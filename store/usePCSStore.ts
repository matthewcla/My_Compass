import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistItem, PCSOrder, PCSSegmentStatus } from '@/types/pcs';
import { MOCK_PCS_ORDERS } from '@/constants/MockPCSData';
import { useUserStore } from './useUserStore';
import { calculateSegmentEntitlement, getDLARate } from '@/utils/jtr';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface Financials {
  advancePay: {
    requested: boolean;
    amount: number;
    months: number;
    repaymentMonths: number;
    repaymentJustification: string | null;
    timing: 'EARLY' | 'STANDARD' | 'LATE';
    timingJustification: string | null;
    justification: string | null;
  };
  dla: {
    eligible: boolean;
    estimatedAmount: number;
    receivedFY: boolean;
  };
  obliserv: {
    required: boolean;
    eaos: string;
    status: 'PENDING' | 'COMPLETE';
  };
  // Added to store calculated entitlements
  totalMalt: number;
  totalPerDiem: number;
}

interface PCSState {
  activeOrder: PCSOrder | null;
  checklist: ChecklistItem[];
  financials: Financials;

  initializeOrders: () => void;
  updateSegmentStatus: (segmentId: string, status: PCSSegmentStatus) => void;
  setChecklistItemStatus: (id: string, status: ChecklistItem['status']) => void;
  resetPCS: () => void;
  recalculateFinancials: () => void;
  checkObliserv: () => void;
}

export const usePCSStore = create<PCSState>()(
  persist(
    (set, get) => ({
      activeOrder: null,
      checklist: [],
      financials: {
        advancePay: {
          requested: false,
          amount: 0,
          months: 1,
          repaymentMonths: 12,
          repaymentJustification: null,
          timing: 'STANDARD',
          timingJustification: null,
          justification: null,
        },
        dla: {
          eligible: false,
          estimatedAmount: 0,
          receivedFY: false,
        },
        obliserv: {
          required: false,
          eaos: '',
          status: 'PENDING',
        },
        totalMalt: 0,
        totalPerDiem: 0,
      },

      initializeOrders: () => {
        const order = MOCK_PCS_ORDERS;
        const checklist: ChecklistItem[] = [];

        // 1. Always Add
        checklist.push({
          id: generateUUID(),
          label: 'Profile Confirmation',
          status: 'NOT_STARTED',
          category: 'PRE_TRAVEL',
        });
        checklist.push({
          id: generateUUID(),
          label: 'OBLISERV Check',
          status: 'NOT_STARTED',
          category: 'PRE_TRAVEL',
        });

        // 2. Conditional Checks
        if (order.isOconus) {
          checklist.push({
            id: generateUUID(),
            label: 'Overseas Screening',
            status: 'NOT_STARTED',
            category: 'SCREENING',
          });
        }

        if (order.isSeaDuty) {
          checklist.push({
            id: generateUUID(),
            label: 'Sea Duty Screening',
            status: 'NOT_STARTED',
            category: 'SCREENING',
          });
        }

        // 3. Segment Planning
        order.segments.forEach((segment) => {
          checklist.push({
            id: generateUUID(),
            label: `Plan Travel: ${segment.title}`,
            segmentId: segment.id,
            status: 'NOT_STARTED',
            category: 'PRE_TRAVEL',
          });
        });

        set({ activeOrder: order, checklist });

        // Initial calculations
        get().recalculateFinancials();
        get().checkObliserv();
      },

      updateSegmentStatus: (segmentId: string, status: PCSSegmentStatus) => {
        const { activeOrder } = get();
        if (!activeOrder) return;

        const updatedSegments = activeOrder.segments.map((seg) =>
          seg.id === segmentId ? { ...seg, status } : seg
        );

        set({
          activeOrder: {
            ...activeOrder,
            segments: updatedSegments,
          },
        });

        // Recalculate as segments change (e.g. status changes might imply plan confirmation, though currently only status updates)
        // Ideally we should recalculate if plan details change.
        // For now, we'll leave it manual or on init, or add it here.
        get().recalculateFinancials();
      },

      setChecklistItemStatus: (id: string, status: ChecklistItem['status']) => {
        const { checklist } = get();
        const updatedChecklist = checklist.map((item) =>
          item.id === id ? { ...item, status } : item
        );
        set({ checklist: updatedChecklist });
      },

      resetPCS: () => {
        set({
          activeOrder: null,
          checklist: [],
          financials: {
            advancePay: {
              requested: false,
              amount: 0,
              months: 1,
              repaymentMonths: 12,
              repaymentJustification: null,
              timing: 'STANDARD',
              timingJustification: null,
              justification: null,
            },
            dla: {
              eligible: false,
              estimatedAmount: 0,
              receivedFY: false,
            },
            obliserv: {
              required: false,
              eaos: '',
              status: 'PENDING',
            },
            totalMalt: 0,
            totalPerDiem: 0,
          }
        });
      },

      recalculateFinancials: () => {
        const { activeOrder, financials } = get();
        if (!activeOrder) return;

        const user = useUserStore.getState().user;
        if (!user) return;

        let totalMalt = 0;
        let totalPerDiem = 0;

        // Sum MALT/Per Diem per segment
        activeOrder.segments.forEach(segment => {
           const { malt, perDiem } = calculateSegmentEntitlement(segment);
           totalMalt += malt;
           totalPerDiem += perDiem;
        });

        // DLA Calculation
        const hasDependents = (user.dependents || 0) > 0;
        const dlaRate = getDLARate(user.rank, hasDependents);

        set({
            financials: {
                ...financials,
                dla: {
                    ...financials.dla,
                    eligible: true, // Assuming basic eligibility
                    estimatedAmount: dlaRate,
                },
                totalMalt,
                totalPerDiem,
            }
        });
      },

      checkObliserv: () => {
        const { activeOrder, financials } = get();
        const user = useUserStore.getState().user;

        if (!activeOrder || !user || !user.eaos) return;

        const reportDate = new Date(activeOrder.reportNLT);
        const eaosDate = new Date(user.eaos);

        // Report + 36 months
        // Logic: You need 3 years of obligated service from the report date
        const requiredServiceDate = new Date(reportDate);
        requiredServiceDate.setMonth(requiredServiceDate.getMonth() + 36);

        // If EAOS is BEFORE the required service date, OBLISERV is required
        const isObliservRequired = eaosDate < requiredServiceDate;

        set({
            financials: {
                ...financials,
                obliserv: {
                    ...financials.obliserv,
                    required: isObliservRequired,
                    eaos: user.eaos,
                    status: isObliservRequired ? 'PENDING' : 'COMPLETE',
                }
            }
        });
      }
    }),
    {
      name: 'pcs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
