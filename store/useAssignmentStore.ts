import * as api from '@/services/api/mockTransactionService';
import * as storage from '@/services/storage';
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

interface AssignmentActions {
    /**
     * Fetch billets from "API" (Mock) and populate store.
     */
    fetchBillets: () => Promise<void>;

    /**
     * Execute Buy-It-Now transaction with optimistic UI updates.
     */
    buyItNow: (billetId: string, userId: string) => Promise<void>;

    /**
     * Reset store to initial state (useful for logout/testing).
     */
    resetStore: () => void;
}

export type AssignmentStore = MyAssignmentState & AssignmentActions;

const INITIAL_STATE: MyAssignmentState = {
    billets: {},
    applications: {},
    userApplicationIds: [],
    lastBilletSyncAt: null,
    isSyncingBillets: false,
    isSyncingApplications: false,
};

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_BILLETS: Billet[] = [
    {
        id: 'b1-uss-ford',
        title: 'OPERATIONS OFFICER',
        uic: '21234',
        location: 'NORFOLK, VA',
        payGrade: 'O-4',
        designator: '1110',
        dutyType: 'SEA',
        reportNotLaterThan: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // ~3 months out
        billetDescription: 'Primary OPSO for USS GERALD R FORD. Top secret clearance required.',
        compass: {
            matchScore: 98,
            contextualNarrative: 'Perfect fit for your recent DH tour and sub-specialty.',
            isBuyItNowEligible: true,
            lockStatus: 'open',
        },
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b2-uni-washington',
        title: 'NROTC INSTRUCTOR',
        uic: '66789',
        location: 'SEATTLE, WA',
        payGrade: 'O-3',
        designator: '1110',
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'Navigation instructor at University of Washington NROTC unit.',
        compass: {
            matchScore: 85,
            contextualNarrative: 'Good shore duty opportunity for graduate education.',
            isBuyItNowEligible: true,
            lockStatus: 'open',
        },
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    },
    {
        id: 'b3-pentagon',
        title: 'JUNIOR STAFF OFFICER',
        uic: '00011',
        location: 'ARLINGTON, VA',
        payGrade: 'O-3',
        designator: '1110',
        dutyType: 'SHORE',
        reportNotLaterThan: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        billetDescription: 'OPNAV N3/N5 Staff. High visibility role.',
        compass: {
            matchScore: 92,
            contextualNarrative: 'Strong career progression role.',
            isBuyItNowEligible: false, // Not BIN eligible
            lockStatus: 'open',
        },
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
        MOCK_BILLETS.forEach((billet) => {
            billetRecord[billet.id] = billet;
        });

        set({
            billets: billetRecord,
            lastBilletSyncAt: new Date().toISOString(),
            isSyncingBillets: false,
        });
    },

    buyItNow: async (billetId: string, userId: string) => {
        const { billets } = get();
        const targetBillet = billets[billetId];

        if (!targetBillet) {
            console.error('Billet not found for BIN transaction');
            return;
        }

        if (!targetBillet.compass.isBuyItNowEligible) {
            console.error('Billet is not eligible for Buy-It-Now');
            return;
        }

        // -------------------------------------------------------------------------
        // STEP 1: OPTIMISTIC UPDATE
        // -------------------------------------------------------------------------
        const optimisticAppId = generateUUID();
        const now = new Date().toISOString();

        const newApplication: Application = {
            id: optimisticAppId,
            billetId,
            userId,
            status: 'optimistically_locked',
            statusHistory: [
                {
                    status: 'optimistically_locked',
                    timestamp: now,
                    reason: 'User initiated Buy-It-Now',
                },
            ],
            lockRequestedAt: now,
            createdAt: now,
            updatedAt: now,
            lastSyncTimestamp: now,
            syncStatus: 'pending_upload',
        };

        // Update Store: Add Application AND Update Billet Lock Status
        set((state) => ({
            applications: {
                ...state.applications,
                [optimisticAppId]: newApplication,
            },
            userApplicationIds: [...state.userApplicationIds, optimisticAppId],
            billets: {
                ...state.billets,
                [billetId]: {
                    ...state.billets[billetId],
                    compass: {
                        ...state.billets[billetId].compass,
                        lockStatus: 'locked_by_user',
                        lockedByUserId: userId,
                        lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min optimistic lock
                    },
                },
            },
            isSyncingApplications: true,
        }));

        try {
            // -----------------------------------------------------------------------
            // STEP 2: PERSISTENCE (Offline Safety)
            // -----------------------------------------------------------------------
            await storage.saveApplication(newApplication);

            // -----------------------------------------------------------------------
            // STEP 3: NETWORK TRANSACTION
            // -----------------------------------------------------------------------
            const result = await api.attemptBinLock(billetId, userId);

            // -----------------------------------------------------------------------
            // STEP 4: RECONCILIATION
            // -----------------------------------------------------------------------
            const completionTime = new Date().toISOString();

            if (result.success) {
                // --- SUCCESS ---
                // 1. Update Application status to confirmed
                // 2. Set server confirmed timestamps and token

                const confirmedApp: Application = {
                    ...newApplication,
                    status: 'confirmed',
                    statusHistory: [
                        ...newApplication.statusHistory,
                        {
                            status: 'confirmed',
                            timestamp: completionTime,
                            reason: 'Server confirmed lock acquisition',
                        },
                    ],
                    optimisticLockToken: result.data.lockToken,
                    lockExpiresAt: result.data.expiresAt,
                    serverConfirmedAt: completionTime,
                    updatedAt: completionTime,
                    lastSyncTimestamp: completionTime,
                    syncStatus: 'synced',
                };

                // Update Store
                set((state) => ({
                    applications: {
                        ...state.applications,
                        [optimisticAppId]: confirmedApp,
                    },
                    billets: {
                        ...state.billets,
                        [billetId]: {
                            ...state.billets[billetId],
                            compass: {
                                ...state.billets[billetId].compass,
                                lockStatus: 'locked_by_user', // Remains locked by user
                                lockExpiresAt: result.data.expiresAt, // Update with server expiry
                            },
                        },
                    },
                    isSyncingApplications: false,
                }));

                // Update Persistence
                await storage.saveApplication(confirmedApp);

            } else {
                // --- FAILURE (RACE CONDITION) ---
                // 1. Update Application status to rejected_race_condition
                // 2. Revert Billet lock status locally

                const rejectedApp: Application = {
                    ...newApplication,
                    status: 'rejected_race_condition',
                    statusHistory: [
                        ...newApplication.statusHistory,
                        {
                            status: 'rejected_race_condition',
                            timestamp: completionTime,
                            reason: result.error.message,
                        },
                    ],
                    serverRejectionReason: result.error.message,
                    updatedAt: completionTime,
                    lastSyncTimestamp: completionTime,
                    syncStatus: 'synced', // It is "synced" in the sense that the server rejected it
                };

                // Update Store
                set((state) => ({
                    applications: {
                        ...state.applications,
                        [optimisticAppId]: rejectedApp,
                    },
                    billets: {
                        ...state.billets,
                        [billetId]: {
                            ...state.billets[billetId],
                            compass: {
                                ...state.billets[billetId].compass,
                                lockStatus: 'locked_by_other', // Someone else got it!
                                // detailed info about who locked it could come from result.error.details if we wanted
                                // for now, just marking it as locked by other
                            },
                        },
                    },
                    isSyncingApplications: false,
                }));

                // Update Persistence
                await storage.saveApplication(rejectedApp);
            }

        } catch (error) {
            console.error('buyItNow transaction error:', error);
            // In a real app, we'd handle network errors here (set syncStatus=error, retry later)
            // For this sprint/context, leaving as optimistic state or could set to error state.
            // Keeping it simple as per prompt instructions, but resetting loading flag.
            set({ isSyncingApplications: false });
        }
    },

    resetStore: () => set(INITIAL_STATE),
}));
