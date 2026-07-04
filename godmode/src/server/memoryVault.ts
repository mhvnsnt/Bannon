import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let memoryVaultDb: any;

try {
  const Database = require('better-sqlite3');
  memoryVaultDb = new Database('memory_vault.db', { verbose: process.env.NODE_ENV !== 'production' ? console.log : undefined });
} catch (e) {
  console.warn("[VAULT] better-sqlite3 not found. Falling back to in-memory dummy DB.");
  class DummyStmt {
    constructor(public sql: string) {}
    run(...args: any[]) { return { changes: 1, lastInsertRowid: Date.now() }; }
    get(...args: any[]) { return { count: 0 }; }
    all(...args: any[]) { return []; }
  }

  memoryVaultDb = {
    prepare: (sql: string) => new DummyStmt(sql),
    exec: (sql: string) => {},
    pragma: (sql: string) => {},
    transaction: (fn: any) => fn,
    close: () => {}
  };
}

// Initialize the table mirroring the Claude memory_user_edits persistent fact store
memoryVaultDb.exec(`
  CREATE TABLE IF NOT EXISTS memory_user_edits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const MemoryVaultTool = {
  /**
   * View all existing memories
   */
  view: () => {
    const stmt = memoryVaultDb.prepare('SELECT id, content, updated_at FROM memory_user_edits ORDER BY id ASC');
    return stmt.all();
  },
  
  /**
   * Add a new structured fact string
   */
  add: (content: string) => {
    const stmt = memoryVaultDb.prepare('INSERT INTO memory_user_edits (content) VALUES (?)');
    const result = stmt.run(content);
    return { success: true, id: result.lastInsertRowid, content };
  },

  /**
   * Replace an existing memory fact string entirely
   */
  replace: (id: number, content: string) => {
    const stmt = memoryVaultDb.prepare('UPDATE memory_user_edits SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(content, id);
    return { success: result.changes > 0, id, content };
  },

  /**
   * Remove a memory
   */
  remove: (id: number) => {
    const stmt = memoryVaultDb.prepare('DELETE FROM memory_user_edits WHERE id = ?');
    const result = stmt.run(id);
    return { success: result.changes > 0, id };
  }
};
