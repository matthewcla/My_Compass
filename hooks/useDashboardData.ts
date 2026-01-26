import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/ctx';
import { useUser } from '@/store/useUserStore';
import { DashboardData } from '@/types/dashboard';
import { getDashboardCache, saveDashboardCache } from '@/services/storage';
import { logger } from '@/utils/logger';

export function useDashboardData() {
  const { session } = useSession();
  const user = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    // If no session, we shouldn't be here usually (guarded by auth), but just in case.
    if (!session) {
      setError('No active session');
      return;
    }

    // We need user ID for caching.
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    // Secure logging - Zero Trust & PII Protection
    // Note: Do not log user ID here.
    logger.info('Dashboard refresh initiated');

    try {
      // -----------------------------------------------------------------------
      // MOCK SUPABASE CALL
      // -----------------------------------------------------------------------

      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1000));

      /*
      // Future Implementation:
      const { data: remoteData, error: remoteError } = await supabase
        .from('dashboard_snapshots')
        .select(`
          cycle_data,
          user_stats,
          leave_summary
        `)
        .eq('user_id', user.id)
        .single();

      if (remoteError) throw remoteError;
      */

      // Mock Data Generation
      const mockData: DashboardData = {
        cycle: {
          cycleId: '24-02',
          phase: 'Apply',
          startDate: '2024-05-01T00:00:00Z',
          endDate: '2024-05-31T23:59:59Z',
          daysRemaining: 12,
        },
        stats: {
          applicationsCount: 3,
          averageMatchScore: 85,
          lastLogin: new Date().toISOString(),
        },
        leave: {
          currentBalance: 15.5,
          pendingRequestsCount: 1,
          useOrLose: 0,
        },
      };

      setData(mockData);

      // Persist to offline cache (SQLite)
      // Constraint: Auth tokens are NOT stored here. Only dashboard data.
      try {
        await saveDashboardCache(user.id, mockData);
      } catch (saveErr) {
        logger.error('Failed to save dashboard cache', saveErr);
        // Do not fail the request if caching fails; UI still has fresh data.
      }

    } catch (err) {
      logger.error('Dashboard fetch failed', err);

      // Offline Fallback Strategy
      try {
        const cached = await getDashboardCache(user.id);
        if (cached) {
          logger.info('Loaded dashboard data from offline cache');
          setData(cached);
        } else {
          setError('Unable to load dashboard data (Network failed & no cache)');
        }
      } catch (cacheErr) {
        logger.error('Cache fallback failed', cacheErr);
        setError('Critical failure: Network and Cache unavailable');
      }
    } finally {
      setLoading(false);
    }
  }, [session, user]);

  useEffect(() => {
    if (session && user) {
      fetchDashboardData();
    }
  }, [session, user, fetchDashboardData]);

  return { data, loading, error, refetch: fetchDashboardData };
}
