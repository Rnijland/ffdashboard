import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { Subscriber } from '@/components/dashboard/subscriber-table';
import { toast } from 'sonner';

export interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
  totalMRR: number;
  avgHealthScore?: number;
  securityAlerts?: any[];
}

async function fetchSubscribers(search: string = ''): Promise<SubscribersResponse> {
  const params = new URLSearchParams();
  if (search) {
    params.append('search', search);
  }
  
  const response = await fetch(`/api/v1/subscribers${params.toString() ? `?${params.toString()}` : ''}`);
  if (!response.ok) {
    throw new Error('Failed to fetch subscribers');
  }
  return response.json();
}

export function useSubscribers(
  search: string = '',
  options?: Omit<UseQueryOptions<SubscribersResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SubscribersResponse>({
    queryKey: ['subscribers', search],
    queryFn: () => fetchSubscribers(search),
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

export function useSubscriber(id: number) {
  return useQuery({
    queryKey: ['subscriber', id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/subscribers/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscriber details');
      }
      return response.json();
    },
    enabled: !!id
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: number[] }) => {
      const response = await fetch('/api/v1/subscribers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids })
      });
      
      if (!response.ok) {
        throw new Error('Bulk action failed');
      }
      
      // Handle CSV export differently
      if (action === 'export') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscribers-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.action !== 'export') {
        toast.success(`Bulk ${variables.action} completed`);
        queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      } else {
        toast.success('Export completed');
      }
    },
    onError: () => {
      toast.error('Bulk action failed');
    }
  });
}