import {
    Application,
    Billet,
    MyAssignmentState
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
export type SwipeDecision = 'nope' | 'like' | 'super';
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
     */
    fetchBillets: () => Promise<void>;

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
    undo: () => void;

    /**
     * Promote a billet from Bench/Discovery to the Slate (Draft Application).
     * Returns true if successful, false if slate is full.
     */
    promoteToSlate: (billetId: string, userId: string) => boolean;

    /**
     * Demote an application back to the Manifest (removes Draft).
     * Keeps the 'interest' in realDecisions so it returns to the Manifest list.
     */
    demoteToManifest: (appId: string) => void;

    /**
     * Recover a 'nope' (archived) billet back to the Manifest ('like').
     */
    recoverBillet: (billetId: string) => void;

    /**
     * Remove (if draft) or Withdraw (if submitted) an application.
     * Triggers re-ranking of remaining applications.
     */
    withdrawApplication: (appId: string) => void;

    /**
     * Reorder application preference ranks based on the provided ID order.
     */
    reorderApplications: (orderedAppIds: string[]) => void;

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
    realDecisions: {},
    sandboxDecisions: {},
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
// STORE IMPLEMENTATION
// =============================================================================

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
    ...INITIAL_STATE,

    fetchBillets: async () => {
        set({ isSyncingBillets: true });

        // Convert array to record for store
        const billetRecord: Record<string, Billet> = {};
        const newStack: string[] = []; // Create stack from fetched billets

        MOCK_BILLETS.forEach((billet) => {
            billetRecord[billet.id] = billet;
            newStack.push(billet.id);
        });

        set({
            billets: billetRecord,
            billetStack: newStack, // Initialize stack
            cursor: 0,             // Reset cursor on full refresh
            realDecisions: {},       // Clear decisions on full refresh
            sandboxDecisions: {},
            lastBilletSyncAt: new Date().toISOString(),
            isSyncingBillets: false,
        });
    },

    setMode: (mode: DiscoveryMode) => {
        set({ mode });
    },

    updateSandboxFilters: (filters: Partial<FilterState>) => {
        set((state) => ({
            sandboxFilters: {
                ...state.sandboxFilters,
                ...filters
            }
        }));
    },

    toggleShowProjected: () => {
        set((state) => ({ showProjected: !state.showProjected }));
    },

    undo: () => {
        const { cursor, mode, billetStack, realDecisions, sandboxDecisions } = get();
        if (cursor <= 0) return;

        const previousCursor = cursor - 1;
        const billetIdToRemove = billetStack[previousCursor];

        // Determine which map to clean up
        if (mode === 'real') {
            const newDecisions = { ...realDecisions };
            delete newDecisions[billetIdToRemove];
            set({
                cursor: previousCursor,
                realDecisions: newDecisions
            });
        } else {
            const newDecisions = { ...sandboxDecisions };
            delete newDecisions[billetIdToRemove];
            set({
                cursor: previousCursor,
                sandboxDecisions: newDecisions
            });
        }
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

            // 3. Handle Side Effects
            // Direction 'right' (Interested) -> Adds to realDecisions (Manifest).
            // Direction 'up' (Target) -> Try promoteToSlate. If full, fallback to Manifest (super).
            // Direction 'left' -> Archive (nope).

            if (direction === 'up') {
                const wasPromoted = promoteToSlate(billetId, userId);
                if (!wasPromoted) {
                    // Fallback to Manifest as 'super' (Favorite)
                    set({
                        cursor: cursor + 1,
                        realDecisions: {
                            ...realDecisions,
                            [billetId]: 'super'
                        }
                    });
                } else {
                    // Promoted successfully, so we mark it as decided (super) BUT it's also an app.
                    // Ideally we still record the decision for history.
                    set({
                        cursor: cursor + 1,
                        realDecisions: {
                            ...realDecisions,
                            [billetId]: 'super'
                        }
                    });
                }
            } else {
                // Left or Right
                set({
                    cursor: cursor + 1,
                    realDecisions: {
                        ...realDecisions,
                        [billetId]: decision
                    }
                });
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

    // --- CYCLE ACTIONS ---

    promoteToSlate: (billetId: string, userId: string): boolean => {
        const { applications, userApplicationIds } = get();

        // 1. Check Constraint: Max 7 Active Applications
        const activeStatuses = ['draft', 'optimistically_locked', 'submitted', 'confirmed'];
        const activeApps = Object.values(applications).filter(app =>
            activeStatuses.includes(app.status)
        );

        if (activeApps.length >= 7) {
            console.warn("Slate is full. You can only have 7 active applications.");
            return false;
        }

        // 2. Determine Preference Rank (Next Available Slot)
        const nextRank = activeApps.length + 1;

        // 3. Create Application Record
        const appId = generateUUID();
        const now = new Date().toISOString();

        const newApp: Application = {
            id: appId,
            billetId,
            userId,
            status: 'draft',
            statusHistory: [{
                status: 'draft',
                timestamp: now,
                reason: 'User promoted to slate'
            }],
            preferenceRank: nextRank,
            createdAt: now,
            updatedAt: now,
            lastSyncTimestamp: now,
            syncStatus: 'pending_upload',
            localModifiedAt: now
        };

        // 4. Update State
        set(state => ({
            applications: {
                ...state.applications,
                [appId]: newApp
            },
            userApplicationIds: [...state.userApplicationIds, appId]
        }));

        return true;
    },

    demoteToManifest: (appId: string) => {
        const { applications, userApplicationIds } = get();
        const targetApp = applications[appId];

        if (!targetApp) return;

        // Only allowed for drafts basically, but if we assume demote = remove application
        // We just remove it. The 'decision' in realDecisions remains, so it "falls back" to bench/manifest.

        const updatedApplications = { ...applications };
        delete updatedApplications[appId];
        const updatedUserIds = userApplicationIds.filter(id => id !== appId);

        // Re-Ranking Logic (Close the Gap)
        const activeStatuses = ['draft', 'submitted', 'confirmed'];
        const remainingApps = Object.values(updatedApplications)
            .filter(app => activeStatuses.includes(app.status))
            .sort((a, b) => (a.preferenceRank || 99) - (b.preferenceRank || 99));

        remainingApps.forEach((app, index) => {
            updatedApplications[app.id] = {
                ...app,
                preferenceRank: index + 1,
                updatedAt: new Date().toISOString()
            };
        });

        set({
            applications: updatedApplications,
            userApplicationIds: updatedUserIds
        });
    },

    recoverBillet: (billetId: string) => {
        const { realDecisions } = get();
        const newDecisions = { ...realDecisions };
        newDecisions[billetId] = 'like';
        set({ realDecisions: newDecisions });
    },

    withdrawApplication: (appId: string) => {
        const { applications, userApplicationIds } = get();
        const targetApp = applications[appId];

        if (!targetApp) return;

        let updatedApplications = { ...applications };
        let updatedUserIds = [...userApplicationIds];

        // 1. Handle Status Change
        if (targetApp.status === 'draft') {
            // Hard delete for drafts
            delete updatedApplications[appId];
            updatedUserIds = updatedUserIds.filter(id => id !== appId);
        } else {
            // Soft delete (withdraw) for submitted/locked
            updatedApplications[appId] = {
                ...targetApp,
                status: 'withdrawn',
                statusHistory: [
                    ...targetApp.statusHistory,
                    {
                        status: 'withdrawn',
                        timestamp: new Date().toISOString(),
                        reason: 'User withdrew application'
                    }
                ],
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending_upload'
            };
        }

        // 2. Re-Ranking Logic (Close the Gap)
        // Get remaining active apps to re-rank
        const activeStatuses = ['draft', 'submitted', 'confirmed'];
        const remainingApps = Object.values(updatedApplications)
            .filter(app => activeStatuses.includes(app.status) && app.id !== appId) // Exclude the withdrawn one if we just soft-deleted it
            .sort((a, b) => (a.preferenceRank || 99) - (b.preferenceRank || 99));

        // Re-assign ranks 1..N
        remainingApps.forEach((app, index) => {
            updatedApplications[app.id] = {
                ...app,
                preferenceRank: index + 1,
                updatedAt: new Date().toISOString() // Touch update time
            };
        });

        set({
            applications: updatedApplications,
            userApplicationIds: updatedUserIds
        });
    },

    reorderApplications: (orderedAppIds: string[]) => {
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

        set({ applications: updatedApplications });
    },

    submitSlate: async () => {
        const { applications } = get();

        // 1. Find Drafts
        const draftApps = Object.values(applications).filter(app => app.status === 'draft');
        if (draftApps.length === 0) return;

        const now = new Date().toISOString();
        const updatedApplications = { ...applications };

        // 2. Update Statuses
        draftApps.forEach(app => {
            updatedApplications[app.id] = {
                ...app,
                status: 'submitted',
                submittedAt: now,
                statusHistory: [
                    ...app.statusHistory,
                    {
                        status: 'submitted',
                        timestamp: now,
                        reason: 'Slate submission'
                    }
                ],
                updatedAt: now,
                syncStatus: 'pending_upload'
            };
        });

        // 3. Mock API Call
        console.log(`[Mock API] Submitting Slate: ${draftApps.length} applications`);

        // 4. Update Store
        set({ applications: updatedApplications });
    },

    getSmartBench: (userId: string) => {
        const { billets, realDecisions, applications } = get();
        const activeAppBilletIds = new Set(
            Object.values(applications)
                .filter(app => !['withdrawn', 'declined'].includes(app.status))
                .map(app => app.billetId)
        );

        const results: SmartBenchItem[] = [];

        // Logic: Return all billets in realDecisions that are NOT currently in the applications map (i.e., Liked but not Drafted).
        Object.entries(realDecisions).forEach(([billetId, decision]) => {
            if ((decision === 'like' || decision === 'super') && !activeAppBilletIds.has(billetId)) {
                const billet = billets[billetId];
                if (billet) {
                    results.push({ billet, type: 'manifest' });
                }
            }
        });

        // Return sorted by match score
        return results.sort((a, b) => b.billet.compass.matchScore - a.billet.compass.matchScore);
    },

    getProjectedBillets: () => {
        const { billets } = get();
        return Object.values(billets).filter(b => b.advertisementStatus === 'projected');
    },

    getManifestItems: (filter: 'candidates' | 'favorites' | 'archived') => {
        const { realDecisions, billets } = get();
        const results: SmartBenchItem[] = [];

        Object.entries(realDecisions).forEach(([id, decision]) => {
            const billet = billets[id];
            if (!billet) return;

            let matchesFilter = false;
            if (filter === 'candidates' && (decision === 'like' || decision === 'super')) matchesFilter = true;
            else if (filter === 'favorites' && decision === 'super') matchesFilter = true;
            else if (filter === 'archived' && decision === 'nope') matchesFilter = true;

            if (matchesFilter) {
                results.push({ billet, type: 'manifest' });
            }
        });

        return results.sort((a, b) => b.billet.compass.matchScore - a.billet.compass.matchScore);
    },

    resetStore: () => set(INITIAL_STATE),
}));
