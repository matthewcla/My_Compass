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
import { DataIntegrityError, IStorageService } from '../storage.interface';
import { DatabaseManager } from '../db/DatabaseManager';

import { WebHelpers } from '../db/DatabaseManager';

export class SQLiteLeaveRepository {
  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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

  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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

  async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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

}

export class WebLeaveRepository {
  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    WebHelpers.setItem(`leave_${request.id}`, request);
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    return WebHelpers.getItem<LeaveRequest>(`leave_${id}`);
  }

  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.startsWith('leave_'))
      .map(k => WebHelpers.getItem<LeaveRequest>(k)!)
      .filter(r => r.userId === userId);
  }

  async deleteLeaveRequest(requestId: string): Promise<void> {
    localStorage.removeItem(`leave_${requestId}`);
  }

  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    WebHelpers.setItem(`balance_${balance.userId}`, balance);
  }

  async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    return WebHelpers.getItem<LeaveBalance>(`balance_${userId}`);
  }

  async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
    WebHelpers.setItem(`defaults_${userId}`, defaults);
  }

  async getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null> {
    return WebHelpers.getItem<LeaveRequestDefaults>(`defaults_${userId}`);
  }

}

export class MockLeaveRepository {
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

  private leaveRequests = new Map<string, LeaveRequest>();

  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    this.leaveBalances.set(balance.userId, balance);
  }

  async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    return this.leaveBalances.get(userId) || null;
  }

  private leaveBalances = new Map<string, LeaveBalance>();

  async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
    this.leaveDefaults.set(userId, defaults);
  }

  async getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null> {
    return this.leaveDefaults.get(userId) || null;
  }

  private leaveDefaults = new Map<string, LeaveRequestDefaults>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const leaveRepository = useMocks
  ? new MockLeaveRepository()
  : Platform.OS === 'web'
    ? new WebLeaveRepository()
    : new SQLiteLeaveRepository();
