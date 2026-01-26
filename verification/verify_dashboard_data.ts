import * as path from 'path';
import Module from 'module';
import assert from 'assert';

const originalRequire = Module.prototype.require;

// Mock database
const mockDb = {
    runAsync: async (sql: string, ...args: any[]) => {
        // console.log('Mock DB runAsync:', sql.trim().substring(0, 50) + '...', args);
        if (sql.includes('INSERT OR REPLACE INTO dashboard_cache')) {
            // args: [userId, data, timestamp, syncStatus]
            mockDb.store[args[0]] = args[1];
        }
    },
    getFirstAsync: async (sql: string, userId: string) => {
        // console.log('Mock DB getFirstAsync:', sql.trim().substring(0, 50) + '...', userId);
        if (sql.includes('SELECT * FROM dashboard_cache')) {
            const data = mockDb.store[userId];
            return data ? { data } : null;
        }
        return null;
    },
    execAsync: async (sql: string) => {
        // console.log('Mock DB execAsync');
    },
    store: {} as Record<string, string>
};

// Mock expo-sqlite
const mockExpoSqlite = {
    openDatabaseAsync: async () => mockDb,
};

// Hook require
(Module.prototype as any).require = function(id: string) {
    if (id === 'expo-sqlite') {
        return mockExpoSqlite;
    }
    if (id.startsWith('@/')) {
        // Resolve @/ to root (relative to this file, assuming structure is preserved)
        // __dirname is verification/
        // @/ points to parent of verification/
        return originalRequire.call(this, path.join(__dirname, '../', id.substring(2)));
    }
    return originalRequire.call(this, id);
};

async function runTest() {
    console.log('Running Dashboard Data Verification...');

    // Load storage service dynamically
    // Use relative path so it works in both source and dist
    const storage = require('../services/storage');

    const userId = 'test-user-123';
    const mockData = {
        cycle: { cycleId: 'TestCycle' },
        stats: { applicationsCount: 1 },
        leave: { currentBalance: 10 }
    };

    // Test Save
    console.log('Testing saveDashboardCache...');
    await storage.saveDashboardCache(userId, mockData);

    // Test Get
    console.log('Testing getDashboardCache...');
    const result = await storage.getDashboardCache(userId);

    // console.log('Result:', result);

    assert.deepStrictEqual(result, mockData, 'Retrieved data should match saved data');

    console.log('Dashboard Data Verification Passed!');
}

runTest().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
