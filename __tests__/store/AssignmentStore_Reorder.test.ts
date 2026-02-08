
import { storage } from '@/services/storage';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Application } from '@/types/schema';

// Mock storage
jest.mock('@/services/storage', () => ({
    storage: {
        saveApplications: jest.fn(),
        getBilletCount: jest.fn().mockResolvedValue(0),
        getPagedBillets: jest.fn().mockResolvedValue([]),
        getAssignmentDecisions: jest.fn().mockResolvedValue({}),
        getUserApplications: jest.fn().mockResolvedValue([]),
        saveBillet: jest.fn(),
        saveApplication: jest.fn(),
    }
}));

describe('AssignmentStore Reorder Optimization', () => {
    const userId = 'user-123';

    beforeEach(() => {
        useAssignmentStore.getState().resetStore();
        jest.clearAllMocks();
    });

    const createMockApp = (id: string, rank: number): Application => ({
        id,
        billetId: `billet-${id}`,
        userId,
        status: 'draft',
        statusHistory: [],
        preferenceRank: rank,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
        localModifiedAt: new Date().toISOString(),
    });

    it('should only save changed applications when reordering', async () => {
        const store = useAssignmentStore.getState();

        // 1. Populate store with 7 applications
        const apps: Record<string, Application> = {};
        const userAppIds: string[] = [];
        for (let i = 1; i <= 7; i++) {
            const id = `app-${i}`;
            apps[id] = createMockApp(id, i);
            userAppIds.push(id);
        }

        useAssignmentStore.setState({
            applications: apps,
            userApplicationIds: userAppIds
        });

        // 2. Reorder: Swap Rank 1 and Rank 2
        // Initial: app-1 (Rank 1), app-2 (Rank 2), app-3 (Rank 3)...
        // Target: app-2 (Rank 1), app-1 (Rank 2), app-3 (Rank 3)...

        const newOrderIds = ['app-2', 'app-1', 'app-3', 'app-4', 'app-5', 'app-6', 'app-7'];

        await store.reorderApplications(newOrderIds, userId);

        // 3. Verify storage calls
        expect(storage.saveApplications).toHaveBeenCalledTimes(1);

        const savedApps = (storage.saveApplications as jest.Mock).mock.calls[0][0] as Application[];

        // Should only save 2 apps (app-1 and app-2)
        expect(savedApps.length).toBe(2);

        const savedIds = savedApps.map(a => a.id).sort();
        expect(savedIds).toEqual(['app-1', 'app-2']);

        // Verify ranks are correct in saved apps
        const app1 = savedApps.find(a => a.id === 'app-1');
        const app2 = savedApps.find(a => a.id === 'app-2');

        expect(app1?.preferenceRank).toBe(2);
        expect(app2?.preferenceRank).toBe(1);
    });

    it('should not save anything if order is unchanged', async () => {
        const store = useAssignmentStore.getState();

        const apps: Record<string, Application> = {};
        const userAppIds: string[] = [];
        for (let i = 1; i <= 3; i++) {
            const id = `app-${i}`;
            apps[id] = createMockApp(id, i);
            userAppIds.push(id);
        }

        useAssignmentStore.setState({
            applications: apps,
            userApplicationIds: userAppIds
        });

        const sameOrderIds = ['app-1', 'app-2', 'app-3'];

        await store.reorderApplications(sameOrderIds, userId);

        expect(storage.saveApplications).not.toHaveBeenCalled();
    });

    it('moveApplication action should correctly calculate new order and call reorderApplications', async () => {
        const store = useAssignmentStore.getState();
        const spy = jest.spyOn(store, 'reorderApplications');

        // Setup 3 apps
        const userAppIds = ['app-1', 'app-2', 'app-3'];
        useAssignmentStore.setState({ userApplicationIds: userAppIds });

        // Move app-2 (index 1) UP -> becomes index 0
        store.moveApplication(1, 'up', userId);

        expect(spy).toHaveBeenCalledWith(['app-2', 'app-1', 'app-3'], userId);

        // Move app-2 (index 0) DOWN -> becomes index 1
        // Reset state for clarity (though spy captures call arguments)
        useAssignmentStore.setState({ userApplicationIds: ['app-2', 'app-1', 'app-3'] });

        store.moveApplication(0, 'down', userId);

        expect(spy).toHaveBeenLastCalledWith(['app-1', 'app-2', 'app-3'], userId);
    });
});
