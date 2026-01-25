// verification/verify_billet_swipe.ts
import fs from 'fs';
import path from 'path';
import Module from 'module';

// --- MOCK SETUP ---
// We need to intercept imports to:
// 1. Mock expo-sqlite (native module)
// 2. Intercept api calls to verify Zero Trust (no network on reject)
// 3. Handle "@/..." aliases since we are running in a standalone script without ts-config-paths

const originalRequire = Module.prototype.require;

// Mock State to verify calls
export const mockState = {
    dbCalls: [] as { sql: string; args: any[] }[],
    apiCalls: [] as { billetId: string; userId: string }[],
    reset: () => {
        mockState.dbCalls = [];
        mockState.apiCalls = [];
    }
};

// Mock SQLite implementation
const MOCK_SQLITE = {
    openDatabaseAsync: async () => ({
        runAsync: async (sql: string, ...args: any[]) => {
            mockState.dbCalls.push({ sql, args });
            return { lastInsertRowId: 1, changes: 1 };
        },
        getFirstAsync: async () => null,
        getAllAsync: async () => [],
        execAsync: async () => {},
    })
};

// Mock API Service implementation
const MOCK_API = {
    attemptBinLock: async (billetId: string, userId: string) => {
        mockState.apiCalls.push({ billetId, userId });
        // Return success by default
        return {
            success: true,
            data: {
                lockToken: 'mock-token',
                expiresAt: new Date(Date.now() + 300000).toISOString(),
                billetId
            },
            meta: { requestId: 'req-1', timestamp: new Date().toISOString() }
        };
    }
};

// Hook require
(Module.prototype as any).require = function(id: string) {
    // 1. Handle Aliases (@/ -> ./)
    // We assume the script is run from project root or handled via ts-node, but if id starts with @/, we map it.
    // However, since we are hooking `require`, `ts-node` might have already resolved the path if it respects tsconfig.
    // If it doesn't, we need to map it.
    // NOTE: In `ts-node`, imports are transpiled to `require`.

    // For this specific script, we need to handle specific mocks BEFORE aliases if possible,
    // but usually aliases come first in the string.

    // Mock expo-sqlite
    if (id === 'expo-sqlite') {
        return MOCK_SQLITE;
    }

    // Mock API Service
    // We check for the file name or path suffix
    if (id.endsWith('mockTransactionService') || id.endsWith('mockTransactionService.ts')) {
        return MOCK_API;
    }

    // Resolve Alias manually if needed (if ts-node doesn't do it)
    if (id.startsWith('@/')) {
        // Map @/ to project root or dist_verification if running compiled
        // If we are running this script from root, process.cwd() is root.

        // Detect if we are running in the compiled directory
        const isCompiled = __filename.includes('dist_verification');

        const root = isCompiled ? path.join(process.cwd(), 'dist_verification') : process.cwd();
        const resolvedPath = path.join(root, id.substring(2));
        return originalRequire.call(this, resolvedPath);
    }

    return originalRequire.call(this, id);
};

// --- RUN VERIFICATION ---

