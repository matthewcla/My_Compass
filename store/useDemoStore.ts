import { DEMO_USERS, DemoPhase, DemoUser } from '@/constants/DemoData';
import { useUserStore } from '@/store/useUserStore';
import { PCSPhase } from '@/types/pcs';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DemoState {
  isDemoMode: boolean;
  selectedUser: DemoUser;
  selectedPhase: DemoPhase;
  pcsPhaseOverride: PCSPhase | null;

  toggleDemoMode: () => void;
  setSelectedUser: (user: DemoUser) => void;
  setSelectedPhase: (phase: DemoPhase) => void;
  setPcsPhaseOverride: (phase: PCSPhase | null) => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      isDemoMode: false,
      selectedUser: DEMO_USERS[0],
      selectedPhase: DemoPhase.MVP,
      pcsPhaseOverride: null,

      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      setSelectedUser: (user) => set({ selectedUser: user }),
      setSelectedPhase: (phase) => set({ selectedPhase: phase }),
      setPcsPhaseOverride: (phase) => set({ pcsPhaseOverride: phase }),
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
