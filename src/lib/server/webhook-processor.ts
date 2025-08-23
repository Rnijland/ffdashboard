import { ThirdwebV2WebhookEvent, ThirdwebLegacyWebhookEvent } from '@/app/api/thirdweb-webhook/route';

export interface ProcessedWebhookEvent {
  eventId: string;
  eventType: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending' | 'cancelled';
  customerWalletAddress: string;
  metadata: {
    agencyId?: string;
    creatorId?: string;
    transactionType?: 'gems' | 'poke' | 'media' | 'subscription';
    gems_purchased?: number;
    [key: string]: any;
  };
  timestamp: Date;
}

/**
 * Parse and validate Thirdweb webhook event (supports both v2 and legacy)
 * @param event - Raw webhook event from Thirdweb
 * @param isV2 - Whether this is a v2 (Insight) webhook
 * @returns Processed event data or null if invalid
 */
export function parseWebhookEvent(
  event: ThirdwebV2WebhookEvent | ThirdwebLegacyWebhookEvent, 
  isV2: boolean = false
): ProcessedWebhookEvent | null {
  try {
    if (isV2) {
      return parseV2WebhookEvent(event as ThirdwebV2WebhookEvent);
    } else {
      return parseLegacyWebhookEvent(event as ThirdwebLegacyWebhookEvent);
    }

  } catch (error) {
    console.error('❌ Error parsing webhook event:', error);
    
return null;
  }
}

/**
 * Parse v2 (Insight) transaction webhook event
 */
function parseV2WebhookEvent(event: ThirdwebV2WebhookEvent): ProcessedWebhookEvent | null {
  try {
    // V2 events are arrays of transactions
    if (!event.data || !Array.isArray(event.data) || event.data.length === 0) {
      console.error('❌ No transaction data in v2 webhook:', event);
      
      return null;
    }

    const transaction = event.data[0]; // Take the first transaction
    if (!transaction.data || transaction.type !== 'transaction') {
      console.error('❌ Invalid transaction data in v2 webhook:', transaction);
      
      return null;
    }

    const txData = transaction.data;
    
    // For USDC transactions, value is in wei (6 decimals for USDC)
    // Convert from wei to USDC (divide by 10^6)
    const valueInWei = BigInt(txData.value || '0');
    const amount = Number(valueInWei) / 1000000; // USDC has 6 decimals

    // Parse timestamp
    const timestamp = new Date(event.timestamp);
    if (isNaN(timestamp.getTime())) {
      console.error('❌ Invalid timestamp in v2 webhook:', event.timestamp);
      
      return null;
    }

    return {
      eventId: transaction.id,
      eventType: 'transaction.completed',
      transactionId: txData.transactionHash,
      amount,
      currency: 'USDC',
      status: transaction.status === 'new' ? 'completed' : 'failed',
      customerWalletAddress: txData.from,
      metadata: {
        transactionType: 'gems', // Assume gem purchase for now
        blockNumber: txData.blockNumber,
        gasUsed: txData.gasUsed,
        gasPrice: txData.gasPrice
      },
      timestamp
    };

  } catch (error) {
    console.error('❌ Error parsing v2 webhook event:', error);
    
    return null;
  }
}

/**
 * Parse legacy payment webhook event
 */
function parseLegacyWebhookEvent(event: ThirdwebLegacyWebhookEvent): ProcessedWebhookEvent | null {
  try {
    // Validate required fields
    if (!event.data?.id || !event.data?.amount || !event.data?.status) {
      console.error('❌ Missing required webhook fields:', event);
      
      return null;
    }

    // Parse amount to number
    const amount = parseFloat(event.data.amount);
    if (isNaN(amount)) {
      console.error('❌ Invalid amount in webhook:', event.data.amount);
      
      return null;
    }

    // Map status to standardized values
    let status: ProcessedWebhookEvent['status'];
    switch (event.type) {
      case 'payment.completed':
        status = 'completed';
        break;
      case 'payment.failed':
        status = 'failed';
        break;
      case 'payment.pending':
        status = 'pending';
        break;
      case 'payment.cancelled':
        status = 'cancelled';
        break;
      default:
        console.error('❌ Unknown webhook event type:', event.type);
        
        return null;
    }

    // Parse timestamp
    const timestamp = new Date(event.data.created_at);
    if (isNaN(timestamp.getTime())) {
      console.error('❌ Invalid timestamp in webhook:', event.data.created_at);
      
      return null;
    }

    return {
      eventId: event.data.id,
      eventType: event.type,
      transactionId: event.data.id, // Using event ID as transaction ID
      amount,
      currency: event.data.currency || 'USDC',
      status,
      customerWalletAddress: event.data.customer?.wallet_address || '',
      metadata: event.data.metadata || {},
      timestamp
    };

  } catch (error) {
    console.error('❌ Error parsing legacy webhook event:', error);
    
    return null;
  }
}

/**
 * Determine database actions needed based on webhook event
 * @param processedEvent - Parsed webhook event
 * @returns Array of database operations to perform
 */
export function getDatabaseActions(processedEvent: ProcessedWebhookEvent): string[] {
  const actions: string[] = [];

  switch (processedEvent.status) {
    case 'completed':
      actions.push('UPDATE_TRANSACTION_STATUS');
      actions.push('CREATE_WEBHOOK_EVENT_LOG');
      
      // Handle gem purchases specifically
      if (processedEvent.metadata.transactionType === 'gems' && 
          processedEvent.metadata.gems_purchased) {
        actions.push('UPDATE_USER_GEM_BALANCE');
      }
      
      break;

    case 'failed':
      actions.push('UPDATE_TRANSACTION_STATUS');
      actions.push('CREATE_WEBHOOK_EVENT_LOG');
      actions.push('HANDLE_PAYMENT_FAILURE');
      break;

    case 'pending':
      actions.push('UPDATE_TRANSACTION_STATUS');
      actions.push('CREATE_WEBHOOK_EVENT_LOG');
      break;

    case 'cancelled':
      actions.push('UPDATE_TRANSACTION_STATUS');
      actions.push('CREATE_WEBHOOK_EVENT_LOG');
      actions.push('HANDLE_PAYMENT_CANCELLATION');
      break;

    default:
      console.warn('⚠️ Unknown status, only logging event:', processedEvent.status);
      actions.push('CREATE_WEBHOOK_EVENT_LOG');
  }

  return actions;
}

/**
 * Log webhook processing events
 * @param event - Processed webhook event
 * @param actions - Database actions taken
 */
export function logWebhookProcessing(
  event: ProcessedWebhookEvent, 
  actions: string[]
) {
  console.log('📝 Processing webhook event:', {
    eventId: event.eventId,
    type: event.eventType,
    status: event.status,
    amount: event.amount,
    currency: event.currency,
    transactionType: event.metadata.transactionType,
    actions,
    timestamp: event.timestamp.toISOString()
  });
}