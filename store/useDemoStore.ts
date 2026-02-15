import { DEMO_USERS, DemoPhase, DemoUser } from '@/constants/DemoData';
import { useUserStore } from '@/store/useUserStore';
import { LiquidationStatus, PCSPhase, TRANSITSubPhase, UCTPhase } from '@/types/pcs';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ── Demo Scenario Presets ───────────────────────────────────────────────────

export interface DemoScenario {
  id: string;
  label: string;
  icon: string;
  context: 'ACTIVE' | 'ARCHIVE';
  phase: PCSPhase | null;
  subPhase?: TRANSITSubPhase | null;
  uctPhase?: UCTPhase | null;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  { id: 'orders', label: 'Orders Received', icon: '📋', context: 'ACTIVE', phase: 'ORDERS_NEGOTIATION', uctPhase: 1 },
  { id: 'planning', label: 'Planning Move', icon: '📦', context: 'ACTIVE', phase: 'TRANSIT_LEAVE', subPhase: 'PLANNING', uctPhase: 2 },
  { id: 'enroute', label: 'En Route', icon: '✈️', context: 'ACTIVE', phase: 'TRANSIT_LEAVE', subPhase: 'ACTIVE_TRAVEL', uctPhase: 3 },
  { id: 'arrived', label: 'Arrived On-Station', icon: '⚓', context: 'ACTIVE', phase: 'CHECK_IN', uctPhase: 4 },
  { id: 'archive', label: 'Sea Bag', icon: '🎒', context: 'ARCHIVE', phase: null },
];

interface DemoState {
  isDemoMode: boolean;
  selectedUser: DemoUser;
  selectedPhase: DemoPhase;
  pcsPhaseOverride: PCSPhase | null;
  pcsSubPhaseOverride: TRANSITSubPhase | null;
  uctPhaseOverride: UCTPhase | null;
  pcsContextOverride: 'ACTIVE' | 'ARCHIVE' | null;
  activeDemoScenarioId: string | null;

  toggleDemoMode: () => void;
  setSelectedUser: (user: DemoUser) => void;
  setSelectedPhase: (phase: DemoPhase) => void;
  setPcsPhaseOverride: (phase: PCSPhase | null) => void;
  setPcsSubPhaseOverride: (subPhase: TRANSITSubPhase | null) => void;
  setUctPhaseOverride: (phase: UCTPhase | null) => void;
  setPcsContextOverride: (context: 'ACTIVE' | 'ARCHIVE' | null) => void;
  applyDemoScenario: (scenario: DemoScenario) => void;
  clearDemoScenario: () => void;
  updateSelectedUser: (updates: Partial<DemoUser>) => void;
  advanceLiquidationStatus: () => void;
  loadMockHistoricalOrders: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      isDemoMode: false,
      selectedUser: DEMO_USERS[0],
      selectedPhase: DemoPhase.MVP,
      pcsPhaseOverride: null,
      pcsSubPhaseOverride: null,
      uctPhaseOverride: null,
      pcsContextOverride: null,
      activeDemoScenarioId: null,

      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      setSelectedUser: (user) => set({ selectedUser: user }),
      updateSelectedUser: (updates) => set((state) => ({
        selectedUser: { ...state.selectedUser, ...updates },
      })),
      setSelectedPhase: (phase) => set({ selectedPhase: phase }),
      setPcsPhaseOverride: (phase) => set({ pcsPhaseOverride: phase, activeDemoScenarioId: null }),
      setPcsSubPhaseOverride: (subPhase) => set({ pcsSubPhaseOverride: subPhase, activeDemoScenarioId: null }),
      setUctPhaseOverride: (phase) => set({ uctPhaseOverride: phase, activeDemoScenarioId: null }),
      setPcsContextOverride: (context) => set({ pcsContextOverride: context, activeDemoScenarioId: null }),

      applyDemoScenario: (scenario) => set({
        pcsContextOverride: scenario.context,
        pcsPhaseOverride: scenario.phase,
        pcsSubPhaseOverride: scenario.subPhase ?? null,
        uctPhaseOverride: scenario.uctPhase ?? null,
        activeDemoScenarioId: scenario.id,
      }),

      clearDemoScenario: () => set({
        pcsContextOverride: null,
        pcsPhaseOverride: null,
        pcsSubPhaseOverride: null,
        uctPhaseOverride: null,
        activeDemoScenarioId: null,
      }),

      advanceLiquidationStatus: () => {
        // Import lazily to avoid circular dependency
        const { usePCSStore } = require('./usePCSStore');
        const pcsStore = usePCSStore.getState();
        const current = pcsStore.financials.liquidation?.currentStatus;

        if (!current) {
          // Initialize liquidation if not started
          pcsStore.initializeLiquidation('demo-claim-001');
          return;
        }

        const progression: LiquidationStatus[] = [
          'SUBMITTED',
          'CPPA_REVIEW',
          'NPPSC_AUDIT',
          'PAID',
        ];
        const currentIndex = progression.indexOf(current);
        const nextStatus = progression[Math.min(currentIndex + 1, progression.length - 1)];
        pcsStore.updateLiquidationStatus(nextStatus);
      },

      loadMockHistoricalOrders: () => {
        // Import lazily to avoid circular dependency
        const { usePCSArchiveStore } = require('./usePCSArchiveStore');
        const { MOCK_HISTORICAL_PCS_ORDERS } = require('@/constants/MockPCSData');
        usePCSArchiveStore.getState().setHistoricalOrders(MOCK_HISTORICAL_PCS_ORDERS);
      },
    }),
    {
      name: 'demo-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // When rehydrating, replace the stale persisted selectedUser with the
      // fresh version from DEMO_USERS so newly-added fields always appear.
      onRehydrateStorage: () => (state) => {
        if (state) {
          const fresh = DEMO_USERS.find((u) => u.id === state.selectedUser?.id);
          if (fresh) state.selectedUser = fresh;
        }
      },
    }
  )
);

/**
 * Helper hook to get the current profile based on Demo Mode status.
 * Returns the selected Demo User if Demo Mode is active, otherwise returns the real user.
 */
export const useCurrentProfile = (): User | null => {
  const isDemoMode = useDemoStore((state) => state.isDemoMode);
  const selectedUser = useDemoStore((state) => state.selectedUser);
  const realUser = useUserStore((state) => state.user);

  if (isDemoMode) {
    return selectedUser;
  }
  return realUser;
};

/**
 * Helper hook to get the correct updateUser function based on Demo Mode status.
 * In demo mode, updates go to useDemoStore.updateSelectedUser.
 * In production mode, updates go to useUserStore.updateUser.
 */
export const useUpdateProfile = (): ((updates: Partial<User>) => void) => {
  const isDemoMode = useDemoStore((state) => state.isDemoMode);
  const updateDemoUser = useDemoStore((state) => state.updateSelectedUser);
  const updateRealUser = useUserStore((state) => state.updateUser);

  if (isDemoMode) {
    return updateDemoUser;
  }
  return updateRealUser;
};
