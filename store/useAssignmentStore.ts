import { services } from '@/services/api/serviceRegistry';
import { MOCK_BILLETS } from '@/constants/MockBillets';
import { storage } from '@/services/storage';
import { syncQueue } from '@/services/syncQueue';
import {
    Application,
    Billet,
    MyAssignmentState,
    SwipeDecision
} from '@/types/schema';
import { create } from 'zustand';

// =============================================================================
// CONSTANTS
// =============================================================================

export const MAX_SLATE_SIZE = 5;

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Simple UUID v4 generator for React Native/Expo environments without 'uuid' package.
 */
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

// =============================================================================
// STORE TYPES
// =============================================================================

export type SwipeDirection = 'left' | 'right' | 'up';
export type SmartBenchItem = { billet: Billet; type: 'manifest' | 'suggestion' };

export type FilterState = {
    payGrade: string[];
    designator: string[]; // Kept for schema compatibility, though less relevant for enlisted
    location: string[];
};

export type DiscoveryMode = 'real' | 'sandbox';

interface AssignmentActions {
    /**
     * Fetch billets from "API" (Mock) and populate store.
     * Also hydrates local decisions/applications if not already loaded.
     */
    fetchBillets: (userId?: string) => Promise<void>;

    /**
     * Load more billets from storage (Pagination).
     */
    loadMore: () => Promise<void>;

    /**
     * Hydrate user data (decisions, applications) from storage.
     */
    hydrateUserData: (userId: string) => Promise<void>;

    /**
     * Handle user swipe action on a billet
     */
    swipe: (billetId: string, direction: SwipeDirection, userId: string) => Promise<void>;

    /**
     * Switch between Real and Sandbox modes.
     */
    setMode: (mode: DiscoveryMode) => void;

    /**
     * Update filters for Sandbox mode.
     */
    updateSandboxFilters: (filters: Partial<FilterState>) => void;

    /**
     * Toggle visibility of Projected Billets in Discovery.
     */
    toggleShowProjected: () => void;

    /**
     * Undo the last swipe action.
     */
    undo: (userId: string) => void;

    /**
     * Promote a billet from Bench/Discovery to the Slate (Draft Application).
     * Returns true if successful, false if slate is full.
     */
    promoteToSlate: (billetId: string, userId: string) => Promise<boolean>;

    /**
     * Demote an application back to the Manifest (removes Draft).
     * Keeps the 'interest' in realDecisions so it returns to the Manifest list.
     */
    demoteToManifest: (appId: string) => Promise<void>;

    /**
     * Recover a 'nope' (archived) billet back to the Manifest ('like').
     */
    recoverBillet: (billetId: string, userId: string) => void;

    /**
     * Remove (if draft) or Withdraw (if submitted) an application.
     * Triggers re-ranking of remaining applications.
     */
    withdrawApplication: (appId: string, userId: string) => Promise<void>;

    /**
     * Move application up or down in the slate.
     */
    moveApplication: (fromIndex: number, direction: 'up' | 'down', userId: string) => Promise<void>;

    /**
     * Reorder application preference ranks based on the provided ID order.
     */
    reorderApplications: (orderedAppIds: string[], userId: string) => Promise<void>;

    /**
     * Submit all DRAFT applications to the server.
     */
    submitSlate: () => Promise<void>;

    /**
     * Get the "Smart Bench" items based on filter.
     * 'candidates': like + super (excluding active apps)
     * 'favorites': super only (excluding active apps)
     * 'archived': nope only
     */
    getManifestItems: (filter: 'candidates' | 'favorites' | 'archived') => SmartBenchItem[];


    /**
     * Get billets that are projected (future vacancies).
     */
    getProjectedBillets: () => Billet[];

    /**
     * Reset store to initial state (useful for logout/testing).
     */
    resetStore: () => void;
}


export type AssignmentStore = MyAssignmentState & {
    // New State for Swipe Deck
    billetStack: string[];
    cursor: number;

    // Discovery Mode State
    mode: DiscoveryMode;
    sandboxFilters: FilterState;
    showProjected: boolean; // New State

    // Cycle State
    slateDeadline: string; // ISO Timestamp

    // Pagination State
    currentOffset: number;

    // Dual Decision Bins
    realDecisions: Record<string, SwipeDecision>;
    sandboxDecisions: Record<string, SwipeDecision>;
} & AssignmentActions;

