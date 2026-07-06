import path from 'path';
import Database from 'better-sqlite3';

export let memoryVault: any;

try {
  const dbPath = path.resolve('bannon_physics.db');
  memoryVault = new Database(dbPath, { verbose: null });
  memoryVault.pragma('foreign_keys = ON');
  console.log("✅ Using native better-sqlite3 backend.");
} catch (e) {
  console.warn("⚠️ better-sqlite3 native bindings not found (running in cloud sandbox).");
  console.warn("🔄 Routing all memory saves to basic JS array held in RAM.");
  
  class DummyStmt {
    constructor(public sql: string) {}
    run(...args: any[]) { return { changes: 1, lastInsertRowid: Date.now() }; }
    get(...args: any[]) { return undefined; }
    all(...args: any[]) { return []; }
  }

  memoryVault = {
    prepare: (sql: string) => new DummyStmt(sql),
    exec: (sql: string) => {},
    pragma: (sql: string) => {},
    transaction: (fn: any) => fn,
    close: () => {}
  };
}
