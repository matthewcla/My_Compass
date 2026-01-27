import { z } from 'zod';
import { SyncStatus, SyncStatusSchema } from './schema';

/**
 * Normalized User entity for referential integrity.
 * Used by approval chains, lock ownership, and actor tracking.
 */
export interface User {
    /**
     * Unique identifier for the user (UUID).
     */
    id: string;

    /**
     * DoD ID (EDIPI) for CAC authentication.
     * @security PII - STRICTLY FORBIDDEN IN LOGS
     */
    dodId?: string;

    /**
     * Display name (e.g., "CAPT J. Smith").
     * @security PII - STRICTLY FORBIDDEN IN LOGS
     */
    displayName: string;

    /**
     * Email address.
     * @security PII - STRICTLY FORBIDDEN IN LOGS
     */
    email?: string;

    /**
     * Pay grade or rank abbreviation.
     */
    rank?: string;

    /**
     * Billet title / role.
     */
    title?: string;

    /**
     * Current unit (UIC).
     */
    uic?: string;

    /**
     * User preferences.
     */
    preferences?: {
        regions?: string[];
        dutyTypes?: string[];
    };

    /**
     * Whether to hide PII in greeting.
     */
    privacyMode?: boolean;

    /**
     * Timestamp of the last successful sync.
     */
    lastSyncTimestamp: string;

    /**
     * Sync status of the record.
     */
    syncStatus: SyncStatus;
}

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

export type UserPreferences = NonNullable<User['preferences']>;

/**
 * Zod schema for User.
 * Matches the User interface.
 */
export const UserSchema = z.object({
    id: z.string().uuid(),
    dodId: z.string().optional(), // DoD ID (EDIPI) for CAC authentication
    displayName: z.string(), // e.g., "CAPT J. Smith"
    email: z.string().email().optional(),
    rank: z.string().optional(), // Pay grade or rank abbreviation
    title: z.string().optional(), // Billet title / role
    uic: z.string().optional(), // Current unit
    preferences: z.object({
        regions: z.array(z.string()).optional(),
        dutyTypes: z.array(z.string()).optional(),
    }).optional(),
    privacyMode: z.boolean().optional(),
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
});
