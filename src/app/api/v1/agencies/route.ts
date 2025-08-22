/**
 * Agencies API Route - Proxy to Xano with security
 * Never exposes Xano API key to frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';
import { CreateAgencyRequest } from '@/types/database';

export async function GET() {
  try {
    const result = await xanoClient.getAgencies();
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data || []);
  } catch (error) {
    console.error('Agencies GET error:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAgencyRequest = await request.json();
    
    // Basic validation
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      );
    }

    const result = await xanoClient.createAgency(body);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Agencies POST error:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}