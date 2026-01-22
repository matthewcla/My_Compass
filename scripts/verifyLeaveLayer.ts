
// @ts-nocheck
declare const jest: any;

// MOCK expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(() => ({
        execAsync: jest.fn(),
        runAsync: jest.fn(),
        getFirstAsync: jest.fn(() => null), // Return null by default (no data)
        getAllAsync: jest.fn(() => []),
    })),
}));

import { useLeaveStore } from '@/store/useLeaveStore';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function runVerification() {
    console.log('--- STARTING VERIFICATION ---');
    const store = useLeaveStore.getState();
    const userId = 'user-test-123';

    // 1. Fetch Leave Data
    console.log('[1] Fetching Leave Data...');
    await store.fetchLeaveData(userId);

    const stateAfterFetch = useLeaveStore.getState();
    console.log('Balance after fetch:', stateAfterFetch.leaveBalance?.currentBalance);
    if (stateAfterFetch.leaveBalance?.currentBalance === 45.5) {
        console.log('✅ Fetch Success');
    } else {
        console.error('❌ Fetch Failed');
        console.log(stateAfterFetch.leaveBalance);
    }

    // 2. Submit Request
    console.log('\n[2] Submitting Leave Request...');

    // Subscribe to changes to watch optimistic update
    const unsubscribe = useLeaveStore.subscribe((state) => {
        const reqs = Object.values(state.leaveRequests);
        if (reqs.length > 0) {
            const lastReq = reqs[reqs.length - 1];
            console.log(`State Update: Request Status = ${lastReq.status}, SyncStatus = ${lastReq.syncStatus}`);
        }
    });

    const payload = {
        startDate: '2026-06-01T08:00:00Z',
        endDate: '2026-06-10T08:00:00Z',
        leaveType: 'annual' as const,
        leaveAddress: '123 Beach St, Miami FL',
        leavePhoneNumber: '555-000-1234',
        emergencyContact: {
            name: 'Wife',
            relationship: 'Spouse',
            phoneNumber: '555-999-8888',
        },
        destinationCountry: 'USA',
        memberRemarks: 'Summer vacation',
    };

    const submitPromise = store.submitRequest(payload, userId);

    // Check optimistic state immediately
    const stateOptimistic = useLeaveStore.getState();
    const optReqs = Object.values(stateOptimistic.leaveRequests);
    console.log(`Optimistic Requests Count: ${optReqs.length}`);
    if (optReqs.length === 1 && optReqs[0].status === 'pending') {
        console.log('✅ Optimistic Update Verified');
    } else {
        console.error('❌ Optimistic Update Failed');
    }

    // Wait for completion (mock service has 1.5s delay)
    console.log('Waiting for network...');
    await submitPromise;
    await sleep(100); // Give store a moment to update if needed

    const stateFinal = useLeaveStore.getState();
    const finalReqs = Object.values(stateFinal.leaveRequests);
    const finalReq = finalReqs[0];

    console.log(`Final Status: ${finalReq?.status}`);
    console.log(`Final ID: ${finalReq?.id}`);

    if (finalReq?.syncStatus === 'synced') {
        console.log('✅ Reconciliation Success');
    } else {
        console.error('❌ Reconciliation Failed');
    }

    unsubscribe();
    console.log('--- VERIFICATION COMPLETE ---');
}

// Check if running directly
if (require.main === module) {
    // This requires a test runner or specialized node setup due to 'import' statements and aliases
    // We will just output the code for review in this context.
    console.log("This script is intended to be run in a test environment with module alias support.");
}

export default runVerification;
