const moduleAlias = require('module-alias');
const path = require('path');

moduleAlias.addAliases({
  '@/services/storage': path.resolve(__dirname, 'mocks/storage'),
  '@/services/correspondence': path.resolve(__dirname, 'mocks/correspondence'),
  '@': path.resolve(__dirname, '..'),
});

import { useInboxStore } from '@/store/useInboxStore';

async function runTest() {
    console.log('--- Starting Inbox Store Verification ---');

    // Initial State
    console.log('Initial messages:', useInboxStore.getState().messages.length);
    console.log('Initial lastFetched:', useInboxStore.getState().lastFetched);

    // 1. First Fetch
    console.log('\n1. Fetching (First time)...');
    const start1 = Date.now();
    await useInboxStore.getState().fetchMessages();
    const duration1 = Date.now() - start1;
    console.log(`Fetch 1 took ${duration1}ms`);

    const state1 = useInboxStore.getState();
    console.log('Messages after fetch:', state1.messages.length);
    console.log('LastFetched after fetch:', state1.lastFetched);

    if (state1.messages.length === 0) throw new Error('Messages should be loaded');
    if (!state1.lastFetched) throw new Error('lastFetched should be set');

    const firstFetchTime = state1.lastFetched;

    // 2. Second Fetch (Should be cached/skipped)
    console.log('\n2. Fetching (Immediate retry)...');
    const start2 = Date.now();
    await useInboxStore.getState().fetchMessages();
    const duration2 = Date.now() - start2;
    console.log(`Fetch 2 took ${duration2}ms`);

    const state2 = useInboxStore.getState();
    // Assuming mock delay is 50ms (set in scripts/mocks/correspondence.ts), skipped fetch is ~0-5ms
    if (duration2 > 25) throw new Error('Fetch 2 should have been skipped (cached)');
    if (state2.lastFetched !== firstFetchTime) throw new Error('lastFetched should not change on skipped fetch');

    // 3. Forced Fetch
    console.log('\n3. Fetching (Forced)...');
    const start3 = Date.now();
    await useInboxStore.getState().fetchMessages({ force: true });
    const duration3 = Date.now() - start3;
    console.log(`Fetch 3 took ${duration3}ms`);

    const state3 = useInboxStore.getState();
    if (duration3 < 50) throw new Error('Fetch 3 should have waited for network delay');
    if (state3.lastFetched === firstFetchTime) throw new Error('lastFetched should update on forced fetch');

    console.log('\n--- Inbox Store Verification Passed ---');
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
