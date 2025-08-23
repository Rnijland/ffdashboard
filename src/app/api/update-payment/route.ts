import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { CreateTransactionRequest, CreateWebhookEventRequest, TransactionType, TransactionMetadata } from '@/types/database';

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
    if (!paymentData.amount || !paymentData.gems || !paymentData.agencyId || !paymentData.walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment data' },
        { status: 400 }
      );
    }

    // Generate idempotency key for duplicate prevention
    const idempotencyKey = paymentData.transactionHash 
      ? `tx_${paymentData.transactionHash}` 
      : `payment_${paymentData.walletAddress}_${paymentData.amount}_${Date.now()}`;

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
      agency: parseInt(paymentData.agencyId), // Convert string to number
      creator: paymentData.creatorId ? parseInt(paymentData.creatorId) : undefined,
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
      transactionData,
      timestamp: new Date().toISOString()
    });

    // TODO: Replace with actual Xano API calls
    // const transactionResponse = await fetch('/api/v1/transactions', {
    //   method: 'POST', 
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(transactionData)
    // });

    // For now, simulate success
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create webhook event record for audit trail
    const webhookEventData: CreateWebhookEventRequest = {
      event_type: 'payment.completed',
      payload: {
        transactionType: paymentData.transactionType,
        amount: paymentData.amount,
        walletAddress: paymentData.walletAddress,
        transactionHash: paymentData.transactionHash,
        timestamp: new Date().toISOString()
      },
      processed: true
    };

    console.log('✅ PAYMENT PROCESSED SUCCESSFULLY:', {
      transactionId,
      gemsAdded: paymentData.gems,
      status: 'completed'
    });

    return NextResponse.json({
      success: true,
      message: `Payment processed: ${paymentData.gems} gems purchased for $${paymentData.amount}`,
      transactionId
    });

  } catch (error) {
    console.error('❌ PAYMENT UPDATE ERROR:', error);
    
    return NextResponse.json(
      { success: false, message: 'Payment processing failed' },
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