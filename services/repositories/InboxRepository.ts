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

export class SQLiteInboxRepository {
  async saveInboxMessages(messages: InboxMessage[]): Promise<void> {
    await DatabaseManager.withWriteTransaction(async (runner) => {
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
        // According to Expo SQLite limits, variables limit is typically 999
        const DELETE_CHUNK_SIZE = 900;
        const deletePromises = [];
        for (let i = 0; i < idsToDelete.length; i += DELETE_CHUNK_SIZE) {
          const chunk = idsToDelete.slice(i, i + DELETE_CHUNK_SIZE);
          const placeholders = chunk.map(() => '?').join(', ');
          deletePromises.push(
            runner.runAsync(
              `DELETE FROM inbox_messages WHERE id IN (${placeholders});`,
              ...chunk
            )
          );
        }
        await Promise.all(deletePromises);
      }
    });
  }

  async getInboxMessages(): Promise<InboxMessage[]> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
    await db.runAsync(
      'UPDATE inbox_messages SET is_read = ? WHERE id = ?',
      isRead ? 1 : 0,
      id
    );
  }

  async updateInboxMessagePinStatus(id: string, isPinned: boolean): Promise<void> {
    const db = await DatabaseManager.getDB();
    await db.runAsync(
      'UPDATE inbox_messages SET is_pinned = ? WHERE id = ?',
      isPinned ? 1 : 0,
      id
    );
  }

}

export class WebInboxRepository {
  async saveInboxMessages(messages: InboxMessage[]): Promise<void> {
    WebHelpers.setItem('inbox_messages', messages.slice(0, 500));
  }

  async getInboxMessages(): Promise<InboxMessage[]> {
    return (WebHelpers.getItem<InboxMessage[]>('inbox_messages') || []).slice(0, 500);
  }

  async updateInboxMessageReadStatus(id: string, isRead: boolean): Promise<void> {
    const messages = await this.getInboxMessages();
    const newMessages = messages.map(m => m.id === id ? { ...m, isRead } : m);
    await this.saveInboxMessages(newMessages);
  }

  async updateInboxMessagePinStatus(id: string, isPinned: boolean): Promise<void> {
    const messages = await this.getInboxMessages();
    const newMessages = messages.map(m => m.id === id ? { ...m, isPinned } : m);
    await this.saveInboxMessages(newMessages);
  }

}

export class MockInboxRepository {
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

  async updateInboxMessagePinStatus(id: string, isPinned: boolean): Promise<void> {
    const msg = this.inboxMessages.get(id);
    if (msg) {
      this.inboxMessages.set(id, { ...msg, isPinned });
    }
  }

  private inboxMessages = new Map<string, InboxMessage>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const inboxRepository = useMocks
  ? new MockInboxRepository()
  : Platform.OS === 'web'
    ? new WebInboxRepository()
    : new SQLiteInboxRepository();
