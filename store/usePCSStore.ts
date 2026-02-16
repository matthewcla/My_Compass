import { services } from '@/services/api/serviceRegistry';
import { ChecklistItem, HHGItem, HHGShipment, HHGShipmentType, LiquidationStatus, LiquidationStep, LiquidationTracking, MovingCostsBreakdown, PCSOrder, PCSPhase, PCSReceipt, PCSRoute, PCSSegment, PCSSegmentStatus, TRANSITSubPhase, UCTNodeStatus, UCTPhase } from '@/types/pcs';
import { getHHGWeightAllowance } from '@/utils/hhg';
import { calculateSegmentEntitlement, getDLARate } from '@/utils/jtr';
import { CachedPDF, cachePDF, deleteCachedPDF, loadPDFMetadata, savePDFMetadata } from '@/utils/pdfCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useDemoStore } from './useDemoStore';
import { useUserStore } from './useUserStore';

/**
 * Returns the active user — demo persona when demo mode is on, real user otherwise.
 * Safe to call from inside Zustand stores (uses getState, not hooks).
 */
const getActiveUser = () => {
  const demo = useDemoStore.getState();
  if (demo.isDemoMode && demo.selectedUser) return demo.selectedUser;
  return useUserStore.getState().user;
};

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Add business days to a date (excludes weekends).
 * Used for estimating payment dates in liquidation tracking.
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) added++;
  }
  return result;
}

/**
 * Derive the current PCS phase from segment statuses.
 * Pure function — no persisted state, always computed.
 */
export function derivePhase(segments: PCSSegment[] | undefined): PCSPhase {
  if (!segments || segments.length === 0) return 'DORMANT';

  const allLocked = segments.every((s) => s.status === 'LOCKED');
  const anyPlanning = segments.some((s) => s.status === 'PLANNING');
  const allComplete = segments.every((s) => s.status === 'COMPLETE');

  if (allComplete) return 'CHECK_IN';
  if (anyPlanning) return 'TRANSIT_LEAVE';
  if (allLocked) return 'ORDERS_NEGOTIATION';

  // Mixed states default to negotiation
  return 'ORDERS_NEGOTIATION';
}

/**
 * Derive whether a Sailor is still planning or actively traveling.
 * Compares today's date against the projected departure date.
 * Pure function — no persisted state, always computed.
 */
export function deriveSubPhase(currentDraft: PCSSegment | null): TRANSITSubPhase {
  if (!currentDraft) return 'PLANNING';

  const departureDate = new Date(currentDraft.dates.projectedDeparture);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  departureDate.setHours(0, 0, 0, 0);

  return today >= departureDate ? 'ACTIVE_TRAVEL' : 'PLANNING';
}

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
    intent?: 'reenlist' | 'extend' | null;
    // Extension-specific (NAVPERS 1070/621)
    extensionMonths?: number;
    reasonForExtension?: string;
    // Reenlistment-specific (NAVPERS 1070/601)
    reenlistmentTermYears?: number;
    reenlistmentStartDate?: string;
    placeOfReenlistment?: string;
    leaveDaysSellBack?: number;
    // Shared
    promises?: string;
    newExpirationDate?: string;
    submittedAt?: string;
  };
  // Added to store calculated entitlements
  totalMalt: number;
  totalPerDiem: number;
  hhg: {
    maxWeightAllowance: number;
    estimatedWeight: number;        // sum across ALL shipments
    isOverLimit: boolean;
    shipments: HHGShipment[];       // multi-shipment support
    estimatedExcessCost: number;
  };
  movingCosts: MovingCostsBreakdown | null;
  liquidation: LiquidationTracking | null;
  /** null = not yet answered (defaults to hasDependents). true = accompanied. false = geo-bachelor. */
  dependentsRelocating: boolean | null;
}

interface PCSState {
  activeOrder: PCSOrder | null;
  checklist: ChecklistItem[];
  financials: Financials;
  receipts: PCSReceipt[];
  currentDraft: PCSSegment | null;

