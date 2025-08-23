import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { CreateTransactionRequest, CreateWebhookEventRequest, TransactionType, TransactionMetadata } from '@/types/database';
import { xanoClient } from '@/lib/server/xano-client';

interface PaymentUpdateRequest {
  amount: number;
  gems?: number;
  agencyId: string;
  creatorId?: string;
  walletAddress: string;
  transactionHash?: string;
  transactionType: 'gems' | 'poke' | 'media' | 'subscription';
}

interface PaymentUpdateResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

// Helper function to find or create agency by string ID
async function findOrCreateAgency(agencyId: string): Promise<number> {
  // First try to find by slug (assuming agencyId is a slug like "agency-001")
  const agencyResult = await xanoClient.findAgencyBySlug(agencyId);
  
  if (agencyResult.data && agencyResult.data.length > 0) {
    return agencyResult.data[0].id;
  }

  // If not found, create new agency
  console.log('🏢 Creating new agency:', agencyId);
  const newAgencyResult = await xanoClient.createAgency({
    slug: agencyId,
    name: agencyId.charAt(0).toUpperCase() + agencyId.slice(1).replace('-', ' '),
    wallet_address: '', // Will be updated when known
    created_at: new Date().toISOString()
  });

  if (newAgencyResult.error || !newAgencyResult.data) {
    throw new Error(`Failed to create agency: ${newAgencyResult.error}`);
  }

  return newAgencyResult.data.id;
}

// Helper function to find or create creator by string ID
async function findOrCreateCreator(creatorId: string, agencyDbId: number): Promise<number> {
  // First try to find by username (assuming creatorId is a username like "creator-001")
  const creatorResult = await xanoClient.findCreatorByUsername(creatorId);
  
  if (creatorResult.data && creatorResult.data.length > 0) {
    return creatorResult.data[0].id;
  }

  // If not found, create new creator
  console.log('👤 Creating new creator:', creatorId);
  const newCreatorResult = await xanoClient.createCreator({
    username: creatorId,
    display_name: creatorId.charAt(0).toUpperCase() + creatorId.slice(1).replace('-', ' '),
    agency: agencyDbId,
    wallet_address: '', // Will be updated when known
    created_at: new Date().toISOString()
  });

  if (newCreatorResult.error || !newCreatorResult.data) {
    throw new Error(`Failed to create creator: ${newCreatorResult.error}`);
  }

  return newCreatorResult.data.id;
}

