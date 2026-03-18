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

export class SQLiteCareerRepository {
  async saveCareerEvents(events: CareerEvent[]): Promise<void> {
    await DatabaseManager.withWriteTransaction(async (runner) => {
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
    const db = await DatabaseManager.getDB();
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

}

export class WebCareerRepository {
  async saveCareerEvents(events: CareerEvent[]): Promise<void> {
    WebHelpers.setItem('career_events', events);
  }

  async getCareerEvents(): Promise<CareerEvent[]> {
    return WebHelpers.getItem<CareerEvent[]>('career_events') || [];
  }

}

export class MockCareerRepository {
  async saveCareerEvents(events: CareerEvent[]): Promise<void> {
    events.forEach(event => this.careerEvents.set(event.eventId, event));
  }

  async getCareerEvents(): Promise<CareerEvent[]> {
    return Array.from(this.careerEvents.values());
  }

  private careerEvents = new Map<string, CareerEvent>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const careerRepository = useMocks
  ? new MockCareerRepository()
  : Platform.OS === 'web'
    ? new WebCareerRepository()
    : new SQLiteCareerRepository();
