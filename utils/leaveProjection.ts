/**
 * Leave Projection Engine
 *
 * Calculates accrual-aware, forward-projected leave balances per Navy policy.
 * - 2.5 days accrual per month (30 days / year)
 * - 60-day max carry-over cap
 * - Chargeable vs unchargeable leave type classification
 * - Committed (approved/pending) leave deduction
 */

import type { LeaveRequest } from '@/types/schema';
import { differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';

// =============================================================================
// CHARGEABLE TYPE CLASSIFICATION
// =============================================================================

/** Leave types that consume annual balance per DoD / MILPERSMAN policy. */
const CHARGEABLE_TYPES = new Set(['annual', 'emergency', 'terminal']);

/**
 * Returns true if the given leave type charges against the Sailor's annual
 * leave balance.  Everything not in the chargeable set is considered an
 * entitlement-based absence that does not reduce the balance.
 */
export function isChargeableLeaveType(type: string): boolean {
    return CHARGEABLE_TYPES.has(type);
}

// =============================================================================
// ACCRUAL CALCULATION
// =============================================================================

/** Standard military leave accrual: 2.5 days per month (30 days / year). */
const MONTHLY_ACCRUAL = 2.5;

/**
 * Pro-rates leave accrual between two dates.
 *
 * @param from          Start of the accrual window (typically today)
 * @param to            End of the accrual window (typically departure date)
 * @param currentBalance  Current balance BEFORE accrual
 * @param maxCarryOver  Maximum balance cap (default 60)
 * @returns             Accrued days (capped so total does not exceed max)
 */
export function calculateAccrual(
    from: Date,
    to: Date,
    currentBalance: number,
    maxCarryOver: number = 60,
): number {
    // No accrual for past or same-day departure
    if (to <= from) return 0;

    const days = differenceInDays(to, from);
    const months = days / 30.4375; // average month length (365.25 / 12)
    const rawAccrual = months * MONTHLY_ACCRUAL;

    // Cap so that currentBalance + accrual ≤ maxCarryOver
    const headroom = Math.max(0, maxCarryOver - currentBalance);
    return Math.min(rawAccrual, headroom);
}

// =============================================================================
// COMMITTED LEAVE DEDUCTION
// =============================================================================

/** Statuses that count as "committed" — assumed to consume balance. */
const COMMITTED_STATUSES = new Set(['approved', 'pending']);

/**
 * Sums up chargeable days from other committed leave requests that fall
 * between `from` and `to`.
 *
 * @param allRequests       Every request in the store
 * @param from              Window start (typically today)
 * @param to                Window end (typically departure date of the request being evaluated)
 * @param excludeRequestId  ID of the request being evaluated (to avoid double-counting)
 */
export function calculateCommittedDeduction(
    allRequests: LeaveRequest[],
    from: Date,
    to: Date,
    excludeRequestId?: string,
): number {
    return allRequests.reduce((sum, req) => {
        // Skip the request we're currently evaluating
        if (excludeRequestId && req.id === excludeRequestId) return sum;

        // Must be committed
        if (!COMMITTED_STATUSES.has(req.status)) return sum;

        // Must be a chargeable type
        if (!isChargeableLeaveType(req.leaveType)) return sum;

        // Must overlap with the window [from, to]
        try {
            const reqStart = parseISO(req.startDate);
            const reqEnd = parseISO(req.endDate);

            // No overlap if request ends before window starts or starts after window ends
            if (isBefore(reqEnd, from) || isAfter(reqStart, to)) return sum;
        } catch {
            return sum; // Skip malformed dates
        }

        // Use the stored chargeDays if available and positive, else estimate
        const charge = req.chargeDays > 0
            ? req.chargeDays
            : Math.max(0, differenceInDays(parseISO(req.endDate), parseISO(req.startDate)) + 1);

        return sum + charge;
    }, 0);
}

// =============================================================================
// MAIN PROJECTION
// =============================================================================

export interface LeaveProjectionInput {
    /** Today's raw leave balance. */
    currentBalance: number;
    /** Maximum carry-over cap (typically 60). */
    maxCarryOver: number;
    /** Date the Sailor departs on leave. */
    departureDate: Date;
    /** Date the Sailor returns from leave. */
    returnDate: Date;
    /** Chargeable days for the current request (from calculateLeave). */
    chargeableDays: number;
    /** Leave type of the current request. */
    leaveType: string;
    /** All requests in the store (for committed deduction). */
    allRequests: LeaveRequest[];
    /** ID of the request being evaluated (excluded from committed deduction). */
    currentRequestId?: string;
}

export interface LeaveProjectionResult {
    /** Days accrued between today and departure. */
    accruedByDeparture: number;
    /** Days consumed by other committed chargeable leave before departure. */
    committedDeduction: number;
    /** Projected balance available on the day of departure. */
    availableOnDeparture: number;
    /** Balance remaining when the Sailor returns. */
    remainingOnReturn: number;
    /** True if remainingOnReturn < 0. */
    isOverdraft: boolean;
    /** True if the leave type does not charge against annual balance. */
    isUnchargeable: boolean;
}

/**
 * Computes a fully accrual-aware, forward-projected leave balance.
 *
 * Formula:
 *   availableOnDeparture = currentBalance
 *                        + accruedBetween(today, departureDate)
 *                        − committedChargeableDaysOfOtherLeave(today, departureDate)
 *
 *   remainingOnReturn    = isChargeable
 *                        ? availableOnDeparture − chargeableDays
 *                        : availableOnDeparture
 */
export function projectLeaveBalance(input: LeaveProjectionInput): LeaveProjectionResult {
    const {
        currentBalance,
        maxCarryOver,
        departureDate,
        returnDate,
        chargeableDays,
        leaveType,
        allRequests,
        currentRequestId,
    } = input;

    const today = new Date();
    const isUnchargeable = !isChargeableLeaveType(leaveType);

    // 1. Accrual
    const accruedByDeparture = calculateAccrual(today, departureDate, currentBalance, maxCarryOver);

    // 2. Committed deduction
    const committedDeduction = calculateCommittedDeduction(
        allRequests,
        today,
        departureDate,
        currentRequestId,
    );

    // 3. Available on departure
    const availableOnDeparture = Math.max(0, currentBalance + accruedByDeparture - committedDeduction);

    // 4. Remaining on return
    const remainingOnReturn = isUnchargeable
        ? availableOnDeparture
        : availableOnDeparture - chargeableDays;

    return {
        accruedByDeparture: Math.round(accruedByDeparture * 10) / 10,
        committedDeduction: Math.round(committedDeduction * 10) / 10,
        availableOnDeparture: Math.round(availableOnDeparture * 10) / 10,
        remainingOnReturn: Math.round(remainingOnReturn * 10) / 10,
        isOverdraft: remainingOnReturn < 0,
        isUnchargeable,
    };
}
