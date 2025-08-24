import { useQuery } from '@tanstack/react-query';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    activeSubscribers: number;
    averageRevenuePerUser: number;
    failureRate: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  topAgencies: Array<{
    id: number;
    name: string;
    revenue: number;
    transactionCount: number;
    creators: number;
    status: string;
    creators_count?: number;
    transaction_count?: number;
    total_revenue?: number;
  }>;
  failureAnalysis: {
    totalFailures: number;
    failureRate: number;
    reasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  };
  trends: {
    revenueGrowth: number;
    newSubscribers: number;
    churnRate: number;
    averageLifetimeValue: number;
  };
  // Additional optional properties used in the UI
  totalRevenue?: number;
  growthRate?: number;
  successRate?: number;
  failedCount?: number;
  successRateChange?: number;
  totalTransactions?: number;
  avgTransactionValue?: number;
  revenueByType?: any[];
  transactionsByType?: any[];
  avgByType?: any[];
  monthlyTrends?: any[];
  failuresByType?: any[];
  failureReasons?: any[];
}

export function useAnalytics(timeRange: string = '6months') {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/v1/analytics?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  });
}

export function useSecurityAlerts() {
  return useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/v1/security/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch security alerts');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });
}