import { decryptData, encryptData } from '@/lib/encryption';
import { CareerEvent } from '@/types/career';
import { DashboardData } from '@/types/dashboard';
import { InboxMessage } from '@/types/inbox';
import { DocumentCategory, HistoricalPCSOrder, PCSDocument } from '@/types/pcs';
import {
  Application,
  ApplicationSchema,
  Billet,
  BilletSchema,
  DashboardCacheSchema,
  initializeSQLiteTables,
  LeaveBalance,
  LeaveBalanceSchema,
  LeaveRequest,
  LeaveRequestDefaults,
  LeaveRequestDefaultsSchema,
  LeaveRequestSchema
} from '@/types/schema';
import { User, UserSchema } from '@/types/user';
import { safeJsonParse } from '@/utils/jsonUtils';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { DataIntegrityError, IStorageService } from './storage.interface';

const DB_NAME = 'my_compass.db';

// =============================================================================
// SQLITE IMPLEMENTATION
// =============================================================================

class SQLiteStorage implements IStorageService {
  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    const db = await this.getDB();
    const sql = `
      INSERT OR REPLACE INTO leave_requests (
        id, user_id, start_date, end_date, charge_days,
        leave_type, leave_address, leave_phone_number, emergency_contact,
        duty_section, ration_status, pre_review_checks, mode_of_travel,
        destination_country, normal_working_hours, leave_in_conus,
        member_remarks, status, status_history, approval_chain,
        current_approver_id, return_reason, denial_reason,
        created_at, updated_at, submitted_at,
        last_sync_timestamp, sync_status, local_modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    // Encrypt sensitive data
    let emergencyContactEncrypted = null;
    if (request.emergencyContact) {
      emergencyContactEncrypted = encryptData(JSON.stringify(request.emergencyContact));
    }

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
      emergencyContactEncrypted,
      request.dutySection || null,
      request.rationStatus || null,
      JSON.stringify(request.preReviewChecks || {}),
      request.modeOfTravel || null,
      request.destinationCountry || null,
      request.normalWorkingHours || null,
      request.leaveInConus ? 1 : 0,
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
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    const db = await this.getDB();
    try {
      const result = await db.getFirstAsync<any>('SELECT * FROM leave_requests WHERE id = ?', id);
      if (!result) return null;
      return this.mapRowToLeaveRequest(result);
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError(`Failed to parse LeaveRequest record for ID ${id}`, error);
    }
  }

  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    const db = await this.getDB();
    try {
      const results = await db.getAllAsync<any>('SELECT * FROM leave_requests WHERE user_id = ?', userId);
      const validRequests: LeaveRequest[] = [];

      for (const row of results) {
        try {
          validRequests.push(this.mapRowToLeaveRequest(row));
        } catch (e) {
          console.warn(`[Storage] Corrupted LeaveRequest detected (ID: ${row.id}). Self-healing by deleting record.`, e);
          await db.runAsync('DELETE FROM leave_requests WHERE id = ?', row.id).catch(err =>
            console.error(`[Storage] Failed to delete corrupted leave request ${row.id}`, err)
          );
        }
      }

      return validRequests;
    } catch (error: any) {
      // Check if error is "no such table" - means DB not initialized yet
      // prepareAsync wraps the real error in its cause chain, so check stringified form too
      const errStr = String(error?.message || '') + String(error?.cause || '') + String(error || '');
      if (errStr.includes('no such table')) {
        console.warn('[Storage] leave_requests table not yet created. Returning empty array.');
        return [];
      }

      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError('Failed to parse LeaveRequest records', error);
    }
  }

  async deleteLeaveRequest(requestId: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM leave_requests WHERE id = ?', requestId);
  }
  private dbInstance: SQLite.SQLiteDatabase | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (this.dbInstance) {
      return this.dbInstance;
    }
    this.dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    return this.dbInstance;
  }

  private async enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const queuedOperation = this.writeQueue.then(operation, operation);
    this.writeQueue = queuedOperation.then(
      () => undefined,
      () => undefined
    );
    return queuedOperation;
  }

  private async withWriteTransaction(task: (runner: SQLite.SQLiteDatabase) => Promise<void>): Promise<void> {
    const db = await this.getDB();
    await this.enqueueWrite(async () => {
      if (Platform.OS === 'web') {
        await db.withTransactionAsync(async () => {
          await task(db);
        });
        return;
      }

      await db.withExclusiveTransactionAsync(async (txn) => {
        await task(txn);
      });
    });
  }

  async init(): Promise<void> {
    const db = await this.getDB();
    // Enable WAL mode for better concurrency and to prevent database locked errors
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await initializeSQLiteTables(db);
  }

  // ---------------------------------------------------------------------------
  // User
  // ---------------------------------------------------------------------------

  async saveUser(user: User): Promise<void> {
    const db = await this.getDB();
    const sql = `
      INSERT OR REPLACE INTO users (
        id, dod_id, display_name, email, rank, title, uic,
        prd, seaos,
        preferences, last_sync_timestamp, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await db.runAsync(
      sql,
      user.id,
      user.dodId || null,
      user.displayName,
      user.email || null,
      user.rank || null,
      user.title || null,
      user.uic || null,
      user.prd || null,
      user.seaos || null,
      JSON.stringify(user.preferences || {}),
      user.lastSyncTimestamp,
      user.syncStatus
    );
  }

  async getUser(id: string): Promise<User | null> {
    const db = await this.getDB();
    try {
      const result = await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ?', id);
      if (!result) return null;
      return this.mapRowToUser(result);
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError('Failed to parse User record', error);
    }
  }

