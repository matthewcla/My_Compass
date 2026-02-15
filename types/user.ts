import { z } from 'zod';
import { SyncStatusSchema } from './schema';

export const PREFERENCE_REGIONS = [
    'Mid-Atlantic',
    'Southeast',
    'Southwest',
    'Northwest',
    'Hawaii',
    'Europe',
    'Pacific',
    'Japan'
] as const;

export const DUTY_TYPES = [
    'Sea',
    'Shore',
    'Overseas',
    'Special'
] as const;

export const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'] as const;
export const HOUSING_TYPES = ['on_base', 'off_base', 'barracks', 'ship', 'government', 'not_yet_secured'] as const;
export const DUTY_STATION_TYPES = ['CONUS', 'OCONUS', 'AFLOAT'] as const;
export const DEPENDENT_RELATIONSHIPS = ['spouse', 'child', 'parent', 'other'] as const;

/**
 * Financial profile for PCS entitlement calculations.
 * Contains pay grade, base pay, and dependent information.
 */
export interface FinancialProfile {
    payGrade: string;
    basePay: number;
    hasDependents: boolean;
    dependentsCount: number;
}

// ─── Reusable sub-schemas ────────────────────────────────

const AddressSchema = z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
});

const EmergencyContactSchema = z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
    address: AddressSchema.optional(),
});

const DutyStationSchema = z.object({
    name: z.string(),           // e.g. "USS Gerald R. Ford"
    address: z.string(),        // Full street address
    zip: z.string(),            // BAH zip
    type: z.enum(DUTY_STATION_TYPES),
});

const DependentDetailSchema = z.object({
    id: z.string(),
    name: z.string(),
    relationship: z.enum(DEPENDENT_RELATIONSHIPS),
    dob: z.string(),            // ISO date string
    efmpEnrolled: z.boolean().optional(),
    address: AddressSchema.optional(),
});

const BeneficiarySchema = z.object({
    id: z.string(),
    name: z.string(),
    relationship: z.string(),
    address: AddressSchema.optional(),
    percentage: z.number(),       // 0–100 (death gratuity / unpaid pay)
});

const PADDSchema = z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    address: AddressSchema.optional(),
    phone: z.string().optional(),
});

const HousingSchema = z.object({
    type: z.enum(HOUSING_TYPES),
    address: z.string().optional(),
    zip: z.string().optional(), // BAH calculation zip
});

const POVSchema = z.object({
    id: z.string(),
    make: z.string(),
    model: z.string(),
    year: z.number(),
    licensePlate: z.string().optional(),
});

// ─── Main User Schema ────────────────────────────────────

/**
 * Zod schema for User.
 * Includes all PCS-relevant profile data — this is the NSIPS replacement surface.
 * The user edits this data directly in My Compass instead of NSIPS.
 */
