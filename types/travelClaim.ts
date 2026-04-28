// types/travelClaim.ts
// My Compass — Smart Travel Claim (DD 1351-2) Type System
// Offline-first travel voucher with receipt capture & per diem calculations

import { z } from 'zod';
import { ApproverSchema, SyncStatusSchema } from './schema';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/**
 * Travel claim status workflow.
 *
 * Workflow:
 * 1. draft → Sailor composing claim offline, auto-saved
 * 2. pending → Submitted to approving official
 * 3. approved → Approved by chain, awaiting disbursement
 * 4. returned → Returned for corrections
 * 5. paid → Disbursed by DFAS
 * 6. cancelled → Cancelled by member or command
 *
 * @see JTR Ch.1, §010201 — Travel Claim Processing
 */
export const TravelClaimStatusSchema = z.enum([
    'draft',       // Sailor composing, not yet submitted
    'pending',     // Submitted, awaiting approving official
    'approved',    // Approved, awaiting DFAS disbursement
    'returned',    // Returned for corrections
    'paid',        // Disbursed by DFAS
    'cancelled',   // Cancelled by member or command
]);
export type TravelClaimStatus = z.infer<typeof TravelClaimStatusSchema>;

/**
 * Travel type per DD Form 1610 (Request and Authorization for TDY Travel).
 * @see JTR Ch.2, §020101 — Temporary Duty Travel
 */
export const TravelTypeSchema = z.enum([
    'tdy',         // Temporary Duty
    'pcs',         // Permanent Change of Station
    'local',       // Local travel (within commuting area)
    'training',    // Training assignment
    'conference',  // Conference attendance
    'other',       // Other authorized travel
]);
export type TravelType = z.infer<typeof TravelTypeSchema>;

/**
 * Expense category for reimbursable travel costs.
 * @see JTR Ch.2, §020801 — Reimbursable Expenses
 */
export const ExpenseTypeSchema = z.enum([
    'lodging',     // Commercial lodging
    'fuel',        // POV fuel
    'toll',        // Road/bridge tolls
    'parking',     // Parking fees
    'rental_car',  // Rental vehicle
    'airfare',     // Commercial air travel
    'misc',        // Miscellaneous (laundry, tips, etc.)
]);
export type ExpenseType = z.infer<typeof ExpenseTypeSchema>;

/**
 * Mode of travel for MALT rate determination.
 * @see JTR Ch.2, §020206 — Monetary Allowance in Lieu of Transportation (MALT)
 */
export const TravelModeSchema = z.enum([
    'pov',          // Privately Owned Vehicle
    'commercial_air', // Commercial airline
    'gov_vehicle',  // Government vehicle
    'mixed',        // Combination of modes
    'rail',         // Train / Amtrak
]);
export type TravelMode = z.infer<typeof TravelModeSchema>;

/**
 * Meals rate type for M&IE calculations.
 * @see JTR Ch.2, §020302 — Meals & Incidental Expenses
 */
export const MealsRateSchema = z.enum([
    'standard',          // Full locality M&IE rate
    'proportional',      // First/last day (75% rate)
    'government_mess',   // Government meals available (reduced rate)
]);
export type MealsRate = z.infer<typeof MealsRateSchema>;

// =============================================================================
// RECEIPT / ATTACHMENT
// =============================================================================

/**
 * Receipt photo or document attached to an expense.
 * Supports offline-first: stored locally via expo-image-picker,
 * uploaded on sync.
 *
 * @see DoDFMR Vol.9, Ch.3 — Receipts required for expenses ≥ $75
 */