const INITIAL_STATE: MyAssignmentState & {
    billetStack: string[];
    cursor: number;
    mode: DiscoveryMode;
    sandboxFilters: FilterState;
    showProjected: boolean;
    slateDeadline: string;
    currentOffset: number;
    realDecisions: Record<string, SwipeDecision>;
    sandboxDecisions: Record<string, SwipeDecision>;
} = {
    billets: {},
    applications: {},
    userApplicationIds: [],
    lastBilletSyncAt: null,
    isSyncingBillets: false,
    isSyncingApplications: false,

    // New State
    billetStack: [],
    cursor: 0,

    // Discovery Mode Defaults
    mode: 'real',
    sandboxFilters: {
        payGrade: ['E-6'], // Default to user's rank
        designator: [],
        location: []
    },
    showProjected: false,
    // Mock Deadline: 72 hours from now
    slateDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    currentOffset: 0,
    realDecisions: {},
    sandboxDecisions: {},
};

// =============================================================================
// WRITE-BEHIND BUFFER
// =============================================================================

type PendingSwipe = { userId: string; billetId: string; decision: SwipeDecision };
let pendingSwipes: PendingSwipe[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | number | null = null;

const purgePendingSwipes = (userId: string, billetId: string): boolean => {
    const initialCount = pendingSwipes.length;
    pendingSwipes = pendingSwipes.filter(
        pending => !(pending.userId === userId && pending.billetId === billetId)
    );

    if (pendingSwipes.length === 0 && flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
    }

    return pendingSwipes.length < initialCount;
};

const persistDecisions = async () => {
    if (pendingSwipes.length === 0) return;

    // 1. Take snapshot and clear queue immediately
    const batch = [...pendingSwipes];
    pendingSwipes = [];
    if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
    }

    // 2. Persist batch
    try {
        await Promise.all(
            batch.map(item => storage.saveAssignmentDecision(item.userId, item.billetId, item.decision))
        );
    } catch (e) {
        console.error('[Store] Failed to persist decisions batch', e);
        // In a real app, we might want to retry or put them back in queue
    }
};

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select Manifest Items based on filter.
 * NOTE: This is a pure function. Components should use `useMemo` to prevent re-calculations.
 */
