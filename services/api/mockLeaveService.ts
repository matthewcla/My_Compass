import {
    ApiResult,
    CreateLeaveRequestPayload,
    SubmitLeaveRequestResponse
} from '@/types/api';
import { LeaveBalance, LeaveRequest } from '@/types/schema';

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

    return {
        id: `lr-draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId,

        // Leave period - defaults to tomorrow
        startDate: now,
        endDate: now,
        chargeDays: 0,

        // Leave details
        leaveType: 'annual',
        leaveAddress: '',
        leavePhoneNumber: '',

        // Emergency contact (required, initialized empty)
        emergencyContact: {
            name: '',
            relationship: '',
            phoneNumber: '',
            altPhoneNumber: undefined,
            address: undefined,
        },

        // Transportation
        modeOfTravel: undefined,
        destinationCountry: 'USA',

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

const MOCK_LEAVE_BALANCE: LeaveBalance = {
    id: 'lb-mock-user-1',
    userId: 'user-123', // Will be overwritten by requested userId
    currentBalance: 45.5,
    useOrLoseDays: 15.0,
    useOrLoseExpirationDate: '2026-09-30T23:59:59Z',
    earnedThisFiscalYear: 10.0,
    usedThisFiscalYear: 5.0,
    projectedEndOfYearBalance: 55.5, // 45.5 + (2.5 * 8 months left) approx
    maxCarryOver: 60,
    balanceAsOfDate: new Date().toISOString(),
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
};

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Fetch leave balance for a user.
 * Returns mock data with 45.5 days current, 15.0 use/lose.
 */
export const fetchLeaveBalance = async (userId: string): Promise<ApiResult<LeaveBalance>> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
        success: true,
        data: {
            ...MOCK_LEAVE_BALANCE,
            userId,
        },
        meta: {
            requestId: `req-${Date.now()}`,
            timestamp: new Date().toISOString(),
        },
    };
};

/**
 * Submit a new leave request.
 * Simulates 1.5s delay and returns success.
 */
export const submitLeaveRequest = async (
    payload: CreateLeaveRequestPayload
): Promise<ApiResult<SubmitLeaveRequestResponse['data']>> => {
    // Simulate network delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Determine next approver (mock)
    const nextApproverId = 'approver-456';
    const nextApproverName = 'CDR Sarah Commander';

    return {
        success: true,
        data: {
            requestId: `req-new-${Date.now()}`,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            nextApproverId,
            nextApproverName,
        },
        meta: {
            requestId: `req-${Date.now()}`,
            timestamp: new Date().toISOString(),
        },
    };
};
