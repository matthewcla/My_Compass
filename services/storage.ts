import * as SQLite from 'expo-sqlite';
import {
  Billet,
  Application,
  LeaveRequest,
  initializeSQLiteTables,
  BilletSchema,
  ApplicationSchema,
  LeaveRequestSchema,
} from '@/types/schema';

const DB_NAME = 'my_compass.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  return dbInstance;
};

export const initDatabase = async () => {
  const db = await getDB();
  await initializeSQLiteTables(db);
};

// Helper to run raw queries (since we're wrapping direct SQL from schema)
// In a real app, we might use a query builder, but here we map manually to match the schema's SQL definitions.

// =============================================================================
// BILLET SERVICE
// =============================================================================

export const saveBillet = async (billet: Billet): Promise<void> => {
  const db = await getDB();
  const sql = `
    INSERT OR REPLACE INTO billets (
      id, title, uic, location, pay_grade, nec, designator, duty_type,
      report_not_later_than, billet_description,
      compass_match_score, compass_contextual_narrative, compass_is_buy_it_now_eligible,
      compass_lock_status, compass_lock_expires_at, compass_locked_by_user_id,
      last_sync_timestamp, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  await db.runAsync(
    sql,
    billet.id,
    billet.title,
    billet.uic,
    billet.location,
    billet.payGrade,
    billet.nec || null,
    billet.designator || null,
    billet.dutyType || null,
    billet.reportNotLaterThan || null,
    billet.billetDescription || null,
    billet.compass.matchScore,
    billet.compass.contextualNarrative,
    billet.compass.isBuyItNowEligible ? 1 : 0,
    billet.compass.lockStatus,
    billet.compass.lockExpiresAt || null,
    billet.compass.lockedByUserId || null,
    billet.lastSyncTimestamp,
    billet.syncStatus
  );
};

export const getBillet = async (id: string): Promise<Billet | null> => {
  const db = await getDB();
  const result = await db.getFirstAsync<any>('SELECT * FROM billets WHERE id = ?', id);
  if (!result) return null;

  return mapRowToBillet(result);
};

export const getAllBillets = async (): Promise<Billet[]> => {
  const db = await getDB();
  const results = await db.getAllAsync<any>('SELECT * FROM billets');
  return results.map(mapRowToBillet);
};

const mapRowToBillet = (row: any): Billet => {
  return BilletSchema.parse({
    id: row.id,
    title: row.title,
    uic: row.uic,
    location: row.location,
    payGrade: row.pay_grade,
    nec: row.nec,
    designator: row.designator,
    dutyType: row.duty_type,
    reportNotLaterThan: row.report_not_later_than,
    billetDescription: row.billet_description,
    compass: {
      matchScore: row.compass_match_score,
      contextualNarrative: row.compass_contextual_narrative,
      isBuyItNowEligible: Boolean(row.compass_is_buy_it_now_eligible),
      lockStatus: row.compass_lock_status,
      lockExpiresAt: row.compass_lock_expires_at,
      lockedByUserId: row.compass_locked_by_user_id,
    },
    lastSyncTimestamp: row.last_sync_timestamp,
    syncStatus: row.sync_status,
  });
};

// =============================================================================
// APPLICATION SERVICE
// =============================================================================

export const saveApplication = async (app: Application): Promise<void> => {
  const db = await getDB();
  const sql = `
    INSERT OR REPLACE INTO applications (
      id, billet_id, user_id, status, status_history,
      optimistic_lock_token, lock_requested_at, lock_expires_at,
      personal_statement, preference_rank, submitted_at,
      server_confirmed_at, server_rejection_reason,
      created_at, updated_at, last_sync_timestamp, sync_status, local_modified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  await db.runAsync(
    sql,
    app.id,
    app.billetId,
    app.userId,
    app.status,
    JSON.stringify(app.statusHistory),
    app.optimisticLockToken || null,
    app.lockRequestedAt || null,
    app.lockExpiresAt || null,
    app.personalStatement || null,
    app.preferenceRank || null,
    app.submittedAt || null,
    app.serverConfirmedAt || null,
    app.serverRejectionReason || null,
    app.createdAt,
    app.updatedAt,
    app.lastSyncTimestamp,
    app.syncStatus,
    app.localModifiedAt || null
  );
};

export const getApplication = async (id: string): Promise<Application | null> => {
  const db = await getDB();
  const result = await db.getFirstAsync<any>('SELECT * FROM applications WHERE id = ?', id);
  if (!result) return null;
  return mapRowToApplication(result);
};

export const getUserApplications = async (userId: string): Promise<Application[]> => {
  const db = await getDB();
  const results = await db.getAllAsync<any>('SELECT * FROM applications WHERE user_id = ?', userId);
  return results.map(mapRowToApplication);
};

const mapRowToApplication = (row: any): Application => {
  return ApplicationSchema.parse({
    id: row.id,
    billetId: row.billet_id,
    userId: row.user_id,
    status: row.status,
    statusHistory: JSON.parse(row.status_history),
    optimisticLockToken: row.optimistic_lock_token,
    lockRequestedAt: row.lock_requested_at,
    lockExpiresAt: row.lock_expires_at,
    personalStatement: row.personal_statement,
    preferenceRank: row.preference_rank,
    submittedAt: row.submitted_at,
    serverConfirmedAt: row.server_confirmed_at,
    serverRejectionReason: row.server_rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSyncTimestamp: row.last_sync_timestamp,
    syncStatus: row.sync_status,
    localModifiedAt: row.local_modified_at,
  });
};

// =============================================================================
// LEAVE REQUEST SERVICE
// =============================================================================

export const saveLeaveRequest = async (request: LeaveRequest): Promise<void> => {
  const db = await getDB();
  const sql = `
    INSERT OR REPLACE INTO leave_requests (
      id, user_id, start_date, end_date, charge_days, leave_type,
      leave_address, leave_phone_number, emergency_contact,
      mode_of_travel, destination_country, member_remarks,
      status, status_history, approval_chain, current_approver_id,
      return_reason, denial_reason, created_at, updated_at, submitted_at,
      last_sync_timestamp, sync_status, local_modified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  await db.runAsync(
    sql,
    request.id,
    request.userId,
    request.startDate,
    request.endDate,
    request.chargeDays,
    request.leaveType,
    request.leaveAddress,
    request.leavePhoneNumber,
    JSON.stringify(request.emergencyContact),
    request.modeOfTravel || null,
    request.destinationCountry,
    request.memberRemarks || null,
    request.status,
    JSON.stringify(request.statusHistory),
    JSON.stringify(request.approvalChain),
    request.currentApproverId || null,
    request.returnReason || null,
    request.denialReason || null,
    request.createdAt,
    request.updatedAt,
    request.submittedAt || null,
    request.lastSyncTimestamp,
    request.syncStatus,
    request.localModifiedAt || null
  );
};

export const getLeaveRequest = async (id: string): Promise<LeaveRequest | null> => {
  const db = await getDB();
  const result = await db.getFirstAsync<any>('SELECT * FROM leave_requests WHERE id = ?', id);
  if (!result) return null;
  return mapRowToLeaveRequest(result);
};

export const getUserLeaveRequests = async (userId: string): Promise<LeaveRequest[]> => {
  const db = await getDB();
  const results = await db.getAllAsync<any>('SELECT * FROM leave_requests WHERE user_id = ?', userId);
  return results.map(mapRowToLeaveRequest);
};

const mapRowToLeaveRequest = (row: any): LeaveRequest => {
  return LeaveRequestSchema.parse({
    id: row.id,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date,
    chargeDays: row.charge_days,
    leaveType: row.leave_type,
    leaveAddress: row.leave_address,
    leavePhoneNumber: row.leave_phone_number,
    emergencyContact: JSON.parse(row.emergency_contact),
    modeOfTravel: row.mode_of_travel,
    destinationCountry: row.destination_country,
    memberRemarks: row.member_remarks,
    status: row.status,
    statusHistory: JSON.parse(row.status_history),
    approvalChain: JSON.parse(row.approval_chain),
    currentApproverId: row.current_approver_id,
    returnReason: row.return_reason,
    denialReason: row.denial_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    lastSyncTimestamp: row.last_sync_timestamp,
    syncStatus: row.sync_status,
    localModifiedAt: row.local_modified_at,
  });
};