  initializeOrders: () => Promise<void>;
  updateSegmentStatus: (segmentId: string, status: PCSSegmentStatus) => void;
  setChecklistItemStatus: (id: string, status: ChecklistItem['status']) => void;
  resetPCS: () => void;
  recalculateFinancials: () => void;
  checkObliserv: () => void;
  updateFinancials: (updates: Partial<Financials> | ((prev: Financials) => Partial<Financials>)) => void;
  startPlanning: (segmentId: string) => void;
  commitSegment: (segmentId: string) => void;
  updateDraft: (updates: Partial<PCSSegment>) => void;

  // Receipt Vault Actions
  addReceipt: (receipt: Omit<PCSReceipt, 'id' | 'capturedAt'>) => void;
  removeReceipt: (id: string) => void;
  updateReceipt: (id: string, updates: Partial<PCSReceipt>) => void;

  // HHG Shipment Actions (multi-shipment)
  addShipment: (type: HHGShipmentType, label: string, originZip: string, destinationZip?: string | null) => void;
  removeShipment: (id: string) => void;
  addItemToShipment: (shipmentId: string, item: Omit<HHGItem, 'id'>) => void;
  removeItemFromShipment: (shipmentId: string, itemId: string) => void;
  updateShipment: (id: string, updates: Partial<HHGShipment>) => void;

  // Legacy HHG Actions (forward to default shipment for backward compat)
  addHHGItem: (item: Omit<HHGItem, 'id'>) => void;
  removeHHGItem: (id: string) => void;
  clearHHGItems: () => void;
  updateHHGPlan: (updates: Partial<{ estimatedExcessCost: number }>) => void;
  updateMovingCosts: (updates: Partial<MovingCostsBreakdown>) => void;

  // Liquidation Actions
  initializeLiquidation: (claimId: string) => void;
  updateLiquidationStatus: (status: LiquidationStatus) => void;

  // Caching
  cachedOrders: CachedPDF | null;
  cacheOrders: (url: string) => Promise<{ success: boolean; cached?: CachedPDF; error?: any }>;
  initializeOrdersCache: () => Promise<void>;
}

