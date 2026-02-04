import { storage } from '@/services/storage';
import {
    Application,
    Billet,
    MyAssignmentState,
    SwipeDecision
} from '@/types/schema';
import { create } from 'zustand';

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
     * Reorder application preference ranks based on the provided ID order.
     */
    reorderApplications: (orderedAppIds: string[], userId: string) => void;

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
let flushTimeout: NodeJS.Timeout | number | null = null;

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
// MOCK DATA (Persona: IT1 Samuel P. Wilson)
// =============================================================================

const MOCK_BILLETS: Billet[] = [
    {
        id: 'b1-uss-halsey',
        title: 'NETWORK SYSTEM ADMIN',
        uic: '21345',
        location: 'SAN DIEGO, CA',
        payGrade: 'E-6',
        nec: 'H08A', // CANES System Admin
        dutyType: 'SEA',
        reportNotLaterThan: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // ~3 months out
        billetDescription: 'Lead SysAdmin for USS HALSEY (DDG-97). Security+ required. CANES migration experience preferred.',
        compass: {
            matchScore: 98,
            contextualNarrative: 'This billet is an exceptional match for your profile. Your recent shore tour combined with your NEC H08A certification positions you perfectly to lead the CANES migration team. Completing this sea duty tour will be a strong discriminator for Chief selection next cycle.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b2-nctams-pac',
        title: 'COMM CENTER SUPERVISOR',
        uic: '66890',
        location: 'WAHIAWA, HI',
        payGrade: 'E-6',
        nec: 'H04A', // Transmission Systems Tech
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Watch Supervisor at NCTAMS PAC. Shift work involved.',
        compass: {
            matchScore: 89,
            contextualNarrative: 'A solid leadership opportunity in a high-vis shore command. While slightly outside your core sys-admin track, the Watch Supervisor qualification offered here is highly valued. This tour offers stability for your family while broadening your operational comms experience.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b3-devgru',
        title: 'EX TACTICAL COMMS',
        uic: '00012',
        location: 'VIRGINIA BEACH, VA',
        payGrade: 'E-6',
        nec: 'H09A', // Expeditionary Force
        dutyType: 'SEA',
        reportNotLaterThan: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Expeditionary communications support. Screening required.',
        compass: {
            matchScore: 94,
            contextualNarrative: 'An elite, high-tempo assignment reserved for top performers. Your consistent "Early Promote" evaluations make you a prime candidate. This role requires rigorous screening but offers unparalleled training in tactical comms and direct support to special operations forces.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    // --- DUMMY DATA FOR TESTING ---
    {
        id: 'b4-uss-gerald-r-ford',
        title: 'SECURITY MANAGER',
        uic: '23456',
        location: 'NORFOLK, VA',
        payGrade: 'E-6',
        nec: '741A', // Information Systems Technician
        dutyType: 'SEA',
        reportNotLaterThan: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Manage security protocols and clearances for crew.',
        compass: {
            matchScore: 85,
            contextualNarrative: 'Leverage your attention to detail in this critical program management role. As the Security Manager for a CVN, you will oversee thousands of clearances, giving you direct access to the Command Triad. Ideally suited for someone looking to demonstrate administrative excellence at scale.',
        },
        advertisementStatus: 'projected',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b5-nioc-hawaii',
        title: 'CYBER ANALYST',
        uic: '34567',
        location: 'PEARL HARBOR, HI',
        payGrade: 'E-6',
        nec: 'H10A', // Cyber Defense Analyst
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Analyze network traffic for threats.',
        compass: {
            matchScore: 92,
            contextualNarrative: 'Your background in network defense makes you an immediate asset here. This role focuses on active threat hunting and incident response. It is a technical heavy-hitter tour that will qualify you for high-level civilian sector certifications like CISSP and CEH.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b6-uss-ronald-reagan',
        title: 'NETWORK ADMIN',
        uic: '45678',
        location: 'YOKOSUKA, JAPAN',
        payGrade: 'E-6',
        nec: 'H08A',
        dutyType: 'SEA',
        reportNotLaterThan: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Maintain shipboard networks during deployment.',
        compass: {
            matchScore: 88,
            contextualNarrative: 'Forward Deployed Naval Forces (FDNF) experience is a career accelerator. This sea tour in Japan offers high operational tempo and the chance to lead a large division. While demanding, the promotion rates for sailors completing this tour are significantly above average.',
        },
        advertisementStatus: 'projected',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b7-ncts-san-diego',
        title: 'SATCOM OPERATOR',
        uic: '56789',
        location: 'SAN DIEGO, CA',
        payGrade: 'E-5',
        nec: 'V01A', // SATCOM
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Operate satellite communications equipment.',
        compass: {
            matchScore: 75,
            contextualNarrative: 'A functional shore duty that keeps you in San Diego. While the technical scope is slightly below your extensive experience, it offers a predictable schedule allowing for college education or off-duty certification work. Good for work-life balance.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b8-uss-constitution',
        title: 'PUBLIC AFFAIRS',
        uic: '67890',
        location: 'BOSTON, MA',
        payGrade: 'E-6',
        nec: 'A01A', // Public Affairs
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Historic ship duty, public interface required.',
        compass: {
            matchScore: 60,
            contextualNarrative: 'A rare "Special Duty" assignment aboard "Old Ironsides." This is a pivot away from your technical track but offers a unique, once-in-a-lifetime experience. Excellent for public speaking and heritage engagement, though it may pause your technical NEC progression.',
        },
        advertisementStatus: 'closed',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b9-pers-40',
        title: 'DETAILER ASSISTANT',
        uic: '78901',
        location: 'MILLINGTON, TN',
        payGrade: 'E-6',
        nec: '803R', // Recruiter/Detailer
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Assist in detailer assignments and records.',
        compass: {
            matchScore: 80,
            contextualNarrative: 'Gain "inside baseball" knowledge of the detailing process. Working directly at NPC gives you insight into how slates are built and careers are managed. Networking opportunities here are immense, though the location is less desirable than fleet concentration areas.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b10-uss-zumwalt',
        title: 'WEAPONS SYS TECH',
        uic: '89012',
        location: 'SAN DIEGO, CA',
        payGrade: 'E-6',
        nec: 'V02A',
        dutyType: 'SEA',
        reportNotLaterThan: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Advanced weapons system maintenance.',
        compass: {
            matchScore: 82,
            contextualNarrative: 'Work on the cutting edge of naval technology aboard the DDG-1000 class. This platform requires technicians who can adapt to new, often experimental systems. Your troubleshooting history suggests you would thrive in this dynamic engineering environment.',
        },
        advertisementStatus: 'projected',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b11-navwar',
        title: 'PROJECT MANAGER',
        uic: '90123',
        location: 'SAN DIEGO, CA',
        payGrade: 'E-7', // Higher rank for variety
        nec: 'H12A',
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Manage NAVWAR IT projects.',
        compass: {
            matchScore: 70,
            contextualNarrative: 'This is a stretch assignment typically slated for an E-7, but your package is competitive for a waiver. It involves high-level acquisition program management. Success here would be a definitive "sustained superior performance" indicator for your Chief package.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b12-uss-america',
        title: 'RADIO DIV SUPER',
        uic: '01234',
        location: 'SASEBO, JAPAN',
        payGrade: 'E-6',
        nec: 'H04A',
        dutyType: 'SEA',
        reportNotLaterThan: new Date(Date.now() + 260 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Leading Radio division on LHA-6.',
        compass: {
            matchScore: 90,
            contextualNarrative: 'An urgent fill for a critical leadership gap. You would be stepping immediately into a Division Leading Petty Officer (DLPO) role on a forward-deployed big deck amphib. The responsibility is massive, but the rewards and visibility are equally significant.',
        },
        advertisementStatus: 'projected',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b13-pentagon',
        title: 'JOINT STAFF SUPPORT',
        uic: '10101',
        location: 'ARLINGTON, VA',
        payGrade: 'E-6',
        nec: 'H08A',
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'IT support for Joint Staff J6.',
        compass: {
            matchScore: 95,
            contextualNarrative: 'The ultimate prestige shore duty. You will be supporting flag officers and senior civilians in the Joint Staff environment. Requires impeccable bearing, top-tier technical skills, and a TS/SCI clearance. This is a "purple" assignment that looks fantastic on a resume.',
        },
        advertisementStatus: 'confirmed_open',
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
];

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
        const existing = await storage.getAllBillets();
        if (existing.length === 0) {
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
                    await persistDecisions();
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

            // FIX: Remove orphaned application if last action was a 'promote'
            const appToRemove = Object.values(applications).find(
                app => app.billetId === billetIdToRemove && app.status === 'draft'
            );
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

            // Persist
            // Check if it's in the pending queue
            const pendingIndex = pendingSwipes.findIndex(p => p.billetId === billetIdToRemove && p.userId === userId);
            if (pendingIndex !== -1) {
                // It's pending, just remove from queue so it never gets saved
                pendingSwipes.splice(pendingIndex, 1);
                // If queue is empty, maybe clear timeout?
                if (pendingSwipes.length === 0 && flushTimeout) {
                    clearTimeout(flushTimeout);
                    flushTimeout = null;
                }
            } else {
                // It's already in DB, remove it
                storage.removeAssignmentDecision(userId, billetIdToRemove);
            }
            // Note: Orphaned application deletion from storage not fully implemented yet 
            // as per storage interface limitations.
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

        // 1. Check Limits (Max 5)
        if (userApplicationIds.length >= 5) {
            return false;
        }

        // 2. Check if already exists
        const existing = Object.values(applications).find(a => a.billetId === billetId);
        if (existing) return true;

        // 3. Create Application Object
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

        // 4. Update Store
        const newApplications = { ...applications, [newApp.id]: newApp };
        const newUserAppIds = [...userApplicationIds, newApp.id];

        set({
            applications: newApplications,
            userApplicationIds: newUserAppIds
        });

        // 5. Persist
        await storage.saveApplication(newApp);

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
        for (const app of remainingApps) {
            await storage.saveApplication(updatedApplications[app.id]);
        }
        // Note: We cannot "delete" the demoted app from storage yet via interface. 
        // Ideally we should have storage.deleteApplication(appId).
    },

    recoverBillet: (billetId: string, userId: string) => {
        const { realDecisions } = get();
        const newDecisions = { ...realDecisions };
        newDecisions[billetId] = 'like';
        set({ realDecisions: newDecisions });
        storage.saveAssignmentDecision(userId, billetId, 'like');
    },

    withdrawApplication: async (appId: string, userId: string) => {
        // Remove from applications, remove from realDecisions (so it goes back to deck??)
        // Or "Withdraw" might mean move to 'nope'? 
        // Usually "Withdraw" means you are no longer interested in applying.
        // Let's set decision to 'nope'.

        const { applications, userApplicationIds, realDecisions } = get();
        const app = applications[appId];
        if (!app) return;

        // 1. Update Decisions to 'nope'
        const updatedDecisions = { ...realDecisions };
        if (app.billetId) {
            updatedDecisions[app.billetId] = 'nope';
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

        // Persist
        if (app.billetId) {
            await storage.saveAssignmentDecision(userId, app.billetId, 'nope');
        }
        // Persist updated apps
        for (const app of remainingApps) {
            await storage.saveApplication(updatedApplications[app.id]);
        }
    },

    reorderApplications: (orderedAppIds: string[], userId: string) => {
        const { applications } = get();
        const updatedApplications = { ...applications };

        orderedAppIds.forEach((id, index) => {
            if (updatedApplications[id]) {
                updatedApplications[id] = {
                    ...updatedApplications[id],
                    preferenceRank: index + 1,
                    updatedAt: new Date().toISOString(),
                    localModifiedAt: new Date().toISOString()
                };
            }
        });

        set({
            applications: updatedApplications,
            userApplicationIds: orderedAppIds // Ensure sorting matches
        });

        // Persist
        orderedAppIds.forEach(id => {
            if (updatedApplications[id]) {
                storage.saveApplication(updatedApplications[id]);
            }
        });
    },

    submitSlate: async () => {
        set({ isSyncingApplications: true });
        // Simulating network call
        await new Promise(resolve => setTimeout(resolve, 800));

        const { applications } = get();
        const updatedApps = { ...applications };

        // Mark all draft as submitted
        Object.keys(updatedApps).forEach(key => {
            const app = updatedApps[key];
            if (app.status === 'draft') {
                updatedApps[key] = {
                    ...app,
                    status: 'submitted',
                    submittedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastSyncTimestamp: new Date().toISOString(),
                    syncStatus: 'synced',
                };
                // In real app, persist these changes
                storage.saveApplication(updatedApps[key]);
            }
        });

        set({
            applications: updatedApps,
            isSyncingApplications: false
        });
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
