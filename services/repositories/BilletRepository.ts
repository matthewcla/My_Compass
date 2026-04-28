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

export class SQLiteBilletRepository {
  async saveBillet(billet: Billet): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM billets');
    return Number(result?.count ?? 0);
  }

  async getPagedBillets(limit: number, offset: number): Promise<Billet[]> {
    const db = await DatabaseManager.getDB();
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

}

export class WebBilletRepository {
  async saveBillet(billet: Billet): Promise<void> {
    WebHelpers.setItem(`billet_${billet.id}`, billet);
  }

  async getBillet(id: string): Promise<Billet | null> {
    return WebHelpers.getItem<Billet>(`billet_${id}`);
  }

  async getAllBillets(): Promise<Billet[]> {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.startsWith('billet_'))
      .map(k => WebHelpers.getItem<Billet>(k)!);
  }

  async getBilletCount(): Promise<number> {
    return Object.keys(localStorage).filter(k => k.startsWith('billet_')).length;
  }

  async getPagedBillets(limit: number, offset: number): Promise<Billet[]> {
    const all = await this.getAllBillets();
    return all.slice(offset, offset + limit);
  }

}

export class MockBilletRepository {
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

  private billets = new Map<string, Billet>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const billetRepository = useMocks
  ? new MockBilletRepository()
  : Platform.OS === 'web'
    ? new WebBilletRepository()
    : new SQLiteBilletRepository();
