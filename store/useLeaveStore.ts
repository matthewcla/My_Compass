import { services } from '@/services/api/serviceRegistry';
import { storage } from '@/services/storage';
import { syncQueue } from '@/services/syncQueue';
import { useDemoStore } from '@/store/useDemoStore';
import { MOCK_LEAVE_DEFAULTS } from '@/constants/MockLeaveDefaults';
import { CreateLeaveRequestPayload } from '@/types/api';
import {
    LeaveBalance,
    LeaveRequest,
    LeaveRequestDefaults,
    MyAdminState,
    Step1IntentSchema,
    Step2ContactSchema,
    Step3CommandSchema
} from '@/types/schema';
import { create } from 'zustand';

// =============================================================================
// UTILITIES
// =============================================================================

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

interface LeaveActions {
    /**
     * Fetch leave data (balance) from API and populate store.
     */
    fetchLeaveData: (userId: string) => Promise<void>;

    /**
     * Fetch user defaults for leave requests.
     */
    fetchUserDefaults: (userId: string) => Promise<void>;

    /**
     * Fetch all local/persisted requests for user (Hydration).
     */
    fetchUserRequests: (userId: string) => Promise<void>;

    /**
     * Generate a quick draft based on smart defaults.
     */
    generateQuickDraft: (type: 'weekend' | 'standard', userId: string) => LeaveRequest;

    /**
     * Submit a leave request with optimistic updates.
     */
    submitRequest: (payload: CreateLeaveRequestPayload, userId: string) => Promise<void>;

    /**
     * Update a local draft and persist to storage.
     * Invalidates preReviewChecks on any edit.
     */
    updateDraft: (draftId: string, patch: Partial<LeaveRequest>) => Promise<void>;
    updateDraftField: (draftId: string, field: keyof LeaveRequest, value: any) => Promise<void>;

    /**
     * Create a new draft in the store and persistence.
     */
    createDraft: (draft: LeaveRequest) => Promise<void>;

    /**
     * Validate a specific wizard step for a draft.
     */
    validateStep: (draftId: string, step: 1 | 2 | 3) => { success: boolean; errors?: any };

    /**
     * Discard a draft (remove locally and from storage).
     */
    discardDraft: (draftId: string) => Promise<void>;

    /**
     * Cancel a submitted request.
     */
    cancelRequest: (requestId: string) => Promise<void>;

    /**
     * Reset store.
     */
    resetStore: () => void;
}

export type LeaveStore = MyAdminState & LeaveActions;

