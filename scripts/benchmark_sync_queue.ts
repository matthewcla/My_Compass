const moduleAlias = require('module-alias');
const path = require('path');

// Setup aliases before imports
moduleAlias.addAliases({
  '@react-native-async-storage/async-storage': path.join(__dirname, 'mocks/AsyncStorage.ts'),
  '@': path.join(__dirname, '../')
});

// Now we can import the service
// We need to use require because we are modifying module resolution
const { SyncQueueService } = require('../services/syncQueue');
const { setItemCalls } = require('./mocks/AsyncStorage');

async function benchmark() {
    console.log('Starting SyncQueue benchmark...');
    const queue = new SyncQueueService();
    await queue.init();

    const start = Date.now();
    const ITERATIONS = 1000;

    console.log(`Enqueuing ${ITERATIONS} items...`);

    // Simulate rapid fire updates (e.g. bulk import or rapid user actions)
    for (let i = 0; i < ITERATIONS; i++) {
        await queue.enqueue('TEST_ACTION', { index: i, timestamp: Date.now() });
    }

    // Wait for debounce
    console.log('Waiting for debounced persistence...');
    await new Promise(r => setTimeout(r, 1000));

    const duration = Date.now() - start;
    console.log(`\nBenchmark Results:`);
    console.log(`Total Time: ${duration}ms`);
    console.log(`Average Time per Op: ${(duration / ITERATIONS).toFixed(2)}ms`);
    console.log(`Persistence Writes (AsyncStorage.setItem): ${setItemCalls.count}`);

    if (setItemCalls.count >= ITERATIONS) {
        console.log('\n❌ Analysis: Persistence is happening on every single operation!');
    } else if (setItemCalls.count <= 2) {
        console.log('\n✅ Analysis: Persistence is highly optimized (debounced).');
    } else {
        console.log('\n⚠️ Analysis: Persistence is somewhat optimized but not ideal.');
    }
}

benchmark().catch(console.error);
