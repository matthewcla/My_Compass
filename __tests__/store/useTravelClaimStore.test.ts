/**
 * @file useTravelClaimStore.test.ts
 * @description Unit tests for Travel Claim Zustand Store
 */

// Mock syncQueue before imports
jest.mock('@/services/syncQueue', () => ({
    syncQueue: {
        enqueue: jest.fn().mockResolvedValue('sync-mock-id'),
        init: jest.fn(),
    },
}));

import { useTravelClaimStore } from '../../store/useTravelClaimStore';
import { Expense, TravelClaim } from '../../types/travelClaim';
import { MALT_RATE } from '../../utils/travelClaimCalculations';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create a minimal valid TravelClaim draft for testing.
 */
function makeDraftClaim(overrides: Partial<TravelClaim> = {}): TravelClaim {
    const now = new Date().toISOString();
    return {
        id: 'test-draft-1',
        userId: 'user-1',
        travelType: 'pcs',
        departureDate: '2024-03-01T00:00:00.000Z',
        returnDate: '2024-03-10T00:00:00.000Z',
        departureLocation: 'NS Norfolk',
        destinationLocation: 'NB San Diego',
        isOconus: false,
        travelMode: 'pov',
        maltAmount: 0,
        maltMiles: 500,
        dlaAmount: 0,
        tleDays: 0,
        tleAmount: 0,
        perDiemDays: [],
        expenses: [],
        totalExpenses: 0,
        totalEntitlements: 0,
        totalClaimAmount: 0,
        advanceAmount: 0,
        netPayable: 0,
        status: 'draft',
        statusHistory: [{ status: 'draft', timestamp: now }],
        approvalChain: [],
        memberCertification: false,
        createdAt: now,
        updatedAt: now,
        lastSyncTimestamp: now,
        syncStatus: 'pending_upload',
        ...overrides,
    };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
    return {
        id: 'exp-1',
        claimId: 'test-draft-1',
        expenseType: 'toll',
        amount: 25,
        date: '2024-03-05T00:00:00.000Z',
        receipts: [],
        tollDetails: { tollAmount: 25 },
        ...overrides,
    };
}

// =============================================================================
// TESTS
// =============================================================================

