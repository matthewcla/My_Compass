import { useAssignmentStore } from '@/store/useAssignmentStore';
import { storage } from '@/services/storage';
import { Application } from '@/types/schema';

// Mock storage
jest.mock('@/services/storage', () => ({
  storage: {
    saveApplications: jest.fn(),
  }
}));

describe('AssignmentStore - Reorder Optimization', () => {
    beforeEach(() => {
        useAssignmentStore.getState().resetStore();
        jest.clearAllMocks();
    });

    it('should only save applications whose rank has changed', async () => {
        const userId = 'user-123';

        // 1. Setup 7 applications with correct ranks
        const apps: Record<string, Application> = {};
        const appIds: string[] = [];

        for (let i = 1; i <= 7; i++) {
            const id = `app-${i}`;
            appIds.push(id);
            apps[id] = {
                id,
                billetId: `billet-${i}`,
                userId,
                status: 'draft',
                statusHistory: [],
                preferenceRank: i,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastSyncTimestamp: new Date().toISOString(),
                syncStatus: 'synced',
            };
        }

        // Initialize store state directly
        useAssignmentStore.setState({
            applications: apps,
            userApplicationIds: appIds,
        });

        // 2. Perform Reorder (Swap 1st and 2nd)
        // Original: [1, 2, 3, 4, 5, 6, 7]
        // Swap: [2, 1, 3, 4, 5, 6, 7]
        // Index 0: app-2 (was rank 2, now rank 1) -> CHANGED
        // Index 1: app-1 (was rank 1, now rank 2) -> CHANGED
        // Index 2: app-3 (was rank 3, now rank 3) -> UNCHANGED
        // ...

        // We use moveApplication(0, 'down', userId) which swaps index 0 and 1.
        await useAssignmentStore.getState().moveApplication(0, 'down', userId);

        // 3. Verify storage call
        expect(storage.saveApplications).toHaveBeenCalledTimes(1);

        const savedApps = (storage.saveApplications as jest.Mock).mock.calls[0][0] as Application[];
        expect(savedApps).toHaveLength(2);

        const savedIds = savedApps.map(a => a.id).sort();
        expect(savedIds).toEqual(['app-1', 'app-2']);

        // Verify ranks in saved apps
        const app1 = savedApps.find(a => a.id === 'app-1');
        const app2 = savedApps.find(a => a.id === 'app-2');

        expect(app1?.preferenceRank).toBe(2);
        expect(app2?.preferenceRank).toBe(1);
    });
});
