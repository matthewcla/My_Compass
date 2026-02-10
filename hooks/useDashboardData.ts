import { useSession } from '@/lib/ctx';
import { storage } from '@/services/storage';
import { useUserStore } from '@/store/useUserStore';
import { DashboardData } from '@/types/dashboard';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

// ---------------------------------------------------------------------------
// MODULE-LEVEL PREFETCH CACHE
// ---------------------------------------------------------------------------
// Enables "Prefetch-on-Press" pattern: data fetched during OAuth roundtrip
// is immediately available when Hub mounts, eliminating perceived lag.
// ---------------------------------------------------------------------------

let prefetchCache: DashboardData | null = null;
let prefetchPromise: Promise<DashboardData | null> | null = null;

/**
 * Standalone prefetch function - call from sign-in.tsx BEFORE navigation.
 * Overlaps network fetch with OAuth roundtrip for zero-latency feel.
 */
export async function prefetchDashboardData(): Promise<DashboardData | null> {
  // If already prefetching, return existing promise (deduplication)
  if (prefetchPromise) {
    return prefetchPromise;
  }

  logger.info('Dashboard prefetch initiated');

  prefetchPromise = (async () => {
    try {
      // -----------------------------------------------------------------------
      // MOCK SUPABASE CALL (mirrors real fetch logic)
      // -----------------------------------------------------------------------
      await new Promise(resolve => setTimeout(resolve, 800)); // Slightly faster for prefetch

      const mockData: DashboardData = {
        cycle: {
          cycleId: '24-02',
          phase: 'Apply',
          startDate: '2024-05-01T00:00:00Z',
          endDate: '2024-05-31T23:59:59Z',
          daysRemaining: 12,
          matchingBillets: 342,
        },
        stats: {
          applicationsCount: 3,
          averageMatchScore: 85,
          lastLogin: new Date().toISOString(),
          liked: 12,
          superLiked: 2,
          passed: 45,
        },
        leave: {
          currentBalance: 15.5,
          pendingRequestsCount: 1,
          useOrLose: 0,
        },
      };

      prefetchCache = mockData;
      logger.info('Dashboard prefetch completed');
      return mockData;
    } catch (err) {
      logger.error('Dashboard prefetch failed', err);
      return null;
    } finally {
      prefetchPromise = null; // Allow future prefetches
    }
  })();

  return prefetchPromise;
}

/**
 * Clear the prefetch cache (useful for logout or refresh scenarios)
 */
export function clearPrefetchCache(): void {
  prefetchCache = null;
  prefetchPromise = null;
}

// ---------------------------------------------------------------------------
// HOOK: useDashboardData
// ---------------------------------------------------------------------------

export function useDashboardData() {
  const { session } = useSession();
  const user = useUserStore(useShallow(state => state.user));

  // IMMEDIATE HYDRATION: Use prefetch cache if available
  const [data, setData] = useState<DashboardData | null>(prefetchCache);
  const [loading, setLoading] = useState(!prefetchCache); // Not loading if cache hit
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!session) {
      setError('No active session');
      return;
    }

    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    logger.info('Dashboard refresh initiated');

    try {
      // -----------------------------------------------------------------------
      // MOCK SUPABASE CALL
      // -----------------------------------------------------------------------
      await new Promise(resolve => setTimeout(resolve, 1000));

      const demoStore = require('@/store/useDemoStore').useDemoStore; // Inline require to avoid circular dependency issues if any, though explicit import is better. 
      // Actually, let's just use the store instance we already imported or can import.
      // Better to stick to the top level import if possible, but let's check imports first.

      const { selectedUser, isDemoMode } = require('@/store/useDemoStore').useDemoStore.getState();

      const mockData: DashboardData = {
        cycle: {
          cycleId: '24-02',
          phase: 'Apply',
          startDate: '2024-05-01T00:00:00Z',
          endDate: '2024-05-31T23:59:59Z',
          daysRemaining: 12,
          matchingBillets: 342,
        },
        stats: {
          applicationsCount: 3,
          averageMatchScore: 85,
          lastLogin: new Date().toISOString(),
          liked: 12,
          superLiked: 2,
          passed: 45,
        },
        leave: {
          currentBalance: isDemoMode ? selectedUser.leaveBalance : 15.5,
          pendingRequestsCount: 1,
          useOrLose: 0,
        },
      };

      setData(mockData);
      prefetchCache = mockData; // Update cache for future mounts

      try {
        await storage.saveDashboardCache(user.id, mockData);
      } catch (saveErr) {
        logger.error('Failed to save dashboard cache', saveErr);
      }

    } catch (err) {
      logger.error('Dashboard fetch failed', err);

      try {
        const cached = await storage.getDashboardCache(user.id);
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
      // If prefetch cache hit, we already have data - just mark not loading
      if (prefetchCache) {
        setData(prefetchCache);
        setLoading(false);
        // Still fetch fresh data in background (stale-while-revalidate)
        fetchDashboardData();
        return;
      }

      // No prefetch cache - fetch immediately (no InteractionManager delay)
      fetchDashboardData();
    }
  }, [session, user, fetchDashboardData]);

  return { data, loading, error, refetch: fetchDashboardData };
}
