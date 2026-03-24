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

export class SQLitePCSRepository {
  async saveHistoricalPCSOrder(order: HistoricalPCSOrder): Promise<void> {
    await DatabaseManager.withWriteTransaction(async (runner) => {
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
      const CHUNK_SIZE = 50;
      for (let i = 0; i < order.documents.length; i += CHUNK_SIZE) {
        const chunk = order.documents.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 0) continue;

        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values: any[] = [];

        for (const doc of chunk) {
          values.push(
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

        await runner.runAsync(
          `INSERT OR REPLACE INTO pcs_documents (
            id, pcs_order_id, category, filename, display_name,
            local_uri, original_url, size_bytes, uploaded_at, metadata
          ) VALUES ${placeholders};`,
          ...values
        );
      }
    });
  }

  async getUserHistoricalPCSOrders(userId: string): Promise<HistoricalPCSOrder[]> {
    const db = await DatabaseManager.getDB();
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM historical_pcs_orders WHERE user_id = ? ORDER BY departure_date DESC',
        userId
      );

      if (!rows || rows.length === 0) {
        return [];
      }

      // Optimize: batch fetch all documents to avoid N+1 query problem
      const orderIds = rows.map((r: any) => r.id);
      let allDocs: any[] = [];
      const CHUNK_SIZE = 900; // Safe limit for SQLite placeholders

      for (let i = 0; i < orderIds.length; i += CHUNK_SIZE) {
        const chunk = orderIds.slice(i, i + CHUNK_SIZE);
        const placeholders = chunk.map(() => '?').join(',');
        const docs = await db.getAllAsync<any>(
          `SELECT * FROM pcs_documents WHERE pcs_order_id IN (${placeholders}) ORDER BY uploaded_at DESC`,
          ...chunk
        );
        allDocs = allDocs.concat(docs);
      }

      // Group documents by order ID
      const docsByOrderId: Record<string, PCSDocument[]> = {};
      for (const docRow of allDocs) {
        if (!docsByOrderId[docRow.pcs_order_id]) {
          docsByOrderId[docRow.pcs_order_id] = [];
        }
        docsByOrderId[docRow.pcs_order_id].push(this.mapRowToPCSDocument(docRow));
      }

      const orders: HistoricalPCSOrder[] = [];
      for (const row of rows) {
        orders.push(this.mapRowToHistoricalOrder(row, docsByOrderId[row.id] || []));
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
    // Cascade delete handles pcs_documents
    await db.runAsync('DELETE FROM historical_pcs_orders WHERE id = ?', id);
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

  async savePCSDocument(doc: PCSDocument): Promise<void> {
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
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
    const db = await DatabaseManager.getDB();
    await db.runAsync('DELETE FROM pcs_documents WHERE id = ?', docId);
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

export class WebPCSRepository {
  async saveHistoricalPCSOrder(order: HistoricalPCSOrder): Promise<void> {
    const orders = WebHelpers.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    const filtered = orders.filter(o => o.id !== order.id);
    WebHelpers.setItem('pcs_archive', [...filtered, order]);
  }

  async getUserHistoricalPCSOrders(userId: string): Promise<HistoricalPCSOrder[]> {
    const orders = WebHelpers.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    return orders
      .filter(o => o.userId === userId)
      .sort((a, b) => b.departureDate.localeCompare(a.departureDate));
  }

  async getHistoricalPCSOrder(id: string): Promise<HistoricalPCSOrder | null> {
    const orders = WebHelpers.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    return orders.find(o => o.id === id) || null;
  }

  async deleteHistoricalPCSOrder(id: string): Promise<void> {
    const orders = WebHelpers.getItem<HistoricalPCSOrder[]>('pcs_archive') || [];
    WebHelpers.setItem('pcs_archive', orders.filter(o => o.id !== id));
  }

  async savePCSDocument(doc: PCSDocument): Promise<void> {
    const docs = WebHelpers.getItem<PCSDocument[]>('pcs_documents') || [];
    const filtered = docs.filter(d => d.id !== doc.id);
    WebHelpers.setItem('pcs_documents', [...filtered, doc]);
  }

  async getPCSDocument(docId: string): Promise<PCSDocument | null> {
    const docs = WebHelpers.getItem<PCSDocument[]>('pcs_documents') || [];
    return docs.find(d => d.id === docId) || null;
  }

  async getPCSDocuments(pcsOrderId: string): Promise<PCSDocument[]> {
    const docs = WebHelpers.getItem<PCSDocument[]>('pcs_documents') || [];
    return docs.filter(d => d.pcsOrderId === pcsOrderId);
  }

  async deletePCSDocument(docId: string): Promise<void> {
    const docs = WebHelpers.getItem<PCSDocument[]>('pcs_documents') || [];
    WebHelpers.setItem('pcs_documents', docs.filter(d => d.id !== docId));
  }

}

export class MockPCSRepository {
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

  private historicalPCSOrders = new Map<string, HistoricalPCSOrder>();

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

  private pcsDocuments = new Map<string, PCSDocument>();

}

const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
export const pcsRepository = useMocks
  ? new MockPCSRepository()
  : Platform.OS === 'web'
    ? new WebPCSRepository()
    : new SQLitePCSRepository();
