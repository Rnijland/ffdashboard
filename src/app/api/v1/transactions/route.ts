/**
 * Transactions API Route - Proxy to Xano with financial data validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';
import { CreateTransactionRequest } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agency');
    const idempotencyKey = searchParams.get('idempotency_key');
    
    let result;
    
    if (idempotencyKey) {
      result = await xanoClient.getTransactionByIdempotencyKey(idempotencyKey);
    } else if (agencyId) {
      result = await xanoClient.getTransactionsByAgency(parseInt(agencyId));
    } else {
      result = await xanoClient.getTransactions();
    }
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data || []);
  } catch (error) {
    console.error('Transactions GET error:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTransactionRequest = await request.json();
    
    // Basic validation
    if (!body.type || !body.amount || !body.agency) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, agency' },
        { status: 400 }
      );
    }

    // Financial data validation
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Generate idempotency key if not provided
    if (!body.idempotency_key) {
      body.idempotency_key = uuidv4();
    }

    // Check for duplicate idempotency key
    const existingTransaction = await xanoClient.getTransactionByIdempotencyKey(body.idempotency_key);
    if ('data' in existingTransaction && existingTransaction.data) {
      return NextResponse.json(existingTransaction.data);
    }

    const result = await xanoClient.createTransaction(body);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Transactions POST error:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}