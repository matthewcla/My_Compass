// types/schema.ts
// My Compass - Offline-First Data Layer Schema
// Phase 1: My Assignment (Transactional Market) + My Admin (Leave Module)

import { runMigrationSystem } from '@/services/migrations';
import { z } from 'zod';

// =============================================================================
// CORE SYNC INFRASTRUCTURE
// =============================================================================

/**
 * Sync status for all transactional records.
 * - synced: Record matches authoritative API state
 * - pending_upload: Local changes awaiting sync
 * - error: Sync failed, requires retry or manual intervention
 */
export const SyncStatusSchema = z.enum(['synced', 'pending_upload', 'error']);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

/**
 * Base mixin for all cacheable/syncable entities.
 * Applied to transactional records that require offline support.
 */
export const SyncMetadataSchema = z.object({
    lastSyncTimestamp: z.string().datetime(), // ISO 8601 timestamp
    syncStatus: SyncStatusSchema,
    localModifiedAt: z.string().datetime().optional(), // Tracks local edits for conflict detection
});
export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;

// =============================================================================
// NORMALIZED USER ENTITY
// =============================================================================

// User types moved to @/types/user.ts

// =============================================================================
// DASHBOARD CACHE
// =============================================================================

export const DashboardCacheSchema = z.object({
    userId: z.string(),
    data: z.string(), // JSON stringified DashboardData
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
});
export type DashboardCache = z.infer<typeof DashboardCacheSchema>;

// =============================================================================
// BILLET LOCK CONTEXT (Computed Helper)
// =============================================================================

/**
 * User-relative lock context for UI display logic.
 * Computed at runtime based on current userId and billet.compass.lockedByUserId.
 */
export interface BilletLockContext {
    /** Raw lock status from server */
    rawStatus: BilletLockStatus;
    /** Is the billet currently locked by anyone? */
    isLocked: boolean;
    /** Is the lock held by the current authenticated user? */
    isLockedByMe: boolean;
    /** Is the lock held by someone else? */
    isLockedByOther: boolean;
    /** Can the current user apply to this billet? */
    canApply: boolean;
    /** Human-readable lock message for UI */
    lockMessage: string | null;
    /** Time remaining on lock (if applicable) */
    lockExpiresIn: number | null; // milliseconds
}

/**
 * Helper function to compute BilletLockContext.
 * @param billet - The billet to evaluate
 * @param currentUserId - The authenticated user's ID
 */
export function computeBilletLockContext(
    billet: Billet,
    currentUserId: string
): BilletLockContext {
    return {
        rawStatus: 'open',
        isLocked: false,
        isLockedByMe: false,
        isLockedByOther: false,
        canApply: true,
        lockMessage: null,
        lockExpiresIn: null,
    };
}

// =============================================================================
// SQLITE TABLE DEFINITIONS
// =============================================================================

/**
 * SQLite table schemas for expo-sqlite persistence.
 * These map directly to Zod schemas but use SQLite-compatible types.
 */
