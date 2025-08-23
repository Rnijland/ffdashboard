import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export interface Transaction {
  id: string;
  type: 'chat' | 'script' | 'media' | 'subscription';
  amount: number;
  fee: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  agency: number;
  creator?: number;
  wallet_address: string;
  metadata: Record<string, any>;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: number;
  name: string;
  slug: string;
  wallet_address: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  successRate: number;
  totalTransactions: number;
  transactionsByType: {
    chat: number;
    script: number;
    media: number;
    subscription: number;
  };
  recentTransactions: Transaction[];
  agencies: Agency[];
  monthlyRecurringRevenue: number;
}

async function fetchDashboardData(): Promise<DashboardMetrics> {
  const response = await fetch('/api/v1/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

export function useDashboard(options?: Omit<UseQueryOptions<DashboardMetrics>, 'queryKey' | 'queryFn'>) {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

export function useTransactions(options?: Omit<UseQueryOptions<Transaction[]>, 'queryKey' | 'queryFn'>) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/v1/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 10000,
    ...options,
  });
}

export function useAgencies(options?: Omit<UseQueryOptions<Agency[]>, 'queryKey' | 'queryFn'>) {
  return useQuery<Agency[]>({
    queryKey: ['agencies'],
    queryFn: async () => {
      const response = await fetch('/api/v1/agencies');
      if (!response.ok) {
        throw new Error('Failed to fetch agencies');
      }
      return response.json();
    },
    refetchInterval: 60000, // 1 minute
    refetchIntervalInBackground: true,
    staleTime: 30000,
    ...options,
  });
}