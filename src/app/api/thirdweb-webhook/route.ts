import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { executeDatabaseActions } from '@/lib/server/webhook-database';
import {
    isEventAlreadyProcessed,
    logProcessingMetrics,
    markEventAsProcessed,
    withRetry
} from '@/lib/server/webhook-idempotency';
import { getDatabaseActions, logWebhookProcessing, parseWebhookEvent } from '@/lib/server/webhook-processor';
import { isValidWebhookTimestamp, logSecurityEvent, verifyWebhookSignature } from '@/lib/server/webhook-verification';

// Thirdweb v2 webhook event types (Insight webhooks)
export interface ThirdwebV2WebhookEvent {
    topic: string;
    timestamp: string;
    data: {
        data: {
            transactionHash: string;
            blockNumber: string;
            from: string;
            to: string;
            value: string;
            gasUsed: string;
            gasPrice: string;
            timestamp: string;
        };
        status: 'new' | 'reverted';
        type: 'transaction';
        id: string;
    }[];
}

// Legacy payment webhook interface (for backward compatibility)
export interface ThirdwebLegacyWebhookEvent {
    type: 'payment.completed' | 'payment.failed' | 'payment.pending' | 'payment.cancelled';
    data: {
        id: string;
        amount: string;
        currency: string;
        status: string;
        metadata: Record<string, any>;
        customer: {
            wallet_address: string;
        };
        created_at: string;
    };
}