export async function POST(request: NextRequest): Promise<NextResponse<PaymentUpdateResponse>> {
  console.log('💳 PAYMENT UPDATE API CALLED:', {
    timestamp: new Date().toISOString(),
    url: request.url
  });

  try {
    // Parse request body
    const paymentData: PaymentUpdateRequest = await request.json();
    
    console.log('📊 PAYMENT DATA:', {
      amount: paymentData.amount,
      gems: paymentData.gems,
      agencyId: paymentData.agencyId,
      creatorId: paymentData.creatorId,
      walletAddress: paymentData.walletAddress,
      transactionHash: paymentData.transactionHash,
      transactionType: paymentData.transactionType
    });

    // Validate required fields
    if (!paymentData.amount || !paymentData.agencyId || !paymentData.walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment data' },
        { status: 400 }
      );
    }

    // Generate idempotency key for duplicate prevention
    const idempotencyKey = paymentData.transactionHash 
      ? `tx_${paymentData.transactionHash}` 
      : `payment_${paymentData.walletAddress}_${paymentData.amount}_${Date.now()}`;

    // Check for duplicate transaction
    const existingTransaction = await xanoClient.getTransactionByIdempotencyKey(idempotencyKey);
    if (existingTransaction.data) {
      console.log('⚠️ Duplicate transaction detected:', idempotencyKey);
      return NextResponse.json({
        success: true,
        message: 'Transaction already processed',
        transactionId: existingTransaction.data.id.toString()
      });
    }

    // Find or create agency and creator records
    const agencyDbId = await findOrCreateAgency(paymentData.agencyId);
    let creatorDbId: number | undefined;
    
    if (paymentData.creatorId) {
      creatorDbId = await findOrCreateCreator(paymentData.creatorId, agencyDbId);
    }

    // Calculate fees (2.5% processing fee)
    const fee = paymentData.amount * 0.025;
    const netAmount = paymentData.amount - fee;

    // Map transaction types to database types
    const transactionTypeMap: Record<string, TransactionType> = {
      'gems': 'chat',
      'poke': 'chat', 
      'media': 'media',
      'subscription': 'subscription'
    };

    // Create transaction metadata
    const metadata: TransactionMetadata = {};
    if (paymentData.transactionType === 'gems' && paymentData.gems) {
      metadata.message_count = paymentData.gems; // Gems = message credits
    } else if (paymentData.transactionType === 'poke') {
      metadata.message_count = 1;
    }

    // Create transaction record
    const transactionData: CreateTransactionRequest = {
      thirdweb_transaction_id: paymentData.transactionHash,
      type: transactionTypeMap[paymentData.transactionType] || 'chat',
      amount: paymentData.amount,
      fee,
      status: 'completed',
      payment_method: 'crypto',
      agency: agencyDbId,
      creator: creatorDbId,
      wallet_address: paymentData.walletAddress,
      metadata,
      idempotency_key: idempotencyKey
    };

    console.log('💎 CREATING TRANSACTION:', {
      buyer: paymentData.walletAddress,
      seller: process.env.NEXT_PUBLIC_SELLER_ADDRESS || 'unknown',
      amount: `$${paymentData.amount}`,
      fee: `$${fee.toFixed(4)}`,
      netAmount: `$${netAmount.toFixed(4)}`,
      gems: paymentData.gems,
      agencyDbId,
      creatorDbId,
      transactionData,
      timestamp: new Date().toISOString()
    });

    // Create transaction in Xano database
    console.log('🔄 About to call Xano createTransaction with:', JSON.stringify(transactionData, null, 2));
    const transactionResult = await xanoClient.createTransaction(transactionData);
    console.log('🔄 Xano createTransaction result:', JSON.stringify(transactionResult, null, 2));
    
    if (transactionResult.error || !transactionResult.data) {
      console.error('❌ Failed to create transaction:', transactionResult.error);
      return NextResponse.json(
        { success: false, message: `Database error: ${transactionResult.error}` },
        { status: 500 }
      );
    }

    const transaction = transactionResult.data;
    console.log('✅ Transaction created in database:', transaction);
    console.log('✅ Transaction ID type:', typeof transaction.id, 'Value:', transaction.id);
    
    // Create webhook event record for audit trail
    const webhookEventData: CreateWebhookEventRequest = {
      event_type: 'payment.completed',
      payload: {
        transactionId: transaction.id,
        transactionType: paymentData.transactionType,
        amount: paymentData.amount,
        walletAddress: paymentData.walletAddress,
        transactionHash: paymentData.transactionHash,
        timestamp: new Date().toISOString()
      },
      processed: true
    };

    const webhookResult = await xanoClient.createWebhookEvent(webhookEventData);
    if (webhookResult.error) {
      console.warn('⚠️ Failed to create webhook event:', webhookResult.error);
      // Don't fail the transaction, just warn
    }

    console.log('✅ PAYMENT PROCESSED SUCCESSFULLY:', {
      transactionId: transaction.id,
      gemsAdded: paymentData.gems,
      agencyId: paymentData.agencyId,
      creatorId: paymentData.creatorId,
      status: 'completed'
    });

    return NextResponse.json({
      success: true,
      message: `Payment processed: ${paymentData.gems || 0} gems purchased for $${paymentData.amount}`,
      transactionId: transaction.id.toString()
    });

  } catch (error) {
    console.error('❌ PAYMENT UPDATE ERROR:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}