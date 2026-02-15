const { performance } = require('perf_hooks');

// Mock Data
const messages = Array.from({ length: 1000 }).map((_, i) => ({
    id: `msg-${i}`,
    type: 'NAVADMIN',
    subject: `Test Message ${i}`,
    body: 'Some body content...',
    timestamp: new Date().toISOString(),
    isRead: false,
    isPinned: false,
    metadata: {}
}));

// Mock DB Runner Factory
function createMockRunner() {
    return {
        callCount: 0,
        async runAsync(sql, ...args) {
            this.callCount++;
            await new Promise(resolve => setTimeout(resolve, 0.1));
            return Promise.resolve();
        },
        async getAllAsync(sql, ...args) {
            this.callCount++;
            await new Promise(resolve => setTimeout(resolve, 0.1));
            return Promise.resolve([]);
        }
    };
}

// Current Implementation (Before Optimization)
async function saveInboxMessagesBefore(messages, runner) {
    if (messages.length === 0) {
        await runner.runAsync('DELETE FROM inbox_messages;');
        return;
    }

    for (const msg of messages) {
        await runner.runAsync(
          `INSERT OR REPLACE INTO inbox_messages (
            id, type, subject, body, timestamp, is_read, is_pinned, metadata, last_sync_timestamp, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          msg.id,
          msg.type,
          msg.subject,
          msg.body,
          msg.timestamp,
          msg.isRead ? 1 : 0,
          msg.isPinned ? 1 : 0,
          JSON.stringify(msg.metadata || {}),
          new Date().toISOString(),
          'synced'
        );
    }

    const placeholders = messages.map(() => '?').join(', ');
    await runner.runAsync(
        `DELETE FROM inbox_messages WHERE id NOT IN (${placeholders});`,
        ...messages.map((msg) => msg.id)
    );
}

// Optimized Implementation (As Implemented in services/storage.ts)
async function saveInboxMessagesAfter(messages, runner) {
    if (messages.length === 0) {
        await runner.runAsync('DELETE FROM inbox_messages;');
        return;
    }

    // Chunk size to avoid SQLite variable limit (default usually 999 or 32766)
    const CHUNK_SIZE = 50;

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        const chunk = messages.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;

        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values = [];

        for (const msg of chunk) {
            values.push(
                msg.id,
                msg.type,
                msg.subject,
                msg.body,
                msg.timestamp,
                msg.isRead ? 1 : 0,
                msg.isPinned ? 1 : 0,
                JSON.stringify(msg.metadata || {}),
                new Date().toISOString(),
                'synced'
            );
        }

        await runner.runAsync(
            `INSERT OR REPLACE INTO inbox_messages (
            id, type, subject, body, timestamp, is_read, is_pinned, metadata, last_sync_timestamp, sync_status
            ) VALUES ${placeholders};`,
            ...values
        );
    }

    // Existing DELETE logic (simplified, assuming < 999 items)
    const placeholders = messages.map(() => '?').join(', ');
    await runner.runAsync(
        `DELETE FROM inbox_messages WHERE id NOT IN (${placeholders});`,
        ...messages.map((msg) => msg.id)
    );
}

async function runBenchmark() {
    console.log(`Benchmarking with ${messages.length} messages...`);

    // Test Before
    const runnerBefore = createMockRunner();
    const startBefore = performance.now();
    await saveInboxMessagesBefore(messages, runnerBefore);
    const endBefore = performance.now();
    console.log(`Before: ${(endBefore - startBefore).toFixed(2)}ms (Calls: ${runnerBefore.callCount})`);

    // Test After
    const runnerAfter = createMockRunner();
    const startAfter = performance.now();
    await saveInboxMessagesAfter(messages, runnerAfter);
    const endAfter = performance.now();
    console.log(`After: ${(endAfter - startAfter).toFixed(2)}ms (Calls: ${runnerAfter.callCount})`);

    const improvement = (endBefore - startBefore) / (endAfter - startAfter);
    console.log(`Speedup: ${improvement.toFixed(2)}x`);
}

runBenchmark();
