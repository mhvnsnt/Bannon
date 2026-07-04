import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function runProjectMigrations() {
  console.log('[ProjectMigrations] Starting Project ID schema synchronization...');

  // Databases lists
  const bannonPhysicsDbPath = path.join(process.cwd(), 'bannon_physics.db');
  const memoryVaultDbPath = path.join(process.cwd(), 'memory_vault.db');

  let Database;
  try {
    Database = require('better-sqlite3');
  } catch(e) {
    console.log('[ProjectMigrations] better-sqlite3 not available. Skipping schema synchronization.');
    return;
  }

  const bannonDb = new Database(bannonPhysicsDbPath);
  const memoryDb = new Database(memoryVaultDbPath);

  // Helper to safely add project_id column
  const ensureProjectIdColumn = (db: any, tableName: string) => {
    try {
      // Check if table exists
      const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
      if (!tableCheck) {
        console.log(`[ProjectMigrations] Table ${tableName} does not exist in this database. Skipping.`);
        return;
      }

      // Read column info
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
      const hasProjectId = columns.some(col => col.name === 'project_id');

      if (!hasProjectId) {
        console.log(`[ProjectMigrations] Altering table ${tableName} to include 'project_id' column.`);
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN project_id TEXT DEFAULT 'bannon'`);
        
        // Ensure any existing rows have 'bannon' assigned
        const updateCount = db.prepare(`UPDATE ${tableName} SET project_id = 'bannon' WHERE project_id IS NULL`).run();
        console.log(`[ProjectMigrations] Initialized 'bannon' project ID for ${updateCount.changes} rows in ${tableName}.`);
      } else {
        console.log(`[ProjectMigrations] Table ${tableName} already has 'project_id' column.`);
      }
    } catch (err: any) {
      console.error(`[ProjectMigrations] Failed to check/alter ${tableName}: ${err.message}`);
    }
  };

  // Run on bannon_physics.db tables
  const bannonTables = ['dna_archive', 'kinetic_logs', 'swarm_results', 'prompt_queue'];
  bannonTables.forEach(table => {
    ensureProjectIdColumn(bannonDb, table);
  });

  // Run on memory_vault.db table
  ensureProjectIdColumn(memoryDb, 'memory_user_edits');

  console.log('[ProjectMigrations] Project ID schema migration complete.');
  
  // Close database connections safely
  bannonDb.close();
  memoryDb.close();
}
