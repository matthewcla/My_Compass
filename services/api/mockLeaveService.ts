import {
    ApiResult,
    CreateLeaveRequestPayload,
    SubmitLeaveRequestResponse
} from '@/types/api';
import { LeaveBalance } from '@/types/schema';

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
