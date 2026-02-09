// @ts-nocheck
const path = require('path');
const moduleAlias = require(path.resolve(__dirname, '../node_modules/module-alias'));

// Setup aliases
moduleAlias.addAliases({
  '@/services/storage': path.resolve(__dirname, 'mocks/storage'),
  '@': path.resolve(__dirname, '..'),
});

// Mock other native modules
const jest = { mock: () => {} }; // Dummy jest
global.jest = jest as any;

// Use require instead of import to avoid some TS/ESM issues if any
const { storage } = require('@/services/storage');
const { useAssignmentStore } = require('@/store/useAssignmentStore');

async function run() {
  console.log('Running verify-swipe-perf...');

  // 1. Initialize Store
  const storeActions = useAssignmentStore.getState();

  // Need to populate billets first
  console.log('Fetching billets...');
  await storeActions.fetchBillets('USER_0001');

  // Get fresh state
  const state = useAssignmentStore.getState();

  // Verify billets loaded
  console.log(`Billets in stack: ${state.billetStack.length}`);

  if (state.billetStack.length === 0) {
      const count = await storage.getBilletCount();
      console.log(`Storage count: ${count}`);
  }

  // 2. Monkey-patch storage to simulate slow writes (e.g. 500ms)
  const originalSave = storage.saveAssignmentDecision;
  // @ts-ignore
  storage.saveAssignmentDecision = async (...args) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // @ts-ignore
    return originalSave.apply(storage, args);
  };

  // Also slow down saveApplication for promoteToSlate
  const originalSaveApp = storage.saveApplication;
  // @ts-ignore
  storage.saveApplication = async (...args) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // @ts-ignore
      return originalSaveApp.apply(storage, args);
  };

  // 3. Perform 5 swipes
  console.log('Starting 5 swipes...');
  const start = Date.now();

  // Ensure we have billets to swipe
  const stack = state.billetStack;
  if (stack.length < 5) {
      console.error('Not enough billets to test swipe batching');
      return;
  }

  // Swipe 1
  await storeActions.swipe(stack[0], 'left', 'USER_0001');
  // Swipe 2
  await storeActions.swipe(stack[1], 'left', 'USER_0001');
  // Swipe 3
  await storeActions.swipe(stack[2], 'left', 'USER_0001');
  // Swipe 4
  await storeActions.swipe(stack[3], 'left', 'USER_0001');
  // Swipe 5 - This should trigger persistDecisions and block if awaited
  await storeActions.swipe(stack[4], 'left', 'USER_0001');

  const end = Date.now();
  const duration = end - start;
  console.log(`Total time for 5 swipes: ${duration}ms`);

  if (duration > 100) {
      console.log('Performance: SLOW (Blocked by storage)');
  } else {
      console.log('Performance: FAST (Optimistic update)');
  }
}

run();
