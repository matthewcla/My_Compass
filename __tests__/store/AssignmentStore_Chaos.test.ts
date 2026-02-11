/**
 * =============================================================================
 * ANTIGRAVITY CHAOS SUITE: useAssignmentStore Vulnerability Tests
 * =============================================================================
 *
 * These tests are designed to FAIL against the current implementation,
 * exposing logical vulnerabilities in the store's state management.
 */

import { storage } from '@/services/storage';
import { MAX_SLATE_SIZE, selectManifestItems, useAssignmentStore } from '@/store/useAssignmentStore';

// Test User ID
const TEST_USER_ID = 'test-user-001';

// Helper to reset the store before each test
const resetStore = () => {
    useAssignmentStore.getState().resetStore();
};

// Helper to populate billets
const populateBillets = async () => {
    await useAssignmentStore.getState().fetchBillets();
};

describe('🔥 ANTIGRAVITY CHAOS SUITE: useAssignmentStore', () => {
    beforeEach(async () => {
        resetStore();
        await populateBillets();
    });

    /**
     * TEST 1: The Doppelgänger
     *
     * VULNERABILITY: undo() does not remove the Application entry created
     * when the last action was a 'promote' (swipe up).
     *
     * EXPECTED BEHAVIOR: After 5 swipe-up/undo cycles on the SAME billet,
     * there should be 0 applications (all undone).
     *
     * ACTUAL (BUG): Each swipe('up') creates an Application, but undo() only
     * removes the realDecisions entry, leaving orphaned applications.
     * After 5 cycles, we expect 5 orphaned applications (or at least > 0).
     */
    it('The Doppelgänger: swipe(up) + undo() loop should NOT create orphan applications', async () => {
        const billetStack = useAssignmentStore.getState().billetStack;

        // Use the first billet for all cycles
        const targetBilletId = billetStack[0];

        for (let i = 0; i < 5; i++) {
            // Reset cursor to 0 to swipe on the same billet each time
            useAssignmentStore.setState({ cursor: 0 });
            await useAssignmentStore.getState().swipe(targetBilletId, 'up', TEST_USER_ID);

            useAssignmentStore.getState().undo(TEST_USER_ID);
        }

        const finalState = useAssignmentStore.getState();
        const applicationCount = Object.keys(finalState.applications).length;

        // ASSERTION: Should be 0 applications after undoing all swipes
        // BUG: This will likely FAIL with applicationCount === 5
        expect(applicationCount).toBe(0);
    });

    /**
     * TEST 2: The Full Slate Bypass
     *
     * VULNERABILITY: When slate is full and swipe('up') falls back to manifest,
     * then a slot opens, the billet can be "double-tracked" in both
     * applications AND realDecisions.
     *
     * EXPECTED BEHAVIOR: No "ghost" state where a billet exists in both.
     */
    it('The Full Slate Bypass: overflow item should not end up in ghost state after withdraw + re-promote', async () => {
        const state = useAssignmentStore.getState();
        const billets = state.billets;

        // Get only non-projected billets for this test
        const nonProjectedBillets = Object.values(billets).filter(
            b => b.advertisementStatus !== 'projected'
        );

        const needed = MAX_SLATE_SIZE + 2; // Need slate + 1 overflow + 1 spare
        if (nonProjectedBillets.length < needed) {
            console.warn('Not enough non-projected billets for test - skipping');
            return;
        }

        // Fill the slate to MAX_SLATE_SIZE
        for (let i = 0; i < MAX_SLATE_SIZE; i++) {
            await useAssignmentStore.getState().swipe(nonProjectedBillets[i].id, 'up', TEST_USER_ID);
        }

        let stateAfterFull = useAssignmentStore.getState();
        expect(Object.keys(stateAfterFull.applications).length).toBe(MAX_SLATE_SIZE);

        // Attempt to swipe 'up' on overflow item (should fallback to manifest as 'super')
        const overflowBillet = nonProjectedBillets[MAX_SLATE_SIZE];
        await useAssignmentStore.getState().swipe(overflowBillet.id, 'up', TEST_USER_ID);

        let stateAfterOverflow = useAssignmentStore.getState();
        // Should still only have MAX_SLATE_SIZE apps (overflow went to manifest)
        expect(Object.keys(stateAfterOverflow.applications).length).toBe(MAX_SLATE_SIZE);
        // Overflow should be in realDecisions as 'super'
        expect(stateAfterOverflow.realDecisions[overflowBillet.id]).toBe('super');

        // Withdraw one of the original slate items to free a slot
        const firstAppId = stateAfterOverflow.userApplicationIds[0];
        await useAssignmentStore.getState().withdrawApplication(firstAppId, TEST_USER_ID);

        // Now try to promote the overflow item
        const promotionResult = await useAssignmentStore.getState().promoteToSlate(overflowBillet.id, TEST_USER_ID);

        expect(promotionResult).toBe(true);

        const finalState = useAssignmentStore.getState();

        // Count how many applications have this billetId
        const appsWithOverflowBillet = Object.values(finalState.applications).filter(
            app => app.billetId === overflowBillet.id
        );

        // ASSERTION: Should be exactly 1 application for this billet
        expect(appsWithOverflowBillet.length).toBe(1);
    });

    /**
     * TEST 3: The Zombie Draft
     *
     * VULNERABILITY: withdrawApplication() does not clear the realDecisions
     * entry that originally put the billet on the slate.
     *
     * EXPECTED BEHAVIOR: After withdrawal, the billet should NOT appear in
     * the Manifest (realDecisions should be cleared).
     *
     * ACTUAL (BUG): The realDecisions['super'] entry persists, causing the
     * billet to reappear in the Manifest as if the user is still interested.
     */
    it('The Zombie Draft: withdrawn billet should NOT persist in realDecisions', async () => {
        const billetStack = useAssignmentStore.getState().billetStack;
        const targetBilletId = billetStack[0];

        // Swipe up to create a draft
        await useAssignmentStore.getState().swipe(targetBilletId, 'up', TEST_USER_ID);

        let stateAfterSwipe = useAssignmentStore.getState();
        const appId = stateAfterSwipe.userApplicationIds[0];

        // Verify draft was created
        expect(stateAfterSwipe.applications[appId]).toBeDefined();
        expect(stateAfterSwipe.applications[appId].status).toBe('draft');
        expect(stateAfterSwipe.realDecisions[targetBilletId]).toBe('super');

        // Withdraw (hard delete for draft)
        await useAssignmentStore.getState().withdrawApplication(appId, TEST_USER_ID);

        const finalState = useAssignmentStore.getState();

        // Application should be removed
        expect(finalState.applications[appId]).toBeUndefined();

        // ASSERTION: realDecisions should also be cleared
        // BUG: This will likely FAIL because withdrawApplication doesn't touch realDecisions
        expect(finalState.realDecisions[targetBilletId]).toBeUndefined();
    });

    it('Buffered Swipe Purge: withdraw should delete decision from queue/storage and keep unrelated swipes', async () => {
        const userId = `${TEST_USER_ID}-buffered-purge`;
        const billetStack = useAssignmentStore.getState().billetStack;
        const targetBilletId = billetStack[0];
        const unrelatedBilletId = billetStack[1];

        await useAssignmentStore.getState().swipe(targetBilletId, 'up', userId);
        await useAssignmentStore.getState().swipe(unrelatedBilletId, 'right', userId);

        const afterSwipes = useAssignmentStore.getState();
        const appId = afterSwipes.userApplicationIds.find(id => afterSwipes.applications[id].billetId === targetBilletId);

        expect(appId).toBeDefined();
        expect(afterSwipes.realDecisions[targetBilletId]).toBe('super');
        expect(afterSwipes.realDecisions[unrelatedBilletId]).toBe('like');

        await useAssignmentStore.getState().withdrawApplication(appId!, userId);

        const afterWithdraw = useAssignmentStore.getState();
        expect(afterWithdraw.realDecisions[targetBilletId]).toBeUndefined();
        expect(afterWithdraw.realDecisions[unrelatedBilletId]).toBe('like');

        // Wait longer than the 2s debounce to ensure stale buffered writes do not resurrect.
        await new Promise(resolve => setTimeout(resolve, 2200));

        const persistedDecisions = (await storage.getAssignmentDecisions(userId)) || {};
        expect(persistedDecisions[targetBilletId]).toBeUndefined();
        expect(persistedDecisions[unrelatedBilletId]).toBe('like');

        const stateAfterFlush = useAssignmentStore.getState();
        const candidateIds = selectManifestItems(stateAfterFlush, 'candidates').map(item => item.billet.id);
        const favoriteIds = selectManifestItems(stateAfterFlush, 'favorites').map(item => item.billet.id);

        expect(candidateIds).not.toContain(targetBilletId);
        expect(favoriteIds).not.toContain(targetBilletId);
        expect(candidateIds).toContain(unrelatedBilletId);
    });

    it('Withdraw Re-rank: remaining applications should close rank gaps', async () => {
        const userId = `${TEST_USER_ID}-rerank`;
        const billetStack = useAssignmentStore.getState().billetStack;
        const firstBilletId = billetStack[0];
        const secondBilletId = billetStack[1];

        await useAssignmentStore.getState().swipe(firstBilletId, 'up', userId);
        await useAssignmentStore.getState().swipe(secondBilletId, 'up', userId);

        const beforeWithdraw = useAssignmentStore.getState();
        const firstAppId = beforeWithdraw.userApplicationIds.find(id => beforeWithdraw.applications[id].billetId === firstBilletId);
        const secondAppId = beforeWithdraw.userApplicationIds.find(id => beforeWithdraw.applications[id].billetId === secondBilletId);

        expect(firstAppId).toBeDefined();
        expect(secondAppId).toBeDefined();
        expect(beforeWithdraw.applications[firstAppId!].preferenceRank).toBe(1);
        expect(beforeWithdraw.applications[secondAppId!].preferenceRank).toBe(2);

        await useAssignmentStore.getState().withdrawApplication(firstAppId!, userId);

        const afterWithdraw = useAssignmentStore.getState();
        expect(afterWithdraw.applications[firstAppId!]).toBeUndefined();
        expect(afterWithdraw.applications[secondAppId!].preferenceRank).toBe(1);
    });

    /**
     * TEST 4: The Sandbox Leak
     *
     * VULNERABILITY: promoteToSlate() does not validate that the current
     * mode is 'real' before writing to the applications state.
     *
     * EXPECTED BEHAVIOR: Swiping 'up' in sandbox mode should NOT create
     * a real application.
     *
     * NOTE: The swipe() action itself does gate sandbox mode, but if
     * promoteToSlate() is called directly, it could leak.
     */
    it('The Sandbox Leak: swipe(up) in sandbox mode should NOT create real application', async () => {
        const billetStack = useAssignmentStore.getState().billetStack;
        const targetBilletId = billetStack[0];

        // Switch to sandbox mode
        useAssignmentStore.getState().setMode('sandbox');

        // Swipe up on a billet
        await useAssignmentStore.getState().swipe(targetBilletId, 'up', TEST_USER_ID);

        // Switch back to real mode
        useAssignmentStore.getState().setMode('real');

        const finalState = useAssignmentStore.getState();

        // ASSERTION: No application should exist for this billet
        // (swipe() in sandbox mode should NOT call promoteToSlate)
        const appsForBillet = Object.values(finalState.applications).filter(
            app => app.billetId === targetBilletId
        );

        expect(appsForBillet.length).toBe(0);

        // Also verify it went to sandboxDecisions, not realDecisions
        expect(finalState.sandboxDecisions[targetBilletId]).toBe('super');
        expect(finalState.realDecisions[targetBilletId]).toBeUndefined();
    });

    /**
     * TEST 5: The Projected Trap
     *
     * VULNERABILITY: There is no validation that prevents promoting a
     * 'projected' billet (future vacancy) to the slate and submitting it.
     *
     * EXPECTED BEHAVIOR: Projected billets should NOT be promotable.
     * 
     * AFTER FIX: promoteToSlate() now correctly blocks projected billets.
     */
    it('The Projected Trap: projected billet should NOT be promotable', async () => {
        const billets = useAssignmentStore.getState().billets;

        // Find a projected billet
        const projectedBillet = Object.values(billets).find(
            b => b.advertisementStatus === 'projected'
        );

        // If no projected billet exists in mock data, skip
        if (!projectedBillet) {
            console.warn('No projected billet found in mock data - skipping test');
            return;
        }

        // Attempt to promote the projected billet to slate
        const promotionResult = await useAssignmentStore.getState().promoteToSlate(projectedBillet.id, TEST_USER_ID);

        // ASSERTION: Promotion should be BLOCKED (return false)
        expect(promotionResult).toBe(false);

        // Verify no application was created
        const finalState = useAssignmentStore.getState();
        const appsForProjected = Object.values(finalState.applications).filter(
            app => app.billetId === projectedBillet.id
        );
        expect(appsForProjected.length).toBe(0);
    });
});
