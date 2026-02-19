/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useTravelClaimStore.ts — Travel Claim State Management (Zustand)
 * ─────────────────────────────────────────────────────────────────────────────
 * @deprecated All settlement logic now lives in usePCSStore (initSettlement,
 * updateSettlement, submitSettlement). This store is retained for its test
 * suite and as a reference. Do not import in new code.
 *
 * Mirrors the Leave store pattern (useLeaveStore.ts) with:
 *   • Optimistic updates for submit
 *   • AsyncStorage persistence via Zustand persist middleware
 *   • Auto-recalculation of totals via calculateTravelClaim()
 *   • Nested expense array helpers (addExpense / removeExpense)
 *   • Wizard step validation via Zod schemas
 *
 * References:
 *   • Joint Travel Regulations (JTR), DD Form 1351-2
 *   • DoDFMR Vol 9, Ch.3 — Receipt Requirements
 *
 * @module useTravelClaimStore
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { syncQueue } from '@/services/syncQueue';
import {
    CreateTravelClaimPayload,
    Expense,
    Step1TripSchema,
    Step2LodgingSchema,
    Step3FuelSchema,
    Step4MealsSchema,
    Step5ReviewSchema,
    TravelClaim,
    TravelClaimState,
} from '@/types/travelClaim';
import { calculateTravelClaim, ClaimCalculationResult } from '@/utils/travelClaimCalculations';

// =============================================================================
// UTILITIES
// =============================================================================

const generateUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });

/**
 * Round a number to two decimal places (standard currency rounding).
 */
const round2 = (n: number): number => Math.round(n * 100) / 100;

// =============================================================================
// STORE TYPES
// =============================================================================

/** Validation result returned by validateStep. */
export interface StepValidationResult {
    success: boolean;
    errors?: any;
}

interface TravelClaimActions {
    /**
     * Create a new travel claim draft in the store.
     */
    createDraft: (claim: TravelClaim) => Promise<void>;

    /**
     * Update a draft with a partial patch.
     * Auto-recalculates totals via calculateTravelClaim().
     */
    updateDraft: (claimId: string, patch: Partial<TravelClaim>) => Promise<void>;

    /**
     * Convenience wrapper — update a single field on a draft.
     */
    updateDraftField: (claimId: string, field: keyof TravelClaim, value: any) => Promise<void>;

    /**
     * Discard (delete) a draft from the store and persistence.
     */
    discardDraft: (claimId: string) => Promise<void>;

    /**
     * Submit a travel claim with optimistic updates.
     * Creates a pending claim, attempts API call, and reconciles.
     */
    submitClaim: (payload: CreateTravelClaimPayload, userId: string) => Promise<void>;

    /**
     * Hydrate claims from persisted storage for a given user.
     * With Zustand persist middleware, this is mostly automatic,
     * but this action allows explicit re-fetch / demo-mode handling.
     */
    fetchUserClaims: (userId: string) => Promise<void>;

    /**
     * Validate a specific wizard step for a draft.
     * Uses Zod step schemas from types/travelClaim.ts.
     */
    validateStep: (claimId: string, step: 1 | 2 | 3 | 4 | 5) => StepValidationResult;

    /**
     * Add an expense to a claim's expense array.
     * Triggers auto-recalculation.
     */
    addExpense: (claimId: string, expense: Expense) => Promise<void>;

    /**
     * Remove an expense from a claim's expense array by expense ID.
     * Triggers auto-recalculation.
     */
    removeExpense: (claimId: string, expenseId: string) => Promise<void>;

    /**
     * Reset the store to initial state.
     */
    resetStore: () => void;

    /**
     * Create a PCS claim draft pre-hydrated with order data.
     * Convenience wrapper for creating PCS-specific claims.
     */
    createPCSClaimFromOrder: (userId: string, orderNumber: string) => Promise<string>;
}

