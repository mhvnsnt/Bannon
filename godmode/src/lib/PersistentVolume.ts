import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const isRailway =
  process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
const dbDirectory = isRailway
  ? "/app/data"
  : path.resolve(process.cwd(), "./data");
const dbPath = path.join(dbDirectory, "taskMatrix.db");

// Guarantee the persistent volume directory exists before connection initialization
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

export const db = new Database(dbPath);

// Initialize core structural tables for agent state tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_memory (
    id TEXT PRIMARY KEY,
    session_context TEXT,
    stability_score REAL,
    entropy_score REAL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

const versionRow = db.prepare("PRAGMA user_version").get() as {
  user_version: number;
};
if (versionRow.user_version < 1) {
  try {
    db.exec(`ALTER TABLE agent_memory ADD COLUMN node_metadata TEXT;`);
  } catch (err) {
    console.log("Column node_metadata might already exist", err);
  }
  db.exec("PRAGMA user_version = 1");
  console.log("[STORAGE UPGRADE] Database schema migrated to version 1");
}

console.log(`[STORAGE INITIALIZED] Database permanently anchored at ${dbPath}`);

export async function getDiskUsageStats() {
  try {
    const stats = await fs.promises.statfs(dbDirectory);
    const totalSpace = stats.blocks * stats.bsize;
    const freeSpace = stats.bfree * stats.bsize;
    return {
      totalSpaceMB: (totalSpace / 1024 / 1024).toFixed(2),
      freeSpaceMB: (freeSpace / 1024 / 1024).toFixed(2),
      usedSpaceMB: ((totalSpace - freeSpace) / 1024 / 1024).toFixed(2),
    };
  } catch (error) {
    console.error("[STORAGE METRICS] Failed to retrieve disk usage", error);
    return null;
  }
}
