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

export class SQLiteApplicationRepository {
  async saveApplication(app: Application): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    await DatabaseManager.withWriteTransaction(async (runner) => {
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB(); // Ensure DB is initialized
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
    const db = await DatabaseManager.getDB();
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

  async saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void> {
    const db = await DatabaseManager.getDB();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO assignment_decisions_entries (user_id, billet_id, decision, timestamp)
       VALUES (?, ?, ?, ?);`,
      userId, billetId, decision, now
    );
  }

  async removeAssignmentDecision(userId: string, billetId: string): Promise<void> {
    const db = await DatabaseManager.getDB();
    await db.runAsync(
      `DELETE FROM assignment_decisions_entries WHERE user_id = ? AND billet_id = ?;`,
      userId, billetId
    );
  }

  async getAssignmentDecisions(userId: string): Promise<Record<string, string> | null> {
    const db = await DatabaseManager.getDB();
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

}

export class WebApplicationRepository {
  async saveApplication(app: Application): Promise<void> {
    WebHelpers.setItem(`app_${app.id}`, app);
    // Update user index if it exists
    const indexKey = `user_apps_idx_${app.userId}`;
    const index = WebHelpers.getItem<string[]>(indexKey);
    if (index && !index.includes(app.id)) {
      index.push(app.id);
      WebHelpers.setItem(indexKey, index);
    }
  }

  async saveApplications(apps: Application[]): Promise<void> {
    // Group by user to optimize index updates
    const appsByUser = new Map<string, Application[]>();
    for (const app of apps) {
      if (!appsByUser.has(app.userId)) {
        appsByUser.set(app.userId, []);
      }
      appsByUser.get(app.userId)!.push(app);
    }

    for (const [userId, userApps] of appsByUser) {
      const indexKey = `user_apps_idx_${userId}`;
      const index = WebHelpers.getItem<string[]>(indexKey);

      for (const app of userApps) {
        WebHelpers.setItem(`app_${app.id}`, app);
        if (index && !index.includes(app.id)) {
          index.push(app.id);
        }
      }

      if (index) {
        WebHelpers.setItem(indexKey, index);
      }
    }
  }

  async getApplication(id: string): Promise<Application | null> {
    return WebHelpers.getItem<Application>(`app_${id}`);
  }

  async getUserApplications(userId: string): Promise<Application[]> {
    const indexKey = `user_apps_idx_${userId}`;
    const index = WebHelpers.getItem<string[]>(indexKey);

    if (index) {
      // Fast path: use index
      const apps = index
        .map(id => WebHelpers.getItem<Application>(`app_${id}`))
        .filter(a => a !== null) as Application[];

      // Self-healing: if we found nulls (deleted apps), update the index
      if (apps.length !== index.length) {
        WebHelpers.setItem(indexKey, apps.map(a => a.id));
      }
      return apps;
    }

    // Slow path: scan all keys (fallback/migration)
    const keys = Object.keys(localStorage);
    const apps = keys.filter(k => k.startsWith('app_'))
      .map(k => WebHelpers.getItem<Application>(k)!)
      .filter(a => a.userId === userId);

    // Build index for next time
    WebHelpers.setItem(indexKey, apps.map(a => a.id));

    return apps;
  }

  async deleteApplication(appId: string): Promise<void> {
    const app = WebHelpers.getItem<Application>(`app_${appId}`);
    if (app) {
      const indexKey = `user_apps_idx_${app.userId}`;
      const index = WebHelpers.getItem<string[]>(indexKey);
      if (index) {
        const newIndex = index.filter(id => id !== appId);
        if (newIndex.length !== index.length) {
          WebHelpers.setItem(indexKey, newIndex);
        }
      }
    }
    localStorage.removeItem(`app_${appId}`);
  }

  async saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void> {
    const decisions = WebHelpers.getItem<Record<string, string>>(`decisions_${userId}`) || {};
    decisions[billetId] = decision;
    WebHelpers.setItem(`decisions_${userId}`, decisions);
  }

  async removeAssignmentDecision(userId: string, billetId: string): Promise<void> {
    const decisions = WebHelpers.getItem<Record<string, string>>(`decisions_${userId}`) || {};
    delete decisions[billetId];
    WebHelpers.setItem(`decisions_${userId}`, decisions);
  }

  async getAssignmentDecisions(userId: string): Promise<Record<string, string> | null> {
    return WebHelpers.getItem<Record<string, string>>(`decisions_${userId}`);
  }

}

export class MockApplicationRepository {
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

  private applications = new Map<string, Application>();

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

  private decisions = new Map<string, Record<string, string>>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const applicationRepository = useMocks
  ? new MockApplicationRepository()
  : Platform.OS === 'web'
    ? new WebApplicationRepository()
    : new SQLiteApplicationRepository();
