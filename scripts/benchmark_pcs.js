const sqlite3 = require('sqlite3').verbose();
const { performance } = require('perf_hooks');

const db = new sqlite3.Database(':memory:');

async function setupDB() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE historical_pcs_orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        departure_date TEXT
      )`);
      db.run(`CREATE TABLE pcs_documents (
        id TEXT PRIMARY KEY,
        pcs_order_id TEXT
      )`);

      const stmtOrders = db.prepare('INSERT INTO historical_pcs_orders VALUES (?, ?, ?)');
      const stmtDocs = db.prepare('INSERT INTO pcs_documents VALUES (?, ?)');

      const userId = 'user_1';
      for (let i = 0; i < 1000; i++) {
        const orderId = `order_${i}`;
        stmtOrders.run(orderId, userId, new Date().toISOString());
        // 5 documents per order
        for (let j = 0; j < 5; j++) {
          stmtDocs.run(`doc_${i}_${j}`, orderId);
        }
      }

      stmtOrders.finalize();
      stmtDocs.finalize();
      resolve();
    });
  });
}

function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function runBaseline() {
  const start = performance.now();

  const userId = 'user_1';
  const rows = await runQuery('SELECT * FROM historical_pcs_orders WHERE user_id = ? ORDER BY departure_date DESC', [userId]);

  const orders = [];
  for (const row of rows) {
    const docs = await runQuery('SELECT * FROM pcs_documents WHERE pcs_order_id = ? ORDER BY id DESC', [row.id]);
    orders.push({ ...row, documents: docs });
  }

  const end = performance.now();
  console.log(`Baseline (N+1): ${end - start} ms, ${orders.length} orders`);
  return end - start;
}

async function runOptimized() {
  const start = performance.now();

  const userId = 'user_1';
  // Optimized using WHERE IN chunking
  const rows = await runQuery('SELECT * FROM historical_pcs_orders WHERE user_id = ? ORDER BY departure_date DESC', [userId]);

  if (rows.length === 0) {
    const end = performance.now();
    console.log(`Optimized: ${end - start} ms, 0 orders`);
    return end - start;
  }

  const orderIds = rows.map(r => r.id);
  const CHUNK_SIZE = 900;
  let allDocs = [];

  for (let i = 0; i < orderIds.length; i += CHUNK_SIZE) {
    const chunk = orderIds.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => '?').join(',');
    const docs = await runQuery(
      `SELECT * FROM pcs_documents WHERE pcs_order_id IN (${placeholders}) ORDER BY id DESC`,
      chunk
    );
    allDocs = allDocs.concat(docs);
  }

  // Group docs by order id
  const docsByOrderId = {};
  for (const doc of allDocs) {
    if (!docsByOrderId[doc.pcs_order_id]) {
      docsByOrderId[doc.pcs_order_id] = [];
    }
    docsByOrderId[doc.pcs_order_id].push(doc);
  }

  const orders = [];
  for (const row of rows) {
    orders.push({ ...row, documents: docsByOrderId[row.id] || [] });
  }

  const end = performance.now();
  console.log(`Optimized: ${end - start} ms, ${orders.length} orders`);
  return end - start;
}

async function main() {
  await setupDB();

  console.log('Running baseline...');
  const t1 = await runBaseline();

  console.log('Running optimized...');
  const t2 = await runOptimized();

  console.log(`Improvement: ${((t1 - t2) / t1 * 100).toFixed(2)}%`);
}

main().catch(console.error);
