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

/**
 * Zod schema for User.
 * Matches the User interface.
 */
export const UserSchema = z.object({
    id: z.string().uuid(),
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
    rank: z.string().optional(), // Pay grade or rank abbreviation
    rating: z.string().optional(), // Enlisted rating (e.g., "IT", "ET")
    title: z.string().optional(), // Billet title / role
    uic: z.string().optional(), // Current unit
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
    preferences: z.object({
        regions: z.array(z.string()).optional(),
        dutyTypes: z.array(z.string()).optional(),
    }).optional(),
    privacyMode: z.boolean().optional(),
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
});

/**
 * Normalized User entity for referential integrity.
 * Used by approval chains, lock ownership, and actor tracking.
 */
export type User = z.infer<typeof UserSchema>;

export type UserPreferences = NonNullable<User['preferences']>;
