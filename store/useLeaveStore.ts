import * as api from '@/services/api/mockLeaveService';
import * as storage from '@/services/storage';
import { CreateLeaveRequestPayload } from '@/types/api';
import {
    LeaveRequest,
    MyAdminState
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
     * Submit a leave request with optimistic updates.
     */
    submitRequest: (payload: CreateLeaveRequestPayload, userId: string) => Promise<void>;

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
        set({ isSyncingBalance: true });

        try {
            // 1. Fetch from API
            const result = await api.fetchLeaveBalance(userId);

            if (result.success) {
                const balance = result.data;

                // 2. Update Store
                set({
                    leaveBalance: balance,
                    lastBalanceSyncAt: new Date().toISOString(),
                    isSyncingBalance: false,
                });

                // 3. Persist to Storage
                await storage.saveLeaveBalance(balance);
            } else {
                console.error('Failed to fetch leave balance:', result.error);
                set({ isSyncingBalance: false });
            }
        } catch (error) {
            console.error('Error fetching leave data:', error);
            set({ isSyncingBalance: false });
        }
    },

    submitRequest: async (payload: CreateLeaveRequestPayload, userId: string) => {
        set({ isSyncingRequests: true });

        // -------------------------------------------------------------------------
        // STEP 1: OPTIMISTIC UPDATE
        // -------------------------------------------------------------------------
        const tempId = generateUUID();
        const now = new Date().toISOString();

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

        // Update Store
        set((state) => ({
            leaveRequests: {
                ...state.leaveRequests,
                [tempId]: optimisticRequest,
            },
            userLeaveRequestIds: [...state.userLeaveRequestIds, tempId],
        }));

        // Persist Optimistic State
        try {
            await storage.saveLeaveRequest(optimisticRequest);
        } catch (e) {
            console.error('Failed to save optimistic leave request to storage', e);
        }

        try {
            // -----------------------------------------------------------------------
            // STEP 2: NETWORK TRANSACTION
            // -----------------------------------------------------------------------
            const result = await api.submitLeaveRequest(payload);

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
                // STEP 4: FAILURE RECONCILIATION
                // ---------------------------------------------------------------------
                // Mark as error or remove? 
                // Let's mark syncStatus as error.
                const failedRequest: LeaveRequest = {
                    ...optimisticRequest,
                    syncStatus: 'error',
                };

                set((state) => ({
                    leaveRequests: {
                        ...state.leaveRequests,
                        [tempId]: failedRequest,
                    },
                    isSyncingRequests: false,
                }));

                await storage.saveLeaveRequest(failedRequest);
            }

        } catch (error) {
            console.error('submitRequest transaction error:', error);
            set({ isSyncingRequests: false });
            // Ensure we update sync status to error in store if it crashed
            set((state) => {
                if (state.leaveRequests[tempId]) {
                    return {
                        leaveRequests: {
                            ...state.leaveRequests,
                            [tempId]: { ...state.leaveRequests[tempId], syncStatus: 'error' }
                        }
                    }
                }
                return {};
            });
        }
    },

    resetStore: () => set(INITIAL_STATE),
}));
