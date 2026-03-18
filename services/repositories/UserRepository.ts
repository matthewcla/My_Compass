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

export class SQLiteUserRepository {
  async saveUser(user: User): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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

}

export class WebUserRepository {
  async saveUser(user: User): Promise<void> {
    WebHelpers.setItem(`user_${user.id}`, user);
  }

  async getUser(id: string): Promise<User | null> {
    return WebHelpers.getItem<User>(`user_${id}`);
  }

}

export class MockUserRepository {
  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  private users = new Map<string, User>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const userRepository = useMocks
  ? new MockUserRepository()
  : Platform.OS === 'web'
    ? new WebUserRepository()
    : new SQLiteUserRepository();
