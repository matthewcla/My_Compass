require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    esModuleInterop: true,
  }
});
const { performance } = require('perf_hooks');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Create mock expo-sqlite
const expoSQLite = {
  openDatabaseAsync: async () => ({
    runAsync: async (query, ...args) => {
      return new Promise((resolve, reject) => {
        db.run(query, args, function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastInsertRowId: this.lastID });
        });
      });
    },
    getFirstAsync: async (query, ...args) => {
      return new Promise((resolve, reject) => {
        db.get(query, args, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    getAllAsync: async (query, ...args) => {
      return new Promise((resolve, reject) => {
        db.all(query, args, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    execAsync: async (query) => {
      return new Promise((resolve, reject) => {
        db.exec(query, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  })
};

const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', __dirname + '/..');

const mockModule = require('module');
const originalRequire = mockModule.prototype.require;
mockModule.prototype.require = function(request) {
  if (request === 'expo-sqlite') return expoSQLite;
  if (request === 'react-native') return { Platform: { OS: 'ios' } };
  if (request === '@/lib/encryption') return { encryptData: (d) => d, decryptData: (d) => d };
  if (request === '@/utils/jsonUtils') return { safeJsonParse: (d) => JSON.parse(d) };
  return originalRequire.apply(this, arguments);
};

const { DatabaseManager } = require('../services/db/DatabaseManager');
const { SQLitePCSRepository } = require('../services/repositories/PCSRepository');

async function setupDB() {
  await DatabaseManager.init();
  const dbInstance = await DatabaseManager.getDB();

  const userId = 'test_user_benchmark';

  for (let i = 0; i < 200; i++) {
    const orderId = `order_${i}`;
    await dbInstance.runAsync(
      `INSERT INTO historical_pcs_orders (
        id, user_id, order_number, origin_command, origin_location,
        gaining_command, gaining_location, departure_date, arrival_date,
        fiscal_year, total_malt, total_per_diem, total_reimbursement,
        is_oconus, is_sea_duty, status, archived_at,
        last_sync_timestamp, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      orderId, userId, `ORD-${i}`, 'Cmd A', 'Loc A', 'Cmd B', 'Loc B', new Date().toISOString(), new Date().toISOString(),
      2024, 100, 100, 200, 0, 0, 'ARCHIVED', null, new Date().toISOString(), 'synced'
    );
    // 5 documents per order
    for (let j = 0; j < 5; j++) {
      await dbInstance.runAsync(
        `INSERT INTO pcs_documents (
          id, pcs_order_id, category, filename, display_name,
          local_uri, original_url, size_bytes, uploaded_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        `doc_${i}_${j}`, orderId, 'ORDERS', 'test.pdf', 'test.pdf',
        'file://test.pdf', null, 1024, new Date().toISOString(), null
      );
    }
  }
}

async function runBaseline() {
  const repo = new SQLitePCSRepository();
  const start = performance.now();

  const userId = 'test_user_benchmark';
  const orders = await repo.getUserHistoricalPCSOrders(userId);

  const end = performance.now();
  console.log(`Baseline (N+1): ${end - start} ms, ${orders.length} orders`);
  return end - start;
}

async function runOptimized() {
  const repo = new SQLitePCSRepository();

  repo.getUserHistoricalPCSOrders = async function(userId) {
    const db = await DatabaseManager.getDB();
    try {
      const rows = await db.getAllAsync(
        'SELECT * FROM historical_pcs_orders WHERE user_id = ? ORDER BY departure_date DESC',
        userId
      );

      if (!rows || rows.length === 0) return [];

      const orderIds = rows.map(r => r.id);
      let allDocs = [];
      const CHUNK_SIZE = 900; // Safe limit for SQLite placeholders

      for (let i = 0; i < orderIds.length; i += CHUNK_SIZE) {
        const chunk = orderIds.slice(i, i + CHUNK_SIZE);
        const placeholders = chunk.map(() => '?').join(',');
        const docs = await db.getAllAsync(
          `SELECT * FROM pcs_documents WHERE pcs_order_id IN (${placeholders}) ORDER BY uploaded_at DESC`,
          ...chunk
        );
        allDocs = allDocs.concat(docs);
      }

      const docsByOrderId = {};
      for (const docRow of allDocs) {
        if (!docsByOrderId[docRow.pcs_order_id]) {
          docsByOrderId[docRow.pcs_order_id] = [];
        }
        docsByOrderId[docRow.pcs_order_id].push(this.mapRowToPCSDocument(docRow));
      }

      const orders = [];
      for (const row of rows) {
        orders.push(this.mapRowToHistoricalOrder(row, docsByOrderId[row.id] || []));
      }
      return orders;
    } catch (error) {
      if (error?.message?.includes('no such table')) return [];
      console.error('[Storage] Failed to fetch historical PCS orders:', error);
      return [];
    }
  };

  const start = performance.now();

  const userId = 'test_user_benchmark';
  const orders = await repo.getUserHistoricalPCSOrders(userId);

  const end = performance.now();
  console.log(`Optimized (IN clause chunked): ${end - start} ms, ${orders.length} orders`);
  return end - start;
}

async function main() {
  await setupDB();
  const t1 = await runBaseline();
  const t2 = await runOptimized();
  console.log(`Improvement: ${((t1 - t2) / t1 * 100).toFixed(2)}%`);
}

main().catch(console.error);
