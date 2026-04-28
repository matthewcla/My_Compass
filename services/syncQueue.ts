import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// Temporary mock for NetInfo until @react-native-community/netinfo can be installed
const addEventListener = (callback: (state: any) => void) => {
    callback({ isConnected: true });
};

// =============================================================================
// TYPES
// =============================================================================

export type SyncOperationStatus = 'pending' | 'in_flight' | 'dead_letter';

export interface SyncOperation {
    id: string;
    type: string;
    payload: unknown;
    attemptCount: number;
    maxRetries: number;
    nextRetryAt: number; // Unix timestamp ms
    status: SyncOperationStatus;
    createdAt: number;
    lastAttemptAt: number | null;
    errorMessage: string | null;
}

export type SyncQueueListener = (operations: SyncOperation[]) => void;
export type SyncExecutor = (type: string, payload: unknown) => Promise<void>;

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = '@my_compass/sync_queue';
const STORAGE_KEY_INDEX = '@my_compass/sync_queue_index';
const DEFAULT_MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 2_000; // 2s

// =============================================================================
// SYNC QUEUE SERVICE
// =============================================================================

export class SyncQueueService {
    private queue: Map<string, SyncOperation> = new Map();
    private dirtyIds: Set<string> = new Set();
    private persistTimer: ReturnType<typeof setTimeout> | null = null;
    private listeners: Set<SyncQueueListener> = new Set();
    private executor: SyncExecutor | null = null;
    private processing = false;
    private initialized = false;
    private isOnline = true;
    private isForeground = true;

