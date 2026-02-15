const { performance } = require('perf_hooks');

// Mock Data
const applications = Array.from({ length: 1000 }).map((_, i) => ({
    id: `app-${i}`,
    billetId: `billet-${i}`,
    userId: `user-1`,
    status: 'pending',
    statusHistory: [],
    personalStatement: 'Statement...',
    preferenceRank: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced'
}));

// Mock DB Runner Factory
function createMockRunner() {
    return {
        callCount: 0,
        async runAsync(sql, ...args) {
            this.callCount++;
            await new Promise(resolve => setTimeout(resolve, 0.1)); // Simulate 0.1ms latency
            return Promise.resolve();
        }
    };
}

// Current Implementation (Unoptimized)
async function saveApplicationsBefore(apps, runner) {
    for (const app of apps) {
        await runner.runAsync(
          `INSERT OR REPLACE INTO applications (
            id, billet_id, user_id, status, status_history,
            optimistic_lock_token, lock_requested_at, lock_expires_at,
            personal_statement, preference_rank, submitted_at,
            server_confirmed_at, server_rejection_reason,
            created_at, updated_at, last_sync_timestamp, sync_status, local_modified_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          app.id,
          app.billetId,
          app.userId,
          app.status,
          JSON.stringify(app.statusHistory),
          null,
          null,
          null,
          app.personalStatement || null,
          app.preferenceRank || null,
          app.submittedAt || null,
          app.serverConfirmedAt || null,
          app.serverRejectionReason || null,
          app.createdAt,
          app.updatedAt,
          app.lastSyncTimestamp,
          app.syncStatus,
          app.localModifiedAt || null
        );
    }
}

// Optimized Implementation (Proposed)
async function saveApplicationsAfter(apps, runner) {
    const CHUNK_SIZE = 50;

    for (let i = 0; i < apps.length; i += CHUNK_SIZE) {
        const chunk = apps.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;

        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values = [];

        for (const app of chunk) {
            values.push(
                app.id,
                app.billetId,
                app.userId,
                app.status,
                JSON.stringify(app.statusHistory),
                null,
                null,
                null,
                app.personalStatement || null,
                app.preferenceRank || null,
                app.submittedAt || null,
                app.serverConfirmedAt || null,
                app.serverRejectionReason || null,
                app.createdAt,
                app.updatedAt,
                app.lastSyncTimestamp,
                app.syncStatus,
                app.localModifiedAt || null
            );
        }

        await runner.runAsync(
            `INSERT OR REPLACE INTO applications (
            id, billet_id, user_id, status, status_history,
            optimistic_lock_token, lock_requested_at, lock_expires_at,
            personal_statement, preference_rank, submitted_at,
            server_confirmed_at, server_rejection_reason,
            created_at, updated_at, last_sync_timestamp, sync_status, local_modified_at
            ) VALUES ${placeholders};`,
            ...values
        );
    }
}

async function runBenchmark() {
    console.log(`Benchmarking with ${applications.length} applications...`);

    // Test Before
    const runnerBefore = createMockRunner();
    const startBefore = performance.now();
    await saveApplicationsBefore(applications, runnerBefore);
    const endBefore = performance.now();
    console.log(`Before: ${(endBefore - startBefore).toFixed(2)}ms (Calls: ${runnerBefore.callCount})`);

    // Test After
    const runnerAfter = createMockRunner();
    const startAfter = performance.now();
    await saveApplicationsAfter(applications, runnerAfter);
    const endAfter = performance.now();
    console.log(`After: ${(endAfter - startAfter).toFixed(2)}ms (Calls: ${runnerAfter.callCount})`);

    const improvement = (endBefore - startBefore) / (endAfter - startAfter);
    console.log(`Speedup: ${improvement.toFixed(2)}x`);
}

runBenchmark();