const INITIAL_STATE: MyAdminState = {
    leaveBalance: null,
    leaveRequests: {},
    userLeaveRequestIds: [],
    userDefaults: null,
    lastBalanceSyncAt: null,
    isSyncingBalance: false,
    isSyncingRequests: false,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useLeaveStore = create<LeaveStore>((set, get) => ({
    ...INITIAL_STATE,

    fetchLeaveData: async (userId: string) => {
        console.log('[Store] fetchLeaveData called for:', userId);
        set({ isSyncingBalance: true });

        try {
            // 1. Fetch from API
            let result;
            const { isDemoMode, selectedUser } = useDemoStore.getState();

            if (isDemoMode) {
                const now = new Date().toISOString();
                const balance = selectedUser.leaveBalance ?? 30.0; // Fallback for stale persisted store
                const demoBalance: LeaveBalance = {
                    id: `lb-${selectedUser.id}`,
                    userId: selectedUser.id,
                    currentBalance: balance,
                    useOrLoseDays: 0,
                    useOrLoseExpirationDate: new Date(new Date().getFullYear(), 8, 30).toISOString(), // Sep 30
                    earnedThisFiscalYear: 0,
                    usedThisFiscalYear: 0,
                    projectedEndOfYearBalance: balance,
                    maxCarryOver: 60,
                    balanceAsOfDate: now,
                    lastSyncTimestamp: now,
                    syncStatus: 'synced',
                };
                console.log('[Store] Using Demo Balance:', demoBalance);
                // Simulate API delay/result structure
                result = { success: true, data: demoBalance };
            } else {
                result = await services.leave.fetchBalance(userId);
            }

            console.log('[Store] fetchLeaveBalance result:', result);

            if (result.success) {
                const balance = result.data;
                console.log('[Store] Updating balance in store:', balance);

                // 2. Update Store
                set({
                    leaveBalance: balance,
                    lastBalanceSyncAt: new Date().toISOString(),
                    isSyncingBalance: false,
                });

                // 3. Persist to Storage
                await storage.saveLeaveBalance(balance);
                console.log('[Store] Saved balance to storage');
            } else {
                console.error('Failed to fetch leave balance:', result.error);
                set({ isSyncingBalance: false });
            }
        } catch (error) {
            console.error('Error fetching leave data:', error);
            set({ isSyncingBalance: false });
        }
    },

    fetchUserDefaults: async (userId: string) => {
        try {
            let defaults = await storage.getLeaveDefaults(userId);

            // Seed defaults from mock data if not yet persisted
            if (!defaults) {
                defaults = { ...MOCK_LEAVE_DEFAULTS };
                await storage.saveLeaveDefaults(userId, defaults);
            }

            set({ userDefaults: defaults });
        } catch (error) {
            console.error('Failed to fetch user defaults', error);
        }
    },

    fetchUserRequests: async (userId: string) => {
        set({ isSyncingRequests: true });
        try {
            // In demo mode, don't read stale SQLite data from previous sessions
            const { isDemoMode } = useDemoStore.getState();
            if (isDemoMode) {
                set({
                    leaveRequests: {},
                    userLeaveRequestIds: [],
                    isSyncingRequests: false,
                });
                return;
            }

            const requests = await storage.getUserLeaveRequests(userId);
            const requestMap = requests.reduce((acc, req) => {
                acc[req.id] = req;
                return acc;
            }, {} as Record<string, LeaveRequest>);

            set({
                leaveRequests: requestMap,
                userLeaveRequestIds: requests.map(r => r.id),
                isSyncingRequests: false
            });
        } catch (error) {
            console.error('Failed to fetch user requests:', error);
            set({ isSyncingRequests: false });
        }
    },

    generateQuickDraft: (type: 'weekend' | 'standard', userId: string) => {
        const state = get();
        const { userDefaults } = state;
        const now = new Date();
        const draftId = generateUUID();

        // Robust Defaults (Fallback if userDefaults is null)
        const defaults = userDefaults || {
            leaveAddress: '123 Sailor Blvd, Norfolk, VA',
            leavePhoneNumber: '555-000-1234',
            emergencyContact: {
                name: 'Sarah Connor',
                relationship: 'Mother',
                phoneNumber: '555-867-5309',
            },
            dutySection: 'Deck Dept',
            deptDiv: '1st Div',
            dutyPhone: '555-111-2222',
            rationStatus: 'not_applicable'
        };

        let startDate = '';
        let endDate = '';
        const chargeDays = 0;

        if (type === 'weekend') {
            const daysUntilFriday = (5 - now.getDay() + 7) % 7;
            const nextFriday = new Date(now);
            nextFriday.setDate(now.getDate() + daysUntilFriday);
            nextFriday.setHours(16, 0, 0, 0); // 16:00

            const followingMonday = new Date(nextFriday);
            followingMonday.setDate(nextFriday.getDate() + 3);
            followingMonday.setHours(7, 0, 0, 0); // 07:00

            startDate = nextFriday.toISOString();
            endDate = followingMonday.toISOString();
        }

        const draft: LeaveRequest = {
            id: draftId,
            userId,
            startDate,
            endDate,
            chargeDays,
            leaveType: 'annual',
            leaveAddress: defaults.leaveAddress || '',
            leavePhoneNumber: defaults.leavePhoneNumber || '555-000-0000',
            emergencyContact: defaults.emergencyContact || { name: 'Emergency Contact', relationship: 'None', phoneNumber: '555-000-0000' },
            dutySection: defaults.dutySection || 'N/A',
            deptDiv: defaults.deptDiv || 'N/A',
            dutyPhone: defaults.dutyPhone || 'N/A',
            rationStatus: defaults.rationStatus || 'not_applicable',
            modeOfTravel: 'POV',
            destinationCountry: 'USA',
            normalWorkingHours: '0700-1600',
            leaveInConus: true,
            status: 'draft',
            statusHistory: [{
                status: 'draft',
                timestamp: new Date().toISOString(),
                comments: 'Generated Quick Draft',
            }],
            approvalChain: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncTimestamp: new Date().toISOString(),
            syncStatus: 'pending_upload',
        };

        return draft;
    },

    submitRequest: async (payload: CreateLeaveRequestPayload, userId: string) => {
        set({ isSyncingRequests: true });

        // -------------------------------------------------------------------------
        // STEP 1: OPTIMISTIC UPDATE
        // -------------------------------------------------------------------------
        const tempId = generateUUID();
        const now = new Date().toISOString();

        // Extract defaults from payload
        const newDefaults: LeaveRequestDefaults = {
            leaveAddress: payload.leaveAddress,
            leavePhoneNumber: payload.leavePhoneNumber,
            emergencyContact: payload.emergencyContact,
            dutySection: payload.dutySection,
            deptDiv: payload.deptDiv,
            dutyPhone: payload.dutyPhone,
            rationStatus: payload.rationStatus,
        };

        // Create optimistic request object
        // Note: We need to map payload to full LeaveRequest schema
        // Some fields like approvalChain are empty initially
        const optimisticRequest: LeaveRequest = {
            id: tempId,
            userId,
            startDate: payload.startDate,
            endDate: payload.endDate,
            chargeDays: 0, // Mock calculation, would ideally calc from dates but simpler for now
            leaveType: payload.leaveType,
            leaveAddress: payload.leaveAddress,
            leavePhoneNumber: payload.leavePhoneNumber,
            emergencyContact: payload.emergencyContact,
            modeOfTravel: payload.modeOfTravel,
            destinationCountry: payload.destinationCountry,
            normalWorkingHours: '0700-1600',
            leaveInConus: payload.leaveInConus,
            memberRemarks: payload.memberRemarks,
            status: 'pending', // Optimistically assume it goes to pending
            statusHistory: [{
                status: 'pending',
                timestamp: now,
                comments: 'Optimistic submission',
            }],
            approvalChain: [],
            createdAt: now,
            updatedAt: now,
            lastSyncTimestamp: now,
            syncStatus: 'pending_upload',
        };

        // Update Store (Requests + Defaults)
        set((state) => ({
            leaveRequests: {
                ...state.leaveRequests,
                [tempId]: optimisticRequest,
            },
            userLeaveRequestIds: [...state.userLeaveRequestIds, tempId],
            userDefaults: newDefaults,
        }));

        // Persist Optimistic State & Defaults
        try {
            await storage.saveLeaveRequest(optimisticRequest);
            await storage.saveLeaveDefaults(userId, newDefaults);
        } catch (e) {
            console.error('Failed to save optimistic leave request or defaults to storage', e);
        }

        try {
            // -----------------------------------------------------------------------
            // STEP 2: NETWORK TRANSACTION
            // -----------------------------------------------------------------------
            const result = await services.leave.submitRequest(payload);

            if (result.success) {
                // ---------------------------------------------------------------------
                // STEP 3: SUCCESS RECONCILIATION
                // ---------------------------------------------------------------------
                const { requestId, status, submittedAt, nextApproverId } = result.data;

                // Create confirmed request object (swapping ID if needed, or just updating metadata)
                // In a real app we might swap the tempID for the real requestId. 
                // For simplicity here, we'll assume we update the existing object with server data if we could, 
                // but since ID changed, we might need to swap it in the store. 
                // Strategies: 
                // A) Use UUID generated by client as primary key (best for offline).
                // B) Swap ID. 
                // The mock service returns a NEW ID `req-new-...`. 
                // So let's swap it.

                const confirmedRequest: LeaveRequest = {
                    ...optimisticRequest,
                    id: requestId, // Server ID
                    status: status, // 'pending'
                    submittedAt: submittedAt,
                    currentApproverId: nextApproverId,
                    lastSyncTimestamp: new Date().toISOString(),
                    syncStatus: 'synced',
                };

                // Remove optimistic, add confirmed
                set((state) => {
                    const { [tempId]: _, ...remainingRequests } = state.leaveRequests;
                    const remainingIds = state.userLeaveRequestIds.filter(id => id !== tempId);

                    return {
                        leaveRequests: {
                            ...remainingRequests,
                            [requestId]: confirmedRequest,
                        },
                        userLeaveRequestIds: [...remainingIds, requestId],
                        isSyncingRequests: false,
                    };
                });

                // Persist confirmed, delete optimistic (conceptually, or just leave it as garbage? SQLite doesn't have delete exposed in storage.ts yet)
                // We haven't implemented delete in storage.ts. So we'll just save the new one. 
                await storage.saveLeaveRequest(confirmedRequest);

            } else {
                // ---------------------------------------------------------------------
                // STEP 4: FAILURE RECONCILIATION — enqueue for retry
                // ---------------------------------------------------------------------
                const pendingRequest: LeaveRequest = {
                    ...optimisticRequest,
                    syncStatus: 'pending_upload',
                };

                set((state) => ({
                    leaveRequests: {
                        ...state.leaveRequests,
                        [tempId]: pendingRequest,
                    },
                    isSyncingRequests: false,
                }));

                await storage.saveLeaveRequest(pendingRequest);
                await syncQueue.enqueue('leave:submit', { requestId: tempId, payload });
            }

        } catch (error) {
            console.error('submitRequest transaction error:', error);
            set({ isSyncingRequests: false });

            // Enqueue for retry instead of dead-ending at error
            set((state) => {
                if (state.leaveRequests[tempId]) {
                    return {
                        leaveRequests: {
                            ...state.leaveRequests,
                            [tempId]: { ...state.leaveRequests[tempId], syncStatus: 'pending_upload' }
                        }
                    }
                }
                return {};
            });
            await syncQueue.enqueue('leave:submit', { requestId: tempId, payload });
        }
    },

    updateDraft: async (draftId: string, patch: Partial<LeaveRequest>) => {
        const state = get();
        const existing = state.leaveRequests[draftId];

        if (!existing) {
            console.error('[useLeaveStore] Draft not found:', draftId);
            return;
        }

        // Invalidate checks if any field changed
        const resetChecks = (existing.preReviewChecks && Object.keys(patch).length > 0)
            ? { preReviewChecks: undefined }
            : {};

        const updatedRequest = {
            ...existing,
            ...patch,
            ...resetChecks,
            localModifiedAt: new Date().toISOString(),
            // Ensure status remains draft unless explicitly changed (though UI shouldn't be calling this for submitted ones usually)
        };

        set({
            leaveRequests: {
                ...state.leaveRequests,
                [draftId]: updatedRequest,
            }
        });

        // Debounced persistence could be handled here or in UI. 
        // For now, straightforward async save (fire and forget from UI perspective).
        try {
            await storage.saveLeaveRequest(updatedRequest);
        } catch (error) {
            console.error('[useLeaveStore] Failed to persist draft update:', error);
        }
    },

    createDraft: async (draft: LeaveRequest) => {
        set((state) => ({
            leaveRequests: {
                ...state.leaveRequests,
                [draft.id]: draft,
            },
            userLeaveRequestIds: [...state.userLeaveRequestIds, draft.id],
        }));

        try {
            await storage.saveLeaveRequest(draft);
        } catch (error) {
            console.error('[useLeaveStore] Failed to persist new draft:', error);
        }
    },

    updateDraftField: async (draftId: string, field: keyof LeaveRequest, value: any) => {
        await get().updateDraft(draftId, { [field]: value });
    },

    validateStep: (draftId: string, step: 1 | 2 | 3) => {
        const request = get().leaveRequests[draftId];
        if (!request) return { success: false, errors: ['Draft not found'] };

        let schema;
        switch (step) {
            case 1: schema = Step1IntentSchema; break;
            case 2: schema = Step2ContactSchema; break;
            case 3: schema = Step3CommandSchema; break;
            default: return { success: false, errors: ['Invalid step'] };
        }

        const result = schema.safeParse(request);
        return {
            success: result.success,
            errors: result.success ? undefined : result.error.format()
        };
    },

    discardDraft: async (draftId: string) => {
        // Remove from local state
        set((state) => {
            const { [draftId]: _, ...remainingRequests } = state.leaveRequests;
            const remainingIds = state.userLeaveRequestIds.filter(id => id !== draftId);
            return {
                leaveRequests: remainingRequests,
                userLeaveRequestIds: remainingIds,
            };
        });

        // Remove from persistent storage
        try {
            await storage.deleteLeaveRequest(draftId);
        } catch (error) {
            console.error('[useLeaveStore] Failed to delete draft:', error);
        }
    },

    cancelRequest: async (requestId: string) => {
        const state = get();
        const request = state.leaveRequests[requestId];
        if (!request) return;

        set({ isSyncingRequests: true });

        // Optimistic Update
        const previousStatus = request.status;
        const now = new Date().toISOString();

        const updatedRequest: LeaveRequest = {
            ...request,
            status: 'cancelled',
            statusHistory: [
                ...request.statusHistory,
                {
                    status: 'cancelled',
                    timestamp: now,
                    comments: 'User cancelled request',
                }
            ],
            updatedAt: now,
            localModifiedAt: now,
            syncStatus: 'pending_upload',
        };

        set((state) => ({
            leaveRequests: {
                ...state.leaveRequests,
                [requestId]: updatedRequest,
            },
        }));

        try {
            await storage.saveLeaveRequest(updatedRequest);
            const result = await services.leave.cancelRequest(requestId);

            if (result.success) {
                // Confirm sync
                set((state) => ({
                    leaveRequests: {
                        ...state.leaveRequests,
                        [requestId]: {
                            ...state.leaveRequests[requestId],
                            syncStatus: 'synced',
                            lastSyncTimestamp: result.data.canceledAt,
                        }
                    },
                    isSyncingRequests: false,
                }));
                // Update storage again with synced status
                await storage.saveLeaveRequest({ ...updatedRequest, syncStatus: 'synced', lastSyncTimestamp: result.data.canceledAt });
            } else {
                console.error('API failed to cancel request');
                set({ isSyncingRequests: false });
                // Note: We leave it as optimistically cancelled. 
                // A real implementation might revert or mark syncStatus: 'error'.
            }
        } catch (error) {
            console.error('Failed to cancel request:', error);
            set({ isSyncingRequests: false });
        }
    },

    resetStore: () => set(INITIAL_STATE),
}));
