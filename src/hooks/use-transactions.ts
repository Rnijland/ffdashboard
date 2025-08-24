import { useQuery } from '@tanstack/react-query';

interface TransactionFilters {
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  agency?: number;
  limit?: number;
}

interface TransactionData {
  transactions: any[];
  total: number;
  totalVolume: number;
  totalFees: number;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery<TransactionData>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.dateFrom) params.append('from', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('to', filters.dateTo.toISOString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.agency) params.append('agency', filters.agency.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/v1/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/transactions/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction');
      }
      return response.json();
    },
    enabled: !!id
  });
}