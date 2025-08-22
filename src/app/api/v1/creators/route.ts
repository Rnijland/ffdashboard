/**
 * Creators API Route - Proxy to Xano with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';
import { CreateCreatorRequest } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agency');
    
    let result;
    
    if (agencyId) {
      result = await xanoClient.getCreatorsByAgency(parseInt(agencyId));
    } else {
      result = await xanoClient.getCreators();
    }
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data || []);
  } catch (error) {
    console.error('Creators GET error:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCreatorRequest = await request.json();
    
    // Basic validation
    if (!body.name || !body.username || !body.agency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, username, agency' },
        { status: 400 }
      );
    }

    // Validate commission rate if provided
    if (body.commission_rate !== undefined && (body.commission_rate < 0 || body.commission_rate > 100)) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' },
        { status: 400 }
      );
    }

    const result = await xanoClient.createCreator(body);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Creators POST error:', error);
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}