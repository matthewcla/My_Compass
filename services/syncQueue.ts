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
    private queue: SyncOperation[] = [];
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
        listener(this.queue);
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

        this.queue.push(operation);
        await this.persist();
        this.notifyListeners();

        return id;
    }

    async processQueue(): Promise<void> {
        if (this.processing || !this.executor) return;
        this.processing = true;

        try {
            const now = Date.now();
            const readyOps = this.queue.filter(
                (op) => op.status === 'pending' && op.nextRetryAt <= now
            );

            for (const op of readyOps) {
                op.status = 'in_flight';
                op.attemptCount++;
                op.lastAttemptAt = now;
                this.notifyListeners();

                try {
                    await this.executor(op.type, op.payload);
                    // Success — remove from queue
                    this.queue = this.queue.filter((o) => o.id !== op.id);
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
        const op = this.queue.find((o) => o.id === id && o.status === 'dead_letter');
        if (!op) return false;

        op.status = 'pending';
        op.attemptCount = 0;
        op.nextRetryAt = Date.now();
        op.errorMessage = null;

        await this.persist();
        this.notifyListeners();

        return true;
    }

    getQueue(): SyncOperation[] {
        return [...this.queue];
    }

    getPendingCount(): number {
        return this.queue.filter((op) => op.status === 'pending' || op.status === 'in_flight').length;
    }

    getDeadLetterCount(): number {
        return this.queue.filter((op) => op.status === 'dead_letter').length;
    }

    // =========================================================================
    // PERSISTENCE
    // =========================================================================

    private async hydrate(): Promise<void> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: SyncOperation[] = JSON.parse(raw);
                // Reset any in_flight back to pending on hydration (app restarted)
                this.queue = parsed.map((op) => ({
                    ...op,
                    status: op.status === 'in_flight' ? 'pending' : op.status,
                }));
                this.notifyListeners();
            }
        } catch (e) {
            console.error('[SyncQueue] Failed to hydrate queue:', e);
        }
    }

    private async persist(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.error('[SyncQueue] Failed to persist queue:', e);
        }
    }

    // =========================================================================
    // NOTIFICATION
    // =========================================================================

    private notifyListeners(): void {
        const snapshot = [...this.queue];
        for (const listener of this.listeners) {
            listener(snapshot);
        }
    }
}

export const syncQueue = new SyncQueueService();