export const ReceiptSchema = z.object({
    id: z.string(),
    expenseId: z.string(),                              // Parent expense
    localUri: z.string().nullable(),                    // expo-image-picker local path
    remoteUrl: z.string().url().nullable(),              // CDN URL after upload
    mimeType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
    fileSizeBytes: z.number().int().positive().optional(),
    uploadStatus: z.enum(['pending', 'uploading', 'uploaded', 'failed']),
    capturedAt: z.string().datetime(),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

// =============================================================================
// EXPENSE SUBTYPES
// =============================================================================

/**
 * Lodging expense line item.
 * @see JTR Ch.5, §050201 — Temporary Lodging Expense (TLE)
 * @see JTR Ch.2, §020303 — Lodging Reimbursement
 */
export const LodgingExpenseSchema = z.object({
    nightlyRate: z.number().min(0),            // Actual nightly cost
    numberOfNights: z.number().int().min(1),
    localityMaxRate: z.number().min(0),        // GSA/DoD locality ceiling
    isTLE: z.boolean().default(false),         // Temporary Lodging Expense flag
    hotelName: z.string().optional(),
    confirmationNumber: z.string().optional(),
});
export type LodgingExpense = z.infer<typeof LodgingExpenseSchema>;

/**
 * POV fuel expense line item.
 * @see JTR Ch.2, §020206 — MALT / POV Mileage Rates
 */
export const FuelExpenseSchema = z.object({
    gallons: z.number().min(0).optional(),
    pricePerGallon: z.number().min(0).optional(),
    odometerStart: z.number().int().min(0).optional(),
    odometerEnd: z.number().int().min(0).optional(),
    totalMiles: z.number().min(0).optional(),
    povRate: z.number().min(0).optional(),      // $/mile (GSA rate)
});
export type FuelExpense = z.infer<typeof FuelExpenseSchema>;

/**
 * Road or bridge toll expense.
 */
export const TollExpenseSchema = z.object({
    tollAmount: z.number().min(0),
    roadOrBridgeName: z.string().optional(),
});
export type TollExpense = z.infer<typeof TollExpenseSchema>;

/**
 * Parking fee expense.
 */
export const ParkingExpenseSchema = z.object({
    dailyRate: z.number().min(0),
    numberOfDays: z.number().int().min(1),
    facilityName: z.string().optional(),
});
export type ParkingExpense = z.infer<typeof ParkingExpenseSchema>;

/**
 * Miscellaneous reimbursable expense.
 * @see JTR Ch.2, §020801 — Miscellaneous Reimbursable Expenses
 */
export const MiscExpenseSchema = z.object({
    description: z.string().min(1),
    justification: z.string().optional(),
});
export type MiscExpense = z.infer<typeof MiscExpenseSchema>;

/**
 * Unified expense line item with discriminated subtype details.
 * Each expense carries a type-specific `details` object and
 * an array of receipt attachments.
 */
export const ExpenseSchema = z.object({
    id: z.string(),
    claimId: z.string(),                        // Parent travel claim
    expenseType: ExpenseTypeSchema,
    amount: z.number().min(0),                  // Total expense amount ($)
    date: z.string().datetime(),                // Date expense incurred
    description: z.string().optional(),
    receipts: z.array(ReceiptSchema).default([]),

    // Type-specific details (only the matching subtype populated)
    lodgingDetails: LodgingExpenseSchema.optional(),
    fuelDetails: FuelExpenseSchema.optional(),
    tollDetails: TollExpenseSchema.optional(),
    parkingDetails: ParkingExpenseSchema.optional(),
    miscDetails: MiscExpenseSchema.optional(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

// =============================================================================
// PER DIEM & MEALS
// =============================================================================

/**
 * Single-day per diem record for M&IE and lodging calculations.
 * @see JTR Ch.2, §020302 — Per Diem Allowance
 * @see JTR Ch.2, §020303 — Meals & Incidental Expenses (M&IE)
 */
export const PerDiemDaySchema = z.object({
    date: z.string().datetime(),
    locality: z.string(),                       // GSA locality name
    localityRate: z.number().min(0),            // Full per diem rate ($/day)
    lodgingRate: z.number().min(0),             // Max lodging ceiling
    mieRate: z.number().min(0),                 // Meals & Incidental rate

    // Meal deductions (government-provided meals)
    breakfastProvided: z.boolean().default(false),
    lunchProvided: z.boolean().default(false),
    dinnerProvided: z.boolean().default(false),

    mealsRate: MealsRateSchema,                 // Standard vs proportional
    isProrated: z.boolean().default(false),      // First/last travel day
    actualMieAmount: z.number().min(0),          // After deductions
});
export type PerDiemDay = z.infer<typeof PerDiemDaySchema>;

/**
 * Meals & Incidental Expenses (M&IE) summary for the entire claim.
 * @see JTR Ch.2, §020302 — M&IE Standard Rates
 */
export const MealsAndIncidentalsSummarySchema = z.object({
    totalMIE: z.number().min(0),               // Gross M&IE entitlement
    mealDeductions: z.number().min(0),          // Government meals deduction
    netMIE: z.number().min(0),                 // Net amount payable
    travelDays: z.number().int().min(0),
});
export type MealsAndIncidentalsSummary = z.infer<typeof MealsAndIncidentalsSummarySchema>;

// =============================================================================
// TRAVEL CLAIM (MAIN ENTITY — DD 1351-2)
// =============================================================================

/**
 * Smart Travel Claim entity — models DD Form 1351-2 (Travel Voucher).
 * Supports offline-first drafting with receipt photo capture,
 * auto-save, and sync queue integration.
 *
 * @see DD Form 1351-2 — Travel Voucher or Subvoucher
 * @see JTR Ch.1 — General Travel Provisions
 */
export const TravelClaimSchema = z.object({
    id: z.string(),
    userId: z.string(),

    // --- DD Form 1610 Reference ---
    orderNumber: z.string().optional(),          // DD 1610 authorization number
    travelType: TravelTypeSchema,

    // --- Trip Details (Section 1) ---
    departureDate: z.string().datetime(),
    returnDate: z.string().datetime(),
    departureLocation: z.string(),               // Duty station or home
    destinationLocation: z.string(),             // TDY site
    isOconus: z.boolean().default(false),         // Outside CONUS
    travelMode: TravelModeSchema,

    // --- Entitlements ---
    /** Monetary Allowance in Lieu of Transportation (MALT) — JTR §020206 */
    maltAmount: z.number().min(0).default(0),
    maltMiles: z.number().int().min(0).default(0),

    /** Dislocation Allowance — JTR Ch.5, §050801 (PCS only) */
    dlaAmount: z.number().min(0).default(0),

    /** Temporary Lodging Expense — JTR Ch.5, §050201 (PCS only) */
    tleDays: z.number().int().min(0).max(14).default(0),
    tleAmount: z.number().min(0).default(0),

    // --- Per Diem ---
    perDiemDays: z.array(PerDiemDaySchema).default([]),
    mealsAndIncidentals: MealsAndIncidentalsSummarySchema.optional(),

    // --- Expenses ---
    expenses: z.array(ExpenseSchema).default([]),

    // --- Totals ---
    totalExpenses: z.number().min(0).default(0),
    totalEntitlements: z.number().min(0).default(0),
    totalClaimAmount: z.number().min(0).default(0),
    advanceAmount: z.number().min(0).default(0),  // Travel advance received
    netPayable: z.number().default(0),            // Total - advance (can be negative)

    // --- Status Workflow ---
    status: TravelClaimStatusSchema,
    statusHistory: z.array(z.object({
        status: TravelClaimStatusSchema,
        timestamp: z.string().datetime(),
        actorId: z.string().optional(),
        comments: z.string().optional(),
    })),
    approvalChain: z.array(ApproverSchema),
    currentApproverId: z.string().nullable().optional(),

    // --- Member Certification ---
    memberCertification: z.boolean().default(false),
    memberRemarks: z.string().nullable().optional(),

    // --- Timestamps ---
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    submittedAt: z.string().datetime().nullable().optional(),

    // --- Sync Metadata ---
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
    localModifiedAt: z.string().datetime().nullable().optional(),
});
export type TravelClaim = z.infer<typeof TravelClaimSchema>;

// =============================================================================
// WIZARD STEP VALIDATION SCHEMAS
// =============================================================================

/** Step 1: Trip Details — dates, locations, travel type/mode */
export const Step1TripSchema = TravelClaimSchema.pick({
    travelType: true,
    departureDate: true,
    returnDate: true,
    departureLocation: true,
    destinationLocation: true,
    isOconus: true,
    travelMode: true,
    orderNumber: true,
});

/** Step 2: Lodging — lodging expenses and TLE (PCS) */
export const Step2LodgingSchema = z.object({
    lodgingExpenses: z.array(ExpenseSchema).default([]),
    tleDays: z.number().int().min(0).max(14).default(0),
    tleAmount: z.number().min(0).default(0),
});

/** Step 3: Fuel & Transportation — fuel, tolls, parking, rental, airfare */
export const Step3FuelSchema = z.object({
    transportationExpenses: z.array(ExpenseSchema).default([]),
    maltAmount: z.number().min(0).default(0),
    maltMiles: z.number().int().min(0).default(0),
});

/** Step 4: Meals & Per Diem — daily M&IE, meal deductions */
export const Step4MealsSchema = z.object({
    perDiemDays: z.array(PerDiemDaySchema).default([]),
    mealsAndIncidentals: MealsAndIncidentalsSummarySchema.optional(),
});

/** Step 5: Review & Certification — pre-submit checks, member remarks */
export const Step5ReviewSchema = z.object({
    memberCertification: z.boolean().refine((v) => v === true, {
        message: 'You must certify the claim is accurate per 31 U.S.C. §3729',
    }),
    memberRemarks: z.string().nullable().optional(),
    totalClaimAmount: z.number().min(0),
    advanceAmount: z.number().min(0).default(0),
    netPayable: z.number(),
});

// =============================================================================
// STORE STATE SHAPE (Zustand)
// =============================================================================

/**
 * Travel Claim domain store slice.
 * Mirrors the `MyAdminState` pattern from schema.ts.
 */
export interface TravelClaimState {
    travelClaims: Record<string, TravelClaim>;   // Indexed by claim ID
    userClaimIds: string[];                       // Current user's claim IDs
    activeDraftId: string | null;                 // Wizard active draft
    lastClaimSyncAt: string | null;
    isSyncingClaims: boolean;
}

// =============================================================================
// API PAYLOADS
// =============================================================================

/**
 * Payload for creating a new travel claim (initial draft).
 * Minimal fields required to start the wizard.
 */
export const CreateTravelClaimPayloadSchema = z.object({
    travelType: TravelTypeSchema,
    departureDate: z.string().datetime(),
    returnDate: z.string().datetime(),
    departureLocation: z.string().min(1),
    destinationLocation: z.string().min(1),
    isOconus: z.boolean().default(false),
    travelMode: TravelModeSchema,
    orderNumber: z.string().optional(),
});
export type CreateTravelClaimPayload = z.infer<typeof CreateTravelClaimPayloadSchema>;

/**
 * Payload for updating an existing travel claim draft.
 * All fields optional — supports partial section saves.
 */
export const UpdateTravelClaimPayloadSchema = z.object({
    claimId: z.string(),
    patch: TravelClaimSchema.partial().omit({
        id: true,
        userId: true,
        createdAt: true,
        lastSyncTimestamp: true,
        syncStatus: true,
    }),
});
export type UpdateTravelClaimPayload = z.infer<typeof UpdateTravelClaimPayloadSchema>;

/**
 * Payload for final submission of a completed travel claim.
 * Requires member certification per 31 U.S.C. §3729 (False Claims Act).
 */
export const SubmitTravelClaimPayloadSchema = z.object({
    claimId: z.string(),
    memberCertification: z.literal(true),
    memberRemarks: z.string().max(1000).optional(),
});
export type SubmitTravelClaimPayload = z.infer<typeof SubmitTravelClaimPayloadSchema>;

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

// Re-use existing ApiResponse<> generics from @/types/api
import type { ApiResponse, PaginatedApiResponse } from './api';

export type GetTravelClaimsResponse = PaginatedApiResponse<TravelClaim>;
export type GetTravelClaimResponse = ApiResponse<TravelClaim>;

/**
 * Travel claim submission response with disbursement tracking.
 */
export interface SubmitTravelClaimResponse {
    success: true;
    data: {
        claimId: string;
        status: 'pending';
        submittedAt: string;
        estimatedDisbursementDate: string;  // Expected DFAS payment date
        nextApproverId: string;
        nextApproverName: string;
    };
}
