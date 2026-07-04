import { memoryVault } from './db';
import { swarmOrchestrator } from './swarmOrchestrator';

class ResurrectionEngine {
  init() {
    const interrupted = memoryVault.prepare(`SELECT * FROM resurrection_log WHERE status = 'STARTED'`).all() as any[];
    for (const op of interrupted) {
      console.log(`RESURRECTION: Found interrupted [${op.op_type}] from [${op.timestamp}] — resuming`);
      if (op.op_type === 'SWARM_STARTED') {
        try {
          const payload = JSON.parse(op.payload);
          // async resume
          swarmOrchestrator.dispatch(payload).then(() => {
             memoryVault.prepare(`UPDATE resurrection_log SET status = 'RESURRECTED' WHERE id = ?`).run(op.id);
          });
        } catch (e) {
          console.error("Failed to resume op", e);
        }
      }
    }
  }

  logStart(type: string, id: string, payload: any) {
    memoryVault.prepare(`INSERT INTO resurrection_log (op_type, op_id, status, payload) VALUES (?, ?, 'STARTED', ?)`).run(type, id, JSON.stringify(payload));
  }

  logComplete(type: string, id: string, resolution: any) {
    // Usually we update the STARTED to COMPLETED
    memoryVault.prepare(`UPDATE resurrection_log SET status = 'COMPLETED', resolution = ? WHERE op_id = ? AND op_type = ?`).run(JSON.stringify(resolution), id, type.replace('COMPLETED', 'STARTED').replace('STARTED', 'STARTED')); 
    // simplification
  }

  getResurrectionLog(limit = 10) {
    return memoryVault.prepare(`SELECT * FROM resurrection_log ORDER BY timestamp DESC LIMIT ?`).all(limit);
  }

  getInterruptedOps() {
    return memoryVault.prepare(`SELECT * FROM resurrection_log WHERE status = 'STARTED'`).all();
  }
}

export const resurrectionEngine = new ResurrectionEngine();
