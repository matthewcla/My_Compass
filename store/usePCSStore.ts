import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistItem, PCSOrder, PCSSegmentStatus } from '@/types/pcs';
import { MOCK_PCS_ORDERS } from '@/constants/MockPCSData';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface PCSState {
  activeOrder: PCSOrder | null;
  checklist: ChecklistItem[];

  initializeOrders: () => void;
  updateSegmentStatus: (segmentId: string, status: PCSSegmentStatus) => void;
  setChecklistItemStatus: (id: string, status: ChecklistItem['status']) => void;
  resetPCS: () => void;
}

export const usePCSStore = create<PCSState>()(
  persist(
    (set, get) => ({
      activeOrder: null,
      checklist: [],

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
      },

      setChecklistItemStatus: (id: string, status: ChecklistItem['status']) => {
        const { checklist } = get();
        const updatedChecklist = checklist.map((item) =>
          item.id === id ? { ...item, status } : item
        );
        set({ checklist: updatedChecklist });
      },

      resetPCS: () => {
        set({ activeOrder: null, checklist: [] });
      },
    }),
    {
      name: 'pcs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