    async init(): Promise<void> {
        if (this.initialized) return;

        this.isForeground = AppState.currentState === 'active';

        AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                this.isForeground = true;
                if (this.isOnline) {
                    this.processQueue();
                }
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                this.isForeground = false;
            }
        });

        addEventListener((state: any) => {
            this.isOnline = !!state.isConnected;
            if (this.isOnline && this.isForeground) {
                this.processQueue();
            }
        });

        await this.hydrate();
        this.initialized = true;
    }

    registerExecutor(executor: SyncExecutor): void {
        this.executor = executor;
    }

    subscribe(listener: SyncQueueListener): () => void {
        this.listeners.add(listener);
        listener(Array.from(this.queue.values()));
        return () => {
            this.listeners.delete(listener);
        };
    }

    async enqueue(type: string, payload: unknown): Promise<string> {
        const id = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const operation: SyncOperation = {
            id,
            type,
            payload,
            attemptCount: 0,
            maxRetries: DEFAULT_MAX_RETRIES,
            nextRetryAt: Date.now(),
            status: 'pending',
            createdAt: Date.now(),
            lastAttemptAt: null,
            errorMessage: null,
        };

        this.queue.set(id, operation);
        this.markDirty(id);
        this.persist(); // Trigger debounced persist
        this.notifyListeners();

        return id;
    }

    async processQueue(): Promise<void> {
        if (this.processing || !this.executor || !this.isOnline || !this.isForeground) return;
        this.processing = true;

        try {
            const now = Date.now();
            const readyOps = [];
            for (const op of this.queue.values()) {
                if (op.status === 'pending' && op.nextRetryAt <= now) {
                    readyOps.push(op);
                }
            }

            for (const op of readyOps) {
                op.status = 'in_flight';
                op.attemptCount++;
                op.lastAttemptAt = now;
                this.markDirty(op.id);
                this.notifyListeners();

                try {
                    await this.executor(op.type, op.payload);
                    // Success — remove from queue
                    this.queue.delete(op.id);
                    this.markDirty(op.id); // Mark ID as dirty so it gets removed from storage
                } catch (err) {
                    op.errorMessage = err instanceof Error ? err.message : 'Unknown error';

                    if (op.attemptCount >= op.maxRetries) {
                        op.status = 'dead_letter';
                    } else {
                        op.status = 'pending';
                        const delay = BASE_RETRY_DELAY * Math.pow(2, op.attemptCount - 1);
                        const jitter = delay * (0.5 + Math.random() * 0.5);
                        op.nextRetryAt = Date.now() + Math.min(jitter, 60_000);
                    }
                    this.markDirty(op.id);
                }
            }

            this.persist();
            this.notifyListeners();
        } finally {
            this.processing = false;
        }
    }

    async retryDeadLetter(id: string): Promise<boolean> {
        const op = this.queue.get(id);
        if (!op || op.status !== 'dead_letter') return false;

        op.status = 'pending';
        op.attemptCount = 0;
        op.nextRetryAt = Date.now();
        op.errorMessage = null;

        this.markDirty(id);
        this.persist();
        this.notifyListeners();

        return true;
    }

    getQueue(): SyncOperation[] {
        return Array.from(this.queue.values());
    }

    getPendingCount(): number {
        let count = 0;
        for (const op of this.queue.values()) {
            if (op.status === 'pending' || op.status === 'in_flight') {
                count++;
            }
        }
        return count;
    }

    getDeadLetterCount(): number {
        let count = 0;
        for (const op of this.queue.values()) {
            if (op.status === 'dead_letter') {
                count++;
            }
        }
        return count;
    }

    private markDirty(id: string): void {
        this.dirtyIds.add(id);
    }

    // =========================================================================
    // PERSISTENCE
    // =========================================================================

    private async hydrate(): Promise<void> {
        try {
            // Check for legacy data first (single JSON blob)
            const legacyRaw = await AsyncStorage.getItem(STORAGE_KEY);
            if (legacyRaw) {
                try {
                    const parsed: SyncOperation[] = JSON.parse(legacyRaw);
                    this.queue.clear();
                    const multiSetPairs: [string, string][] = [];
                    const ids: string[] = [];

                    for (const op of parsed) {
                        // Reset any in_flight back to pending on hydration (app restarted)
                        if (op.status === 'in_flight') {
                            op.status = 'pending';
                        }
                        this.queue.set(op.id, op);
                        ids.push(op.id);
                        multiSetPairs.push([`${STORAGE_KEY}_item_${op.id}`, JSON.stringify(op)]);
                    }

                    // Migrate to new incremental storage with batching
                    const CHUNK_SIZE = 50;
                    if (multiSetPairs.length > 0) {
                        for (let i = 0; i < multiSetPairs.length; i += CHUNK_SIZE) {
                            await AsyncStorage.multiSet(multiSetPairs.slice(i, i + CHUNK_SIZE));
                        }
                    }
                    await AsyncStorage.setItem(STORAGE_KEY_INDEX, JSON.stringify(ids));

                    // Remove legacy key
                    await AsyncStorage.removeItem(STORAGE_KEY);

                    this.notifyListeners();
                    return;
                } catch (migrationError) {
                    console.error('[SyncQueue] Migration failed, falling back to empty queue:', migrationError);
                    // If migration fails, we might want to keep the legacy key or clear it.
                    // For safety, let's just log.
                }
            }

            // Normal hydration from incremental storage
            const indexRaw = await AsyncStorage.getItem(STORAGE_KEY_INDEX);
            if (indexRaw) {
                const ids: string[] = JSON.parse(indexRaw);
                const keys = ids.map(id => `${STORAGE_KEY}_item_${id}`);

                // Fetch all items in parallel
                // Note: multiGet might also hit limits on some platforms if keys array is huge,
                // but usually reading is less restricted than writing transaction size.
                // For safety, we could chunk this too if we expect >1000 items.
                // Given the context, we'll keep it simple for now as 1000 keys is usually fine for multiGet.
                const pairs = await AsyncStorage.multiGet(keys);

                this.queue.clear();
                for (const [key, val] of pairs) {
                    if (val) {
                        const op: SyncOperation = JSON.parse(val);
                        // Reset any in_flight back to pending on hydration
                        if (op.status === 'in_flight') {
                            op.status = 'pending';
                        }
                        this.queue.set(op.id, op);
                    }
                }
                this.notifyListeners();
            }
        } catch (e) {
            console.error('[SyncQueue] Failed to hydrate queue:', e);
        }
    }

    private persist(): void {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
        }

        this.persistTimer = setTimeout(async () => {
            if (this.dirtyIds.size === 0) return;

            // Capture current dirty set to avoid race conditions with concurrent updates
            const batch = new Set(this.dirtyIds);

            try {
                const toSet: [string, string][] = [];
                const toRemove: string[] = [];

                for (const id of batch) {
                    const op = this.queue.get(id);
                    if (op) {
                        toSet.push([`${STORAGE_KEY}_item_${id}`, JSON.stringify(op)]);
                    } else {
                        // Item was deleted from queue
                        toRemove.push(`${STORAGE_KEY}_item_${id}`);
                    }
                }

                // Chunking to avoid Android IPC limits
                const CHUNK_SIZE = 50;

                // Batch write updates
                if (toSet.length > 0) {
                    for (let i = 0; i < toSet.length; i += CHUNK_SIZE) {
                        await AsyncStorage.multiSet(toSet.slice(i, i + CHUNK_SIZE));
                    }
                }

                // Batch remove deletions
                if (toRemove.length > 0) {
                    for (let i = 0; i < toRemove.length; i += CHUNK_SIZE) {
                        await AsyncStorage.multiRemove(toRemove.slice(i, i + CHUNK_SIZE));
                    }
                }

                // Always update the index to reflect current order and existence
                const index = Array.from(this.queue.keys());
                await AsyncStorage.setItem(STORAGE_KEY_INDEX, JSON.stringify(index));

                // Only remove the items we actually processed
                for (const id of batch) {
                    this.dirtyIds.delete(id);
                }
            } catch (e) {
                console.error('[SyncQueue] Failed to persist queue:', e);
            }
        }, 500);
    }

    // =========================================================================
    // NOTIFICATION
    // =========================================================================

    private notifyListeners(): void {
        const snapshot = Array.from(this.queue.values());
        for (const listener of this.listeners) {
            listener(snapshot);
        }
    }
}

export const syncQueue = new SyncQueueService();
