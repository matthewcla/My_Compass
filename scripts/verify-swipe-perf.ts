// @ts-nocheck
import * as path from 'path';
import * as moduleAlias from 'module-alias';

// Register aliases
moduleAlias.addAliases({
    '@/services/storage': path.join(__dirname, 'mocks/storage.ts'),
    '@/services/correspondence': path.join(__dirname, 'mocks/correspondence.ts'),
    '@': path.join(__dirname, '..'),
});

// Import using require to ensure aliases are active
const { storage } = require('@/services/storage');
const { useAssignmentStore } = require('@/store/useAssignmentStore');
const { performance } = require('perf_hooks');

async function main() {
    console.log('Initializing store...');
    const store = useAssignmentStore.getState();
    await store.fetchBillets();

    // Check initial count
    const initialCount = await storage.getBilletCount();
    console.log(`Store initialized. Billet count: ${initialCount}`);

    // Monkey patch storage to simulate slow I/O
    const originalSaveDecision = storage.saveAssignmentDecision;
    storage.saveAssignmentDecision = async (...args) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return originalSaveDecision.apply(storage, args);
    };

    const originalSaveApplication = storage.saveApplication;
    storage.saveApplication = async (...args) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return originalSaveApplication.apply(storage, args);
    }

    console.log('Starting swipe performance test (5 swipes)...');
    const userId = 'user-123';
    const billets = await storage.getAllBillets();

    // Ensure we have enough billets
    if (billets.length < 5) {
        throw new Error('Not enough billets in mock storage to perform 5 swipes.');
    }

    const startTime = performance.now();

    for (let i = 0; i < 5; i++) {
        const billetId = billets[i].id;
        // swipe right
        await store.swipe(billetId, 'right', userId);
        console.log(`Swiped ${i + 1}/5`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Total time for 5 swipes: ${duration.toFixed(2)}ms`);
}

main().catch(console.error);