export const SQLiteTableDefinitions = {
    users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      dod_id TEXT,
      display_name TEXT NOT NULL,
      email TEXT,
      rank TEXT,
      title TEXT,
      uic TEXT,
      prd TEXT, -- ISO 8601
      seaos TEXT, -- ISO 8601
      preferences TEXT, -- JSON object
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error'))
    );
  `,

    dashboard_cache: `
    CREATE TABLE IF NOT EXISTS dashboard_cache (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `,

    billets: `
    CREATE TABLE IF NOT EXISTS billets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      uic TEXT NOT NULL,
      location TEXT NOT NULL,
      pay_grade TEXT NOT NULL,
      nec TEXT,
      designator TEXT,
      duty_type TEXT,
      report_not_later_than TEXT,
      billet_description TEXT,
      -- Compass metadata (denormalized JSON for simplicity)
      compass_match_score REAL NOT NULL,
      compass_contextual_narrative TEXT NOT NULL,
      compass_is_buy_it_now_eligible INTEGER NOT NULL,
      compass_lock_status TEXT NOT NULL CHECK(compass_lock_status IN ('open', 'locked_by_user', 'locked_by_other')),
      compass_lock_expires_at TEXT,
      compass_locked_by_user_id TEXT,
      -- Sync metadata
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error'))
    );
    CREATE INDEX IF NOT EXISTS idx_billets_uic ON billets(uic);
    CREATE INDEX IF NOT EXISTS idx_billets_pay_grade ON billets(pay_grade);
  `,

    applications: `
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      billet_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft', 'optimistically_locked', 'submitted', 'confirmed', 'rejected_race_condition', 'withdrawn', 'declined')),
      status_history TEXT NOT NULL, -- JSON array
      optimistic_lock_token TEXT,
      lock_requested_at TEXT,
      lock_expires_at TEXT,
      personal_statement TEXT,
      preference_rank INTEGER,
      submitted_at TEXT,
      server_confirmed_at TEXT,
      server_rejection_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error')),
      local_modified_at TEXT,
      FOREIGN KEY (billet_id) REFERENCES billets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_applications_billet_id ON applications(billet_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  `,

    assignment_decisions: `
    CREATE TABLE IF NOT EXISTS assignment_decisions (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL, -- JSON record of billetId -> decision
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `,

    assignment_decisions_entries: `
    CREATE TABLE IF NOT EXISTS assignment_decisions_entries (
      user_id TEXT NOT NULL,
      billet_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      PRIMARY KEY (user_id, billet_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_assignment_decisions_entries_user_id ON assignment_decisions_entries(user_id);
  `,

    leave_balances: `
    CREATE TABLE IF NOT EXISTS leave_balances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      current_balance REAL NOT NULL,
      use_or_lose_days REAL NOT NULL,
      use_or_lose_expiration_date TEXT NOT NULL,
      earned_this_fiscal_year REAL NOT NULL,
      used_this_fiscal_year REAL NOT NULL,
      projected_end_of_year_balance REAL NOT NULL,
      max_carry_over REAL NOT NULL DEFAULT 60,
      balance_as_of_date TEXT NOT NULL,
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `,

    leave_requests: `
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      charge_days REAL NOT NULL,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('annual', 'emergency', 'convalescent', 'terminal', 'parental', 'bereavement', 'adoption', 'ptdy', 'other')),
      leave_address TEXT NOT NULL,
      leave_phone_number TEXT NOT NULL,
      emergency_contact TEXT, -- JSON object (Encrypted)
      duty_section TEXT,
      ration_status TEXT,
      pre_review_checks TEXT, -- JSON object
      mode_of_travel TEXT,
      destination_country TEXT NOT NULL DEFAULT 'USA',
      normal_working_hours TEXT DEFAULT '0700-1600',
      leave_in_conus INTEGER DEFAULT 1,
      member_remarks TEXT,
      status TEXT NOT NULL CHECK(status IN ('draft', 'pending', 'approved', 'denied', 'returned', 'cancelled')),
      status_history TEXT NOT NULL, -- JSON array
      approval_chain TEXT NOT NULL, -- JSON array
      current_approver_id TEXT,
      return_reason TEXT,
      denial_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      submitted_at TEXT,
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error')),
      local_modified_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (current_approver_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
  `,

    leave_defaults: `
    CREATE TABLE IF NOT EXISTS leave_defaults (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL, -- Encrypted JSON blob
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `,

    inbox_messages: `
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      metadata TEXT, -- JSON
      last_sync_timestamp TEXT,
      sync_status TEXT
    );
  `,

    career_events: `
    CREATE TABLE IF NOT EXISTS career_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      attendance_status TEXT NOT NULL,
      priority TEXT NOT NULL,
      qr_token TEXT,
      last_sync_timestamp TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK(sync_status IN ('synced', 'pending_upload', 'error'))
    );
    CREATE INDEX IF NOT EXISTS idx_career_events_date ON career_events(date);
  `,
} as const;

/**
 * Initialize all SQLite tables.
 * @param db - expo-sqlite database instance
 */
export async function initializeSQLiteTables(db: { execAsync: (sql: string) => Promise<void> }): Promise<void> {
    // Create all tables
    for (const tableDef of Object.values(SQLiteTableDefinitions)) {
        await db.execAsync(tableDef);
    }

    // Run versioned migration system
    await runMigrationSystem(db);
}

// =============================================================================
// DOMAIN A: MY ASSIGNMENT (TRANSACTIONAL MARKET)
// =============================================================================

// -----------------------------------------------------------------------------
// Billet (Job Posting)
// -----------------------------------------------------------------------------

/**
 * Lock status for Buy-It-Now eligibility.
 * - open: Billet available for application
 * - locked_by_user: Current user has initiated BIN lock
 * - locked_by_other: Another user has locked this billet
 */
export const BilletLockStatusSchema = z.enum(['open', 'locked_by_user', 'locked_by_other']);
export type BilletLockStatus = z.infer<typeof BilletLockStatusSchema>;

/**
 * Compass-specific AI enhancement fields for billet matching.
 */
export const CompassBilletMetadataSchema = z.object({
    matchScore: z.number().min(0).max(100), // AI-computed fit score (0-100)
    contextualNarrative: z.string(), // AI-generated "Why this fits you" explanation
});
export type CompassBilletMetadata = z.infer<typeof CompassBilletMetadataSchema>;

/**
 * Standard Navy billet/job posting fields.
 */
export const BilletSchema = z.object({
    id: z.string(),
    title: z.string(), // Job title
    uic: z.string(), // Unit Identification Code
    location: z.string(), // Geographic location
    payGrade: z.string(), // E-1 through O-10, W-1 through W-5
    nec: z.string().nullable().optional(), // Navy Enlisted Classification code
    designator: z.string().nullable().optional(), // Officer designator code
    dutyType: z.string().nullable().optional(), // Sea, Shore, Overseas, etc.
    reportNotLaterThan: z.string().datetime().nullable().optional(), // RNLTD
    billetDescription: z.string().nullable().optional(),

    // Compass AI Enhancements
    compass: CompassBilletMetadataSchema,

    // Status for MyNavy Assignment Projection
    advertisementStatus: z.enum(['projected', 'confirmed_open', 'closed']).default('confirmed_open'),

    // Sync metadata (billets are reference data, but we cache locally)
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
});
export type Billet = z.infer<typeof BilletSchema>;

// -----------------------------------------------------------------------------
// Application (Transaction)
// -----------------------------------------------------------------------------

/**
 * Application state machine for Slate/Cycle handling.
 * 
 * Workflow:
 * 1. draft → User is composing application locally on the Slate
 * 2. submitted → User submitted the Slate
 * 3. confirmed → Application accepted by detailer
 * 4. withdrawn → User withdrew application
 * 5. declined → Detailer rejected application
 */
export const ApplicationStatusSchema = z.enum([
    'draft',
    'submitted',
    'confirmed',
    'withdrawn',
    'declined',
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

/**
 * Application record representing a user's intent to fill a billet.
 */
export const ApplicationSchema = z.object({
    id: z.string(),
    billetId: z.string(),
    userId: z.string(),

    // State machine
    status: ApplicationStatusSchema,
    statusHistory: z.array(z.object({
        status: ApplicationStatusSchema,
        timestamp: z.string().datetime(),
        reason: z.string().optional(),
    })),

    // Application content
    personalStatement: z.string().optional(),
    preferenceRank: z.number().int().min(1).optional(), // User's ranking among their applications
    submittedAt: z.string().datetime().optional(),

    // Server response tracking
    serverConfirmedAt: z.string().datetime().optional(),
    serverRejectionReason: z.string().optional(),

    // Timestamps
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),

    // Sync metadata
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
    localModifiedAt: z.string().datetime().optional(),
});
export type Application = z.infer<typeof ApplicationSchema>;

// =============================================================================
// DOMAIN C: CAREER (CALENDAR & EVENTS)
// =============================================================================

export const EventPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'STANDARD']);
export type EventPriority = z.infer<typeof EventPrioritySchema>;

export const CareerEventTypeSchema = z.enum([
    'ADVANCEMENT_EXAM',
    'STATUTORY_BOARD',
    'ADMIN_BOARD',
    'ATTENDANCE_MUSTER'
]);
export type CareerEventType = z.infer<typeof CareerEventTypeSchema>;

export const AttendanceStatusSchema = z.enum(['PENDING', 'PRESENT', 'ABSENT', 'EXCUSED']);
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;

export const CareerEventSchema = z.object({
    eventId: z.string(),
    eventType: CareerEventTypeSchema,
    title: z.string(),
    date: z.string().datetime(),
    location: z.string(),
    attendanceStatus: AttendanceStatusSchema,
    priority: EventPrioritySchema,
    qr_token: z.string().optional(),

    // Sync metadata
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
});
export type CareerEvent = z.infer<typeof CareerEventSchema>;

// =============================================================================
// DOMAIN B: MY ADMIN (LEAVE MODULE)
// =============================================================================

// -----------------------------------------------------------------------------
// Leave Balance
// -----------------------------------------------------------------------------

/**
 * Leave balance snapshot for the authenticated user.
 */
export const LeaveBalanceSchema = z.object({
    id: z.string(),
    userId: z.string(),

    // Core balance fields
    currentBalance: z.number().min(0), // Days currently available
    useOrLoseDays: z.number().min(0), // Days that will expire at fiscal year end
    useOrLoseExpirationDate: z.string().datetime(), // Typically Sep 30

    // Accrual tracking
    earnedThisFiscalYear: z.number().min(0),
    usedThisFiscalYear: z.number().min(0),
    projectedEndOfYearBalance: z.number(),

    // Maximum carry-over (typically 60 days)
    maxCarryOver: z.number().default(60),

    // Balance as-of date (server snapshot time)
    balanceAsOfDate: z.string().datetime(),

    // Sync metadata
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
});
export type LeaveBalance = z.infer<typeof LeaveBalanceSchema>;

// -----------------------------------------------------------------------------
// Leave Request (Modeled after USAF LeaveWeb)
// -----------------------------------------------------------------------------

/**
 * Leave types per DoD standards.
 */
export const LeaveTypeSchema = z.enum([
    'annual', // Regular annual leave
    'emergency', // Emergency leave
    'convalescent', // Medical convalescent leave
    'terminal', // Terminal leave (separation/retirement)
    'parental', // Parental leave
    'bereavement', // Bereavement leave
    'adoption', // Adoption leave
    'ptdy', // Permissive TDY
    'other', // Other authorized absence
]);
export type LeaveType = z.infer<typeof LeaveTypeSchema>;

/**
 * Leave request status workflow.
 */
export const LeaveRequestStatusSchema = z.enum([
    'draft', // User composing, not yet submitted
    'pending', // Submitted, awaiting supervisor action
    'approved', // Approved by chain
    'denied', // Denied by chain
    'returned', // Returned for corrections
    'cancelled', // Cancelled by member after submission
]);
export type LeaveRequestStatus = z.infer<typeof LeaveRequestStatusSchema>;

/**
 * Emergency contact information (required for leave requests).
 */
export const EmergencyContactSchema = z.object({
    name: z.string(),
    relationship: z.string(),
    phoneNumber: z.string(),
    altPhoneNumber: z.string().optional(),
    address: z.string().optional(),
});
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

/**
 * Approval chain member.
 */
export const ApproverSchema = z.object({
    id: z.string(),
    name: z.string(),
    title: z.string().optional(), // e.g., "Division Officer", "Department Head"
    action: z.enum(['pending', 'approved', 'denied', 'returned']).optional(),
    actionTimestamp: z.string().datetime().optional(),
    comments: z.string().optional(),
});
export type Approver = z.infer<typeof ApproverSchema>;

/**
 * Leave request record (modeled after USAF LeaveWeb structure).
 */
export const RationStatusSchema = z.enum(['commuted', 'in_kind', 'not_applicable']);
export type RationStatus = z.infer<typeof RationStatusSchema>;

export const PreReviewChecksSchema = z.object({
    hasReadPolicy: z.boolean(),
    hasInformalApproval: z.boolean(),
    isReadyToSubmit: z.boolean(),
});
export type PreReviewChecks = z.infer<typeof PreReviewChecksSchema>;

/**
 * Leave request record (modeled after USAF LeaveWeb structure).
 */
export const LeaveRequestSchema = z.object({
    id: z.string(),
    userId: z.string(),

    // Leave period
    startDate: z.string().datetime(), // Leave start date/time
    endDate: z.string().datetime(), // Leave end date/time
    chargeDays: z.number().min(0), // Actual chargeable days (excludes weekends/holidays)

    // Leave details
    leaveType: LeaveTypeSchema,
    leaveAddress: z.string(), // Where member will be during leave
    leavePhoneNumber: z.string(),

    // Command Details
    dutySection: z.string().optional(), // e.g. "N1 Admin"
    deptDiv: z.string().optional(),
    dutyPhone: z.string().optional(),
    rationStatus: RationStatusSchema.optional(),

    // Emergency contact (required for submission, optional for draft)
    emergencyContact: EmergencyContactSchema.optional(),

    // Transportation
    modeOfTravel: z.string().optional(), // POV, Commercial Air, etc.
    destinationCountry: z.string().default('USA'),
    normalWorkingHours: z.string().default('0700-1600'),
    leaveInConus: z.boolean().default(true),

    // Remarks
    memberRemarks: z.string().nullable().optional(),

    // Checklist
    preReviewChecks: PreReviewChecksSchema.optional(),

    // Status workflow
    status: LeaveRequestStatusSchema,
    statusHistory: z.array(z.object({
        status: LeaveRequestStatusSchema,
        timestamp: z.string().datetime(),
        actorId: z.string().optional(),
        comments: z.string().optional(),
    })),

    // Approval chain
    approvalChain: z.array(ApproverSchema),
    currentApproverId: z.string().nullable().optional(), // Who needs to act next

    // Return reason (if status = returned)
    returnReason: z.string().nullable().optional(),

    // Denial reason (if status = denied)
    denialReason: z.string().nullable().optional(),

    // Timestamps
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    submittedAt: z.string().datetime().nullable().optional(),

    // Sync metadata
    lastSyncTimestamp: z.string().datetime(),
    syncStatus: SyncStatusSchema,
    localModifiedAt: z.string().datetime().nullable().optional(),
});
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

// =============================================================================
// COMPOSITE STORE TYPES (for Zustand)
// =============================================================================

/**
 * My Assignment domain store slice.
 */
export interface MyAssignmentState {
    billets: Record<string, Billet>; // Indexed by billet ID
    applications: Record<string, Application>; // Indexed by application ID
    userApplicationIds: string[]; // Quick lookup of current user's applications
    lastBilletSyncAt: string | null;
    isSyncingBillets: boolean;
    isSyncingApplications: boolean;
}

/**
 * My Admin (Leave) domain store slice.
 */
export interface MyAdminState {
    leaveBalance: LeaveBalance | null;
    leaveRequests: Record<string, LeaveRequest>; // Indexed by request ID
    userLeaveRequestIds: string[]; // Quick lookup of current user's requests
    userDefaults: LeaveRequestDefaults | null;
    lastBalanceSyncAt: string | null;
    isSyncingBalance: boolean;
    isSyncingRequests: boolean;
}

// =============================================================================
// WIZARD STEP VALIDATION SCHEMAS
// =============================================================================

export const Step1IntentSchema = LeaveRequestSchema.pick({
    leaveType: true,
    startDate: true,
    endDate: true,
    chargeDays: true,
    leaveInConus: true,
    destinationCountry: true,
});

export const Step2ContactSchema = LeaveRequestSchema.pick({
    leaveAddress: true,
    leavePhoneNumber: true,
    modeOfTravel: true,
});

export const Step3CommandSchema = LeaveRequestSchema.pick({
    dutySection: true,
    deptDiv: true,
    dutyPhone: true,
    rationStatus: true,
});

export const Step4SafetySchema = LeaveRequestSchema.pick({
    emergencyContact: true,
    memberRemarks: true,
}).extend({
    emergencyContact: EmergencyContactSchema,
});

/**
 * Smart Defaults for Leave Requests.
 * Subset of LeaveRequest that is persisted to speed up data entry.
 */
export const LeaveRequestDefaultsSchema = LeaveRequestSchema.pick({
    leaveAddress: true,
    leavePhoneNumber: true,
    emergencyContact: true,
    dutySection: true,
    deptDiv: true,
    dutyPhone: true,
    rationStatus: true,
});
export type LeaveRequestDefaults = z.infer<typeof LeaveRequestDefaultsSchema>;

/**
 * Root store interface combining all domain slices.
 */
export interface MyCompassStore {
    assignment: MyAssignmentState;
    admin: MyAdminState;
}

// =============================================================================
// SWIPE DECISIONS
// =============================================================================

export const SwipeDecisionSchema = z.enum(['like', 'nope', 'super']);
export type SwipeDecision = z.infer<typeof SwipeDecisionSchema>;