  private mapRowToUser(row: any): User {
    try {
      return UserSchema.parse({
        id: row.id,
        dodId: row.dod_id,
        displayName: row.display_name,
        email: row.email,
        rank: row.rank,
        title: row.title,
        uic: row.uic,
        prd: row.prd,
        seaos: row.seaos,
        preferences: safeJsonParse(row.preferences),
        lastSyncTimestamp: row.last_sync_timestamp,
        syncStatus: row.sync_status,
      });
    } catch (error) {
      throw new DataIntegrityError(`User integrity check failed for ID ${row.id}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Billets
  // ---------------------------------------------------------------------------

  async saveBillet(billet: Billet): Promise<void> {
    const db = await this.getDB();
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
      0, // isBuyItNowEligible (Removed from schema)
      'open', // lockStatus (Removed from schema)
      null, // lockExpiresAt (Removed from schema)
      null, // lockedByUserId (Removed from schema)
      billet.lastSyncTimestamp,
      billet.syncStatus
    );
  }

  async getBillet(id: string): Promise<Billet | null> {
    const db = await this.getDB();
    try {
      const result = await db.getFirstAsync<any>('SELECT * FROM billets WHERE id = ?', id);
      if (!result) return null;
      return this.mapRowToBillet(result);
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError(`Failed to parse Billet record for ID ${id}`, error);
    }
  }

  async getAllBillets(): Promise<Billet[]> {
    const db = await this.getDB();
    try {
      const results = await db.getAllAsync<any>('SELECT * FROM billets');
      const validBillets: Billet[] = [];

      for (const row of results) {
        try {
          validBillets.push(this.mapRowToBillet(row));
        } catch (e) {
          console.warn(`[Storage] Corrupted Billet detected (ID: ${row.id}). Self-healing by deleting record. Reason:`, JSON.stringify(e, null, 2));
          // Self-healing: Delete the corrupted record to prevent future errors
          await db.runAsync('DELETE FROM billets WHERE id = ?', row.id).catch(err =>
            console.error(`[Storage] Failed to delete corrupted billet ${row.id}`, err)
          );
        }
      }
      return validBillets;
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError('Failed to parse Billet records', error);
    }
  }

  async getBilletCount(): Promise<number> {
    const db = await this.getDB();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM billets');
    return Number(result?.count ?? 0);
  }

  async getPagedBillets(limit: number, offset: number): Promise<Billet[]> {
    const db = await this.getDB();
    try {
      const results = await db.getAllAsync<any>(
        'SELECT * FROM billets LIMIT ? OFFSET ?',
        limit,
        offset
      );

      const validBillets: Billet[] = [];

      for (const row of results) {
        try {
          validBillets.push(this.mapRowToBillet(row));
        } catch (e) {
          console.warn(`[Storage] Corrupted Billet detected in page (ID: ${row.id}). Self-healing by deleting record. Reason:`, JSON.stringify(e, null, 2));
          // Self-healing
          await db.runAsync('DELETE FROM billets WHERE id = ?', row.id).catch(err =>
            console.error(`[Storage] Failed to delete corrupted billet ${row.id}`, err)
          );
        }
      }

      return validBillets;
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError('Failed to parse Billet records', error);
    }
  }

  private mapRowToBillet(row: any): Billet {
    try {
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
          // Legacy fields removed from schema:
          // isBuyItNowEligible, lockStatus, lockExpiresAt, lockedByUserId
        },
        lastSyncTimestamp: row.last_sync_timestamp,
        syncStatus: row.sync_status,
      });
    } catch (error) {
      throw new DataIntegrityError(`Billet integrity check failed for ID ${row.id}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Applications
  // ---------------------------------------------------------------------------

  async saveApplication(app: Application): Promise<void> {
    const db = await this.getDB();
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
      null, // optimisticLockToken (Removed from schema)
      null, // lockRequestedAt (Removed from schema)
      null, // lockExpiresAt (Removed from schema)
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
  }

  async saveApplications(apps: Application[]): Promise<void> {
    await this.withWriteTransaction(async (runner) => {
      // Chunk size to avoid SQLite variable limit
      // BENCHMARK: ~45x speedup vs N+1 writes (25ms vs 1170ms for 1000 records)
      const CHUNK_SIZE = 50;

      for (let i = 0; i < apps.length; i += CHUNK_SIZE) {
        const chunk = apps.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;

        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values: any[] = [];

        for (const app of chunk) {
          values.push(
            app.id,
            app.billetId,
            app.userId,
            app.status,
            JSON.stringify(app.statusHistory),
            null, // optimisticLockToken (Removed from schema)
            null, // lockRequestedAt (Removed from schema)
            null, // lockExpiresAt (Removed from schema)
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
        }

        await runner.runAsync(
          `INSERT OR REPLACE INTO applications (
            id, billet_id, user_id, status, status_history,
            optimistic_lock_token, lock_requested_at, lock_expires_at,
            personal_statement, preference_rank, submitted_at,
            server_confirmed_at, server_rejection_reason,
            created_at, updated_at, last_sync_timestamp, sync_status, local_modified_at
          ) VALUES ${placeholders};`,
          ...values
        );
      }
    });
  }

  async getApplication(id: string): Promise<Application | null> {
    const db = await this.getDB();
    try {
      const result = await db.getFirstAsync<any>('SELECT * FROM applications WHERE id = ?', id);
      if (!result) return null;
      return this.mapRowToApplication(result);
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError(`Failed to parse Application record for ID ${id}`, error);
    }
  }

  async getUserApplications(userId: string): Promise<Application[]> {
    const db = await this.getDB(); // Ensure DB is initialized
    try {
      const results = await db.getAllAsync<any>('SELECT * FROM applications WHERE user_id = ?', userId);
      const validApps: Application[] = [];

      for (const row of results) {
        try {
          validApps.push(this.mapRowToApplication(row));
        } catch (e) {
          console.warn(`[Storage] Corrupted Application detected (ID: ${row.id}). Self-healing by deleting record.`, e);
          // Self-healing: Delete the corrupted record
          await db.runAsync('DELETE FROM applications WHERE id = ?', row.id);
        }
      }

      return validApps;
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError('Failed to fetch/parse Application records', error);
    }
  }

  async deleteApplication(appId: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM applications WHERE id = ?', appId);
  }

  private mapRowToApplication(row: any): Application {
    try {
      return ApplicationSchema.parse({
        id: row.id,
        billetId: row.billet_id,
        userId: row.user_id,
        status: row.status,
        statusHistory: safeJsonParse(row.status_history) || [],
        // Legacy fields removed from schema: optimisticLockToken, lockRequestedAt, lockExpiresAt
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
    } catch (error) {
      throw new DataIntegrityError(`Application integrity check failed for ID ${row.id}`, error);
    }
  }

  // ... (inside mapRowToLeaveRequest)
  private mapRowToLeaveRequest(row: any): LeaveRequest {
    try {
      // Decrypt sensitive data
      let emergencyContact = undefined;
      if (row.emergency_contact) {
        try {
          const decrypted = decryptData(row.emergency_contact);
          emergencyContact = JSON.parse(decrypted);
        } catch (e) {
          console.error('[Storage] Failed to decrypt emergency contact', e);
          // If decryption fails, maybe it wasn't encrypted? Try parsing raw
          try {
            emergencyContact = JSON.parse(row.emergency_contact);
          } catch (inner) {
            // Return undefined if unrecoverable
          }
        }
      }

      // Robust Emergency Contact Handling (Ensure all required fields exist)
      if (emergencyContact) {
        emergencyContact = {
          name: emergencyContact.name || 'Unknown',
          relationship: emergencyContact.relationship || 'Unknown',
          phoneNumber: emergencyContact.phoneNumber || '000-000-0000',
          altPhoneNumber: emergencyContact.altPhoneNumber,
          address: emergencyContact.address,
        };
      }

      return LeaveRequestSchema.parse({
        id: row.id,
        userId: row.user_id,
        startDate: row.start_date,
        endDate: row.end_date,
        chargeDays: row.charge_days,
        leaveType: row.leave_type,
        leaveAddress: row.leave_address,
        leavePhoneNumber: row.leave_phone_number,
        emergencyContact: emergencyContact,
        dutySection: row.duty_section ?? undefined,
        rationStatus: ['commuted', 'in_kind', 'not_applicable'].includes(row.ration_status) ? row.ration_status : undefined,
        preReviewChecks: (() => {
          const raw = safeJsonParse(row.pre_review_checks);
          if (!raw) return undefined;
          return {
            hasReadPolicy: !!raw.hasReadPolicy,
            hasInformalApproval: !!raw.hasInformalApproval,
            isReadyToSubmit: !!raw.isReadyToSubmit,
          };
        })(),
        modeOfTravel: row.mode_of_travel ?? undefined,
        destinationCountry: row.destination_country ?? undefined,
        normalWorkingHours: row.normal_working_hours ?? undefined,
        leaveInConus: Boolean(row.leave_in_conus),
        memberRemarks: row.member_remarks ?? undefined,
        status: row.status,
        statusHistory: Array.isArray(safeJsonParse(row.status_history)) ? safeJsonParse(row.status_history) : [],
        approvalChain: Array.isArray(safeJsonParse(row.approval_chain)) ? safeJsonParse(row.approval_chain) : [],
        currentApproverId: row.current_approver_id ?? undefined,
        returnReason: row.return_reason ?? undefined,
        denialReason: row.denial_reason ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        submittedAt: row.submitted_at ?? undefined,
        lastSyncTimestamp: row.last_sync_timestamp,
        syncStatus: row.sync_status,
        localModifiedAt: row.local_modified_at ?? undefined,
      });
    } catch (error: any) {
      if (error && error.format) {
        console.error('[Integrity Error Details]', JSON.stringify(error.format(), null, 2));
      }
      throw new DataIntegrityError(`LeaveRequest integrity check failed for ID ${row.id}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Leave Balance
  // ---------------------------------------------------------------------------

  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    const db = await this.getDB();
    const sql = `
      INSERT OR REPLACE INTO leave_balances (
        id, user_id, current_balance, use_or_lose_days, use_or_lose_expiration_date,
        earned_this_fiscal_year, used_this_fiscal_year, projected_end_of_year_balance,
        max_carry_over, balance_as_of_date, last_sync_timestamp, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await db.runAsync(
      sql,
      balance.id,
      balance.userId,
      balance.currentBalance,
      balance.useOrLoseDays,
      balance.useOrLoseExpirationDate,
      balance.earnedThisFiscalYear,
      balance.usedThisFiscalYear,
      balance.projectedEndOfYearBalance,
      balance.maxCarryOver,
      balance.balanceAsOfDate,
      balance.lastSyncTimestamp,
      balance.syncStatus
    );
  }

  async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    const db = await this.getDB();
    try {
      const result = await db.getFirstAsync<any>('SELECT * FROM leave_balances WHERE user_id = ?', userId);
      if (!result) return null;
      return this.mapRowToLeaveBalance(result);
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError(`Failed to parse LeaveBalance record for user ${userId}`, error);
    }
  }

  private mapRowToLeaveBalance(row: any): LeaveBalance {
    try {
      return LeaveBalanceSchema.parse({
        id: row.id,
        userId: row.user_id,
        currentBalance: row.current_balance,
        useOrLoseDays: row.use_or_lose_days,
        useOrLoseExpirationDate: row.use_or_lose_expiration_date,
        earnedThisFiscalYear: row.earned_this_fiscal_year,
        usedThisFiscalYear: row.used_this_fiscal_year,
        projectedEndOfYearBalance: row.projected_end_of_year_balance,
        maxCarryOver: row.max_carry_over,
        balanceAsOfDate: row.balance_as_of_date,
        lastSyncTimestamp: row.last_sync_timestamp,
        syncStatus: row.sync_status,
      });
    } catch (error) {
      throw new DataIntegrityError(`LeaveBalance integrity check failed for user ${row.user_id}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Leave Defaults
  // ---------------------------------------------------------------------------

  async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
    const db = await this.getDB();
    const serialized = JSON.stringify(defaults);
    const encrypted = encryptData(serialized);
    const now = new Date().toISOString();

    const sql = `
      INSERT OR REPLACE INTO leave_defaults (
        user_id, data, last_sync_timestamp, sync_status
      ) VALUES (?, ?, ?, ?);
    `;

    await db.runAsync(
      sql,
      userId,
      encrypted,
      now,
      'synced'
    );
  }

  async getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null> {
    const db = await this.getDB();
    try {
      const result = await db.getFirstAsync<any>('SELECT * FROM leave_defaults WHERE user_id = ?', userId);
      if (!result) return null;

      const decrypted = decryptData(result.data);
      const parsed = JSON.parse(decrypted);
      return LeaveRequestDefaultsSchema.parse(parsed);
    } catch (error: any) {
      // Check if error is "no such table" - means DB not initialized yet
      // prepareAsync wraps the real error in its cause chain, so check stringified form too
      const errStr = String(error?.message || '') + String(error?.cause || '') + String(error || '');
      if (errStr.includes('no such table')) {
        console.warn('[Storage] leave_defaults table not yet created. Returning null.');
        return null;
      }

      console.error(`[Storage] Data Corruption detected for LeaveDefaults (User ${userId}). Resetting defaults.`, error);
      // Self-healing: Delete corrupted record only if table exists
      try {
        await db.runAsync('DELETE FROM leave_defaults WHERE user_id = ?', userId);
      } catch (deleteError) {
        // Ignore delete errors if table doesn't exist
      }
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
    const db = await this.getDB();
    const serialized = JSON.stringify(data);
    const now = new Date().toISOString();

    const sql = `
      INSERT OR REPLACE INTO dashboard_cache (
        user_id, data, last_sync_timestamp, sync_status
      ) VALUES (?, ?, ?, ?);
    `;

    await db.runAsync(
      sql,
      userId,
      serialized,
      now,
      'synced'
    );
  }

  async getDashboardCache(userId: string): Promise<DashboardData | null> {
    const db = await this.getDB();
    try {
      const result = await db.getFirstAsync<any>('SELECT * FROM dashboard_cache WHERE user_id = ?', userId);
      if (!result) return null;

      // Validate the cache record itself
      const cacheRecord = DashboardCacheSchema.parse({
        userId: result.user_id,
        data: result.data,
        lastSyncTimestamp: result.last_sync_timestamp,
        syncStatus: result.sync_status
      });

      return JSON.parse(cacheRecord.data) as DashboardData;
    } catch (error) {
      throw new DataIntegrityError(`Failed to parse DashboardCache for user ${userId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Assignment Decisions
  // ---------------------------------------------------------------------------

  async saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void> {
    const db = await this.getDB();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO assignment_decisions_entries (user_id, billet_id, decision, timestamp)
       VALUES (?, ?, ?, ?);`,
      userId, billetId, decision, now
    );
  }

  async removeAssignmentDecision(userId: string, billetId: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      `DELETE FROM assignment_decisions_entries WHERE user_id = ? AND billet_id = ?;`,
      userId, billetId
    );
  }

  async getAssignmentDecisions(userId: string): Promise<Record<string, string> | null> {
    const db = await this.getDB();
    try {
      const rows = await db.getAllAsync<{ billet_id: string; decision: string }>(
        `SELECT billet_id, decision FROM assignment_decisions_entries WHERE user_id = ?;`,
        userId
      );
      if (!rows || rows.length === 0) return null;

      const decisions: Record<string, string> = {};
      rows.forEach(row => {
        decisions[row.billet_id] = row.decision;
      });
      return decisions;
    } catch (e) {
      console.warn('Failed to fetch assignment decisions', e);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Inbox
  // ---------------------------------------------------------------------------

  async saveInboxMessages(messages: InboxMessage[]): Promise<void> {
    await this.withWriteTransaction(async (runner) => {
      if (messages.length === 0) {
        await runner.runAsync('DELETE FROM inbox_messages;');
        return;
      }

      // Chunk size to avoid SQLite variable limit (default usually 999 or 32766)
      const CHUNK_SIZE = 50;

      for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        const chunk = messages.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;

        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values: any[] = [];

        for (const msg of chunk) {
          values.push(
            msg.id,
            msg.type,
            msg.subject,
            msg.body,
            msg.timestamp,
            msg.isRead ? 1 : 0,
            msg.isPinned ? 1 : 0,
            JSON.stringify(msg.metadata || {}),
            new Date().toISOString(),
            'synced'
          );
        }

        await runner.runAsync(
          `INSERT OR REPLACE INTO inbox_messages (
            id, type, subject, body, timestamp, is_read, is_pinned, metadata, last_sync_timestamp, sync_status
          ) VALUES ${placeholders};`,
          ...values
        );
      }

      // Robust sync: Fetch all existing IDs to determine deletions
      // This avoids "too many variables" error with DELETE ... NOT IN (...) for large datasets
      const existingRows = await runner.getAllAsync<{ id: string }>('SELECT id FROM inbox_messages');
      const existingIds = new Set(existingRows.map((row) => row.id));
      const newIds = new Set(messages.map((msg) => msg.id));

      const idsToDelete: string[] = [];
      for (const id of existingIds) {
        if (!newIds.has(id)) {
          idsToDelete.push(id);
        }
      }

      if (idsToDelete.length > 0) {
        const DELETE_CHUNK_SIZE = 50;
        for (let i = 0; i < idsToDelete.length; i += DELETE_CHUNK_SIZE) {
          const chunk = idsToDelete.slice(i, i + DELETE_CHUNK_SIZE);
          const placeholders = chunk.map(() => '?').join(', ');
          await runner.runAsync(
            `DELETE FROM inbox_messages WHERE id IN (${placeholders});`,
            ...chunk
          );
        }
      }
    });
  }

  async getInboxMessages(): Promise<InboxMessage[]> {
    const db = await this.getDB();
    try {
      const results = await db.getAllAsync<any>(
        'SELECT * FROM inbox_messages ORDER BY timestamp DESC LIMIT 500'
      );
      return results.map(row => ({
        id: row.id,
        type: row.type,
        subject: row.subject,
        body: row.body,
        timestamp: row.timestamp,
        isRead: Boolean(row.is_read),
        isPinned: Boolean(row.is_pinned),
        metadata: row.metadata ? safeJsonParse(row.metadata) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch inbox messages', error);
      return [];
    }
  }

  async updateInboxMessageReadStatus(id: string, isRead: boolean): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'UPDATE inbox_messages SET is_read = ? WHERE id = ?',
      isRead ? 1 : 0,
      id
    );
  }

  // ---------------------------------------------------------------------------
  // Career Events
  // ---------------------------------------------------------------------------

  async saveCareerEvents(events: CareerEvent[]): Promise<void> {
    await this.withWriteTransaction(async (runner) => {
      // Chunking to avoid SQLite variable limit (default usually 999 or 32766)
      const CHUNK_SIZE = 50;

      for (let i = 0; i < events.length; i += CHUNK_SIZE) {
        const chunk = events.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;

        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values: any[] = [];

        for (const event of chunk) {
          values.push(
            event.eventId,
            event.eventType,
            event.title,
            event.date,
            event.location,
            event.attendanceStatus,
            event.priority,
            event.qr_token || null,
            new Date().toISOString(),
            'synced'
          );
        }

        await runner.runAsync(
          `INSERT OR REPLACE INTO career_events (
            event_id, event_type, title, date, location, attendance_status, priority, qr_token, last_sync_timestamp, sync_status
          ) VALUES ${placeholders};`,
          ...values
        );
      }
    });
  }

  async getCareerEvents(): Promise<CareerEvent[]> {
    const db = await this.getDB();
    try {
      const results = await db.getAllAsync<any>('SELECT * FROM career_events');
      return results.map(row => ({
        eventId: row.event_id,
        eventType: row.event_type,
        title: row.title,
        date: row.date,
        location: row.location,
        attendanceStatus: row.attendance_status,
        priority: row.priority,
        qr_token: row.qr_token || undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch career events', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Historical PCS Orders (Digital Sea Bag)
  // ---------------------------------------------------------------------------

  async saveHistoricalPCSOrder(order: HistoricalPCSOrder): Promise<void> {
    await this.withWriteTransaction(async (runner) => {
      // Upsert the order record
      await runner.runAsync(
        `INSERT OR REPLACE INTO historical_pcs_orders (
          id, user_id, order_number, origin_command, origin_location,
          gaining_command, gaining_location, departure_date, arrival_date,
          fiscal_year, total_malt, total_per_diem, total_reimbursement,
          is_oconus, is_sea_duty, status, archived_at,
          last_sync_timestamp, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        order.id,
        order.userId,
        order.orderNumber,
        order.originCommand,
        order.originLocation,
        order.gainingCommand,
        order.gainingLocation,
        order.departureDate,
        order.arrivalDate,
        order.fiscalYear,
        order.totalMalt,
        order.totalPerDiem,
        order.totalReimbursement,
        order.isOconus ? 1 : 0,
        order.isSeaDuty ? 1 : 0,
        order.status,
        order.archivedAt || null,
        new Date().toISOString(),
        'synced'
      );

      // Upsert associated documents
      for (const doc of order.documents) {
        await runner.runAsync(
          `INSERT OR REPLACE INTO pcs_documents (
            id, pcs_order_id, category, filename, display_name,
            local_uri, original_url, size_bytes, uploaded_at, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          doc.id,
          doc.pcsOrderId,
          doc.category,
          doc.filename,
          doc.displayName,
          doc.localUri,
          doc.originalUrl || null,
          doc.sizeBytes,
          doc.uploadedAt,
          doc.metadata ? encryptData(JSON.stringify(doc.metadata)) : null
        );
      }
    });
  }

  async getUserHistoricalPCSOrders(userId: string): Promise<HistoricalPCSOrder[]> {
    const db = await this.getDB();
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM historical_pcs_orders WHERE user_id = ? ORDER BY departure_date DESC',
        userId
      );

      const orders: HistoricalPCSOrder[] = [];
      for (const row of rows) {
        const docs = await this.getPCSDocuments(row.id);
        orders.push(this.mapRowToHistoricalOrder(row, docs));
      }
      return orders;
    } catch (error: any) {
      if (error?.message?.includes('no such table')) {
        return [];
      }
      console.error('[Storage] Failed to fetch historical PCS orders:', error);
      return [];
    }
  }

  async getHistoricalPCSOrder(id: string): Promise<HistoricalPCSOrder | null> {
    const db = await this.getDB();
    try {
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM historical_pcs_orders WHERE id = ?',
        id
      );
      if (!row) return null;
      const docs = await this.getPCSDocuments(id);
      return this.mapRowToHistoricalOrder(row, docs);
    } catch (error) {
      console.error('[Storage] Failed to fetch historical PCS order:', error);
      return null;
    }
  }

  async deleteHistoricalPCSOrder(id: string): Promise<void> {
    const db = await this.getDB();
    // Cascade delete handles pcs_documents
    await db.runAsync('DELETE FROM historical_pcs_orders WHERE id = ?', id);
  }

  async savePCSDocument(doc: PCSDocument): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      `INSERT OR REPLACE INTO pcs_documents (
        id, pcs_order_id, category, filename, display_name,
        local_uri, original_url, size_bytes, uploaded_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      doc.id,
      doc.pcsOrderId,
      doc.category,
      doc.filename,
      doc.displayName,
      doc.localUri,
      doc.originalUrl || null,
      doc.sizeBytes,
      doc.uploadedAt,
      doc.metadata ? encryptData(JSON.stringify(doc.metadata)) : null
    );
  }

  async getPCSDocument(docId: string): Promise<PCSDocument | null> {
    const db = await this.getDB();
    try {
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM pcs_documents WHERE id = ?',
        docId
      );
      return row ? this.mapRowToPCSDocument(row) : null;
    } catch (error: any) {
      if (error?.message?.includes('no such table')) {
        return null;
      }
      console.error('[Storage] Failed to fetch PCS document:', error);
      return null;
    }
  }

  async getPCSDocuments(pcsOrderId: string): Promise<PCSDocument[]> {
    const db = await this.getDB();
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM pcs_documents WHERE pcs_order_id = ? ORDER BY uploaded_at DESC',
        pcsOrderId
      );
      return rows.map((row: any) => this.mapRowToPCSDocument(row));
    } catch (error: any) {
      if (error?.message?.includes('no such table')) {
        return [];
      }
      console.error('[Storage] Failed to fetch PCS documents:', error);
      return [];
    }
  }

  async deletePCSDocument(docId: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM pcs_documents WHERE id = ?', docId);
  }

  private mapRowToHistoricalOrder(row: any, docs: PCSDocument[]): HistoricalPCSOrder {
    return {
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      originCommand: row.origin_command || '',
      originLocation: row.origin_location || '',
      gainingCommand: row.gaining_command || '',
      gainingLocation: row.gaining_location || '',
      departureDate: row.departure_date || '',
      arrivalDate: row.arrival_date || '',
      fiscalYear: row.fiscal_year || 0,
      totalMalt: row.total_malt || 0,
      totalPerDiem: row.total_per_diem || 0,
      totalReimbursement: row.total_reimbursement || 0,
      isOconus: Boolean(row.is_oconus),
      isSeaDuty: Boolean(row.is_sea_duty),
      status: row.status || 'ARCHIVED',
      archivedAt: row.archived_at || undefined,
      documents: docs,
    };
  }

  private mapRowToPCSDocument(row: any): PCSDocument {
    let metadata: Record<string, string> | undefined;
    if (row.metadata) {
      try {
        metadata = JSON.parse(decryptData(row.metadata));
      } catch {
        try {
          metadata = JSON.parse(row.metadata);
        } catch {
          // Unrecoverable metadata — skip
        }
      }
    }

    return {
      id: row.id,
      pcsOrderId: row.pcs_order_id,
      category: row.category as DocumentCategory,
      filename: row.filename,
      displayName: row.display_name || row.filename,
      localUri: row.local_uri || '',
      originalUrl: row.original_url || undefined,
      sizeBytes: row.size_bytes || 0,
      uploadedAt: row.uploaded_at || '',
      metadata,
    };
  }
}

// =============================================================================
// MOCK IMPLEMENTATION
// =============================================================================

class MockStorage implements IStorageService {
  private users = new Map<string, User>();
  private billets = new Map<string, Billet>();
  private applications = new Map<string, Application>();
  private leaveRequests = new Map<string, LeaveRequest>();
  private leaveBalances = new Map<string, LeaveBalance>();
  private leaveDefaults = new Map<string, LeaveRequestDefaults>();
  private dashboardCache = new Map<string, DashboardData>();
  private decisions = new Map<string, Record<string, string>>();
  private inboxMessages = new Map<string, InboxMessage>();
  private careerEvents = new Map<string, CareerEvent>();
  private historicalPCSOrders = new Map<string, HistoricalPCSOrder>();
  private pcsDocuments = new Map<string, PCSDocument>();

  async init(): Promise<void> {
    console.log('[MockStorage] Initialized in-memory storage');
  }

  // User
  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  // Billets
  async saveBillet(billet: Billet): Promise<void> {
    this.billets.set(billet.id, billet);
  }
  async getBillet(id: string): Promise<Billet | null> {
    return this.billets.get(id) || null;
  }
  async getAllBillets(): Promise<Billet[]> {
    return Array.from(this.billets.values());
  }

  async getBilletCount(): Promise<number> {
    return this.billets.size;
  }

  async getPagedBillets(limit: number, offset: number): Promise<Billet[]> {
    const all = Array.from(this.billets.values());
    return all.slice(offset, offset + limit);
  }

  // Applications
  async saveApplication(app: Application): Promise<void> {
    this.applications.set(app.id, app);
  }
  async saveApplications(apps: Application[]): Promise<void> {
    apps.forEach(app => this.applications.set(app.id, app));
  }
  async getApplication(id: string): Promise<Application | null> {
    return this.applications.get(id) || null;
  }
  async getUserApplications(userId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(a => a.userId === userId);
  }
  async deleteApplication(appId: string): Promise<void> {
    this.applications.delete(appId);
  }

  // Leave Requests
  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    this.leaveRequests.set(request.id, request);
  }
  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    return this.leaveRequests.get(id) || null;
  }
  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(r => r.userId === userId);
  }
  async deleteLeaveRequest(requestId: string): Promise<void> {
    this.leaveRequests.delete(requestId);
  }

  // Leave Balance
  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    this.leaveBalances.set(balance.userId, balance);
  }
  async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    return this.leaveBalances.get(userId) || null;
  }

  // Leave Defaults
  async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
    this.leaveDefaults.set(userId, defaults);
  }
  async getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null> {
    return this.leaveDefaults.get(userId) || null;
  }

  // Dashboard
  async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
    this.dashboardCache.set(userId, data);
  }
  async getDashboardCache(userId: string): Promise<DashboardData | null> {
    return this.dashboardCache.get(userId) || null;
  }

  // Assignment Decisions
  async saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void> {
    const current = (await this.getAssignmentDecisions(userId)) || {};
    current[billetId] = decision;
    this.decisions.set(userId, current);
  }

  async removeAssignmentDecision(userId: string, billetId: string): Promise<void> {
    const current = (await this.getAssignmentDecisions(userId)) || {};
    delete current[billetId];
    this.decisions.set(userId, current);
  }

  async getAssignmentDecisions(userId: string): Promise<Record<string, string> | null> {
    return this.decisions.get(userId) || null;
  }

  // Inbox
  async saveInboxMessages(messages: InboxMessage[]): Promise<void> {
    this.inboxMessages.clear();
    messages.slice(0, 500).forEach(msg => this.inboxMessages.set(msg.id, msg));
  }

  async getInboxMessages(): Promise<InboxMessage[]> {
    return Array.from(this.inboxMessages.values()).slice(0, 500);
  }

  async updateInboxMessageReadStatus(id: string, isRead: boolean): Promise<void> {
    const msg = this.inboxMessages.get(id);
    if (msg) {
      this.inboxMessages.set(id, { ...msg, isRead });
    }
  }

  // Career Events
  async saveCareerEvents(events: CareerEvent[]): Promise<void> {
    events.forEach(event => this.careerEvents.set(event.eventId, event));
  }

  async getCareerEvents(): Promise<CareerEvent[]> {
    return Array.from(this.careerEvents.values());
  }

  // Historical PCS Orders
  async saveHistoricalPCSOrder(order: HistoricalPCSOrder): Promise<void> {
    this.historicalPCSOrders.set(order.id, order);
    order.documents.forEach(doc => this.pcsDocuments.set(doc.id, doc));
  }
  async getUserHistoricalPCSOrders(userId: string): Promise<HistoricalPCSOrder[]> {
    return Array.from(this.historicalPCSOrders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => b.departureDate.localeCompare(a.departureDate));
  }
  async getHistoricalPCSOrder(id: string): Promise<HistoricalPCSOrder | null> {
    return this.historicalPCSOrders.get(id) || null;
  }
  async deleteHistoricalPCSOrder(id: string): Promise<void> {
    const order = this.historicalPCSOrders.get(id);
    if (order) {
      order.documents.forEach(doc => this.pcsDocuments.delete(doc.id));
    }
    this.historicalPCSOrders.delete(id);
  }

  // PCS Documents
  async savePCSDocument(doc: PCSDocument): Promise<void> {
    this.pcsDocuments.set(doc.id, doc);
  }
  async getPCSDocument(docId: string): Promise<PCSDocument | null> {
    return this.pcsDocuments.get(docId) || null;
  }
  async getPCSDocuments(pcsOrderId: string): Promise<PCSDocument[]> {
    return Array.from(this.pcsDocuments.values()).filter(d => d.pcsOrderId === pcsOrderId);
  }
  async deletePCSDocument(docId: string): Promise<void> {
    this.pcsDocuments.delete(docId);
  }
}

// =============================================================================
// EXPORT
// =============================================================================

// =============================================================================
// WEB IMPLEMENTATION (localStorage)
// =============================================================================

class WebStorage implements IStorageService {
  async init(): Promise<void> {
    // No-op for localStorage
  }

  async getPagedBillets(limit: number, offset: number): Promise<Billet[]> {
    const all = await this.getAllBillets();
    return all.slice(offset, offset + limit);
  }

  // --- Helpers ---
  private getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  private setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- User ---
  async saveUser(user: User): Promise<void> {
    this.setItem(`user_${user.id}`, user);
  }
  async getUser(id: string): Promise<User | null> {
    return this.getItem<User>(`user_${id}`);
  }

  // --- Billets ---
  async saveBillet(billet: Billet): Promise<void> {
    this.setItem(`billet_${billet.id}`, billet);
  }
  async getBillet(id: string): Promise<Billet | null> {
    return this.getItem<Billet>(`billet_${id}`);
  }
  async getAllBillets(): Promise<Billet[]> {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.startsWith('billet_'))
      .map(k => this.getItem<Billet>(k)!);
  }

  async getBilletCount(): Promise<number> {
    return Object.keys(localStorage).filter(k => k.startsWith('billet_')).length;
  }

  // --- Applications ---
  async saveApplication(app: Application): Promise<void> {
    this.setItem(`app_${app.id}`, app);
  }
  async saveApplications(apps: Application[]): Promise<void> {
    apps.forEach(app => this.setItem(`app_${app.id}`, app));
  }
  async getApplication(id: string): Promise<Application | null> {
    return this.getItem<Application>(`app_${id}`);
  }
  async getUserApplications(userId: string): Promise<Application[]> {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.startsWith('app_'))
      .map(k => this.getItem<Application>(k)!)
      .filter(a => a.userId === userId);
  }
  async deleteApplication(appId: string): Promise<void> {
    localStorage.removeItem(`app_${appId}`);
  }

  // --- Leave Requests ---
  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    this.setItem(`leave_${request.id}`, request);
  }
  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    return this.getItem<LeaveRequest>(`leave_${id}`);
  }
  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.startsWith('leave_'))
      .map(k => this.getItem<LeaveRequest>(k)!)
      .filter(r => r.userId === userId);
  }
  async deleteLeaveRequest(requestId: string): Promise<void> {
    localStorage.removeItem(`leave_${requestId}`);
  }

  // --- Leave Balance ---
  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    this.setItem(`balance_${balance.userId}`, balance);
  }
  async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    return this.getItem<LeaveBalance>(`balance_${userId}`);
  }

  // --- Defaults ---
  async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
    this.setItem(`defaults_${userId}`, defaults);
  }
  async getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null> {
    return this.getItem<LeaveRequestDefaults>(`defaults_${userId}`);
  }

  // --- Dashboard ---
  async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
    this.setItem(`dash_${userId}`, data);
  }
  async getDashboardCache(userId: string): Promise<DashboardData | null> {
    return this.getItem<DashboardData>(`dash_${userId}`);
  }

  // --- Assignment Decisions ---
  async saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void> {
    const decisions = this.getItem<Record<string, string>>(`decisions_${userId}`) || {};
    decisions[billetId] = decision;
    this.setItem(`decisions_${userId}`, decisions);
  }

  async removeAssignmentDecision(userId: string, billetId: string): Promise<void> {
    const decisions = this.getItem<Record<string, string>>(`decisions_${userId}`) || {};
    delete decisions[billetId];
    this.setItem(`decisions_${userId}`, decisions);
  }

  async getAssignmentDecisions(userId: string): Promise<Record<string, string> | null> {
    return this.getItem<Record<string, string>>(`decisions_${userId}`);
  }

  // --- Inbox ---
  async saveInboxMessages(messages: InboxMessage[]): Promise<void> {
    this.setItem('inbox_messages', messages.slice(0, 500));
  }

  async getInboxMessages(): Promise<InboxMessage[]> {
    return (this.getItem<InboxMessage[]>('inbox_messages') || []).slice(0, 500);
  }

  async updateInboxMessageReadStatus(id: string, isRead: boolean): Promise<void> {
    const messages = await this.getInboxMessages();
    const newMessages = messages.map(m => m.id === id ? { ...m, isRead } : m);
    await this.saveInboxMessages(newMessages);
  }

  // --- Career Events ---
  async saveCareerEvents(events: CareerEvent[]): Promise<void> {
    this.setItem('career_events', events);
  }

  async getCareerEvents(): Promise<CareerEvent[]> {
    return this.getItem<CareerEvent[]>('career_events') || [];
  }

  // --- Historical PCS Orders ---
  async saveHistoricalPCSOrder(order: HistoricalPCSOrder): Promise<void> {
    const orders = this.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    const filtered = orders.filter(o => o.id !== order.id);
    this.setItem('pcs_archive', [...filtered, order]);
  }
  async getUserHistoricalPCSOrders(userId: string): Promise<HistoricalPCSOrder[]> {
    const orders = this.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    return orders
      .filter(o => o.userId === userId)
      .sort((a, b) => b.departureDate.localeCompare(a.departureDate));
  }
  async getHistoricalPCSOrder(id: string): Promise<HistoricalPCSOrder | null> {
    const orders = this.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    return orders.find(o => o.id === id) || null;
  }
  async deleteHistoricalPCSOrder(id: string): Promise<void> {
    const orders = this.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    this.setItem('pcs_archive', orders.filter(o => o.id !== id));
  }

  // --- PCS Documents ---
  async savePCSDocument(doc: PCSDocument): Promise<void> {
    const docs = this.getItem<PCSDocument[]>('pcs_documents') || [];
    const filtered = docs.filter(d => d.id !== doc.id);
    this.setItem('pcs_documents', [...filtered, doc]);
  }
  async getPCSDocument(docId: string): Promise<PCSDocument | null> {
    const docs = this.getItem<PCSDocument[]>('pcs_documents') || [];
    return docs.find(d => d.id === docId) || null;
  }
  async getPCSDocuments(pcsOrderId: string): Promise<PCSDocument[]> {
    const docs = this.getItem<PCSDocument[]>('pcs_documents') || [];
    return docs.filter(d => d.pcsOrderId === pcsOrderId);
  }
  async deletePCSDocument(docId: string): Promise<void> {
    const docs = this.getItem<PCSDocument[]>('pcs_documents') || [];
    this.setItem('pcs_documents', docs.filter(d => d.id !== docId));
  }
}

// =============================================================================
// EXPORT
// =============================================================================

// Determine which service to use
const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

// Export the service instance
export const storage: IStorageService = useMocks
  ? new MockStorage()
  : Platform.OS === 'web'
    ? new WebStorage()
    : new SQLiteStorage();
