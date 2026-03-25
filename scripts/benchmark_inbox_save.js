const { performance } = require('perf_hooks');
const sqlite3 = require('sqlite3').verbose();

async function runBenchmark() {
  const db = new sqlite3.Database(':memory:');

  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE inbox_messages (
        id TEXT PRIMARY KEY,
        type TEXT,
        subject TEXT,
        body TEXT,
        timestamp TEXT,
        is_read INTEGER,
        is_pinned INTEGER,
        metadata TEXT,
        last_sync_timestamp TEXT,
        sync_status TEXT
      )`, resolve);
    });
  });

  const runner = {
    getAllAsync: async (query) => {
      return new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    runAsync: async (query, ...params) => {
      return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };

  const existingCount = 10000;

  // Insert initial messages
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare("INSERT INTO inbox_messages (id) VALUES (?)");
      for (let i = 0; i < existingCount; i++) {
        stmt.run(`msg_${i}`);
      }
      stmt.finalize();
      db.run("COMMIT", err => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  // Array of new message ids
  const newMessagesIds = [];
  for (let i = 0; i < 2000; i++) {
    newMessagesIds.push(`msg_${i}`);
  }

  // Set JS-side latency to better simulate what happens in React Native with a real DB.

  const runnerSimulated = {
    getAllAsync: async (query) => {
      await new Promise(r => setTimeout(r, 2)); // simulate RN bridge overhead
      return runner.getAllAsync(query);
    },
    runAsync: async (query, ...params) => {
      await new Promise(r => setTimeout(r, 2)); // simulate RN bridge overhead
      return runner.runAsync(query, ...params);
    }
  };

  // === Baseline approach: fetch all, diff, chunked IN clause ===
  const startBaseline = performance.now();

  const existingRows = await runnerSimulated.getAllAsync('SELECT id FROM inbox_messages');
  const existingIds = new Set(existingRows.map((row) => row.id));
  const newIds = new Set(newMessagesIds);

  const idsToDelete = [];
  for (const id of existingIds) {
    if (!newIds.has(id)) {
      idsToDelete.push(id);
    }
  }

  const DELETE_CHUNK_SIZE = 900;
  for (let i = 0; i < idsToDelete.length; i += DELETE_CHUNK_SIZE) {
    const chunk = idsToDelete.slice(i, i + DELETE_CHUNK_SIZE);
    const placeholders = chunk.map(() => '?').join(', ');
    await runnerSimulated.runAsync(
      `DELETE FROM inbox_messages WHERE id IN (${placeholders});`,
      ...chunk
    );
  }

  const endBaseline = performance.now();
  console.log(`Baseline (Fetch, Diff, Chunked IN sequentially): ${endBaseline - startBaseline}ms`);

  // Reset database for optimized approach
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run('DELETE FROM inbox_messages');
      const stmt = db.prepare("INSERT INTO inbox_messages (id) VALUES (?)");
      for (let i = 0; i < existingCount; i++) {
        stmt.run(`msg_${i}`);
      }
      stmt.finalize();
      db.run("COMMIT", err => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  const startOptimizedManual = performance.now();
  try {
    const deletePromises = [];

    // Just batch run them in parallel
    for (let i = 0; i < idsToDelete.length; i += DELETE_CHUNK_SIZE) {
      const chunk = idsToDelete.slice(i, i + DELETE_CHUNK_SIZE);
      const placeholders = chunk.map(() => '?').join(', ');

      deletePromises.push(
        runnerSimulated.runAsync(
          `DELETE FROM inbox_messages WHERE id IN (${placeholders});`,
          ...chunk
        )
      );
    }
    await Promise.all(deletePromises);

    const endOptimizedManual = performance.now();
    console.log(`Optimized (Parallel Chunked IN): ${endOptimizedManual - startOptimizedManual}ms`);
  } catch(e) {
    console.log(`Failed: ${e.message}`);
  }

  db.close();
}

runBenchmark().catch(console.error);