export type TravelClaimStore = TravelClaimState & TravelClaimActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const INITIAL_STATE: TravelClaimState = {
    travelClaims: {},
    userClaimIds: [],
    activeDraftId: null,
    lastClaimSyncAt: null,
    isSyncingClaims: false,
};

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Recalculate a claim's totals using the calculation engine and
 * write the results back into the claim object.
 */
function applyRecalculation(claim: TravelClaim): TravelClaim {
    const result: ClaimCalculationResult = calculateTravelClaim(claim);

    return {
        ...claim,
        maltAmount: round2(result.maltAmount),
        tleAmount: round2(result.tleAmount),
        totalExpenses: round2(result.totalExpenses),
        totalEntitlements: round2(result.totalEntitlements),
        totalClaimAmount: round2(result.totalEntitlements),
        netPayable: round2(result.netPayable),
        updatedAt: new Date().toISOString(),
    };
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

const STORAGE_KEY = 'travel-claim-storage';

export const useTravelClaimStore = create<TravelClaimStore>()(
    persist(
        (set, get) => ({
            ...INITIAL_STATE,

            // -----------------------------------------------------------------
            // createDraft
            // -----------------------------------------------------------------
            createDraft: async (claim: TravelClaim) => {
                set((state) => ({
                    travelClaims: {
                        ...state.travelClaims,
                        [claim.id]: claim,
                    },
                    userClaimIds: [...state.userClaimIds, claim.id],
                    activeDraftId: claim.id,
                }));
                // Persistence is handled automatically by Zustand persist middleware.
            },

            // -----------------------------------------------------------------
            // updateDraft
            // -----------------------------------------------------------------
            updateDraft: async (claimId: string, patch: Partial<TravelClaim>) => {
                const state = get();
                const existing = state.travelClaims[claimId];

                if (!existing) {
                    console.error('[useTravelClaimStore] Draft not found:', claimId);
                    return;
                }

                // Merge patch
                const merged: TravelClaim = {
                    ...existing,
                    ...patch,
                    localModifiedAt: new Date().toISOString(),
                };

                // Auto-recalculate totals
                const recalculated = applyRecalculation(merged);

                set({
                    travelClaims: {
                        ...state.travelClaims,
                        [claimId]: recalculated,
                    },
                });
            },

            // -----------------------------------------------------------------
            // updateDraftField
            // -----------------------------------------------------------------
            updateDraftField: async (
                claimId: string,
                field: keyof TravelClaim,
                value: any,
            ) => {
                await get().updateDraft(claimId, { [field]: value } as Partial<TravelClaim>);
            },

            // -----------------------------------------------------------------
            // discardDraft
            // -----------------------------------------------------------------
            discardDraft: async (claimId: string) => {
                set((state) => {
                    const { [claimId]: _, ...remainingClaims } = state.travelClaims;
                    const remainingIds = state.userClaimIds.filter((id) => id !== claimId);
                    return {
                        travelClaims: remainingClaims,
                        userClaimIds: remainingIds,
                        activeDraftId:
                            state.activeDraftId === claimId ? null : state.activeDraftId,
                    };
                });
            },

            // -----------------------------------------------------------------
            // submitClaim
            // -----------------------------------------------------------------
            submitClaim: async (payload: CreateTravelClaimPayload, userId: string) => {
                set({ isSyncingClaims: true });

                // ── STEP 1: OPTIMISTIC UPDATE ─────────────────────────────────
                const tempId = generateUUID();
                const now = new Date().toISOString();

                const optimisticClaim: TravelClaim = {
                    id: tempId,
                    userId,
                    orderNumber: payload.orderNumber,
                    travelType: payload.travelType,
                    departureDate: payload.departureDate,
                    returnDate: payload.returnDate,
                    departureLocation: payload.departureLocation,
                    destinationLocation: payload.destinationLocation,
                    isOconus: payload.isOconus,
                    travelMode: payload.travelMode,

                    // Entitlements — zeroed, will be calculated on first edit via wizard
                    maltAmount: 0,
                    maltMiles: 0,
                    dlaAmount: 0,
                    tleDays: 0,
                    tleAmount: 0,

                    // Per Diem
                    perDiemDays: [],

                    // Expenses
                    expenses: [],

                    // Totals
                    totalExpenses: 0,
                    totalEntitlements: 0,
                    totalClaimAmount: 0,
                    advanceAmount: 0,
                    netPayable: 0,

                    // Status
                    status: 'pending',
                    statusHistory: [
                        {
                            status: 'pending',
                            timestamp: now,
                            comments: 'Optimistic submission',
                        },
                    ],
                    approvalChain: [],
                    memberCertification: true,

                    // Timestamps
                    createdAt: now,
                    updatedAt: now,
                    submittedAt: now,
                    lastSyncTimestamp: now,
                    syncStatus: 'pending_upload',
                };

                set((state) => ({
                    travelClaims: {
                        ...state.travelClaims,
                        [tempId]: optimisticClaim,
                    },
                    userClaimIds: [...state.userClaimIds, tempId],
                    activeDraftId: null,
                }));

                try {
                    // ── STEP 2: NETWORK TRANSACTION (STUBBED) ──────────────────
                    // In production, this would call services.travelClaim.submitClaim(payload)
                    // For now, simulate success after a short delay.
                    await new Promise<void>((resolve) => setTimeout(resolve, 300));

                    const serverId = `tc-${Date.now()}`;

                    // ── STEP 3: SUCCESS RECONCILIATION ─────────────────────────
                    const confirmedClaim: TravelClaim = {
                        ...optimisticClaim,
                        id: serverId,
                        syncStatus: 'synced',
                        lastSyncTimestamp: new Date().toISOString(),
                    };

                    set((state) => {
                        const { [tempId]: _, ...remaining } = state.travelClaims;
                        const remainingIds = state.userClaimIds.filter((id) => id !== tempId);
                        return {
                            travelClaims: {
                                ...remaining,
                                [serverId]: confirmedClaim,
                            },
                            userClaimIds: [...remainingIds, serverId],
                            isSyncingClaims: false,
                        };
                    });
                } catch (error) {
                    // ── STEP 4: FAILURE — enqueue for retry ──────────────────
                    console.error('[useTravelClaimStore] submitClaim error:', error);

                    set((state) => ({
                        travelClaims: {
                            ...state.travelClaims,
                            [tempId]: {
                                ...state.travelClaims[tempId],
                                syncStatus: 'pending_upload',
                            },
                        },
                        isSyncingClaims: false,
                    }));

                    await syncQueue.enqueue('travelClaim:submit', {
                        requestId: tempId,
                        payload,
                    });
                }
            },

            // -----------------------------------------------------------------
            // fetchUserClaims
            // -----------------------------------------------------------------
            fetchUserClaims: async (_userId: string) => {
                // With Zustand persist, state is auto-hydrated from AsyncStorage.
                // This action exists for explicit refresh / demo-mode handling.
                // A production implementation would call the API and merge results.
                set({ isSyncingClaims: false });
            },

            // -----------------------------------------------------------------
            // validateStep
            // -----------------------------------------------------------------
            validateStep: (
                claimId: string,
                step: 1 | 2 | 3 | 4 | 5,
            ): StepValidationResult => {
                const claim = get().travelClaims[claimId];
                if (!claim) return { success: false, errors: ['Draft not found'] };

                let schema;
                switch (step) {
                    case 1:
                        schema = Step1TripSchema;
                        break;
                    case 2:
                        schema = Step2LodgingSchema;
                        break;
                    case 3:
                        schema = Step3FuelSchema;
                        break;
                    case 4:
                        schema = Step4MealsSchema;
                        break;
                    case 5:
                        schema = Step5ReviewSchema;
                        break;
                    default:
                        return { success: false, errors: ['Invalid step'] };
                }

                const result = schema.safeParse(claim);
                return {
                    success: result.success,
                    errors: result.success ? undefined : result.error?.format(),
                };
            },

            // -----------------------------------------------------------------
            // addExpense
            // -----------------------------------------------------------------
            addExpense: async (claimId: string, expense: Expense) => {
                const state = get();
                const existing = state.travelClaims[claimId];
                if (!existing) {
                    console.error('[useTravelClaimStore] Claim not found for addExpense:', claimId);
                    return;
                }

                const updatedExpenses = [...(existing.expenses || []), expense];
                await get().updateDraft(claimId, { expenses: updatedExpenses });
            },

            // -----------------------------------------------------------------
            // removeExpense
            // -----------------------------------------------------------------
            removeExpense: async (claimId: string, expenseId: string) => {
                const state = get();
                const existing = state.travelClaims[claimId];
                if (!existing) {
                    console.error('[useTravelClaimStore] Claim not found for removeExpense:', claimId);
                    return;
                }

                const updatedExpenses = (existing.expenses || []).filter(
                    (e) => e.id !== expenseId,
                );
                await get().updateDraft(claimId, { expenses: updatedExpenses });
            },

            // -----------------------------------------------------------------
            // resetStore
            // -----------------------------------------------------------------
            resetStore: () => set(INITIAL_STATE),

            // -----------------------------------------------------------------
            // createPCSClaimFromOrder
            // -----------------------------------------------------------------
            createPCSClaimFromOrder: async (userId: string, orderNumber: string) => {
                // Import here to avoid circular dependency
                const { usePCSStore } = await import('./usePCSStore');
                const activeOrder = usePCSStore.getState().activeOrder;

                if (!activeOrder) {
                    throw new Error('No active PCS order found');
                }

                const claimId = `tc-pcs-${Date.now()}`;
                const now = new Date().toISOString();

                const newClaim: TravelClaim = {
                    id: claimId,
                    userId,
                    orderNumber: activeOrder.orderNumber,
                    travelType: 'pcs',
                    departureDate: activeOrder.segments[0]?.dates.projectedDeparture || '',
                    returnDate: activeOrder.segments[activeOrder.segments.length - 1]?.dates.projectedArrival || '',
                    departureLocation: activeOrder.segments[0]?.location.name || '',
                    destinationLocation: activeOrder.gainingCommand.name,
                    isOconus: activeOrder.isOconus,
                    travelMode: 'pov',

                    // Entitlements - will be calculated in wizard
                    maltAmount: 0,
                    maltMiles: 0,
                    dlaAmount: 0,
                    tleDays: 0,
                    tleAmount: 0,
                    perDiemDays: [],

                    // Expenses - TODO: Link to Phase 3 scanned receipts from ReceiptScannerWidget
                    expenses: [],

                    // Totals
                    totalExpenses: 0,
                    totalEntitlements: 0,
                    totalClaimAmount: 0,
                    advanceAmount: 0,
                    netPayable: 0,

                    // Status
                    status: 'draft',
                    statusHistory: [],
                    approvalChain: [],
                    memberCertification: true,

                    // Timestamps
                    createdAt: now,
                    updatedAt: now,
                    syncStatus: 'pending_upload',
                    lastSyncTimestamp: now,
                };

                await get().createDraft(newClaim);
                return claimId;
            },
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(() => AsyncStorage),
            version: 1,
            migrate: (persisted: any, version: number) => {
                if (version === 0 || version === undefined) {
                    const state = persisted as any;
                    if (!state.travelClaims) state.travelClaims = {};
                    if (!Array.isArray(state.userClaimIds)) state.userClaimIds = [];
                    if (state.activeDraftId === undefined) state.activeDraftId = null;
                    if (state.lastClaimSyncAt === undefined) state.lastClaimSyncAt = null;
                }
                return persisted;
            },
            // Only persist the state slices, not actions
            partialize: (state) => ({
                travelClaims: state.travelClaims,
                userClaimIds: state.userClaimIds,
                activeDraftId: state.activeDraftId,
                lastClaimSyncAt: state.lastClaimSyncAt,
                isSyncingClaims: false, // Always reset syncing flag on hydration
            }),
        },
    ),
);
