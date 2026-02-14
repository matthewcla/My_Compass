import { DEMO_USERS, DemoPhase, DemoUser } from '@/constants/DemoData';
import { useUserStore } from '@/store/useUserStore';
import { LiquidationStatus, PCSPhase, TRANSITSubPhase } from '@/types/pcs';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DemoState {
  isDemoMode: boolean;
  selectedUser: DemoUser;
  selectedPhase: DemoPhase;
  pcsPhaseOverride: PCSPhase | null;
  pcsSubPhaseOverride: TRANSITSubPhase | null;

  toggleDemoMode: () => void;
  setSelectedUser: (user: DemoUser) => void;
  setSelectedPhase: (phase: DemoPhase) => void;
  setPcsPhaseOverride: (phase: PCSPhase | null) => void;
  setPcsSubPhaseOverride: (subPhase: TRANSITSubPhase | null) => void;
  advanceLiquidationStatus: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      isDemoMode: false,
      selectedUser: DEMO_USERS[0],
      selectedPhase: DemoPhase.MVP,
      pcsPhaseOverride: null,
      pcsSubPhaseOverride: null,

      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      setSelectedUser: (user) => set({ selectedUser: user }),
      setSelectedPhase: (phase) => set({ selectedPhase: phase }),
      setPcsPhaseOverride: (phase) => set({ pcsPhaseOverride: phase }),
      setPcsSubPhaseOverride: (subPhase) => set({ pcsSubPhaseOverride: subPhase }),

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
    }),
    {
      name: 'demo-storage',
      storage: createJSONStorage(() => AsyncStorage),
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