async function runVerification() {
    console.log('--- STARTING BILLET SWIPE VERIFICATION ---');

    // Import store dynamically to ensure mocks are in place
    // We use require because 'import' is static and might run before our hook if we were compiling everything together.
    // With ts-node, this function runs after top-level code.
    const { useAssignmentStore } = require('../store/useAssignmentStore');

    const store = useAssignmentStore.getState();
    store.resetStore();

    // 1. SETUP: Initialize with mock billets
    console.log('\nStep 1: Fetching Billets...');
    await store.fetchBillets();

    const initialState = useAssignmentStore.getState();
    console.log(`Loaded ${initialState.billetStack.length} billets.`);

    if (initialState.billetStack.length === 0) {
        throw new Error('Failed to load mock billets.');
    }

    // 2. TEST SWIPE RIGHT (Buy-It-Now)
    console.log('\nStep 2: Testing Swipe Right (Buy-It-Now)...');
    mockState.reset();

    const billetId1 = initialState.billetStack[initialState.cursor];
    const userId = 'test-user-001';

    console.log(`Swiping RIGHT on billet ${billetId1}`);
    await store.swipe(billetId1, 'right', userId);

    const stateAfterRight = useAssignmentStore.getState();

    // Assert 1: Cursor advanced
    if (stateAfterRight.cursor !== 1) {
        throw new Error(`Expected cursor to be 1, got ${stateAfterRight.cursor}`);
    }

    // Assert 2: Decision recorded
    if (stateAfterRight.decisionMap[billetId1] !== 'like') {
        throw new Error(`Expected decision 'like', got ${stateAfterRight.decisionMap[billetId1]}`);
    }

    // Assert 3: Application created
    const app = Object.values(stateAfterRight.applications).find((a: any) => a.billetId === billetId1);
    if (!app) {
        throw new Error('No application record found in store after swipe right.');
    }

    // Assert 4: Status history contains optimistically_locked
    const history = (app as any).statusHistory.map((h: any) => h.status);
    if (!history.includes('optimistically_locked')) {
        throw new Error('Application history does not contain "optimistically_locked". Offline-First protocol failed.');
    }
    console.log('✓ Optimistic lock verified.');

    // Assert 5: SQLite saveApplication called
    const saveAppCall = mockState.dbCalls.find(call => call.sql.includes('INSERT OR REPLACE INTO applications'));
    if (!saveAppCall) {
        throw new Error('SQLite saveApplication was NOT called. Persistence failed.');
    }
    console.log('✓ SQLite persistence verified.');

    // Assert 6: API called (since we are online)
    if (mockState.apiCalls.length === 0) {
        throw new Error('API attemptBinLock was NOT called.');
    }
    console.log('✓ Network request verified.');


    // 3. TEST SWIPE LEFT (Reject)
    console.log('\nStep 3: Testing Swipe Left (Reject)...');
    mockState.reset(); // Reset counters

    const billetId2 = stateAfterRight.billetStack[stateAfterRight.cursor];
    console.log(`Swiping LEFT on billet ${billetId2}`);

    await store.swipe(billetId2, 'left', userId);

    const stateAfterLeft = useAssignmentStore.getState();

    // Assert 1: Cursor advanced
    if (stateAfterLeft.cursor !== 2) {
        throw new Error(`Expected cursor to be 2, got ${stateAfterLeft.cursor}`);
    }

    // Assert 2: Decision recorded
    if (stateAfterLeft.decisionMap[billetId2] !== 'nope') {
        throw new Error(`Expected decision 'nope', got ${stateAfterLeft.decisionMap[billetId2]}`);
    }

    // Assert 3: NO application created
    const app2 = Object.values(stateAfterLeft.applications).find((a: any) => a.billetId === billetId2);
    if (app2) {
        throw new Error('Application record created for rejected billet! Zero Trust violation.');
    }

    // Assert 4: NO SQLite call (for application)
    // Note: swipe updates decisionMap locally in store, but does it persist decision?
    // The prompt says "NO network request or application record is created".
    // Does it save decision to DB? The store logic `swipe` function updates `decisionMap` in state.
    // It calls `buyItNow` only on right/up.
    // It does NOT appear to call any storage function for the decision map itself in the provided code.
    // So there should be NO db calls related to application creation.
    if (mockState.dbCalls.length > 0) {
        // If there are DB calls, check if they are for application
        const appDbCall = mockState.dbCalls.find(call => call.sql.includes('INTO applications'));
        if (appDbCall) {
             throw new Error('SQLite saveApplication called for rejected billet! Zero Trust violation.');
        }
    }

    // Assert 5: NO API call
    if (mockState.apiCalls.length > 0) {
        throw new Error('Network request sent for rejected billet! Zero Trust violation.');
    }
    console.log('✓ Zero Trust (no data leak) verified.');


    // 4. TEST EMPTY STATE
    console.log('\nStep 4: Testing Empty State...');

    const totalBillets = stateAfterLeft.billetStack.length;
    // Swipe remaining
    for (let i = stateAfterLeft.cursor; i < totalBillets; i++) {
        const bId = stateAfterLeft.billetStack[i];
        await store.swipe(bId, 'left', userId);
    }

    const finalState = useAssignmentStore.getState();
    if (finalState.cursor < totalBillets) {
        throw new Error('Failed to reach end of stack.');
    }

    console.log('✓ Stack exhausted correctly.');

    console.log('\n--- VERIFICATION SUCCESSFUL ---');
}

runVerification().catch(err => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
});
