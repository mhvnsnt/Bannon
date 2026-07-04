import { memoryVault } from './db';

class SessionGuard {
  init() {
    const last = memoryVault.prepare(`SELECT timestamp FROM session_snapshots ORDER BY timestamp DESC LIMIT 1`).get() as any;
    if (last) {
      const msSince = Date.now() - new Date(last.timestamp + 'Z').getTime();
      if (msSince > 5 * 60 * 1000) {
        console.log(`SESSION GUARD: Last snapshot is stale — system may have been interrupted. Latest known state: [${last.timestamp}]`);
      }
    }

    setInterval(() => {
      this.snapshot();
    }, 30000);
  }

  snapshot() {
    const mems = memoryVault.prepare("SELECT content FROM memory_user_edits").all();
    const swarmRes = memoryVault.prepare("SELECT * FROM swarm_results ORDER BY timestamp DESC LIMIT 10").all();
    const dnaArchive = memoryVault.prepare("SELECT * FROM dna_archive ORDER BY timestamp DESC LIMIT 1").get();
    const logs = memoryVault.prepare("SELECT * FROM kinetic_logs ORDER BY timestamp DESC LIMIT 10").all();
    
    memoryVault.prepare(`INSERT INTO session_snapshots (memory_vault_state, mind_state, roadmap_position, recent_swarm_results, recent_mind_logs, master_dna_config) VALUES (?, ?, ?, ?, ?, ?)`).run(
      JSON.stringify(mems),
      JSON.stringify({}),
      "ROADMAP", // simplified
      JSON.stringify(swarmRes),
      JSON.stringify(logs),
      JSON.stringify(dnaArchive)
    );

    // Keep only last 48
    memoryVault.prepare(`DELETE FROM session_snapshots WHERE id NOT IN (SELECT id FROM session_snapshots ORDER BY timestamp DESC LIMIT 48)`).run();
  }

  getLatestSnapshot() {
     return memoryVault.prepare(`SELECT * FROM session_snapshots ORDER BY timestamp DESC LIMIT 1`).get();
  }

  restoreFromSnapshot(snapshotId: number) {
     const snap = memoryVault.prepare(`SELECT * FROM session_snapshots WHERE id = ?`).get(snapshotId) as any;
     if (!snap) throw new Error("Snapshot not found");
     
     const mems = JSON.parse(snap.memory_vault_state);
     memoryVault.prepare(`DELETE FROM memory_user_edits`).run();
     const insertMem = memoryVault.prepare(`INSERT INTO memory_user_edits (content) VALUES (?)`);
     for (const m of mems) insertMem.run(m.content);
     
     return true;
  }
}

export const sessionGuard = new SessionGuard();