export const selectManifestItems = (
    state: Pick<AssignmentStore, 'billets' | 'realDecisions' | 'applications'>,
    filter: 'candidates' | 'favorites' | 'archived'
): SmartBenchItem[] => {
    const { billets, realDecisions, applications } = state;

    // Exclude things that are already applications
    const activeBilletIds = new Set(Object.values(applications).map(a => a.billetId));

    const items: SmartBenchItem[] = [];

    Object.entries(realDecisions).forEach(([billetId, decision]) => {
        const billet = billets[billetId];
        if (!billet) return;
        if (activeBilletIds.has(billetId)) return; // Already in slate

        if (filter === 'archived') {
            if (decision === 'nope') items.push({ billet, type: 'manifest' });
        } else if (filter === 'favorites') {
            if (decision === 'super') items.push({ billet, type: 'manifest' });
        } else { // candidates (DEFAULT View)
            // Show likes and supers that aren't yet applications
            if (decision === 'like' || decision === 'super') {
                items.push({ billet, type: 'manifest' });
            }
        }
    });

    // Sort candidates: Super Likes first
    if (filter === 'candidates') {
        items.sort((a, b) => {
            const decisionA = realDecisions[a.billet.id];
            const decisionB = realDecisions[b.billet.id];
            if (decisionA === 'super' && decisionB !== 'super') return -1;
            if (decisionA !== 'super' && decisionB === 'super') return 1;
            return 0;
        });
    }

    return items;
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
    ...INITIAL_STATE,

    hydrateUserData: async (userId: string) => {
        try {
            // Parallel hydrate to avoid waterfall
            const [decisions, apps] = await Promise.all([
                storage.getAssignmentDecisions(userId),
                storage.getUserApplications(userId)
            ]);

            const appRecord: Record<string, Application> = {};
            if (apps) {
                apps.forEach(a => { appRecord[a.id] = a; });
            }

            // Merge pending swipes on top of DB data
            const mergedDecisions = { ...((decisions as Record<string, SwipeDecision>) || {}) };
            pendingSwipes.forEach(p => {
                if (p.userId === userId) {
                    mergedDecisions[p.billetId] = p.decision;
                }
            });

            set({
                realDecisions: mergedDecisions,
                applications: appRecord,
                userApplicationIds: apps ? apps.map(a => a.id) : [],
            });
        } catch (e) {
            console.error('[Store] Failed to hydrate user data:', e);
        }
    },

    fetchBillets: async (userId?: string) => {
        // If userId provided, hydrate. otherwise just fetch billets.
        set({ isSyncingBillets: true });

        // Reset Pagination
        const limit = 20;
        const offset = 0;

        // Ensure storage has data (Mock Init)
        // In a real scenario, this step might be "Sync from API to DB"
        const billetCount = await storage.getBilletCount();
        if (billetCount === 0) {
            for (const b of MOCK_BILLETS) {
                await storage.saveBillet(b);
            }
        }

        const pagedBillets = await storage.getPagedBillets(limit, offset);

        // Convert array to record for store
        const billetRecord: Record<string, Billet> = {};
        const newStack: string[] = [];

        pagedBillets.forEach((billet) => {
            billetRecord[billet.id] = billet;
            newStack.push(billet.id);
        });

        // DO NOT reset decisions or applications here if they exist.
        // We only reset billets.
        set((state) => ({
            billets: billetRecord,
            billetStack: newStack,
            cursor: 0,
            currentOffset: 0,
            // PRESERVE DECISIONS / APPS
            // realDecisions: {}, 
            lastBilletSyncAt: new Date().toISOString(),
            isSyncingBillets: false,
        }));

        if (userId) {
            await get().hydrateUserData(userId);
        }
    },

    loadMore: async () => {
        const { currentOffset, billets, billetStack, isSyncingBillets } = get();
        if (isSyncingBillets) return;

        set({ isSyncingBillets: true });

        const limit = 20;
        const newOffset = currentOffset + limit;

        const nextBatch = await storage.getPagedBillets(limit, newOffset);

        if (nextBatch.length === 0) {
            set({ isSyncingBillets: false });
            return;
        }

        const newBilletRecord = { ...billets };
        const newStackIds: string[] = [];

        nextBatch.forEach((billet) => {
            // Avoid duplicates
            if (!newBilletRecord[billet.id]) {
                newBilletRecord[billet.id] = billet;
                newStackIds.push(billet.id);
            }
        });

        set({
            billets: newBilletRecord,
            billetStack: [...billetStack, ...newStackIds],
            currentOffset: newOffset,
            isSyncingBillets: false,
        });
    },

    swipe: async (billetId: string, direction: SwipeDirection, userId: string) => {
        const { cursor, realDecisions, sandboxDecisions, promoteToSlate, mode } = get();

        // 1. Determine Decision based on Direction
        let decision: SwipeDecision = 'nope';
        if (direction === 'right') decision = 'like';
        else if (direction === 'up') decision = 'super';
        else if (direction === 'left') decision = 'nope';

        // 2. Select Target Bin based on Mode
        if (mode === 'real') {
            let newDecisions = { ...realDecisions };

            // 3. Handle Side Effects
            if (direction === 'up') {
                const wasPromoted = await promoteToSlate(billetId, userId);
                if (!wasPromoted) {
                    // Fallback to Manifest as 'super' (Favorite)
                    newDecisions[billetId] = 'super';
                    set({
                        cursor: cursor + 1,
                        realDecisions: newDecisions
                    });
                } else {
                    // Promoted successfully
                    newDecisions[billetId] = 'super';
                    set({
                        cursor: cursor + 1,
                        realDecisions: newDecisions
                    });
                }
            } else {
                // Left or Right
                newDecisions[billetId] = decision;
                set({
                    cursor: cursor + 1,
                    realDecisions: newDecisions
                });
            }

            // Persist (Write-Behind)
            const finalDecision = newDecisions[billetId];
            if (finalDecision) {
                // Add to queue
                pendingSwipes.push({ userId, billetId, decision: finalDecision });

                // Check threshold
                if (pendingSwipes.length >= 5) {
                    persistDecisions();
                } else {
                    // Debounce
                    if (flushTimeout) clearTimeout(flushTimeout);
                    flushTimeout = setTimeout(persistDecisions, 2000);
                }
            }

        } else {
            // SANDBOX MODE: No network transactions, just local state
            set({
                cursor: cursor + 1,
                sandboxDecisions: {
                    ...sandboxDecisions,
                    [billetId]: decision
                }
            });
        }
    },

    setMode: (mode: DiscoveryMode) => set({ mode }),

    updateSandboxFilters: (filters: Partial<FilterState>) => {
        set((state) => ({
            sandboxFilters: { ...state.sandboxFilters, ...filters }
        }));
    },

    toggleShowProjected: () => {
        set((state) => ({ showProjected: !state.showProjected }));
    },

    undo: (userId: string) => {
        const { cursor, mode, billetStack, realDecisions, sandboxDecisions, applications, userApplicationIds } = get();
        if (cursor <= 0) return;

        const previousCursor = cursor - 1;
        const billetIdToRemove = billetStack[previousCursor];

        // Determine which map to clean up
        if (mode === 'real') {
            const newDecisions = { ...realDecisions };
            delete newDecisions[billetIdToRemove];

            // Find app ID in userApplicationIds that matches billetId
            // This ensures we only look at the user's active applications
            const appIdToRemove = userApplicationIds.find(id => {
                const app = applications[id];
                return app && app.billetId === billetIdToRemove && app.userId === userId && app.status === 'draft';
            });
            const appToRemove = appIdToRemove ? applications[appIdToRemove] : undefined;

            let updatedApplications = applications;
            let updatedUserIds = userApplicationIds;

            if (appToRemove) {
                updatedApplications = { ...applications };
                delete updatedApplications[appToRemove.id];
                updatedUserIds = userApplicationIds.filter(id => id !== appToRemove.id);
            }

            set({
                cursor: previousCursor,
                realDecisions: newDecisions,
                applications: updatedApplications,
                userApplicationIds: updatedUserIds
            });

            // Persist decision removal in both pending queue and durable storage.
            purgePendingSwipes(userId, billetIdToRemove);
            void storage.removeAssignmentDecision(userId, billetIdToRemove);

            if (appToRemove) {
                void storage.deleteApplication(appToRemove.id);
            }
        } else {
            const newDecisions = { ...sandboxDecisions };
            delete newDecisions[billetIdToRemove];
            set({
                cursor: previousCursor,
                sandboxDecisions: newDecisions
            });
        }
    },

    promoteToSlate: async (billetId: string, userId: string): Promise<boolean> => {
        const { applications, userApplicationIds, billets, mode } = get();

        // 0. Safety Guard: Sandbox Mode cannot promote to real slate
        if (mode === 'sandbox') {
            console.warn('[Store] Blocked promoteToSlate in Sandbox Mode');
            return false;
        }

        // 1. Block projected billets
        const billet = billets[billetId];
        if (billet && billet.advertisementStatus === 'projected') {
            console.warn('[Store] Blocked promoteToSlate for projected billet');
            return false;
        }

        // 2. Check Limits
        if (userApplicationIds.length >= MAX_SLATE_SIZE) {
            return false;
        }

        // 3. Check if already exists
        const existing = Object.values(applications).find(a => a.billetId === billetId);
        if (existing) return true;

        // 4. Create Application Object
        const newApp: Application = {
            id: generateUUID(),
            billetId,
            userId,
            status: 'draft',
            statusHistory: [{ status: 'draft', timestamp: new Date().toISOString() }],
            preferenceRank: userApplicationIds.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncTimestamp: new Date().toISOString(),
            syncStatus: 'pending_upload',
            localModifiedAt: new Date().toISOString(),
        };

        // 5. Update Store
        const newApplications = { ...applications, [newApp.id]: newApp };
        const newUserAppIds = [...userApplicationIds, newApp.id];

        set({
            applications: newApplications,
            userApplicationIds: newUserAppIds
        });

        // 6. Persist
        storage.saveApplication(newApp).catch(console.error);

        return true;
    },

    demoteToManifest: async (appId: string) => {
        // Demote = remove from Slate, but keep decision in 'realDecisions'
        // So we just remove the Application object.
        const { applications, userApplicationIds } = get();
        const app = applications[appId];
        if (!app) return;

        const updatedApplications = { ...applications };
        delete updatedApplications[appId];
        const updatedUserIds = userApplicationIds.filter(id => id !== appId);

        // Re-calculate ranks for remaining apps
        const remainingApps = updatedUserIds.map(id => updatedApplications[id]);
        remainingApps.forEach((a, idx) => {
            updatedApplications[a.id] = {
                ...a,
                preferenceRank: idx + 1,
                updatedAt: new Date().toISOString(),
                localModifiedAt: new Date().toISOString()
            };
        });

        set({
            applications: updatedApplications,
            userApplicationIds: updatedUserIds
        });

        // Persist: Save all remaining apps to update ranks
        if (remainingApps.length > 0) {
            await storage.saveApplications(remainingApps);
        }

        // Delete the demoted app from storage
        await storage.deleteApplication(appId);
    },

    recoverBillet: (billetId: string, userId: string) => {
        const { realDecisions } = get();
        const newDecisions = { ...realDecisions };
        newDecisions[billetId] = 'like';
        set({ realDecisions: newDecisions });
        storage.saveAssignmentDecision(userId, billetId, 'like');
    },

    withdrawApplication: async (appId: string, userId: string) => {
        const { applications, userApplicationIds, realDecisions } = get();
        const app = applications[appId];
        if (!app) return;
        const billetIdToRemove = app.billetId;

        // 1. Remove decision so the billet returns to Discovery (not Manifest).
        const updatedDecisions = { ...realDecisions };
        if (billetIdToRemove) {
            delete updatedDecisions[billetIdToRemove];
        }

        // 2. Remove Application
        const updatedApplications = { ...applications };
        delete updatedApplications[appId];
        const updatedUserIds = userApplicationIds.filter(id => id !== appId);

        // 3. Re-rank
        const remainingApps = updatedUserIds.map(id => updatedApplications[id]);
        remainingApps.forEach((a, idx) => {
            updatedApplications[a.id] = {
                ...a,
                preferenceRank: idx + 1,
                updatedAt: new Date().toISOString(),
                localModifiedAt: new Date().toISOString()
            };
        });

        set({
            realDecisions: updatedDecisions,
            applications: updatedApplications,
            userApplicationIds: updatedUserIds
        });

        // Remove any queued writes for this decision and then delete durable state.
        if (billetIdToRemove) {
            purgePendingSwipes(userId, billetIdToRemove);
            await storage.removeAssignmentDecision(userId, billetIdToRemove);
        }

        // Delete the withdrawn application
        await storage.deleteApplication(appId);

        // Persist updated apps
        if (remainingApps.length > 0) {
            await storage.saveApplications(remainingApps);
        }
    },

    moveApplication: async (fromIndex: number, direction: 'up' | 'down', userId: string) => {
        const { userApplicationIds, reorderApplications } = get();
        if (direction === 'up' && fromIndex === 0) return;
        if (direction === 'down' && fromIndex === userApplicationIds.length - 1) return;

        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        const newOrder = [...userApplicationIds];
        // Swap
        [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];

        await reorderApplications(newOrder, userId);
    },

    reorderApplications: async (orderedAppIds: string[], userId: string) => {
        const { applications } = get();
        const updatedApplications = { ...applications };
        const appsToSave: Application[] = [];

        orderedAppIds.forEach((id, index) => {
            const currentRank = index + 1;
            const app = updatedApplications[id];

            if (app) {
                // Optimize: Only update if rank changed
                if (app.preferenceRank !== currentRank) {
                    const updatedApp = {
                        ...app,
                        preferenceRank: currentRank,
                        updatedAt: new Date().toISOString(),
                        localModifiedAt: new Date().toISOString()
                    };
                    updatedApplications[id] = updatedApp;
                    appsToSave.push(updatedApp);
                }
            }
        });

        set({
            applications: updatedApplications,
            userApplicationIds: orderedAppIds // Ensure sorting matches
        });

        // Persist only changed apps
        if (appsToSave.length > 0) {
            await storage.saveApplications(appsToSave);
        }
    },

    submitSlate: async () => {
        set({ isSyncingApplications: true });
        // Simulating network call
        await new Promise(resolve => setTimeout(resolve, 800));

        const { applications } = get();
        const updatedApps = { ...applications };
        const appsToSave: Application[] = [];

        // Mark all draft as submitted
        Object.keys(updatedApps).forEach(key => {
            const app = updatedApps[key];
            if (app.status === 'draft') {
                const updatedApp = {
                    ...app,
                    status: 'submitted' as const,
                    submittedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastSyncTimestamp: new Date().toISOString(),
                    syncStatus: 'synced' as const,
                };
                updatedApps[key] = updatedApp;
                appsToSave.push(updatedApp);
            }
        });

        try {
            await storage.saveApplications(appsToSave);
        } catch (e) {
            console.error('[Store] Failed to persist submitted slate', e);
            const appIds = appsToSave.map(a => a.id);
            syncQueue.enqueue('assignment:submitSlate', { appIds }).catch(console.error);
        } finally {
            set({
                applications: updatedApps,
                isSyncingApplications: false
            });
        }
    },

    getManifestItems: (filter: 'candidates' | 'favorites' | 'archived') => {
        return selectManifestItems(get(), filter);
    },

    getProjectedBillets: () => {
        const { billets } = get();
        return Object.values(billets).filter(b => b.advertisementStatus === 'projected');
    },

    resetStore: () => set(INITIAL_STATE),
}));
