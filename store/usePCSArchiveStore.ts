/**
 * ─────────────────────────────────────────────────────────────────────────────
 * usePCSArchiveStore.ts — PCS Document Archive ("Digital Sea Bag")
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Manages the sailor's historical PCS move archive. When a PCS order
 * transitions to DORMANT (all segments COMPLETE), the active order can
 * be archived into this store for long-term document access.
 *
 * Key features:
 *   • Loads/persists historical orders from SQLite
 *   • Searchable by command name, location
 *   • Filterable by fiscal year
 *   • Supports archiving active orders with document migration
 *
 * @module usePCSArchiveStore
 */

import { storage } from '@/services/storage';
import { HistoricalPCSOrder, PCSDocument } from '@/types/pcs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Simple UUID generator
const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// =============================================================================
// STORE TYPES
// =============================================================================

interface PCSArchiveState {
  historicalOrders: HistoricalPCSOrder[];
  selectedOrderId: string | null;
  searchQuery: string;
  filterYear: number | null;
  isLoading: boolean;

  // Actions
  fetchHistoricalOrders: (userId: string) => Promise<void>;
  setHistoricalOrders: (orders: HistoricalPCSOrder[]) => void;
  archiveActiveOrder: (userId: string) => Promise<void>;
  selectOrder: (orderId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterYear: (year: number | null) => void;
  deleteArchivedOrder: (orderId: string) => Promise<void>;

  // Dev actions
  seedDemoArchiveData: () => void;
  clearArchiveData: () => void;
}

// =============================================================================
// FISCAL YEAR HELPER
// =============================================================================

/**
 * Derive fiscal year from a date string.
 * Navy fiscal year starts October 1, so Oct-Dec = next calendar year's FY.
 */
function deriveFiscalYear(dateStr: string): number {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return new Date().getFullYear();
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();
  return month >= 9 ? year + 1 : year; // Oct (9) = next FY
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const usePCSArchiveStore = create<PCSArchiveState>()(
  persist(
    (set, get) => ({
      historicalOrders: [],
      selectedOrderId: null,
      searchQuery: '',
      filterYear: null,
      isLoading: false,

      fetchHistoricalOrders: async (userId: string) => {
        set({ isLoading: true });
        try {
          const orders = await storage.getUserHistoricalPCSOrders(userId);
          set({ historicalOrders: orders, isLoading: false });
        } catch (error) {
          console.error('[PCSArchiveStore] Failed to fetch historical orders:', error);
          set({ isLoading: false });
        }
      },

      setHistoricalOrders: (orders: HistoricalPCSOrder[]) => {
        set({ historicalOrders: orders });
      },

      archiveActiveOrder: async (userId: string) => {
        // Import lazily to avoid circular deps
        const { usePCSStore } = require('./usePCSStore');
        const pcsState = usePCSStore.getState();
        const activeOrder = pcsState.activeOrder;

        if (!activeOrder) return;

        const segments = activeOrder.segments;
        const originSegment = segments[0];
        const destinationSegment = segments[segments.length - 1];

        const historical: HistoricalPCSOrder = {
          id: `pcs-${Date.now()}`,
          orderNumber: activeOrder.orderNumber,
          userId,
          originCommand: originSegment?.location?.name || 'Unknown',
          originLocation: originSegment?.location?.zip || '',
          gainingCommand: activeOrder.gainingCommand.name,
          gainingLocation: activeOrder.gainingCommand.zip || destinationSegment?.location?.zip || '',
          departureDate: originSegment?.dates?.projectedDeparture || '',
          arrivalDate: destinationSegment?.dates?.projectedArrival || '',
          fiscalYear: deriveFiscalYear(originSegment?.dates?.projectedDeparture || ''),
          totalMalt: pcsState.financials.totalMalt,
          totalPerDiem: pcsState.financials.totalPerDiem,
          totalReimbursement: pcsState.financials.liquidation?.actualPaymentAmount || 0,
          documents: [],
          status: 'ARCHIVED',
          archivedAt: new Date().toISOString(),
          isOconus: activeOrder.isOconus,
          isSeaDuty: activeOrder.isSeaDuty,
        };

        // Migrate cached orders PDF to archive documents
        const cachedOrders = pcsState.cachedOrders;
        if (cachedOrders) {
          const ordersDoc: PCSDocument = {
            id: generateUUID(),
            pcsOrderId: historical.id,
            category: 'ORDERS',
            filename: cachedOrders.filename,
            displayName: `Official Orders - ${activeOrder.orderNumber}`,
            localUri: cachedOrders.localUri,
            originalUrl: cachedOrders.originalUrl,
            sizeBytes: cachedOrders.sizeBytes,
            uploadedAt: cachedOrders.cachedAt,
          };
          historical.documents.push(ordersDoc);
        }

        // Save to SQLite
        await storage.saveHistoricalPCSOrder(historical);

        // Update local state
        set((state) => ({
          historicalOrders: [historical, ...state.historicalOrders],
        }));

        // Clear active order
        pcsState.resetPCS();
      },

      selectOrder: (orderId: string | null) => {
        set({ selectedOrderId: orderId });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setFilterYear: (year: number | null) => {
        set({ filterYear: year });
      },

      deleteArchivedOrder: async (orderId: string) => {
        await storage.deleteHistoricalPCSOrder(orderId);
        set((state) => ({
          historicalOrders: state.historicalOrders.filter((o) => o.id !== orderId),
          selectedOrderId: state.selectedOrderId === orderId ? null : state.selectedOrderId,
        }));
      },

      seedDemoArchiveData: () => {
        const now = new Date().toISOString();
        const demoOrders: HistoricalPCSOrder[] = [
          {
            id: generateUUID(),
            orderNumber: 'N01234-25-001',
            userId: 'demo-user',
            originCommand: 'USS GEORGE WASHINGTON (CVN 73)',
            originLocation: 'Norfolk, VA',
            gainingCommand: 'NMCB ELEVEN',
            gainingLocation: 'Gulfport, MS',
            departureDate: '2025-03-15',
            arrivalDate: '2025-03-22',
            fiscalYear: 2025,
            totalMalt: 2400,
            totalPerDiem: 1150,
            totalReimbursement: 5200,
            status: 'ARCHIVED',
            archivedAt: now,
            isOconus: false,
            isSeaDuty: true,
            documents: [
              {
                id: generateUUID(),
                category: 'ORDERS',
                filename: 'official_orders_2025.pdf',
                displayName: 'Official PCS Orders FY25',
                localUri: '',
                sizeBytes: 245_760,
                uploadedAt: '2025-03-01T12:00:00Z',
                pcsOrderId: '',
              },
              {
                id: generateUUID(),
                category: 'TRAVEL_VOUCHER',
                filename: 'dd1351_2025.pdf',
                displayName: 'DD 1351-2 Travel Voucher',
                localUri: '',
                sizeBytes: 128_000,
                uploadedAt: '2025-04-10T12:00:00Z',
                pcsOrderId: '',
              },
              {
                id: generateUUID(),
                category: 'RECEIPT',
                filename: 'hotel_receipt.jpg',
                displayName: 'Marriott TLA Receipt',
                localUri: '',
                sizeBytes: 42_000,
                uploadedAt: '2025-03-20T12:00:00Z',
                pcsOrderId: '',
              },
            ],
          },
          {
            id: generateUUID(),
            orderNumber: 'N05678-23-002',
            userId: 'demo-user',
            originCommand: 'NAVSTA NORFOLK',
            originLocation: 'Norfolk, VA',
            gainingCommand: 'USS GEORGE WASHINGTON (CVN 73)',
            gainingLocation: 'Norfolk, VA',
            departureDate: '2023-06-01',
            arrivalDate: '2023-06-03',
            fiscalYear: 2023,
            totalMalt: 0,
            totalPerDiem: 450,
            totalReimbursement: 1800,
            status: 'ARCHIVED',
            archivedAt: now,
            isOconus: false,
            isSeaDuty: true,
            documents: [
              {
                id: generateUUID(),
                category: 'ORDERS',
                filename: 'official_orders_2023.pdf',
                displayName: 'Official PCS Orders FY23',
                localUri: '',
                sizeBytes: 310_000,
                uploadedAt: '2023-05-15T12:00:00Z',
                pcsOrderId: '',
              },
              {
                id: generateUUID(),
                category: 'W2',
                filename: 'w2_2023.pdf',
                displayName: 'W-2 Tax Form 2023',
                localUri: '',
                sizeBytes: 95_000,
                uploadedAt: '2024-01-31T12:00:00Z',
                pcsOrderId: '',
              },
            ],
          },
          {
            id: generateUUID(),
            orderNumber: 'N09012-21-005',
            userId: 'demo-user',
            originCommand: 'NATTC PENSACOLA',
            originLocation: 'Pensacola, FL',
            gainingCommand: 'NAVSTA NORFOLK',
            gainingLocation: 'Norfolk, VA',
            departureDate: '2021-08-20',
            arrivalDate: '2021-08-25',
            fiscalYear: 2021,
            totalMalt: 1800,
            totalPerDiem: 850,
            totalReimbursement: 3600,
            status: 'ARCHIVED',
            archivedAt: now,
            isOconus: false,
            isSeaDuty: false,
            documents: [
              {
                id: generateUUID(),
                category: 'ORDERS',
                filename: 'official_orders_2021.pdf',
                displayName: 'Official PCS Orders FY21',
                localUri: '',
                sizeBytes: 198_000,
                uploadedAt: '2021-08-01T12:00:00Z',
                pcsOrderId: '',
              },
            ],
          },
        ];
        set({ historicalOrders: demoOrders, selectedOrderId: null, searchQuery: '', filterYear: null });
      },

      clearArchiveData: () => {
        set({ historicalOrders: [], selectedOrderId: null, searchQuery: '', filterYear: null });
      },
    }),
    {
      name: 'pcs-archive-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        historicalOrders: state.historicalOrders,
        selectedOrderId: null, // Don't persist selection
        searchQuery: '', // Don't persist search
        filterYear: null, // Don't persist filter
        isLoading: false,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Returns historical orders filtered by search query and fiscal year.
 * Memoized to prevent unnecessary re-renders.
 */
export const useFilteredHistoricalOrders = (): HistoricalPCSOrder[] => {
  const orders = usePCSArchiveStore((s) => s.historicalOrders);
  const query = usePCSArchiveStore((s) => s.searchQuery);
  const filterYear = usePCSArchiveStore((s) => s.filterYear);

  return useMemo(() => {
    let filtered = orders;

    if (filterYear) {
      filtered = filtered.filter((o) => o.fiscalYear === filterYear);
    }

    if (query.trim()) {
      const lower = query.toLowerCase().trim();
      filtered = filtered.filter(
        (o) =>
          o.originCommand.toLowerCase().includes(lower) ||
          o.gainingCommand.toLowerCase().includes(lower) ||
          o.originLocation.toLowerCase().includes(lower) ||
          o.gainingLocation.toLowerCase().includes(lower) ||
          String(o.fiscalYear).includes(lower) ||
          o.orderNumber.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [orders, query, filterYear]);
};

/**
 * Returns the currently selected historical order, or null.
 */
export const useSelectedHistoricalOrder = (): HistoricalPCSOrder | null => {
  const orders = usePCSArchiveStore((s) => s.historicalOrders);
  const selectedId = usePCSArchiveStore((s) => s.selectedOrderId);

  return useMemo(() => {
    if (!selectedId) return null;
    return orders.find((o) => o.id === selectedId) || null;
  }, [orders, selectedId]);
};

/**
 * Returns available fiscal years from historical orders for filter chips.
 */
export const useAvailableFiscalYears = (): number[] => {
  const orders = usePCSArchiveStore((s) => s.historicalOrders);

  return useMemo(() => {
    const years = new Set(orders.map((o) => o.fiscalYear));
    return Array.from(years).sort((a, b) => b - a); // Descending
  }, [orders]);
};