describe('useTravelClaimStore', () => {
    beforeEach(() => {
        // Reset store between tests
        useTravelClaimStore.getState().resetStore();
    });

    // ─────────────────────────────────────────────────────────────────────
    // createDraft
    // ─────────────────────────────────────────────────────────────────────
    describe('createDraft', () => {
        it('should add a draft to the store', async () => {
            const draft = makeDraftClaim();
            await useTravelClaimStore.getState().createDraft(draft);

            const state = useTravelClaimStore.getState();
            expect(state.travelClaims['test-draft-1']).toBeDefined();
            expect(state.userClaimIds).toContain('test-draft-1');
            expect(state.activeDraftId).toBe('test-draft-1');
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // updateDraft + auto-recalculation
    // ─────────────────────────────────────────────────────────────────────
    describe('updateDraft', () => {
        it('should merge patch and auto-recalculate MALT', async () => {
            const draft = makeDraftClaim({ maltMiles: 0 });
            await useTravelClaimStore.getState().createDraft(draft);

            // Update mileage
            await useTravelClaimStore.getState().updateDraft('test-draft-1', {
                maltMiles: 1000,
            });

            const updated = useTravelClaimStore.getState().travelClaims['test-draft-1'];
            expect(updated.maltMiles).toBe(1000);
            expect(updated.maltAmount).toBe(1000 * MALT_RATE); // 210
        });

        it('should recalculate when expenses are added', async () => {
            const draft = makeDraftClaim();
            await useTravelClaimStore.getState().createDraft(draft);

            const toll: Expense = makeExpense({ amount: 50 });
            await useTravelClaimStore.getState().updateDraft('test-draft-1', {
                expenses: [toll],
            });

            const updated = useTravelClaimStore.getState().travelClaims['test-draft-1'];
            // MALT (500 * 0.21 = 105) + misc toll (50) = 155
            expect(updated.totalEntitlements).toBe(155);
        });

        it('should not crash for non-existent draft', async () => {
            // Should log error, not throw
            await useTravelClaimStore.getState().updateDraft('non-existent', { maltMiles: 0 });
            // No assertion needed — we just want no throw
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // updateDraftField
    // ─────────────────────────────────────────────────────────────────────
    describe('updateDraftField', () => {
        it('should update a single field', async () => {
            await useTravelClaimStore.getState().createDraft(makeDraftClaim());
            await useTravelClaimStore.getState().updateDraftField(
                'test-draft-1',
                'departureLocation',
                'NAS Pensacola',
            );

            const updated = useTravelClaimStore.getState().travelClaims['test-draft-1'];
            expect(updated.departureLocation).toBe('NAS Pensacola');
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // discardDraft
    // ─────────────────────────────────────────────────────────────────────
    describe('discardDraft', () => {
        it('should remove draft and clear activeDraftId', async () => {
            await useTravelClaimStore.getState().createDraft(makeDraftClaim());
            expect(useTravelClaimStore.getState().activeDraftId).toBe('test-draft-1');

            await useTravelClaimStore.getState().discardDraft('test-draft-1');

            const state = useTravelClaimStore.getState();
            expect(state.travelClaims['test-draft-1']).toBeUndefined();
            expect(state.userClaimIds).not.toContain('test-draft-1');
            expect(state.activeDraftId).toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // addExpense / removeExpense
    // ─────────────────────────────────────────────────────────────────────
    describe('addExpense / removeExpense', () => {
        it('should add an expense and recalculate', async () => {
            await useTravelClaimStore.getState().createDraft(makeDraftClaim({ maltMiles: 0 }));
            const expense = makeExpense({ id: 'exp-new', amount: 35 });

            await useTravelClaimStore.getState().addExpense('test-draft-1', expense);

            const updated = useTravelClaimStore.getState().travelClaims['test-draft-1'];
            expect(updated.expenses).toHaveLength(1);
            expect(updated.expenses[0].id).toBe('exp-new');
            expect(updated.totalEntitlements).toBe(35); // Only misc toll expense
        });

        it('should remove an expense and recalculate', async () => {
            const expense = makeExpense({ id: 'exp-remove', amount: 40 });
            await useTravelClaimStore.getState().createDraft(
                makeDraftClaim({ maltMiles: 0, expenses: [expense] }),
            );

            await useTravelClaimStore.getState().removeExpense('test-draft-1', 'exp-remove');

            const updated = useTravelClaimStore.getState().travelClaims['test-draft-1'];
            expect(updated.expenses).toHaveLength(0);
            expect(updated.totalEntitlements).toBe(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // submitClaim
    // ─────────────────────────────────────────────────────────────────────
    describe('submitClaim', () => {
        it('should create a confirmed claim with server ID on success', async () => {
            await useTravelClaimStore.getState().submitClaim(
                {
                    travelType: 'pcs',
                    departureDate: '2024-03-01T00:00:00.000Z',
                    returnDate: '2024-03-10T00:00:00.000Z',
                    departureLocation: 'NS Norfolk',
                    destinationLocation: 'NB San Diego',
                    isOconus: false,
                    travelMode: 'pov',
                },
                'user-1',
            );

            const state = useTravelClaimStore.getState();
            // Should have swapped temp ID for server ID (tc-*)
            const claimIds = state.userClaimIds;
            expect(claimIds).toHaveLength(1);
            expect(claimIds[0]).toMatch(/^tc-/);
            expect(state.isSyncingClaims).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // resetStore
    // ─────────────────────────────────────────────────────────────────────
    describe('resetStore', () => {
        it('should reset all state to initial', async () => {
            await useTravelClaimStore.getState().createDraft(makeDraftClaim());
            useTravelClaimStore.getState().resetStore();

            const state = useTravelClaimStore.getState();
            expect(Object.keys(state.travelClaims)).toHaveLength(0);
            expect(state.userClaimIds).toHaveLength(0);
            expect(state.activeDraftId).toBeNull();
        });
    });
});
