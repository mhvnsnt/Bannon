import { memoryVault } from './db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class MemoryConsolidator {
  private static isConsolidating = false;

  static init() {
    // Check every hour if we need to run consolidation
    setInterval(() => {
      const now = new Date();
      // Run consolidation at 3 AM local time
      if (now.getHours() === 3) {
        this.consolidate().catch(console.error);
      }
    }, 60 * 60 * 1000);

    // Also offer a manual trigger link on startup if the database is large
    setTimeout(() => {
      this.checkDatabaseSizeAndAlert();
    }, 15000);
  }

  private static checkDatabaseSizeAndAlert() {
    try {
      const stats = this.getStorageStats();
      console.log(`[MemoryConsolidator] Database status: size=${(stats.dbSizeMb).toFixed(2)}MB, totalRows=${stats.totalRows}`);
      if (stats.dbSizeMb > 15) {
        console.warn(`[MemoryConsolidator] Performance safeguard: Database size exceeds 15MB. Triggering immediate memory consolidation.`);
        this.consolidate().catch(console.error);
      }
    } catch {}
  }

  static async consolidate(): Promise<boolean> {
    if (this.isConsolidating) return false;
    this.isConsolidating = true;

    console.log('[MemoryConsolidator] Launching spatial SQLite space optimization & retention sweeps...');

    try {
      // 1. Consolidate detailed kinetic_logs older than 7 days
      this.consolidateKineticLogs();

      // 2. Prune routined (non-essential) spine logs older than 3 days
      this.consolidateSpineEventLogs();

      // 3. Compress old swarm result parameters (older than 30 days)
      this.compressSwarmResults();

      // 4. Compress old mind contextual snapshots (older than 14 days)
      this.compressMindLogs();

      // 5. Run WAL checkpoint or database VACUUM to free inactive pages back to disk
      console.log('[MemoryConsolidator] VACUUMing database physical structure...');
      memoryVault.exec('VACUUM');

      // Log successful maintenance event to spine_event_log
      try {
        memoryVault.prepare(`
          INSERT INTO spine_event_log (event_type, payload)
          VALUES ('CONSOLIDATION_COMPLETED', 'Optimized database parameters. Reclaimed unused blocks successfully.')
        `).run();
      } catch {}

      console.log('[MemoryConsolidator] Consolidation maintenance complete.');
      return true;
    } catch (e) {
      console.error('[MemoryConsolidator] Failed consolidation sweep:', e);
      return false;
    } finally {
      this.isConsolidating = false;
    }
  }

  private static consolidateKineticLogs() {
    try {
      // Get all kinetic logs older than 7 days
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - 7);
      const dateStr = thresholdDate.toISOString().slice(0, 10) + ' 23:59:59';

      const oldLogs = memoryVault.prepare(`
        SELECT * FROM kinetic_logs 
        WHERE timestamp < datetime(?)
        ORDER BY timestamp ASC
      `).all(dateStr) as any[];

      if (oldLogs.length === 0) return;

      console.log(`[MemoryConsolidator] Grouping and digesting ${oldLogs.length} historical kinetic records...`);

      // Group logs by day
      const groupedByDay: Record<string, any[]> = {};
      for (const log of oldLogs) {
        const day = new Date(log.timestamp).toISOString().slice(0, 10);
        if (!groupedByDay[day]) groupedByDay[day] = [];
        groupedByDay[day].push(log);
      }

      const insertStmt = memoryVault.prepare(`
        INSERT INTO kinetic_logs (id, session_id, stage_transition, bass_sensitivity, turbulence, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const deleteStmt = memoryVault.prepare(`
        DELETE FROM kinetic_logs WHERE date(timestamp) = date(?)
      `);

      // Run Transaction to preserve atomicity
      const transaction = memoryVault.transaction(() => {
        for (const [day, dayLogs] of Object.entries(groupedByDay)) {
          const changeCount = dayLogs.length;
          const maxTurbulence = Math.max(...dayLogs.map(l => l.turbulence || 0));
          const avgBass = dayLogs.reduce((acc, l) => acc + (l.bass_sensitivity || 0), 0) / changeCount;

          const summaryText = `[CONSOLIDIDATED DIGEST] Day ${day} encapsulated ${changeCount} file modifications. Peak Turbulence: ${maxTurbulence.toFixed(2)}, Average Bass Sensitivity: ${avgBass.toFixed(2)}`;

          // 1. Delete details for this day
          deleteStmt.run(day + ' 00:00:00');

          // 2. Insert summarized row
          insertStmt.run(
            `digest_${day}`,
            'nexus-consolidator',
            summaryText,
            avgBass,
            maxTurbulence,
            day + ' 12:00:00'
          );
        }
      });

      transaction();
    } catch (e: any) {
      console.warn('[MemoryConsolidator] Kinetic logs consolidation skipped or table does not exist yet:', e.message);
    }
  }

  private static consolidateSpineEventLogs() {
    try {
      const stmt = memoryVault.prepare(`
        DELETE FROM spine_event_log 
        WHERE timestamp < datetime('now', '-3 days') 
        AND event_type NOT IN ('ERROR', 'MIND_DIRECTIVE', 'CONSOLIDATION_COMPLETED')
      `);
      const info = stmt.run();
      if (info.changes > 0) {
        console.log(`[MemoryConsolidator] Pruned ${info.changes} obsolete routing event lines.`);
      }
    } catch {}
  }

  private static compressSwarmResults() {
    try {
      const stmt = memoryVault.prepare(`
        UPDATE swarm_results 
        SET builder_output = NULL, destroyer_critique = NULL 
        WHERE timestamp < datetime('now', '-30 days')
      `);
      const info = stmt.run();
      if (info.changes > 0) {
        console.log(`[MemoryConsolidator] Compressed ${info.changes} swarm tasks (nulled code payloads).`);
      }
    } catch {}
  }

  private static compressMindLogs() {
    try {
      const stmt = memoryVault.prepare(`
        UPDATE mind_log 
        SET full_context_snapshot = NULL 
        WHERE timestamp < datetime('now', '-14 days')
      `);
      const info = stmt.run();
      if (info.changes > 0) {
        console.log(`[MemoryConsolidator] Compressed ${info.changes} mind directives (removed snapshot dumps).`);
      }
    } catch {}
  }

  static getStorageStats() {
    const dbPath = path.join(process.cwd(), 'bannon_physics.db');
    let sizeBytes = 0;
    try {
      if (fs.existsSync(dbPath)) {
        sizeBytes = fs.statSync(dbPath).size;
      }
    } catch {}

    const tables = ['embeddings', 'swarm_results', 'mind_log', 'kinetic_logs', 'dna_archive', 'spine_event_log'];
    const rowCounts: Record<string, number> = {};
    let totalRows = 0;

    for (const t of tables) {
      try {
        const row = memoryVault.prepare(`SELECT count(*) as count FROM ${t}`).get() as any;
        rowCounts[t] = row ? row.count : 0;
        totalRows += rowCounts[t];
      } catch {
        rowCounts[t] = 0;
      }
    }

    const estimatedDays = Math.max(1, Math.round((1024 * 1024 * 25 - sizeBytes) / (1024 * 50))); // assuming 50KB growth per day, 25MB threshold

    return {
      dbPath,
      dbSizeMb: sizeBytes / (1024 * 1024),
      rowCounts,
      totalRows,
      estimatedDaysUntilRefit: estimatedDays,
      lastConsolidated: new Date().toISOString()
    };
  }
}

MemoryConsolidator.init();
