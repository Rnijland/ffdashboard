import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';

export async function POST(request: NextRequest) {
  try {
    const { action, ids } = await request.json();

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const id of ids) {
      try {
        switch (action) {
          case 'activate':
            const activateResult = await xanoClient.updateAgency(id, {
              subscription_status: 'active'
            });
            if (activateResult.data) {
              results.push({ id, status: 'activated' });
            } else {
              errors.push({ id, error: activateResult.error });
            }
            break;

          case 'suspend':
            const suspendResult = await xanoClient.updateAgency(id, {
              subscription_status: 'suspended'
            });
            if (suspendResult.data) {
              results.push({ id, status: 'suspended' });
            } else {
              errors.push({ id, error: suspendResult.error });
            }
            break;

          case 'export':
            // For export, we just collect the data
            const agencyResult = await xanoClient.getAgency(id);
            if (agencyResult.data) {
              results.push(agencyResult.data);
            } else {
              errors.push({ id, error: agencyResult.error });
            }
            break;

          default:
            errors.push({ id, error: 'Unknown action' });
        }
      } catch (error) {
        errors.push({ id, error: 'Processing failed' });
      }
    }

    // If export action, return CSV data
    if (action === 'export' && results.length > 0) {
      const csv = generateCSV(results);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="subscribers-export-${Date.now()}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Bulk operation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(agencies: any[]): string {
  const headers = ['ID', 'Name', 'Creators', 'Monthly Fee', 'Status', 'Wallet Address', 'Created'];
  const rows = agencies.map(a => [
    a.id,
    a.name,
    a.creators_count || 0,
    (a.creators_count || 0) * 40,
    a.subscription_status,
    a.wallet_address,
    a.created_at
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}