export const usePCSStore = create<PCSState>()(
  persist(
    (set, get) => ({
      activeOrder: null,
      checklist: [],
      currentDraft: null,
      receipts: [],
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
        hhg: {
          maxWeightAllowance: 0,
          estimatedWeight: 0,
          isOverLimit: false,
          shipments: [],
          estimatedExcessCost: 0,
        },
        movingCosts: null,
        liquidation: null,
        dependentsRelocating: null,
      },
      cachedOrders: null,

      initializeOrders: async () => {
        const userId = useUserStore.getState().user?.id ?? 'unknown';
        const result = await services.pcs.fetchActiveOrder(userId);
        if (!result.success) {
          console.error('[PCSStore] Failed to fetch active order:', result.error.message);
          return;
        }
        const order = result.data;
        const checklist: ChecklistItem[] = [];

        // Phase 1: Orders & OBLISERV
        checklist.push({
          id: generateUUID(),
          label: 'Profile Confirmation',
          status: 'NOT_STARTED',
          category: 'PRE_TRAVEL',
          uctPhase: 1,
          actionRoute: '/pcs-wizard/profile-confirmation',
          helpText: 'Verify your rank, dependents, and contact info are current in the system.',
        });

        // Conditional: housing not yet secured → open task to update later
        const demoStore = require('./useDemoStore').useDemoStore;
        const currentUser = demoStore.getState().isDemoMode
          ? demoStore.getState().selectedUser
          : useUserStore.getState().user;
        if (currentUser?.housing?.type === 'not_yet_secured') {
          checklist.push({
            id: generateUUID(),
            label: 'Update Residence',
            status: 'NOT_STARTED',
            category: 'PRE_TRAVEL',
            uctPhase: 1,
            actionRoute: '/pcs-wizard/profile-confirmation',
            helpText: 'You indicated housing is not yet secured. Update your residence when finalized.',
          });
        }


        // Phase 1: Conditional Screenings
        if (order.isOconus) {
          checklist.push({
            id: generateUUID(),
            label: 'Overseas Screening',
            status: 'NOT_STARTED',
            category: 'SCREENING',
            uctPhase: 1,
            helpText: 'Required medical, dental, and security screenings for OCONUS duty stations.',
          });
        }

        if (order.isSeaDuty) {
          checklist.push({
            id: generateUUID(),
            label: 'Sea Duty Screening',
            status: 'NOT_STARTED',
            category: 'SCREENING',
            uctPhase: 1,
            helpText: 'Physical readiness screening required for sea duty assignments.',
          });
        }

        // Phase 2: Logistics & Finances
        checklist.push({
          id: generateUUID(),
          label: 'Household Goods Move Planner',
          status: 'NOT_STARTED',
          category: 'PRE_TRAVEL',
          uctPhase: 2,
          actionRoute: '/pcs-wizard/hhg-move-planner',
          helpText: 'Estimate your shipment weight, compare GBL vs. PPM costs, and schedule your pickup through DPS.',
        });
        checklist.push({
          id: generateUUID(),
          label: 'Financial Review & Requests',
          status: 'NOT_STARTED',
          category: 'FINANCE',
          uctPhase: 2,
          actionRoute: '/pcs-wizard/financial-review',
          helpText: 'Review entitlements, project moving costs vs. what the Navy covers, and decide on DLA + advance pay.',
        });

        // Phase 3: Transit & Leave — Segment Planning
        // Skip ORIGIN segments — they're detachment points, not travel legs
        order.segments
          .filter((seg) => seg.type !== 'ORIGIN')
          .forEach((segment) => {
            checklist.push({
              id: generateUUID(),
              label: `Plan Travel: ${segment.title}`,
              segmentId: segment.id,
              status: 'NOT_STARTED',
              category: 'PRE_TRAVEL',
              uctPhase: 3,
              actionRoute: `/pcs-wizard/${segment.id}`,
              helpText: 'Plan your route, travel mode, and leave for this segment.',
            });
          });

        // Phase 4: Check-in & Travel Claim
        checklist.push({
          id: generateUUID(),
          label: 'Complete Gaining Command Check-In',
          status: 'NOT_STARTED',
          category: 'PRE_TRAVEL',
          uctPhase: 4,
          helpText: 'Report to your new command\u2019s quarterdeck with your orders. This starts your check-in sheet.',
        });
        checklist.push({
          id: generateUUID(),
          label: 'File DD 1351-2 Travel Claim',
          status: 'NOT_STARTED',
          category: 'FINANCE',
          uctPhase: 4,
          actionRoute: '/travel-claim/request',
          helpText: 'Your travel voucher for reimbursement. File within 5 business days of arrival for fastest payout.',
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
          receipts: [],
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
            hhg: {
              maxWeightAllowance: 0,
              estimatedWeight: 0,
              isOverLimit: false,
              shipments: [],
              estimatedExcessCost: 0,
            },
            movingCosts: null,
            liquidation: null,
            dependentsRelocating: null,
          }
        });
      },

      recalculateFinancials: () => {
        const { activeOrder, financials } = get();

        const user = getActiveUser();
        if (!user) return;

        // ── DLA + HHG Weight — only need rank & dependent status ──
        const profileHasDeps = (user.dependents || 0) > 0;
        const hasDependents = financials.dependentsRelocating ?? profileHasDeps;
        const dlaRate = getDLARate(user.rank, hasDependents);

        // Safe fallback for persisted state that predates multi-shipment migration
        const currentHhg = financials.hhg ?? {
          maxWeightAllowance: 0,
          estimatedWeight: 0,
          isOverLimit: false,
          shipments: [],
          estimatedExcessCost: 0,
        };

        const allShipments = currentHhg.shipments ?? [];
        const maxWeight = getHHGWeightAllowance(user.rank || 'E-1', hasDependents);
        const estimatedWeight = allShipments.reduce(
          (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.estimatedWeight, 0), 0
        );

        // ── MALT / Per Diem — require order segments ──────────────
        let totalMalt = financials.totalMalt || 0;
        let totalPerDiem = financials.totalPerDiem || 0;

        if (activeOrder) {
          totalMalt = 0;
          totalPerDiem = 0;
          activeOrder.segments.forEach(segment => {
            const { malt, perDiem } = calculateSegmentEntitlement(segment);
            totalMalt += malt;
            totalPerDiem += perDiem;
          });
        }

        set({
          financials: {
            ...financials,
            dla: {
              ...financials.dla,
              eligible: true,
              estimatedAmount: financials.dla.receivedFY ? 0 : dlaRate,
            },
            totalMalt,
            totalPerDiem,
            hhg: {
              ...currentHhg,
              maxWeightAllowance: maxWeight,
              estimatedWeight,
              isOverLimit: estimatedWeight > maxWeight,
            },
          }
        });
      },

      updateFinancials: (updates) => {
        const { financials } = get();
        const newFinancials = typeof updates === 'function' ? updates(financials) : updates;

        // Deep merge logic (simplified for specific use cases or use lodash/immer if available, but here manual merge is safer)
        // Since updates is Partial<Financials>, we should be careful.
        // For now, assume top-level merge or specific nested merge if needed.
        // Actually, the requirement is to update nested fields like 'dla'.
        // Let's implement a shallow merge of top-level keys, but since 'dla' is an object, we need to merge it too if provided.
        // However, standard setState pattern usually replaces the object.
        // Let's make it smarter or just expect the caller to provide the full nested object if they want to update it.
        // A better approach for this store structure:

        let mergedFinancials = { ...financials };

        if (newFinancials.advancePay) {
          mergedFinancials.advancePay = { ...mergedFinancials.advancePay, ...newFinancials.advancePay };
        }
        if (newFinancials.dla) {
          mergedFinancials.dla = { ...mergedFinancials.dla, ...newFinancials.dla };
        }
        if (newFinancials.obliserv) {
          mergedFinancials.obliserv = { ...mergedFinancials.obliserv, ...newFinancials.obliserv };
        }
        // Top level primitives
        if (newFinancials.totalMalt !== undefined) mergedFinancials.totalMalt = newFinancials.totalMalt;
        if (newFinancials.totalPerDiem !== undefined) mergedFinancials.totalPerDiem = newFinancials.totalPerDiem;
        if (newFinancials.hhg) {
          mergedFinancials.hhg = { ...mergedFinancials.hhg, ...newFinancials.hhg };
        }
        if (newFinancials.liquidation !== undefined) {
          mergedFinancials.liquidation = newFinancials.liquidation;
        }
        if (newFinancials.dependentsRelocating !== undefined) {
          mergedFinancials.dependentsRelocating = newFinancials.dependentsRelocating;
        }

        set({ financials: mergedFinancials });

        // Trigger recalculation if needed, but recalculateFinancials might overwrite some values (like estimatedAmount).
        // If we update DLA receivedFY, we want recalculateFinancials to run to update estimatedAmount.
        if (newFinancials.dla && newFinancials.dla.receivedFY !== undefined) {
          get().recalculateFinancials();
        }

        // Recalculate if HHG shipments change
        if (newFinancials.hhg && newFinancials.hhg.shipments) {
          get().recalculateFinancials();
        }

        // Recalculate if geo-bachelor status changes (affects DLA rate + HHG weight)
        if (newFinancials.dependentsRelocating !== undefined) {
          get().recalculateFinancials();
        }
      },

      checkObliserv: () => {
        const { activeOrder, financials } = get();
        const user = getActiveUser();

        if (!activeOrder || !user || !user.eaos) return;

        const reportDate = new Date(activeOrder.reportNLT);
        const eaosDate = new Date(user.eaos);

        // Report + 36 months
        // Logic: You need 3 years of obligated service from the report date
        const requiredServiceDate = new Date(reportDate);
        requiredServiceDate.setMonth(requiredServiceDate.getMonth() + 36);

        // If EAOS is BEFORE the required service date, OBLISERV is required
        const isObliservRequired = eaosDate < requiredServiceDate;

        // Compute what status should be based on requirement
        // Note: If user submits an extension/reenlistment, obliserv-request.tsx
        // sets COMPLETE via updateFinancials() directly — not through this function.
        const expectedStatus = isObliservRequired ? 'PENDING' : 'COMPLETE';

        // Bail early if nothing changed — prevents re-render loops
        const current = financials.obliserv;
        if (current.required === isObliservRequired && current.eaos === user.eaos && current.status === expectedStatus) return;

        set({
          financials: {
            ...financials,
            obliserv: {
              ...financials.obliserv,
              required: isObliservRequired,
              eaos: user.eaos,
              status: expectedStatus,
            }
          }
        });
      },

      startPlanning: (segmentId: string) => {
        const { activeOrder } = get();
        if (!activeOrder) return;

        const segment = activeOrder.segments.find(s => s.id === segmentId);
        if (segment) {
          const draft = JSON.parse(JSON.stringify(segment));
          // Ensure stops array exists
          if (!draft.userPlan.stops) {
            draft.userPlan.stops = [];
          }
          set({ currentDraft: draft });
        }
      },

      commitSegment: (segmentId: string) => {
        const { currentDraft, activeOrder } = get();
        if (!currentDraft || !activeOrder || currentDraft.id !== segmentId) return;

        const updatedSegments = activeOrder.segments.map((s) =>
          s.id === segmentId ? { ...currentDraft, status: 'COMPLETE' as PCSSegmentStatus } : s
        );

        set({
          activeOrder: {
            ...activeOrder,
            segments: updatedSegments,
          },
          currentDraft: null,
        });

        // Recalculate financials after commit
        get().recalculateFinancials();
      },

      updateDraft: (updates: Partial<PCSSegment>) => {
        const { currentDraft } = get();
        if (!currentDraft) return;

        set({
          currentDraft: {
            ...currentDraft,
            ...updates,
          }
        });
      },

      // ─── Receipt Vault Actions ─────────────────────────────────────

      addReceipt: (receipt) => {
        const newReceipt: PCSReceipt = {
          ...receipt,
          id: generateUUID(),
          capturedAt: new Date().toISOString(),
        };
        set((state) => ({ receipts: [...state.receipts, newReceipt] }));
      },

      removeReceipt: (id) => {
        set((state) => ({ receipts: state.receipts.filter(r => r.id !== id) }));
      },

      updateReceipt: (id, updates) => {
        set((state) => ({
          receipts: state.receipts.map(r => r.id === id ? { ...r, ...updates } : r),
        }));
      },

      // ─── Multi-Shipment Actions ───────────────────────────────────

      addShipment: (type, label, originZip, destinationZip) => {
        const id = generateUUID();
        const newShipment: HHGShipment = {
          id,
          type,
          label,
          items: [],
          estimatedWeight: 0,
          originZip,
          destinationZip: type === 'NTS' ? null : (destinationZip ?? null),
          selectedPickupWindowId: null,
          status: 'DRAFT',
          ...(type === 'NTS' ? { storage: { facility: 'NTS', maxDaysSIT: 90, estimatedStartDate: new Date().toISOString().split('T')[0] } } : {}),
        };
        set((state) => ({
          financials: {
            ...state.financials,
            hhg: {
              ...state.financials.hhg,
              shipments: [...(state.financials.hhg.shipments || []), newShipment],
            },
          },
        }));
      },

      removeShipment: (id) => {
        set((state) => {
          const newShipments = (state.financials.hhg.shipments || []).filter(s => s.id !== id);
          const estimatedWeight = newShipments.reduce(
            (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.estimatedWeight, 0), 0
          );
          const maxWeight = state.financials.hhg.maxWeightAllowance || 0;
          return {
            financials: {
              ...state.financials,
              hhg: {
                ...state.financials.hhg,
                shipments: newShipments,
                estimatedWeight,
                isOverLimit: estimatedWeight > maxWeight,
              },
            },
          };
        });
      },

      addItemToShipment: (shipmentId, item) => {
        const itemId = generateUUID();
        set((state) => {
          const shipments = (state.financials.hhg.shipments || []).map(s => {
            if (s.id !== shipmentId) return s;
            const newItems = [...s.items, { ...item, id: itemId }];
            return {
              ...s,
              items: newItems,
              estimatedWeight: newItems.reduce((sum, i) => sum + i.estimatedWeight, 0),
            };
          });
          const estimatedWeight = shipments.reduce(
            (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.estimatedWeight, 0), 0
          );
          const maxWeight = state.financials.hhg.maxWeightAllowance || 0;
          return {
            financials: {
              ...state.financials,
              hhg: {
                ...state.financials.hhg,
                shipments,
                estimatedWeight,
                isOverLimit: estimatedWeight > maxWeight,
              },
            },
          };
        });
      },

      removeItemFromShipment: (shipmentId, itemId) => {
        set((state) => {
          const shipments = (state.financials.hhg.shipments || []).map(s => {
            if (s.id !== shipmentId) return s;
            const newItems = s.items.filter(i => i.id !== itemId);
            return {
              ...s,
              items: newItems,
              estimatedWeight: newItems.reduce((sum, i) => sum + i.estimatedWeight, 0),
            };
          });
          const estimatedWeight = shipments.reduce(
            (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.estimatedWeight, 0), 0
          );
          const maxWeight = state.financials.hhg.maxWeightAllowance || 0;
          return {
            financials: {
              ...state.financials,
              hhg: {
                ...state.financials.hhg,
                shipments,
                estimatedWeight,
                isOverLimit: estimatedWeight > maxWeight,
              },
            },
          };
        });
      },

      updateShipment: (id, updates) => {
        set((state) => ({
          financials: {
            ...state.financials,
            hhg: {
              ...state.financials.hhg,
              shipments: (state.financials.hhg.shipments || []).map(s =>
                s.id === id ? { ...s, ...updates } : s
              ),
            },
          },
        }));
      },

      // ─── Legacy HHG Actions (forward to default shipment) ────────

      addHHGItem: (item) => {
        const { financials } = get();
        let shipments = financials.hhg.shipments || [];
        let defaultShipment = shipments[0];
        if (!defaultShipment) {
          // Auto-create default shipment
          get().addShipment('GBL', 'Main Shipment', '');
          shipments = get().financials.hhg.shipments;
          defaultShipment = shipments[0];
        }
        get().addItemToShipment(defaultShipment.id, item);
      },

      removeHHGItem: (id) => {
        // Search all shipments for the item
        const { financials } = get();
        for (const s of (financials.hhg.shipments || [])) {
          if (s.items.some(i => i.id === id)) {
            get().removeItemFromShipment(s.id, id);
            return;
          }
        }
      },

      clearHHGItems: () => {
        set((state) => ({
          financials: {
            ...state.financials,
            hhg: {
              ...state.financials.hhg,
              shipments: [],
              estimatedWeight: 0,
              isOverLimit: false,
            },
          },
        }));
      },

      updateHHGPlan: (updates) => {
        set((state) => ({
          financials: {
            ...state.financials,
            hhg: {
              ...state.financials.hhg,
              ...updates,
            },
          },
        }));
      },

      updateMovingCosts: (updates) => {
        set((state) => {
          const current = state.financials.movingCosts ?? {
            securityDeposit: 0,
            firstLastRent: 0,
            temporaryLodging: 0,
            fuelEstimate: 0,
            mealsEstimate: 0,
            miscellaneous: 0,
            hhgExcessCost: 0,
            totalEstimated: 0,
          };
          const merged = { ...current, ...updates };
          merged.totalEstimated =
            merged.securityDeposit +
            merged.firstLastRent +
            merged.temporaryLodging +
            merged.fuelEstimate +
            merged.mealsEstimate +
            merged.miscellaneous +
            merged.hhgExcessCost;
          return {
            financials: {
              ...state.financials,
              movingCosts: merged,
            },
          };
        });
      },

      initializeLiquidation: (claimId: string) => {
        const steps: LiquidationStep[] = [
          { status: 'SUBMITTED', label: 'Submitted', completedDate: new Date().toISOString() },
          { status: 'CPPA_REVIEW', label: 'CPPA Review' },
          { status: 'NPPSC_AUDIT', label: 'NPPSC Audit' },
          { status: 'PAID', label: 'Paid' },
        ];

        set((state) => ({
          financials: {
            ...state.financials,
            liquidation: {
              claimId,
              currentStatus: 'SUBMITTED',
              steps,
              estimatedPaymentDate: addBusinessDays(new Date(), 14).toISOString(),
              actualPaymentAmount: null,
              submittedAt: new Date().toISOString(),
            },
          },
        }));
      },

      updateLiquidationStatus: (status: LiquidationStatus) => {
        set((state) => {
          if (!state.financials.liquidation) return state;

          const updatedSteps = state.financials.liquidation.steps.map(step =>
            step.status === status
              ? { ...step, completedDate: new Date().toISOString() }
              : step
          );

          return {
            financials: {
              ...state.financials,
              liquidation: {
                ...state.financials.liquidation,
                currentStatus: status,
                steps: updatedSteps,
              },
            },
          };
        });
      },

      cacheOrders: async (url: string) => {
        try {
          const filename = `orders_${Date.now()}.pdf`;
          const cached = await cachePDF(url, filename);
          await savePDFMetadata(cached); // Ensure metadata is saved (cachePDF does this too, but for consistency if cachePDF changes)
          // Actually cachePDF explicitly calls savePDFMetadata internally, so redundant but harmless.
          // Wait, cachePDF returns cachedPDF object.

          set({ cachedOrders: cached });
          return { success: true, cached };
        } catch (error) {
          console.error('[PCSStore] Failed to cache orders:', error);
          return { success: false, error };
        }
      },

      initializeOrdersCache: async () => {
        try {
          const metadata = await loadPDFMetadata();
          const allFiles = Object.values(metadata);

          // filter for orders
          const orderFiles = allFiles.filter(pdf => pdf.filename.startsWith('orders_'));

          // 1. Cleanup old files (> 90 days)
          const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
          const oldFiles = orderFiles.filter(pdf => new Date(pdf.cachedAt).getTime() < ninetyDaysAgo);

          await Promise.all(oldFiles.map(pdf => deleteCachedPDF(pdf.filename)));

          // 2. Determine latest valid cached file
          const validFiles = orderFiles.filter(pdf => {
            // Must be recent enough AND not deleted in step 1
            return new Date(pdf.cachedAt).getTime() >= ninetyDaysAgo;
          });

          if (validFiles.length > 0) {
            // Sort by Date Descending
            const sorted = validFiles.sort((a, b) =>
              new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime()
            );
            const latest = sorted[0];

            // Verify file actually exists
            const fileInfo = await FileSystem.getInfoAsync(latest.localUri);
            if (fileInfo.exists) {
              set({ cachedOrders: latest });
            } else {
              // Metadata ok but file gone - clean up
              await deleteCachedPDF(latest.filename);
              // Could try the next one, but typically if latest is gone, something is wrong.
              // For robustness, maybe loop? But simple approach is fine for now.
            }
          }
        } catch (error) {
          console.error('[PCSStore] Failed to initialize orders cache:', error);
        }
      },
    }),
    {
      name: 'pcs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Selector hooks for PCS data access
 */
export const useActiveOrder = () => usePCSStore((state) => state.activeOrder);
export const usePCSFinancials = () => usePCSStore((state) => state.financials);
export const usePCSChecklist = () => usePCSStore((state) => state.checklist);
export const selectHasActiveOrders = (state: PCSState) => state.activeOrder !== null;

/**
 * Get PCS Route from current user (via demo store or user store)
 * This connects the user's pcsRoute data to the PCS store consumers
 */
export const usePCSRoute = (): PCSRoute | null => {
  const user = useUserStore((state) => state.user);

  // Check if user has pcsRoute data (from demo personas)
  if (user && 'pcsRoute' in user) {
    return (user as any).pcsRoute || null;
  }

  return null;
};

/**
 * Computed phase selector — derives PCS phase from segment statuses.
 * Uses useMemo to prevent re-renders when segments haven't changed.
 * Respects pcsPhaseOverride from useDemoStore when demo mode is active.
 */
export const usePCSPhase = (): PCSPhase => {
  const segments = usePCSStore((state) => state.activeOrder?.segments);
  const isDemoMode = useDemoStore((state) => state.isDemoMode);
  const phaseOverride = useDemoStore((state) => state.pcsPhaseOverride);

  return useMemo(() => {
    if (isDemoMode && phaseOverride) return phaseOverride;
    return derivePhase(segments);
  }, [segments, isDemoMode, phaseOverride]);
};

/**
 * Sub-phase selector — derives PLANNING vs ACTIVE_TRAVEL within TRANSIT_LEAVE.
 * Auto-updates when currentDraft changes (e.g. departure date passes).
 * Respects pcsSubPhaseOverride from useDemoStore when demo mode is active.
 */
export const useSubPhase = (): TRANSITSubPhase => {
  const currentDraft = usePCSStore((state) => state.currentDraft);
  const isDemoMode = useDemoStore((state) => state.isDemoMode);
  const subPhaseOverride = useDemoStore((state) => state.pcsSubPhaseOverride);

  return useMemo(() => {
    if (isDemoMode && subPhaseOverride) return subPhaseOverride;
    return deriveSubPhase(currentDraft);
  }, [currentDraft, isDemoMode, subPhaseOverride]);
};

/**
 * Computed UCT phase status selector.
 * Maps from PCSPhase + TRANSITSubPhase → Record<UCTPhase, UCTNodeStatus>.
 * Determines which TrackNode is COMPLETED, ACTIVE, or LOCKED.
 */
export const useUCTPhaseStatus = (): Record<UCTPhase, UCTNodeStatus> => {
  const phase = usePCSPhase();
  const subPhase = useSubPhase();
  const isDemoMode = useDemoStore((state) => state.isDemoMode);
  const uctPhaseOverride = useDemoStore((state) => state.uctPhaseOverride);

  return useMemo(() => {
    // Map PCSPhase → active UCT phase number
    let activeUCT: UCTPhase;

    if (isDemoMode && uctPhaseOverride) {
      activeUCT = uctPhaseOverride;
    } else {
      switch (phase) {
        case 'ORDERS_NEGOTIATION': activeUCT = 1; break;
        case 'TRANSIT_LEAVE':
          activeUCT = subPhase === 'ACTIVE_TRAVEL' ? 3 : 2;
          break;
        case 'CHECK_IN': activeUCT = 4; break;
        default: activeUCT = 1; // DORMANT defaults to phase 1
      }
    }

    return {
      1: activeUCT > 1 ? 'COMPLETED' : activeUCT === 1 ? 'ACTIVE' : 'LOCKED',
      2: activeUCT > 2 ? 'COMPLETED' : activeUCT === 2 ? 'ACTIVE' : 'LOCKED',
      3: activeUCT > 3 ? 'COMPLETED' : activeUCT === 3 ? 'ACTIVE' : 'LOCKED',
      4: activeUCT === 4 ? 'ACTIVE' : 'LOCKED', // Phase 4 is never "COMPLETED" in active orders
    } as Record<UCTPhase, UCTNodeStatus>;
  }, [phase, subPhase, isDemoMode, uctPhaseOverride]);
};
