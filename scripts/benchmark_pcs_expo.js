require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    esModuleInterop: true,
  }
});
const { performance } = require('perf_hooks');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', __dirname + '/..');

const expoSQLite = {
  openDatabaseSync: () => ({
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

// Hack around require and jest.mock
const mockModule = require('module');
const originalRequire = mockModule.prototype.require;
mockModule.prototype.require = function(request) {
  if (request === 'expo-sqlite') return expoSQLite;
  if (request === 'react-native') return { Platform: { OS: 'ios' } };
  if (request === '@/lib/encryption') return { encryptData: (d) => d, decryptData: (d) => d };
  if (request === '@/utils/jsonUtils') return { safeJsonParse: (d) => JSON.parse(d) };
  return originalRequire.apply(this, arguments);
};

const DatabaseManager = require('../services/db/DatabaseManager').DatabaseManager;
const SQLitePCSRepository = require('../services/repositories/PCSRepository').SQLitePCSRepository;

async function setupDB() {
  DatabaseManager.init();
  const dbInstance = await DatabaseManager.getDB();

  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS historical_pcs_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      departure_date TEXT,
      order_number TEXT, origin_command TEXT, origin_location TEXT,
      gaining_command TEXT, gaining_location TEXT, arrival_date TEXT,
      fiscal_year INTEGER, total_malt REAL, total_per_diem REAL, total_reimbursement REAL,
      is_oconus INTEGER, is_sea_duty INTEGER, status TEXT, archived_at TEXT,
      last_sync_timestamp TEXT, sync_status TEXT
    );
    CREATE TABLE IF NOT EXISTS pcs_documents (
      id TEXT PRIMARY KEY,
      pcs_order_id TEXT,
      category TEXT, filename TEXT, display_name TEXT,
      local_uri TEXT, original_url TEXT, size_bytes INTEGER, uploaded_at TEXT, metadata TEXT
    );
  `);

  const userId = 'test_user_benchmark';

  for (let i = 0; i < 200; i++) {
    const orderId = `order_${i}`;
    await dbInstance.runAsync('INSERT INTO historical_pcs_orders (id, user_id, departure_date) VALUES (?, ?, ?)', orderId, userId, new Date().toISOString());
    // 5 documents per order
    for (let j = 0; j < 5; j++) {
      await dbInstance.runAsync('INSERT INTO pcs_documents (id, pcs_order_id, uploaded_at) VALUES (?, ?, ?)', `doc_${i}_${j}`, orderId, new Date().toISOString());
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

  // monkey patch getUserHistoricalPCSOrders
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
      const CHUNK_SIZE = 900;

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
