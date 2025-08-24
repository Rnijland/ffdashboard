import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const agencyResult = await xanoClient.getAgency(parseInt(resolvedParams.id));
    if (agencyResult.error || !agencyResult.data) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Get transaction history for this agency
    const transactionsResult = await xanoClient.getTransactionsByAgency(parseInt(resolvedParams.id));
    
    // Calculate additional metrics
    const agency = agencyResult.data;
    const transactions = transactionsResult.data || [];
    
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const failedTransactions = transactions.filter(t => t.status === 'failed');
    
    // Calculate health score (mock implementation)
    const healthScore = calculateHealthScore(agency, transactions);
    
    // Get recent activities (mock for now)
    const activities = generateMockActivities(parseInt(resolvedParams.id));
    
    return NextResponse.json({
      ...agency,
      health_score: healthScore,
      failed_payments_count: failedTransactions.length,
      lifetime_value: completedTransactions.reduce((sum, t) => sum + t.amount, 0),
      recent_transactions: transactions.slice(0, 10),
      activities: activities
    });
  } catch (error) {
    console.error('Subscriber detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    // Update agency with provided fields
    const result = await xanoClient.updateAgency(parseInt(resolvedParams.id), body);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log activity (mock - would create activity record in production)
    console.log(`Agency ${resolvedParams.id} updated:`, body);

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Update subscriber API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateHealthScore(agency: any, transactions: any[]): number {
  // Mock health score calculation
  let score = 100;
  
  // Deduct for failed payments
  const failedCount = transactions.filter(t => t.status === 'failed').length;
  score -= failedCount * 10;
  
  // Deduct for overdue status
  if (agency.subscription_status === 'suspended') score -= 30;
  else if (agency.subscription_status === 'inactive') score -= 15;
  
  // Bonus for consistent payments
  const recentTransactions = transactions.slice(0, 3);
  const allRecentComplete = recentTransactions.every(t => t.status === 'completed');
  if (allRecentComplete && recentTransactions.length === 3) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function generateMockActivities(agencyId: number) {
  return [
    {
      id: 1,
      agency_id: agencyId,
      type: 'payment',
      description: 'Monthly subscription payment processed',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      agency_id: agencyId,
      type: 'status_change',
      description: 'Subscription status changed to active',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    }
  ];
}