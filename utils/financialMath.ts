/**
 * ─────────────────────────────────────────────────────────────────────────────
 * financialMath.ts — PCS Entitlements Sandbox & Advance Pay Visualizer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pure TypeScript utility module. Contains **zero** React / React-Native code.
 *
 * References:
 *   • DoD FMR Volume 7A (Military Pay Policy)
 *   • Joint Travel Regulations (JTR), Chapters 5 & 6
 *   • DFAS Advance Pay guidance (DoDFMR Vol 7A, Ch. 32)
 *
 * All monetary values are in **US dollars** and returned as numbers
 * rounded to two decimal places unless otherwise noted.
 *
 * @module financialMath
 */

// ────────────────────────────────────────────────────────────────────────────
// #region  Interfaces & Types
// ────────────────────────────────────────────────────────────────────────────

/**
 * Represents the Sailor's financial / personnel profile relevant to
 * PCS entitlement calculations.
 */
export interface FinancialProfile {
    /** Pay-grade string, e.g. "E-6", "O-3", "W-2". */
    paygrade: string;

    /** Monthly base pay (gross) per the current pay table. */
    monthlyBasePay: number;

    /** Whether the member has legal dependents for entitlement purposes. */
    hasDependents: boolean;

    /**
     * Total number of dependents traveling with the member.
     * Used for the TLE percentage calculation.
     * A value of 0 means the member is traveling alone (unaccompanied).
     */
    numberOfDependents: number;
}

/**
 * Describes the authorized PCS route between the old and new
 * permanent duty stations (PDS).
 */
export interface PCSRoute {
    /** Name or UIC of the origin duty station. */
    originStation: string;

    /** Name or UIC of the destination duty station. */
    destinationStation: string;

    /**
     * Official (authorized) distance in statute miles between the two
     * stations as determined by DTOD (Defense Table of Official Distances).
     */
    authorizedMiles: number;

    /**
     * Number of TLE days the member is authorized (max 14 per JTR §5530).
     * Defaults to 14 if omitted.
     */
    tleDaysAuthorized?: number;
}

/**
 * Itemized result of a PCS entitlements estimate.
 */
export interface PCSEntitlementResult {
    /** Monetary Allowance in Lieu of Transportation (MALT). */
    malt: number;

    /** Dislocation Allowance (DLA). */
    dla: number;

    /**
     * Temporary Lodging Expense (TLE) estimate.
     * Accounts for member + dependents percentage scaling.
     */
    tle: number;

    /**
     * The combined estimated Navy payout:
     *   totalNavyPayout = MALT + DLA + TLE
     */
    totalNavyPayout: number;
}

/**
 * A single row in the Advance Pay repayment timeline.
 */
export interface AmortizationRow {
    /**
     * 1-based month index within the repayment window.
     * Month 1 is the first month a deduction is taken from pay.
     */
    monthIndex: number;

    /**
     * The Sailor's estimated net pay *before* any advance-pay deduction.
     * Calculated as 75 % of monthly base pay (a common rule-of-thumb
     * accounting for taxes, SGLI, TSP, etc.).
     */
    originalNetPay: number;

    /**
     * The deduction amount subtracted this month toward repayment of
     * the advance.  Equal installments over `repaymentMonths`.
     */
    deductionAmount: number;

    /**
     * Projected take-home pay after the advance-pay deduction:
     *   projectedNetPay = originalNetPay – deductionAmount
     */
    projectedNetPay: number;
}

// ────────────────────────────────────────────────────────────────────────────
// #endregion
// #region  Constants
// ────────────────────────────────────────────────────────────────────────────

/**
 * MALT rate per statute mile.
 * Per JTR Appendix A, the privately-owned conveyance (POC) mileage
 * rate for PCS travel.  This is a mock / simplified rate.
 */
const MALT_RATE_PER_MILE = 0.21;

/**
 * Daily TLE lodging rate used for the sandbox estimate.
 * Actual rates vary by locality; $150/day is a reasonable CONUS average.
 */
const TLE_DAILY_RATE = 150;

/**
 * Maximum TLE days authorized per JTR §5530.
 */
const MAX_TLE_DAYS = 14;

/**
 * Percentage of base pay assumed to represent take-home ("net") pay.
 * Accounts for federal / state taxes, SGLI, TSP, TRICARE, etc.
 */
const NET_PAY_FACTOR = 0.75;

