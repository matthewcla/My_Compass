import { decryptData, encryptData } from '@/lib/encryption';
import { DashboardData } from '@/types/dashboard';
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
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { DataIntegrityError, IStorageService } from './storage.interface';

const DB_NAME = 'my_compass.db';

// =============================================================================
// SQLITE IMPLEMENTATION
// =============================================================================

class SQLiteStorage implements IStorageService {
  private dbInstance: SQLite.SQLiteDatabase | null = null;

  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (this.dbInstance) {
      return this.dbInstance;
    }
    this.dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    return this.dbInstance;
  }

  async init(): Promise<void> {
    const db = await this.getDB();
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
        preferences, last_sync_timestamp, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
        preferences: row.preferences ? JSON.parse(row.preferences) : undefined,
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
      billet.compass.isBuyItNowEligible ? 1 : 0,
      billet.compass.lockStatus,
      billet.compass.lockExpiresAt || null,
      billet.compass.lockedByUserId || null,
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
      return results.map(row => this.mapRowToBillet(row));
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
          isBuyItNowEligible: Boolean(row.compass_is_buy_it_now_eligible),
          lockStatus: row.compass_lock_status,
          lockExpiresAt: row.compass_lock_expires_at,
          lockedByUserId: row.compass_locked_by_user_id,
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
    const db = await this.getDB();
    try {
      const results = await db.getAllAsync<any>('SELECT * FROM applications WHERE user_id = ?', userId);
      return results.map(row => this.mapRowToApplication(row));
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError('Failed to parse Application records', error);
    }
  }

  private mapRowToApplication(row: any): Application {
    try {
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
    } catch (error) {
      throw new DataIntegrityError(`Application integrity check failed for ID ${row.id}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Leave Requests
  // ---------------------------------------------------------------------------

  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    const db = await this.getDB();
    const sql = `
      INSERT OR REPLACE INTO leave_requests (
        id, user_id, start_date, end_date, charge_days, leave_type,
        leave_address, leave_phone_number, emergency_contact,
        duty_section, ration_status, pre_review_checks,
        mode_of_travel, destination_country, normal_working_hours, leave_in_conus, member_remarks,
        status, status_history, approval_chain, current_approver_id,
        return_reason, denial_reason, created_at, updated_at, submitted_at,
        last_sync_timestamp, sync_status, local_modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    // Encrypt sensitive data
    const encryptedContact = request.emergencyContact
      ? encryptData(JSON.stringify(request.emergencyContact))
      : null;

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
      encryptedContact,
      request.dutySection || null,
      request.rationStatus || null,
      request.preReviewChecks ? JSON.stringify(request.preReviewChecks) : null,
      request.modeOfTravel || null,
      request.destinationCountry,
      request.normalWorkingHours,
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
      return results.map(row => this.mapRowToLeaveRequest(row));
    } catch (error) {
      if (error instanceof DataIntegrityError) throw error;
      throw new DataIntegrityError('Failed to parse LeaveRequest records', error);
    }
  }

  async deleteLeaveRequest(requestId: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM leave_requests WHERE id = ?', requestId);
  }

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
        dutySection: row.duty_section || undefined,
        rationStatus: row.ration_status || undefined,
        preReviewChecks: row.pre_review_checks ? JSON.parse(row.pre_review_checks) : undefined,
        modeOfTravel: row.mode_of_travel,
        destinationCountry: row.destination_country,
        normalWorkingHours: row.normal_working_hours,
        leaveInConus: Boolean(row.leave_in_conus),
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
    } catch (error) {
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
    } catch (error) {
      console.error(`[Storage] Data Corruption detected for LeaveDefaults (User ${userId}). Resetting defaults.`, error);
      // Self-healing: Delete corrupted record so we can start fresh next time
      await db.runAsync('DELETE FROM leave_defaults WHERE user_id = ?', userId);
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

  // Applications
  async saveApplication(app: Application): Promise<void> {
    this.applications.set(app.id, app);
  }
  async getApplication(id: string): Promise<Application | null> {
    return this.applications.get(id) || null;
  }
  async getUserApplications(userId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(a => a.userId === userId);
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

  // --- Applications ---
  async saveApplication(app: Application): Promise<void> {
    this.setItem(`app_${app.id}`, app);
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
