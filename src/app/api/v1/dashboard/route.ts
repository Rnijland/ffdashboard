import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';

interface DashboardMetrics {
  totalRevenue: number;
  successRate: number;
  totalTransactions: number;
  transactionsByType: {
    chat: number;
    script: number;
    media: number;
    subscription: number;
  };
  recentTransactions: any[];
  agencies: any[];
  monthlyRecurringRevenue: number;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch transactions from Xano
    const transactionsResult = await xanoClient.getTransactions();
    if (transactionsResult.error || !transactionsResult.data) {
      console.error('Failed to fetch transactions:', transactionsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Fetch agencies from Xano
    const agenciesResult = await xanoClient.getAgencies();
    if (agenciesResult.error || !agenciesResult.data) {
      console.error('Failed to fetch agencies:', agenciesResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch agencies' },
        { status: 500 }
      );
    }

    const transactions = transactionsResult.data || [];
    const agencies = agenciesResult.data || [];

    // Calculate metrics
    const totalRevenue = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const completedCount = transactions.filter(t => t.status === 'completed').length;
    const totalCount = transactions.length;
    const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Count transactions by type
    const transactionsByType = {
      chat: 0,
      script: 0,
      media: 0,
      subscription: 0
    };

    transactions.forEach(t => {
      if (t.type && transactionsByType.hasOwnProperty(t.type)) {
        transactionsByType[t.type as keyof typeof transactionsByType]++;
      }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    // For now, count subscription transactions in the current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRecurringRevenue = transactions
      .filter(t => {
        if (t.type !== 'subscription' || t.status !== 'completed') return false;
        const transactionDate = new Date(t.created_at);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Get recent transactions (last 10)
    const recentTransactions = transactions
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    const metrics: DashboardMetrics = {
      totalRevenue,
      successRate,
      totalTransactions: totalCount,
      transactionsByType,
      recentTransactions,
      agencies,
      monthlyRecurringRevenue
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cache control headers for performance
export const revalidate = 30; // Revalidate every 30 seconds