// ────────────────────────────────────────────────────────────────────────────
// #endregion
// #region  Internal Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Round a number to two decimal places (standard currency rounding).
 */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Return a mock DLA rate based on paygrade and dependency status.
 *
 * Rates are approximate 2024 CONUS values sourced from DFAS DLA tables.
 * A production app would pull these from a versioned rate-table API.
 *
 * Uses a **switch statement** for common enlisted, warrant, and officer
 * paygrades per the task specification.
 *
 * @param paygrade  – e.g. "E-6", "O-3E", "W-2"
 * @param hasDependents – true if the member has dependents
 * @returns DLA amount in USD
 */
function lookupDLA(paygrade: string, hasDependents: boolean): number {
    // Normalize input — strip whitespace, uppercase
    const pg = paygrade.trim().toUpperCase();

    switch (pg) {
        // ── Enlisted ──────────────────────────────────────────────────────
        case 'E-1':
        case 'E-2':
        case 'E-3':
            return hasDependents ? 2_633 : 2_000;

        case 'E-4':
            return hasDependents ? 2_633 : 2_050;

        case 'E-5':
            return hasDependents ? 2_800 : 2_200;

        case 'E-6':
            return hasDependents ? 3_100 : 2_400;

        case 'E-7':
            return hasDependents ? 3_250 : 2_600;

        case 'E-8':
            return hasDependents ? 3_400 : 2_800;

        case 'E-9':
            return hasDependents ? 3_600 : 3_000;

        // ── Warrant Officers ─────────────────────────────────────────────
        case 'W-1':
            return hasDependents ? 2_700 : 2_200;

        case 'W-2':
            return hasDependents ? 2_900 : 2_400;

        case 'W-3':
            return hasDependents ? 3_100 : 2_600;

        case 'W-4':
            return hasDependents ? 3_300 : 2_800;

        case 'W-5':
            return hasDependents ? 3_500 : 3_000;

        // ── Officers ─────────────────────────────────────────────────────
        case 'O-1':
        case 'O-1E':
            return hasDependents ? 2_700 : 2_200;

        case 'O-2':
        case 'O-2E':
            return hasDependents ? 2_900 : 2_400;

        case 'O-3':
        case 'O-3E':
            return hasDependents ? 3_100 : 2_600;

        case 'O-4':
            return hasDependents ? 3_400 : 2_900;

        case 'O-5':
            return hasDependents ? 3_700 : 3_200;

        case 'O-6':
            return hasDependents ? 4_000 : 3_500;

        case 'O-7':
        case 'O-8':
        case 'O-9':
        case 'O-10':
            return hasDependents ? 4_200 : 3_700;

        // ── Fallback ─────────────────────────────────────────────────────
        default:
            // Sensible mid-range default for unrecognized paygrades
            return hasDependents ? 2_800 : 2_200;
    }
}

/**
 * Calculate the TLE reimbursement percentage based on the member's
 * household composition, per JTR §5540 guidance (simplified).
 *
 * Scaling rules (mock):
 *   • Member alone              → 65 %
 *   • Member + first dependent  → 65 % + 35 % = 100 %  (capped at 100 %)
 *   • Each additional dependent → +25 %, but total is capped at 100 %
 *
 * In practice, TLE is computed against maximum locality per-diem and
 * actual lodging receipts.  This sandbox abstracts that into a single
 * daily rate × percentage model.
 *
 * @param numberOfDependents – count of dependents traveling with member
 * @returns A percentage expressed as a decimal (0.00 – 1.00)
 */
function computeTLEPercentage(numberOfDependents: number): number {
    const MEMBER_SHARE = 0.65;
    const FIRST_DEP_SHARE = 0.35;
    const ADDITIONAL_DEP_SHARE = 0.25;

    if (numberOfDependents <= 0) {
        return MEMBER_SHARE; // 65 %
    }

    // First dependent adds 35 %
    let total = MEMBER_SHARE + FIRST_DEP_SHARE;

    // Each subsequent dependent adds 25 %
    if (numberOfDependents > 1) {
        total += (numberOfDependents - 1) * ADDITIONAL_DEP_SHARE;
    }

    // Cap at 100 %
    return Math.min(total, 1.0);
}

