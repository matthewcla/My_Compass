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

const DB_NAME = 'my_compass.db';

export class DatabaseManager {
  private static dbInstance: SQLite.SQLiteDatabase | null = null;
  private static writeQueue: Promise<void> = Promise.resolve();

  static async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (this.dbInstance) return this.dbInstance;
    this.dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    return this.dbInstance;
  }

  static async enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const queuedOperation = this.writeQueue.then(operation, operation);
    this.writeQueue = queuedOperation.then(() => undefined, () => undefined);
    return queuedOperation;
  }

  static async withWriteTransaction(task: (runner: SQLite.SQLiteDatabase) => Promise<void>): Promise<void> {
    const db = await this.getDB();
    await this.enqueueWrite(async () => {
      if (Platform.OS === 'web') {
        await db.withTransactionAsync(async () => await task(db));
        return;
      }
      await db.withExclusiveTransactionAsync(async (txn) => await task(txn));
    });
  }

  static async init(): Promise<void> {
    const db = await this.getDB();
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await initializeSQLiteTables(db);
  }
}

export const WebHelpers = {
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
