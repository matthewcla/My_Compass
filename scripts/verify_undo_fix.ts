// @ts-nocheck
const moduleAlias = require('module-alias');
const path = require('path');

// Setup aliases
moduleAlias.addAliases({
  '@/services/storage': path.resolve(__dirname, 'mocks/storage'),
  '@': path.resolve(__dirname, '..'),
});

import { useAssignmentStore } from '@/store/useAssignmentStore';
import { storage } from '@/services/storage';

async function runTest() {
    console.log('--- Starting Undo Fix Verification ---');
    const TEST_USER_ID = 'test-user-001';

    // 1. Setup Store
    // Ensure store is reset
    useAssignmentStore.getState().resetStore();

    console.log('Fetching billets...');
    await useAssignmentStore.getState().fetchBillets();

    const billetStack = useAssignmentStore.getState().billetStack;
    if (billetStack.length === 0) {
        throw new Error('No billets found in stack');
    }

    const targetBilletId = billetStack[0];
    console.log(`Target Billet: ${targetBilletId}`);

    // 2. Execute Loop: Swipe Up -> Undo
    console.log('Running 5 cycles of Swipe Up -> Undo...');

    for (let i = 0; i < 5; i++) {
        // Reset cursor to 0 to swipe on the same billet each time
        useAssignmentStore.setState({ cursor: 0 });

        // Swipe Up (Promote)
        await useAssignmentStore.getState().swipe(targetBilletId, 'up', TEST_USER_ID);

        // Check if application was created
        const appCreated = Object.values(useAssignmentStore.getState().applications).find(a => a.billetId === targetBilletId);
        if (!appCreated) {
             throw new Error(`Cycle ${i}: Swipe UP failed to create application.`);
        }

        // Undo
        useAssignmentStore.getState().undo(TEST_USER_ID);

        // Slight delay to allow async operations (though they are voided in store)
        await new Promise(r => setTimeout(r, 50));
    }

    // 3. Verify Store State
    const finalState = useAssignmentStore.getState();
    const applicationCount = Object.keys(finalState.applications).length;
    console.log(`Final Application Count in Store: ${applicationCount}`);

    if (applicationCount !== 0) {
        throw new Error(`FAILED: Store has ${applicationCount} applications, expected 0.`);
    }

    // 4. Verify Storage State
    const storedApps = await storage.getUserApplications(TEST_USER_ID);
    console.log(`Final Application Count in Storage: ${storedApps.length}`);

    if (storedApps.length !== 0) {
        console.log('Stored apps:', storedApps);
        throw new Error(`FAILED: Storage has ${storedApps.length} applications, expected 0.`);
    }

    console.log('--- Verification Passed ---');
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