// ────────────────────────────────────────────────────────────────────────────
// #endregion
// #region  Public API — PCS Entitlements
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calculate an itemized PCS entitlements estimate.
 *
 * This function produces a **sandbox-quality** estimate suitable for
 * financial planning.  Actual entitlements are determined by PSD /
 * NPPSC based on orders, receipts, and locality rates.
 *
 * ### Entitlement Breakdown
 *
 * | Component | Calculation |
 * |-----------|-------------|
 * | **MALT**  | `authorizedMiles × $0.21/mi` |
 * | **DLA**   | Flat rate lookup by paygrade + dependency status |
 * | **TLE**   | `days × $150/day × household %` (max 14 days, max 100 %) |
 *
 * @param profile – The Sailor's financial / personnel profile
 * @param route   – The authorized PCS travel route
 * @returns An itemized {@link PCSEntitlementResult}
 *
 * @example
 * ```ts
 * const result = calculatePCSEntitlements(
 *   { paygrade: 'E-6', monthlyBasePay: 3800, hasDependents: true, numberOfDependents: 2 },
 *   { originStation: 'NS Norfolk', destinationStation: 'NB San Diego', authorizedMiles: 2700 },
 * );
 * console.log(result.totalNavyPayout); // ≈ $5,767.00
 * ```
 */
export function calculatePCSEntitlements(
    profile: FinancialProfile,
    route: PCSRoute,
): PCSEntitlementResult {
    // ── MALT ────────────────────────────────────────────────────────────
    const malt = round2(route.authorizedMiles * MALT_RATE_PER_MILE);

    // ── DLA ─────────────────────────────────────────────────────────────
    const dla = round2(lookupDLA(profile.paygrade, profile.hasDependents));

    // ── TLE ─────────────────────────────────────────────────────────────
    const tleDays = Math.min(
        route.tleDaysAuthorized ?? MAX_TLE_DAYS,
        MAX_TLE_DAYS,
    );
    const tlePercentage = computeTLEPercentage(profile.numberOfDependents);
    const tle = round2(tleDays * TLE_DAILY_RATE * tlePercentage);

    // ── Total ───────────────────────────────────────────────────────────
    const totalNavyPayout = round2(malt + dla + tle);

    return { malt, dla, tle, totalNavyPayout };
}

// ────────────────────────────────────────────────────────────────────────────
// #endregion
// #region  Public API — Advance Pay Amortization
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generate a month-by-month Advance Pay repayment schedule.
 *
 * ### Background (DoDFMR Vol 7A, Ch. 32)
 * Sailors may request an advance of up to **3 months' base pay** in
 * connection with a PCS move.  The advance is repaid in equal monthly
 * installments over a period not to exceed **24 months** (or the
 * remaining service obligation, whichever is less).
 *
 * ### Assumptions
 * - **Net pay** is estimated at 75 % of gross base pay.  This is a
 *   common planning heuristic that approximates the impact of federal
 *   and state taxes, SGLI, TSP contributions, and TRICARE premiums.
 * - The advance amount equals `basePay × monthsRequested`.
 * - Repayment is in **equal installments** over `repaymentMonths`.
 *
 * @param basePay          – Monthly base pay (gross)
 * @param monthsRequested  – Number of months of base pay to advance (1–3)
 * @param repaymentMonths  – Repayment window in months (12 or 24)
 * @returns An array of {@link AmortizationRow} objects, one per repayment month
 *
 * @example
 * ```ts
 * const schedule = calculateAdvancePayAmortization(3800, 2, 12);
 * // schedule.length === 12
 * // schedule[0].deductionAmount === 633.33  (7600 / 12)
 * // schedule[0].projectedNetPay  === 2216.67 (2850 – 633.33)
 * ```
 */
export function calculateAdvancePayAmortization(
    basePay: number,
    monthsRequested: 1 | 2 | 3,
    repaymentMonths: 12 | 24,
): AmortizationRow[] {
    // ── Derive key amounts ──────────────────────────────────────────────
    const advanceTotal = round2(basePay * monthsRequested);
    const originalNetPay = round2(basePay * NET_PAY_FACTOR);
    const deductionAmount = round2(advanceTotal / repaymentMonths);

    // ── Build repayment timeline ────────────────────────────────────────
    const timeline: AmortizationRow[] = [];

    for (let i = 1; i <= repaymentMonths; i++) {
        timeline.push({
            monthIndex: i,
            originalNetPay,
            deductionAmount,
            projectedNetPay: round2(originalNetPay - deductionAmount),
        });
    }

    return timeline;
}

// ────────────────────────────────────────────────────────────────────────────
// #endregion
// ────────────────────────────────────────────────────────────────────────────
