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

export class SQLiteDashboardRepository {
  async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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

export class WebDashboardRepository {
  async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
    WebHelpers.setItem(`dash_${userId}`, data);
  }

  async getDashboardCache(userId: string): Promise<DashboardData | null> {
    return WebHelpers.getItem<DashboardData>(`dash_${userId}`);
  }

}

export class MockDashboardRepository {
  async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
    this.dashboardCache.set(userId, data);
  }

  async getDashboardCache(userId: string): Promise<DashboardData | null> {
    return this.dashboardCache.get(userId) || null;
  }

  private dashboardCache = new Map<string, DashboardData>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const dashboardRepository = useMocks
  ? new MockDashboardRepository()
  : Platform.OS === 'web'
    ? new WebDashboardRepository()
    : new SQLiteDashboardRepository();
