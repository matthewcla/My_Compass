import type {
    ApiResult,
    CreateLeaveRequestPayload,
    SubmitLeaveRequestResponse,
} from '@/types/api';
import type { LeaveBalance, LeaveRequest } from '@/types/schema';
import type { ILeaveService } from './interfaces/ILeaveService';
import { useDemoStore } from '@/store/useDemoStore';
import { getLeaveDefaults } from '@/constants/MockLeaveDefaults';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a valid draft leave request pre-filled with required defaults.
 * Compliant with LeaveRequestSchema (Zod) from types/schema.ts.
 *
 * @param userId - The current user's ID to assign to the request
 * @returns A valid LeaveRequest object in "draft" status
 */
export const generateDraftRequest = (userId: string): LeaveRequest => {
    const now = new Date().toISOString();
    const defaults = getLeaveDefaults(userId);

    return {
        id: `lr-draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId,

        // Leave period - defaults to tomorrow
        startDate: now,
        endDate: now,
        chargeDays: 0,

        // Leave details
        leaveType: 'annual',
        leaveAddress: defaults.leaveAddress ?? '',
        leavePhoneNumber: defaults.leavePhoneNumber ?? '',

        // Emergency contact — pre-filled from persona defaults
        emergencyContact: {
            name: defaults.emergencyContact?.name ?? '',
            relationship: defaults.emergencyContact?.relationship ?? '',
            phoneNumber: defaults.emergencyContact?.phoneNumber ?? '',
            altPhoneNumber: undefined,
            address: undefined,
        },

        // Transportation
        modeOfTravel: undefined,
        destinationCountry: 'USA',
        normalWorkingHours: '0700-1600',
        leaveInConus: true,

        // Remarks
        memberRemarks: undefined,

        // Status workflow - starts as draft
        status: 'draft',
        statusHistory: [
            {
                status: 'draft',
                timestamp: now,
                actorId: userId,
                comments: 'Request created',
            },
        ],

        // Approval chain (empty, to be populated on submit)
        approvalChain: [],
        currentApproverId: undefined,

        // Return/denial reasons
        returnReason: undefined,
        denialReason: undefined,

        // Timestamps
        createdAt: now,
        updatedAt: now,
        submittedAt: undefined,

        // Sync metadata
        lastSyncTimestamp: now,
        syncStatus: 'pending_upload',
        localModifiedAt: now,
    };
};

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Builds a LeaveBalance for the requested userId.
 * In demo mode, reads the persona's leaveBalance from DemoUser.
 */
const buildLeaveBalance = (userId: string): LeaveBalance => {
    const demo = useDemoStore.getState();
    const balance = (demo.isDemoMode && demo.selectedUser?.leaveBalance != null)
        ? demo.selectedUser.leaveBalance
        : 45.5;

    const useOrLose = Math.max(0, balance - 60);

    return {
        id: `lb-${userId}`,
        userId,
        currentBalance: balance,
        useOrLoseDays: useOrLose,
        useOrLoseExpirationDate: '2026-09-30T23:59:59Z',
        earnedThisFiscalYear: 10.0,
        usedThisFiscalYear: 5.0,
        projectedEndOfYearBalance: balance + 20, // ~2.5 days/mo * 8 months left
        maxCarryOver: 60,
        balanceAsOfDate: new Date().toISOString(),
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'synced',
    };
};

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

const meta = () => ({
    requestId: `req-${Date.now()}`,
    timestamp: new Date().toISOString(),
});

export const mockLeaveService: ILeaveService = {
    fetchBalance: async (userId: string): Promise<ApiResult<LeaveBalance>> => {
        await new Promise((resolve) => setTimeout(resolve, 600));

        return {
            success: true,
            data: buildLeaveBalance(userId),
            meta: meta(),
        };
    },

    submitRequest: async (
        payload: CreateLeaveRequestPayload
    ): Promise<ApiResult<SubmitLeaveRequestResponse['data']>> => {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        return {
            success: true,
            data: {
                requestId: `req-new-${Date.now()}`,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                nextApproverId: 'approver-456',
                nextApproverName: 'CDR Sarah Commander',
            },
            meta: meta(),
        };
    },

    cancelRequest: async (requestId: string): Promise<ApiResult<{ canceledAt: string }>> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
            success: true,
            data: { canceledAt: new Date().toISOString() },
            meta: meta(),
        };
    },
};

// Legacy named exports for backward compatibility during transition
export const fetchLeaveBalance = mockLeaveService.fetchBalance;
export const submitLeaveRequest = mockLeaveService.submitRequest;
export const cancelLeaveRequest = mockLeaveService.cancelRequest;
