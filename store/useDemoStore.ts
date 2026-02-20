import { DEMO_USERS, DemoPhase, DemoUser } from '@/constants/DemoData';
import { getNegotiationDetailsByUserId, getSelectionDetailsByUserId, NegotiationDetails } from '@/constants/MockPCSData';
import { useUserStore } from '@/store/useUserStore';
import { AssignmentPhase, LiquidationStatus, PCSPhase, SelectionDetails, TRANSITSubPhase, UCTPhase } from '@/types/pcs';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ── Unified Lifecycle Steps ─────────────────────────────────────────────────

export interface LifecycleTimeline {
  daysUntilOpen: number;
  daysToReport: number;
  daysOnStation: number;
}

export interface LifecycleStep {
  step: number;
  label: string;
  icon: string;
  assignment: AssignmentPhase | null;
  pcs: { phase: PCSPhase | null; sub: TRANSITSubPhase | null; uct: UCTPhase | null; context: 'ACTIVE' | 'ARCHIVE' } | null;
  timeline: LifecycleTimeline;
}

export const LIFECYCLE_STEPS: LifecycleStep[] = [
  { step: 0, label: 'Discovery', icon: '🔍', assignment: 'DISCOVERY', pcs: null, timeline: { daysUntilOpen: 45, daysToReport: 0, daysOnStation: 0 } },
  { step: 1, label: 'On-Ramp', icon: '📋', assignment: 'ON_RAMP', pcs: null, timeline: { daysUntilOpen: 12, daysToReport: 0, daysOnStation: 0 } },
  { step: 2, label: 'Negotiation', icon: '🤝', assignment: 'NEGOTIATION', pcs: null, timeline: { daysUntilOpen: 0, daysToReport: 0, daysOnStation: 0 } },
  { step: 3, label: 'Selection', icon: '⭐', assignment: 'SELECTION', pcs: null, timeline: { daysUntilOpen: 0, daysToReport: 120, daysOnStation: 0 } },
  { step: 4, label: 'Processing', icon: '⏳', assignment: 'ORDERS_PROCESSING', pcs: null, timeline: { daysUntilOpen: 0, daysToReport: 90, daysOnStation: 0 } },
  { step: 5, label: 'Orders Released', icon: '📄', assignment: 'ORDERS_RELEASED', pcs: { phase: 'ORDERS_NEGOTIATION', sub: null, uct: 1, context: 'ACTIVE' }, timeline: { daysUntilOpen: 0, daysToReport: 75, daysOnStation: 0 } },
  { step: 6, label: 'Plan Move', icon: '📦', assignment: 'ORDERS_RELEASED', pcs: { phase: 'TRANSIT_LEAVE', sub: 'PLANNING', uct: 2, context: 'ACTIVE' }, timeline: { daysUntilOpen: 0, daysToReport: 45, daysOnStation: 0 } },
  { step: 7, label: 'En Route', icon: '✈️', assignment: 'ORDERS_RELEASED', pcs: { phase: 'TRANSIT_LEAVE', sub: 'ACTIVE_TRAVEL', uct: 3, context: 'ACTIVE' }, timeline: { daysUntilOpen: 0, daysToReport: 14, daysOnStation: 0 } },
  { step: 8, label: 'Arrived', icon: '⚓', assignment: 'ORDERS_RELEASED', pcs: { phase: 'CHECK_IN', sub: null, uct: 4, context: 'ACTIVE' }, timeline: { daysUntilOpen: 0, daysToReport: 0, daysOnStation: 3 } },
  { step: 9, label: 'Sea Bag', icon: '🎒', assignment: null, pcs: { phase: null, sub: null, uct: null, context: 'ARCHIVE' }, timeline: { daysUntilOpen: 0, daysToReport: 0, daysOnStation: 0 } },
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
  assignmentPhaseOverride: AssignmentPhase | null;
  selectionDetails: SelectionDetails | null;
  negotiationDetails: NegotiationDetails | null;
  selectionChecklist: {
    contactVerified: boolean;
    dependentsVerified: boolean;
    sponsorContacted: boolean;
  };
  lifecycleStep: number;
  demoTimelineOverride: LifecycleTimeline | null;
  showDevFloatingIcons: boolean;

  toggleDemoMode: () => void;
  setSelectedUser: (user: DemoUser) => void;
  setSelectedPhase: (phase: DemoPhase) => void;
  setPcsPhaseOverride: (phase: PCSPhase | null) => void;
  setPcsSubPhaseOverride: (subPhase: TRANSITSubPhase | null) => void;
  setUctPhaseOverride: (phase: UCTPhase | null) => void;
  setPcsContextOverride: (context: 'ACTIVE' | 'ARCHIVE' | null) => void;
  applyDemoScenario: (scenario: { context: 'ACTIVE' | 'ARCHIVE'; phase: PCSPhase | null; subPhase?: TRANSITSubPhase | null; uctPhase?: UCTPhase | null; id: string }) => void;
  clearDemoScenario: () => void;
  setAssignmentPhaseOverride: (phase: AssignmentPhase | null) => void;
  setLifecycleStep: (step: number) => void;
  updateSelectedUser: (updates: Partial<DemoUser>) => void;
  advanceLiquidationStatus: () => void;
  loadMockHistoricalOrders: () => void;
  toggleDevFloatingIcons: () => void;
  toggleSelectionChecklist: (key: keyof DemoState['selectionChecklist']) => void;
  resetSelectionChecklist: () => void;
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
      assignmentPhaseOverride: null,
      selectionDetails: null,
      negotiationDetails: null,
      selectionChecklist: {
        contactVerified: false,
        dependentsVerified: false,
        sponsorContacted: false,
      },
      lifecycleStep: 0,
      demoTimelineOverride: null,
      showDevFloatingIcons: true,

      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      toggleDevFloatingIcons: () => set((state) => ({ showDevFloatingIcons: !state.showDevFloatingIcons })),
      setSelectedUser: (user) => set({ selectedUser: user }),
      updateSelectedUser: (updates) => set((state) => ({
        selectedUser: { ...state.selectedUser, ...updates },
      })),
      setSelectedPhase: (phase) => set({ selectedPhase: phase }),
      setPcsPhaseOverride: (phase) => set({ pcsPhaseOverride: phase, activeDemoScenarioId: null }),
      setPcsSubPhaseOverride: (subPhase) => set({ pcsSubPhaseOverride: subPhase, activeDemoScenarioId: null }),
      setUctPhaseOverride: (phase) => set({ uctPhaseOverride: phase, activeDemoScenarioId: null }),
      setPcsContextOverride: (context) => set({ pcsContextOverride: context, activeDemoScenarioId: null }),

      setAssignmentPhaseOverride: (phase) => set((state) => {
        if (phase === 'ORDERS_RELEASED') {
          // Auto-activate PCS with Orders Received settings
          return {
            assignmentPhaseOverride: phase,
            selectedPhase: DemoPhase.MY_PCS,
            pcsContextOverride: 'ACTIVE',
            pcsPhaseOverride: 'ORDERS_NEGOTIATION',
            uctPhaseOverride: 1,
            activeDemoScenarioId: 'orders',
          };
        }
        // Deselecting or selecting non-PCS phases: clear PCS overrides
        return {
          assignmentPhaseOverride: phase,
          selectedPhase: phase ? DemoPhase.MVP : state.selectedPhase,
          pcsContextOverride: phase ? null : state.pcsContextOverride,
          pcsPhaseOverride: phase ? null : state.pcsPhaseOverride,
          uctPhaseOverride: phase ? null : state.uctPhaseOverride,
          pcsSubPhaseOverride: phase ? null : state.pcsSubPhaseOverride,
          activeDemoScenarioId: phase ? null : state.activeDemoScenarioId,
        };
      }),

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

      toggleSelectionChecklist: (key) => set((state) => ({
        selectionChecklist: {
          ...state.selectionChecklist,
          [key]: !state.selectionChecklist[key]
        }
      })),

      resetSelectionChecklist: () => set({
        selectionChecklist: {
          contactVerified: false,
          dependentsVerified: false,
          sponsorContacted: false,
        }
      }),

      setLifecycleStep: (step) => {
        const clamped = Math.max(0, Math.min(step, LIFECYCLE_STEPS.length - 1));
        const target = LIFECYCLE_STEPS[clamped];
        const hasPCS = !!target.pcs;
        // Populate phase-specific details
        const needsSelection = target.assignment === 'SELECTION' || target.assignment === 'ORDERS_PROCESSING';
        const needsNegotiation = target.assignment === 'NEGOTIATION';
        const userId = useDemoStore.getState().selectedUser.id;
        set({
          isDemoMode: true,
          lifecycleStep: clamped,
          assignmentPhaseOverride: target.assignment,
          selectionDetails: needsSelection ? getSelectionDetailsByUserId(userId) : null,
          negotiationDetails: needsNegotiation ? getNegotiationDetailsByUserId(userId) : null,
          selectedPhase: hasPCS ? DemoPhase.MY_PCS : DemoPhase.MVP,
          pcsContextOverride: target.pcs?.context ?? null,
          pcsPhaseOverride: target.pcs?.phase ?? null,
          pcsSubPhaseOverride: target.pcs?.sub ?? null,
          uctPhaseOverride: target.pcs?.uct ?? null,
          activeDemoScenarioId: null,
          demoTimelineOverride: target.timeline,
        });

        // Trigger OBLISERV check when entering Selection or Processing phases
        if (needsSelection) {
          const { usePCSStore } = require('./usePCSStore');
          usePCSStore.getState().checkObliserv();
        }
      },

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
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version === 0 || version === undefined) {
          const state = persisted as any;
          if (state.lifecycleStep === undefined) state.lifecycleStep = 0;
          if (state.showDevFloatingIcons === undefined) state.showDevFloatingIcons = true;
          if (state.pcsContextOverride === undefined) state.pcsContextOverride = null;
          if (state.uctPhaseOverride === undefined) state.uctPhaseOverride = null;
          if (state.assignmentPhaseOverride === undefined) state.assignmentPhaseOverride = null;
          if (state.selectionDetails === undefined) state.selectionDetails = null;
          if (state.negotiationDetails === undefined) state.negotiationDetails = null;
        }
        return persisted;
      },
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
