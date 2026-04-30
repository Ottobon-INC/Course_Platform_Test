import { useQuery } from '@tanstack/react-query';
import { DashboardSummary } from '../types/dashboard';

/**
 * Hook to fetch the dashboard summary data.
 * The queryFn handles the API call to /api/dashboard/summary automatically
 * via the configured default queryFn in queryClient.ts.
 */
export function useDashboardSummary() {
  const query = useQuery<DashboardSummary>({
    queryKey: ['/api/dashboard/summary'],
    staleTime: 30000, // 30 seconds
    refetchOnMount: true
  });

  if (query.data) {
    console.log('[useDashboardSummary] Data loaded:', {
      user: query.data.user.fullName,
      cohorts: query.data.cohorts.length,
      onDemand: query.data.onDemand.length
    });
  }

  if (query.error) {
    console.error('[useDashboardSummary] Error:', query.error);
  }

  return query;
}
