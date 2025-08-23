import { xanoClient } from './xano-client';
import { ProcessedWebhookEvent } from './webhook-processor';
import { CreateWebhookEventRequest, CreateTransactionRequest } from '@/types/database';

/**
 * Update transaction status in Xano database
 * @param event - Processed webhook event
 * @returns Success status
 */
export async function updateTransactionStatus(event: ProcessedWebhookEvent): Promise<boolean> {
  try {
    // Find transaction by event ID or create new one
    const existingTransaction = await xanoClient.getTransactionByIdempotencyKey(event.eventId);
    
    if (existingTransaction.data) {
      // Update existing transaction
      // Map webhook status to database transaction status
      let dbStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
      switch (event.status) {
        case 'completed':
          dbStatus = 'completed';
          break;
        case 'failed':
          dbStatus = 'failed';
          break;
        case 'pending':
          dbStatus = 'pending';
          break;
        case 'cancelled':
          dbStatus = 'failed'; // Map cancelled to failed in database
          break;
        default:
          dbStatus = 'pending';
      }

      const result = await xanoClient.updateTransaction(existingTransaction.data.id, {
        status: dbStatus,
        thirdweb_transaction_id: event.transactionId
      });
      
      if (result.error) {
        console.error('❌ Failed to update transaction:', result.error);
        
        return false;
      }
      
      console.log('✅ Updated transaction status:', {
        transactionId: existingTransaction.data.id,
        newStatus: event.status
      });
      
    } else {
      // Map webhook status to database transaction status
      let dbStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
      switch (event.status) {
        case 'completed':
          dbStatus = 'completed';
          break;
        case 'failed':
          dbStatus = 'failed';
          break;
        case 'pending':
          dbStatus = 'pending';
          break;
        case 'cancelled':
          dbStatus = 'failed'; // Map cancelled to failed in database
          break;
        default:
          dbStatus = 'pending';
      }

      // Map transaction type
      let dbTransactionType: 'chat' | 'script' | 'media' | 'subscription';
      switch (event.metadata.transactionType) {
        case 'gems':
          dbTransactionType = 'chat'; // Gems are used for chat
          break;
        case 'poke':
          dbTransactionType = 'chat'; // Pokes are chat-related  
          break;
        case 'media':
          dbTransactionType = 'media';
          break;
        case 'subscription':
          dbTransactionType = 'subscription';
          break;
        default:
          dbTransactionType = 'chat';
      }

      // Map metadata to database format
      const dbMetadata: CreateTransactionRequest['metadata'] = {};
      if (event.metadata.gems_purchased) {
        dbMetadata.message_count = event.metadata.gems_purchased; // Store gems as message count
      }
      if (event.metadata.message_count) {
        dbMetadata.message_count = event.metadata.message_count;
      }
      if (event.metadata.access_type) {
        dbMetadata.access_type = event.metadata.access_type;
      }
      if (event.metadata.access_duration_days) {
        dbMetadata.access_duration_days = event.metadata.access_duration_days;
      }
      if (event.metadata.billing_period) {
        dbMetadata.billing_period = event.metadata.billing_period;
      }
      if (event.metadata.creators_count) {
        dbMetadata.creators_count = event.metadata.creators_count;
      }

      // Create new transaction record
      const transactionData: CreateTransactionRequest = {
        amount: event.amount,
        fee: 0, // TODO: Calculate actual fees from metadata
        status: dbStatus,
        type: dbTransactionType,
        payment_method: 'thirdweb',
        thirdweb_transaction_id: event.transactionId,
        metadata: dbMetadata,
        idempotency_key: event.eventId,
        // TODO: Map agencyId and creatorId from metadata - need agency/creator lookup
        agency: event.metadata.agencyId ? parseInt(event.metadata.agencyId) : 1, // Default to agency 1
        creator: event.metadata.creatorId ? parseInt(event.metadata.creatorId) : undefined
      };
      
      const result = await xanoClient.createTransaction(transactionData);
      
      if (result.error) {
        console.error('❌ Failed to create transaction:', result.error);
        
return false;
      }
      
      console.log('✅ Created new transaction:', {
        transactionId: result.data?.id,
        status: event.status,
        amount: event.amount
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating transaction status:', error);
    
return false;
  }
}

/**
 * Create webhook event log in Xano database
 * @param event - Processed webhook event
 * @returns Success status
 */
export async function createWebhookEventLog(event: ProcessedWebhookEvent): Promise<boolean> {
  try {
    const webhookEventData: CreateWebhookEventRequest = {
      event_type: event.eventType,
      payload: {
        event_id: event.eventId, // Store event_id in payload
        status: event.status,
        amount: event.amount,
        currency: event.currency,
        customerWalletAddress: event.customerWalletAddress,
        metadata: event.metadata,
        timestamp: event.timestamp.toISOString()
      },
      processed: true
    };
    
    const result = await xanoClient.createWebhookEvent(webhookEventData);
    
    if (result.error) {
      console.error('❌ Failed to create webhook event log:', result.error);
      
return false;
    }
    
    console.log('✅ Created webhook event log:', {
      eventId: event.eventId,
      type: event.eventType
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error creating webhook event log:', error);
    
return false;
  }
}

/**
 * Update user gem balance for successful gem purchases
 * @param event - Processed webhook event
 * @returns Success status
 */
export async function updateUserGemBalance(event: ProcessedWebhookEvent): Promise<boolean> {
  try {
    if (event.metadata.transactionType !== 'gems' || !event.metadata.gems_purchased) {
      console.warn('⚠️ Not a gem purchase, skipping balance update');
      
return true;
    }
    
    if (event.status !== 'completed') {
      console.warn('⚠️ Payment not completed, skipping balance update');
      
return true;
    }
    
    const gemsToAdd = Number(event.metadata.gems_purchased);
    if (isNaN(gemsToAdd) || gemsToAdd <= 0) {
      console.error('❌ Invalid gems amount:', event.metadata.gems_purchased);
      
return false;
    }
    
    // TODO: Implement user gem balance update
    // This would require a user_balances table and user identification
    // For now, just log the action
    console.log('📝 TODO: Update user gem balance:', {
      walletAddress: event.customerWalletAddress,
      gemsToAdd,
      eventId: event.eventId
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error updating user gem balance:', error);
    
return false;
  }
}

/**
 * Handle failed payment cleanup
 * @param event - Processed webhook event
 * @returns Success status
 */
export async function handlePaymentFailure(event: ProcessedWebhookEvent): Promise<boolean> {
  try {
    console.log('🚨 Handling payment failure:', {
      eventId: event.eventId,
      amount: event.amount,
      customerWallet: event.customerWalletAddress
    });
    
    // TODO: Implement failure-specific logic:
    // - Send failure notifications
    // - Clean up pending reservations
    // - Update user interface state
    
    return true;
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    
return false;
  }
}

/**
 * Handle payment cancellation cleanup
 * @param event - Processed webhook event  
 * @returns Success status
 */
export async function handlePaymentCancellation(event: ProcessedWebhookEvent): Promise<boolean> {
  try {
    console.log('🚫 Handling payment cancellation:', {
      eventId: event.eventId,
      amount: event.amount,
      customerWallet: event.customerWalletAddress
    });
    
    // TODO: Implement cancellation-specific logic:
    // - Release reserved resources
    // - Update user interface state
    // - Send cancellation notifications
    
    return true;
  } catch (error) {
    console.error('❌ Error handling payment cancellation:', error);
    
return false;
  }
}

/**
 * Execute database actions based on webhook event
 * @param event - Processed webhook event
 * @param actions - Array of database actions to perform
 * @returns Success status
 */
export async function executeDatabaseActions(
  event: ProcessedWebhookEvent, 
  actions: string[]
): Promise<boolean> {
  const results: boolean[] = [];
  
  for (const action of actions) {
    let success = false;
    
    switch (action) {
      case 'UPDATE_TRANSACTION_STATUS':
        success = await updateTransactionStatus(event);
        break;
        
      case 'CREATE_WEBHOOK_EVENT_LOG':
        success = await createWebhookEventLog(event);
        break;
        
      case 'UPDATE_USER_GEM_BALANCE':
        success = await updateUserGemBalance(event);
        break;
        
      case 'HANDLE_PAYMENT_FAILURE':
        success = await handlePaymentFailure(event);
        break;
        
      case 'HANDLE_PAYMENT_CANCELLATION':
        success = await handlePaymentCancellation(event);
        break;
        
      default:
        console.warn(`⚠️ Unknown database action: ${action}`);
        success = false;
    }
    
    results.push(success);
    
    if (!success) {
      console.error(`❌ Database action failed: ${action}`);
    }
  }
  
  const allSuccessful = results.every(r => r);
  
  console.log('📊 Database actions summary:', {
    eventId: event.eventId,
    totalActions: actions.length,
    successful: results.filter(r => r).length,
    allSuccessful
  });
  
  return allSuccessful;
}