// Webhook response interface
interface WebhookResponse {
    success: boolean;
    message: string;
    processed: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<WebhookResponse>> {
    const startTime = Date.now();

    console.log('🔔 WEBHOOK RECEIVED:', {
        timestamp: new Date().toISOString(),
        url: request.url,
        method: request.method
    });

    try {
        // Extract headers (support both v2 and legacy formats)
        const headersList = await headers();
        const signature = headersList.get('x-webhook-signature') || headersList.get('x-signature');
        const webhookId = headersList.get('x-webhook-id');
        const contentType = headersList.get('content-type');

        console.log('📋 WEBHOOK HEADERS:', {
            signature: signature ? signature.substring(0, 16) + '...' : null,
            webhookId,
            contentType
        });

        // Validate content type
        if (!contentType?.includes('application/json')) {
            return NextResponse.json(
                { success: false, message: 'Invalid content type', processed: false },
                { status: 400 }
            );
        }

        // Validate signature header exists
        if (!signature) {
            return NextResponse.json(
                { success: false, message: 'Missing signature header', processed: false },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.text();
        console.log('📦 WEBHOOK BODY:', body);

        let webhookEvent: ThirdwebV2WebhookEvent | ThirdwebLegacyWebhookEvent;
        let isV2Webhook = false;

        try {
            webhookEvent = JSON.parse(body);
            console.log('📋 PARSED WEBHOOK:', webhookEvent);

            // Detect webhook version
            isV2Webhook = 'topic' in webhookEvent && 'timestamp' in webhookEvent;
            console.log('🔍 WEBHOOK VERSION:', isV2Webhook ? 'v2 (Insight)' : 'legacy (Payment)');
        } catch (error) {
            console.error('❌ JSON Parse Error:', error);

            return NextResponse.json(
                { success: false, message: 'Invalid JSON payload', processed: false },
                { status: 400 }
            );
        }

        // Validate required event structure based on version
        if (isV2Webhook) {
            const v2Event = webhookEvent as ThirdwebV2WebhookEvent;
            if (!v2Event.topic || !v2Event.data || !Array.isArray(v2Event.data)) {
                return NextResponse.json(
                    { success: false, message: 'Invalid v2 webhook event structure', processed: false },
                    { status: 400 }
                );
            }
        } else {
            const legacyEvent = webhookEvent as ThirdwebLegacyWebhookEvent;
            if (!legacyEvent.type || !legacyEvent.data?.id) {
                return NextResponse.json(
                    { success: false, message: 'Invalid legacy webhook event structure', processed: false },
                    { status: 400 }
                );
            }
        }

        // Verify webhook signature
        const webhookSecret = process.env.THIRDWEB_WEBHOOK_SECRET;
        if (!webhookSecret) {
            const missingSecretEventId = isV2Webhook
                ? (webhookEvent as ThirdwebV2WebhookEvent).data[0]?.id || 'unknown'
                : (webhookEvent as ThirdwebLegacyWebhookEvent).data.id;

            logSecurityEvent('MISSING_WEBHOOK_SECRET', { eventId: missingSecretEventId });

            return NextResponse.json(
                { success: false, message: 'Webhook secret not configured', processed: false },
                { status: 500 }
            );
        }

        const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);
        if (!isValidSignature) {
            const sigEventId = isV2Webhook
                ? (webhookEvent as ThirdwebV2WebhookEvent).data[0]?.id || 'unknown'
                : (webhookEvent as ThirdwebLegacyWebhookEvent).data.id;

            logSecurityEvent('INVALID_SIGNATURE', {
                eventId: sigEventId,
                signature: signature?.substring(0, 16) + '...' // Log partial signature for debugging
            });

            return NextResponse.json(
                { success: false, message: 'Invalid signature', processed: false },
                { status: 401 }
            );
        }

        // Verify timestamp to prevent replay attacks
        const timestamp = isV2Webhook
            ? (webhookEvent as ThirdwebV2WebhookEvent).timestamp
            : (webhookEvent as ThirdwebLegacyWebhookEvent).data.created_at;

        const isValidTimestamp = isValidWebhookTimestamp(timestamp);
        if (!isValidTimestamp) {
            const tsEventId = isV2Webhook
                ? (webhookEvent as ThirdwebV2WebhookEvent).data[0]?.id || 'unknown'
                : (webhookEvent as ThirdwebLegacyWebhookEvent).data.id;

            logSecurityEvent('INVALID_TIMESTAMP', {
                eventId: tsEventId,
                timestamp
            });

            return NextResponse.json(
                { success: false, message: 'Invalid timestamp', processed: false },
                { status: 401 }
            );
        }

        const currentEventId = isV2Webhook
            ? (webhookEvent as ThirdwebV2WebhookEvent).data[0]?.id || 'unknown'
            : (webhookEvent as ThirdwebLegacyWebhookEvent).data.id;

        const eventType = isV2Webhook
            ? (webhookEvent as ThirdwebV2WebhookEvent).topic
            : (webhookEvent as ThirdwebLegacyWebhookEvent).type;

        logSecurityEvent('WEBHOOK_AUTHENTICATED', {
            eventId: currentEventId,
            type: eventType,
            version: isV2Webhook ? 'v2' : 'legacy'
        });

        // Parse webhook event
        const processedEvent = parseWebhookEvent(webhookEvent, isV2Webhook);
        if (!processedEvent) {
            return NextResponse.json(
                { success: false, message: 'Invalid webhook event data', processed: false },
                { status: 400 }
            );
        }

        const eventId = processedEvent.eventId;

        // Check if event has already been processed (idempotency)
        const alreadyProcessed = await isEventAlreadyProcessed(processedEvent.eventId);
        if (alreadyProcessed) {
            console.log('🔄 Event already processed, returning success:', processedEvent.eventId);
            logProcessingMetrics(processedEvent.eventId, Date.now() - startTime, true);

            return NextResponse.json({
                success: true,
                message: 'Event already processed (idempotent)',
                processed: true
            });
        }

        // Determine required database actions
        const databaseActions = getDatabaseActions(processedEvent);
        logWebhookProcessing(processedEvent, databaseActions);

        // Execute database updates with retry logic
        await withRetry(
            async () => {
                const result = await executeDatabaseActions(processedEvent, databaseActions);
                if (!result) {
                    throw new Error('Database operations failed');
                }

                return result;
            },
            3,
            1000
        );

        // Mark event as successfully processed
        markEventAsProcessed(eventId, 'success');
        logProcessingMetrics(eventId, Date.now() - startTime, true);

        // Temporary success response

        return NextResponse.json({
            success: true,
            message: 'Webhook received successfully',
            processed: true
        });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);

        // Mark event as failed if we have a processedEvent
        if (processedEvent?.eventId && processedEvent.eventId !== 'unknown') {
            markEventAsProcessed(processedEvent.eventId, 'failure');
            logProcessingMetrics(processedEvent.eventId, Date.now() - startTime, false);
        } else {
            logProcessingMetrics('unknown', Date.now() - startTime, false);
        }

        return NextResponse.json(
            { success: false, message: 'Internal server error', processed: false },
            { status: 500 }
        );
    }
}

// Only allow POST requests
export async function GET() {
    return NextResponse.json({ success: false, message: 'Method not allowed', processed: false }, { status: 405 });
}
