import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { 
  verifyWebhookSignature, 
  isValidWebhookTimestamp, 
  logSecurityEvent 
} from '@/lib/server/webhook-verification';
import { 
  parseWebhookEvent, 
  getDatabaseActions, 
  logWebhookProcessing 
} from '@/lib/server/webhook-processor';
import { executeDatabaseActions } from '@/lib/server/webhook-database';
import { 
  isEventAlreadyProcessed, 
  markEventAsProcessed, 
  withRetry,
  logProcessingMetrics 
} from '@/lib/server/webhook-idempotency';

// Thirdweb webhook event types
export interface ThirdwebWebhookEvent {
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
  let eventId = 'unknown';
  
  try {
    // Extract headers
    const headersList = await headers();
    const signature = headersList.get('x-signature');
    const contentType = headersList.get('content-type');

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
    let webhookEvent: ThirdwebWebhookEvent;

    try {
      webhookEvent = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload', processed: false },
        { status: 400 }
      );
    }

    // Validate required event structure
    if (!webhookEvent.type || !webhookEvent.data?.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook event structure', processed: false },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.THIRDWEB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logSecurityEvent('MISSING_WEBHOOK_SECRET', { eventId: webhookEvent.data.id });
      
      return NextResponse.json(
        { success: false, message: 'Webhook secret not configured', processed: false },
        { status: 500 }
      );
    }

    const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      logSecurityEvent('INVALID_SIGNATURE', { 
        eventId: webhookEvent.data.id,
        signature: signature.substring(0, 16) + '...' // Log partial signature for debugging
      });
      
      return NextResponse.json(
        { success: false, message: 'Invalid signature', processed: false },
        { status: 401 }
      );
    }

    // Verify timestamp to prevent replay attacks
    const isValidTimestamp = isValidWebhookTimestamp(webhookEvent.data.created_at);
    if (!isValidTimestamp) {
      logSecurityEvent('INVALID_TIMESTAMP', { 
        eventId: webhookEvent.data.id,
        timestamp: webhookEvent.data.created_at
      });
      
      return NextResponse.json(
        { success: false, message: 'Invalid timestamp', processed: false },
        { status: 401 }
      );
    }

    logSecurityEvent('WEBHOOK_AUTHENTICATED', { 
      eventId: webhookEvent.data.id,
      type: webhookEvent.type
    });

    // Parse webhook event
    const processedEvent = parseWebhookEvent(webhookEvent);
    if (!processedEvent) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook event data', processed: false },
        { status: 400 }
      );
    }
    
    eventId = processedEvent.eventId;

    // Check if event has already been processed (idempotency)
    const alreadyProcessed = await isEventAlreadyProcessed(eventId);
    if (alreadyProcessed) {
      console.log('🔄 Event already processed, returning success:', eventId);
      logProcessingMetrics(eventId, Date.now() - startTime, true);
      
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
    const databaseSuccess = await withRetry(async () => {
      const result = await executeDatabaseActions(processedEvent, databaseActions);
      if (!result) {
        throw new Error('Database operations failed');
      }
      return result;
    }, 3, 1000);
    
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
    
    // Mark event as failed if we have an eventId
    if (eventId !== 'unknown') {
      markEventAsProcessed(eventId, 'failure');
    }
    
    logProcessingMetrics(eventId, Date.now() - startTime, false);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error', processed: false },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed', processed: false },
    { status: 405 }
  );
}