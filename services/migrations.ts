// =============================================================================
// TYPES
// =============================================================================

interface Migration {
    version: number;
    description: string;
    up: (db: DatabaseLike) => Promise<void>;
}

interface DatabaseLike {
    execAsync: (sql: string) => Promise<void>;
}

// =============================================================================
// MIGRATIONS
// =============================================================================

const migrations: Migration[] = [
    {
        version: 1,
        description: 'Add preferences column to users table',
        up: async (db) => {
            await db.execAsync(`ALTER TABLE users ADD COLUMN preferences TEXT;`);
        },
    },
    {
        version: 2,
        description: 'Add normal_working_hours column to leave_requests table',
        up: async (db) => {
            await db.execAsync(
                `ALTER TABLE leave_requests ADD COLUMN normal_working_hours TEXT DEFAULT '0700-1600';`
            );
        },
    },
    {
        version: 3,
        description: 'Add leave_in_conus column to leave_requests table',
        up: async (db) => {
            await db.execAsync(
                `ALTER TABLE leave_requests ADD COLUMN leave_in_conus INTEGER DEFAULT 1;`
            );
        },
    },
    {
        version: 4,
        description: 'Add prd column to users table',
        up: async (db) => {
            await db.execAsync(`ALTER TABLE users ADD COLUMN prd TEXT;`);
        },
    },
    {
        version: 5,
        description: 'Add seaos column to users table',
        up: async (db) => {
            await db.execAsync(`ALTER TABLE users ADD COLUMN seaos TEXT;`);
        },
    },
    {
        version: 6,
        description: 'Create assignment_decisions_entries table',
        up: async (db) => {
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS assignment_decisions_entries (
                    user_id TEXT NOT NULL,
                    billet_id TEXT NOT NULL,
                    decision TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    PRIMARY KEY (user_id, billet_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                CREATE INDEX IF NOT EXISTS idx_assignment_decisions_entries_user_id ON assignment_decisions_entries(user_id);
            `);
        },
    },
];

// =============================================================================
// MIGRATION RUNNER
// =============================================================================

/**
 * Run all pending migrations in order.
 * Gracefully handles "already exists" / "duplicate column" errors
 * for backward compatibility with pre-versioned databases.
 */
export async function runMigrationSystem(db: DatabaseLike): Promise<void> {
    // Ensure schema_version table exists
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_version (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            version INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        );
    `);

    await db.execAsync(`
        INSERT OR IGNORE INTO schema_version (id, version, updated_at)
        VALUES (1, 0, '${new Date().toISOString()}');
    `);

    // We need to read the current version. Since we only have execAsync,
    // we'll use a workaround: try each migration and catch "already exists" errors.
    // For databases with the version table already populated, we track via execAsync.

    // Strategy: Run all migrations, catch duplicates gracefully,
    // then set the final version.
    let highestApplied = 0;

    for (const migration of migrations) {
        try {
            await migration.up(db);
            highestApplied = migration.version;
            console.log(`[Migrations] Applied v${migration.version}: ${migration.description}`);
        } catch (e: any) {
            const msg = e?.message ?? '';
            if (
                msg.includes('duplicate column name') ||
                msg.includes('already exists') ||
                msg.includes('table already exists')
            ) {
                // Already applied — mark as applied and continue
                highestApplied = migration.version;
            } else {
                console.error(
                    `[Migrations] Failed at v${migration.version} (${migration.description}):`,
                    e
                );
                // Stop on unexpected errors — don't skip migrations
                break;
            }
        }
    }

    // Update schema_version to the highest successfully applied migration
    if (highestApplied > 0) {
        try {
            await db.execAsync(`
                UPDATE schema_version
                SET version = ${highestApplied}, updated_at = '${new Date().toISOString()}'
                WHERE id = 1;
            `);
        } catch (e) {
            console.error('[Migrations] Failed to update schema_version:', e);
        }
    }
}
