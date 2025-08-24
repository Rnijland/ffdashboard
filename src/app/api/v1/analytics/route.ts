import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';
import { startOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const timeRange = searchParams.get('timeRange') || '6months';
    
    // Get all transactions and agencies
    const [transactionsResult, agenciesResult] = await Promise.all([
      xanoClient.getTransactions(),
      xanoClient.getAgencies()
    ]);

    if (transactionsResult.error || agenciesResult.error) {
      throw new Error('Failed to fetch data');
    }

    const transactions = transactionsResult.data || [];
    const agencies = agenciesResult.data || [];

    // Calculate time range
    const now = new Date();
    const monthsBack = timeRange === '3months' ? 3 : timeRange === '12months' ? 12 : 6;
    const startDate = startOfMonth(subMonths(now, monthsBack));

    // Filter transactions by date
    const filteredTransactions = transactions.filter(t => 
      new Date(t.created_at) >= startDate
    );

    // Calculate revenue by month
    const revenueByMonth = calculateRevenueByMonth(filteredTransactions, monthsBack);
    
    // Calculate top agencies
    const topAgencies = calculateTopAgencies(agencies, filteredTransactions);
    
    // Calculate payment failure analysis
    const failureAnalysis = calculateFailureAnalysis(filteredTransactions);
    
    // Calculate trends
    const trends = calculateTrends(filteredTransactions, agencies);
    
    // Calculate summary metrics
    const summary = {
      totalRevenue: filteredTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      activeSubscribers: agencies.filter(a => a.subscription_status === 'active').length,
      averageRevenuePerUser: agencies.length > 0 ? 
        filteredTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) / agencies.length : 0,
      failureRate: filteredTransactions.length > 0 ?
        (filteredTransactions.filter(t => t.status === 'failed').length / filteredTransactions.length) * 100 : 0
    };

    return NextResponse.json({
      summary,
      revenueByMonth,
      topAgencies: topAgencies.slice(0, 10),
      failureAnalysis,
      trends
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateRevenueByMonth(transactions: any[], monthsBack: number) {
  const months = [];
  const now = new Date();
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const monthStr = format(date, 'MMM yyyy');
    const monthStart = startOfMonth(date);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.created_at);
      return tDate >= monthStart && tDate <= monthEnd && t.status === 'completed';
    });
    
    const revenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = monthTransactions.length;
    
    months.push({
      month: monthStr,
      revenue,
      transactions: transactionCount
    });
  }
  
  return months;
}

function calculateTopAgencies(agencies: any[], transactions: any[]) {
  return agencies.map(agency => {
    const agencyTransactions = transactions.filter(t => t.agency === agency.id);
    const completedTransactions = agencyTransactions.filter(t => t.status === 'completed');
    const revenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      id: agency.id,
      name: agency.name,
      revenue,
      transactionCount: completedTransactions.length,
      creators: agency.creators_count || 0,
      status: agency.subscription_status
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

function calculateFailureAnalysis(transactions: any[]) {
  const failedTransactions = transactions.filter(t => t.status === 'failed');
  
  return {
    totalFailures: failedTransactions.length,
    failureRate: transactions.length > 0 ? 
      (failedTransactions.length / transactions.length) * 100 : 0
  };
}

function calculateTrends(transactions: any[], agencies: any[]) {
  // Calculate month-over-month growth
  const now = new Date();
  const thisMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));
  const twoMonthsAgo = startOfMonth(subMonths(now, 2));
  
  const thisMonthRevenue = transactions
    .filter(t => new Date(t.created_at) >= thisMonth && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const lastMonthRevenue = transactions
    .filter(t => {
      const date = new Date(t.created_at);
      return date >= lastMonth && date < thisMonth && t.status === 'completed';
    })
    .reduce((sum, t) => sum + t.amount, 0);
    
  const growthRate = lastMonthRevenue > 0 ? 
    ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  
  // New vs returning subscribers (mock data)
  const newSubscribers = agencies.filter(a => {
    const createdDate = new Date(a.created_at);
    return createdDate >= lastMonth;
  }).length;
  
  return {
    revenueGrowth: growthRate,
    newSubscribers,
    churnRate: 0, // Would calculate from real subscription cancellations
    averageLifetimeValue: agencies.length > 0 ?
      transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) / agencies.length : 0
  };
}