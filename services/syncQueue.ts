import AsyncStorage from '@react-native-async-storage/async-storage';

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
const DEFAULT_MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 2_000; // 2s

// =============================================================================
// SYNC QUEUE SERVICE
// =============================================================================

class SyncQueueService {
    private queue: Map<string, SyncOperation> = new Map();
    private listeners: Set<SyncQueueListener> = new Set();
    private executor: SyncExecutor | null = null;
    private processing = false;
    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) return;
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
        await this.persist();
        this.notifyListeners();

        return id;
    }

    async processQueue(): Promise<void> {
        if (this.processing || !this.executor) return;
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
                this.notifyListeners();

                try {
                    await this.executor(op.type, op.payload);
                    // Success — remove from queue
                    this.queue.delete(op.id);
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
                }
            }

            await this.persist();
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

        await this.persist();
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

    // =========================================================================
    // PERSISTENCE
    // =========================================================================

    private async hydrate(): Promise<void> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: SyncOperation[] = JSON.parse(raw);
                this.queue.clear();
                for (const op of parsed) {
                    // Reset any in_flight back to pending on hydration (app restarted)
                    if (op.status === 'in_flight') {
                        op.status = 'pending';
                    }
                    this.queue.set(op.id, op);
                }
                this.notifyListeners();
            }
        } catch (e) {
            console.error('[SyncQueue] Failed to hydrate queue:', e);
        }
    }

    private async persist(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.queue.values())));
        } catch (e) {
            console.error('[SyncQueue] Failed to persist queue:', e);
        }
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
