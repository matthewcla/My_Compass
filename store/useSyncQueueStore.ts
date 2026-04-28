import { create } from 'zustand';
import { syncQueue, SyncOperation } from '@/services/syncQueue';

interface SyncQueueState {
    pendingCount: number;
    deadLetterCount: number;
    operations: SyncOperation[];
    retryDeadLetter: (id: string) => Promise<boolean>;
    processQueue: () => Promise<void>;
}

export const useSyncQueueStore = create<SyncQueueState>((set) => {
    // Subscribe to syncQueue events
    syncQueue.subscribe((operations) => {
        set({
            operations,
            pendingCount: operations.filter(
                (op) => op.status === 'pending' || op.status === 'in_flight'
            ).length,
            deadLetterCount: operations.filter(
                (op) => op.status === 'dead_letter'
            ).length,
        });
    });

    return {
        pendingCount: 0,
        deadLetterCount: 0,
        operations: [],

        retryDeadLetter: async (id: string) => {
            return syncQueue.retryDeadLetter(id);
        },

        processQueue: async () => {
            await syncQueue.processQueue();
        },
    };
});
