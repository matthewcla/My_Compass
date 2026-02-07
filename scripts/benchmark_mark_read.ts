// @ts-nocheck
const moduleAlias = require('module-alias');
const path = require('path');

// Setup aliases to point to our benchmark mocks
moduleAlias.addAliases({
  '@/services/storage': path.resolve(__dirname, 'mocks/storage_benchmark'),
  '@': path.resolve(__dirname, '..'),
});

// Import the store (which will now use our mock storage)
import { useInboxStore } from '@/store/useInboxStore';
import { InboxMessage } from '@/types/inbox';

// Helper to create mock messages
const createMockMessages = (count: number): InboxMessage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    type: 'notification',
    subject: `Message ${i}`,
    body: `This is message body ${i}`,
    timestamp: new Date().toISOString(),
    isRead: false,
    isPinned: false
  }));
};

async function runBenchmark() {
  console.log('--- Starting Mark As Read Benchmark ---');

  const MESSAGE_COUNT = 500;
  const mockMessages = createMockMessages(MESSAGE_COUNT);

  // 1. Setup Initial State
  console.log(`Setting up store with ${MESSAGE_COUNT} messages...`);
  useInboxStore.setState({ messages: mockMessages });

  const mockStorage = require('@/services/storage').storage;
  mockStorage.resetMetrics();

  // 2. Perform Mark as Read
  console.log('Marking a message as read...');
  const targetId = mockMessages[MESSAGE_COUNT - 1].id;

  const start = process.hrtime();
  useInboxStore.getState().markAsRead(targetId);
  const end = process.hrtime(start);

  await new Promise(resolve => setTimeout(resolve, 100));

  // 3. Measure
  const durationMs = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
  console.log(`Operation took ~${durationMs}ms (including state update)`);

  console.log('\n--- Storage Metrics ---');
  console.log(`Write Operations: ${mockStorage.writeOperations}`);
  console.log(`Items Written (Cost): ${mockStorage.itemsWritten}`);

  // Verification
  if (mockStorage.itemsWritten > 100) {
      console.log('\n🔴 RESULT: High write cost detected (O(N)). Optimization needed.');
  } else if (mockStorage.itemsWritten === 1) {
      console.log('\n🟢 RESULT: Low write cost detected (O(1)). Optimized!');
  } else {
      console.log('\n⚪ RESULT: Ambiguous result.');
  }

  // Double check the message was updated in store
  const updatedMsg = useInboxStore.getState().messages.find((m: InboxMessage) => m.id === targetId);
  if (updatedMsg?.isRead) {
      console.log('✅ Store updated correctly.');
  } else {
      console.error('❌ Store failed to update.');
      process.exit(1);
  }
}

runBenchmark().catch(e => {
  console.error(e);
  process.exit(1);
});