export const UserSchema = z.object({
    id: z.string(),
    /**
     * DoD ID (EDIPI) for CAC authentication.
     * @security PII - STRICTLY FORBIDDEN IN LOGS
     */
    dodId: z.string().optional(),
    /**
     * Display name (e.g., "CAPT J. Smith").
     * @security PII - STRICTLY FORBIDDEN IN LOGS
     */
    displayName: z.string(),
    /**
     * Email address.
     * @security PII - STRICTLY FORBIDDEN IN LOGS
     */
    email: z.string().email().optional(),
    rank: z.string().optional(),    // Pay grade or rank abbreviation
    rating: z.string().optional(),  // Enlisted rating (e.g., "IT", "ET")
    title: z.string().optional(),   // Billet title / role

    // ── Contact ──────────────────────────────────────
    /** @security PII - STRICTLY FORBIDDEN IN LOGS */
    phone: z.string().optional(),
    /** @security PII - STRICTLY FORBIDDEN IN LOGS */
    altPhone: z.string().optional(),
    /** @security PII - STRICTLY FORBIDDEN IN LOGS */
    emergencyContact: EmergencyContactSchema.optional(),
    /** @security PII */
    homeAddress: AddressSchema.optional(),
    mailingAddress: AddressSchema.optional(),

    // ── Service Record ───────────────────────────────
    maritalStatus: z.enum(MARITAL_STATUSES).optional(),
    uic: z.string().optional(),     // Current unit identification code
    dutyStation: DutyStationSchema.optional(),

    // ── Service Record (Extended — NAVPERS form support) ─
    /** @security PII - STRICTLY FORBIDDEN IN LOGS */
    dob: z.string().optional(),                                // ISO date — Date of Birth
    branchClass: z.string().optional(),                        // e.g. "USN", "USNR"
    enlistmentDate: z.string().optional(),                     // ISO date — original enlistment
    originalTermYears: z.number().optional(),                  // Original contract length
    serviceStatus: z.enum(['active', 'inactive']).optional(),  // Active / Inactive duty
    pebd: z.string().optional(),                               // Pay Entry Base Date
    adsd: z.string().optional(),                               // Active Duty Service Date
    combatZone: z.boolean().optional(),                        // Currently in combat zone
    citizenship: z.string().optional(),                        // e.g. "US"
    homeOfRecord: z.string().optional(),                       // City, State
    dateOfPaygrade: z.string().optional(),                     // ISO date — date of current paygrade
    totalActiveService: z.string().optional(),                 // "YY/MM/DD" format
    totalInactiveService: z.string().optional(),               // "YY/MM/DD" format
    lastDischargeDate: z.string().optional(),                  // ISO date
    rado: z.string().optional(),                               // RADO months/days
    /**
     * Projected Rotation Date (PRD).
     * Critical for "Detailing Countdown" logic.
     * - 12 months prior: Negotiation Window
     * - 15 months prior: Preparatory Phase
     */
    prd: z.string().datetime().optional(),
    /**
     * Soft End of Active Obligated Service (SEAOS).
     * Used for retention logic and career timing.
     */
    seaos: z.string().datetime().optional(),
    /**
     * End of Active Obligated Service (EAOS).
     * Hard expiration of current contract.
     */
    eaos: z.string().datetime().optional(),

    // ── Dependents ───────────────────────────────────
    /** @deprecated Use dependentDetails for structured data. Kept for backward compat. */
    dependents: z.number().optional(),
    /** Structured dependent records with name, DOB, relationship, EFMP enrollment. */
    dependentDetails: z.array(DependentDetailSchema).optional(),

    // ── Housing & Vehicle ────────────────────────────
    housing: HousingSchema.optional(),
    /** Array of privately owned vehicles. */
    vehicles: z.array(POVSchema).optional(),

    // ── Medical / Check-in ───────────────────────────
    bloodType: z.string().optional(),
    shirtSize: z.string().optional(),

    // ── Page 2 — Beneficiaries & PADD ────────────────
    /** Death gratuity / unpaid pay beneficiaries. */
    beneficiaries: z.array(BeneficiarySchema).optional(),
    /** Person Authorized to Direct Disposition of remains. */
    padd: PADDSchema.optional(),
    efmpEnrolled: z.boolean().optional(),

    // ── Preferences & Meta ───────────────────────────
    preferences: z.object({
        regions: z.array(z.string()).optional(),
        dutyTypes: z.array(z.string()).optional(),
    }).optional(),
    privacyMode: z.boolean().optional(),
    financialProfile: z.object({
        payGrade: z.string(),
        basePay: z.number(),
        hasDependents: z.boolean(),
        dependentsCount: z.number(),
    }).optional(),
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
});

// Export sub-schema types for component props
export type Address = z.infer<typeof AddressSchema>;
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type DutyStation = z.infer<typeof DutyStationSchema>;
export type DependentDetail = z.infer<typeof DependentDetailSchema>;
export type Housing = z.infer<typeof HousingSchema>;
export type Beneficiary = z.infer<typeof BeneficiarySchema>;
export type PADD = z.infer<typeof PADDSchema>;
export type POV = z.infer<typeof POVSchema>;

/**
 * Normalized User entity for referential integrity.
 * Used by approval chains, lock ownership, and actor tracking.
 */
export type User = z.infer<typeof UserSchema>;

export type UserPreferences = NonNullable<User['preferences']>;
