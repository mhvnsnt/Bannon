import { memoryVault as db } from "../../server/db.js";

export class StatePersistenceEngine {
  static async checkpointActiveCortex(sessionToken: string, activeBrainState: any): Promise<void> {
    const payloadString = JSON.stringify(activeBrainState);
    
    db.prepare(`
      INSERT INTO cortex_checkpoints (session_token, brain_payload, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(session_token) DO UPDATE SET
        brain_payload = excluded.brain_payload,
        updated_at = excluded.updated_at
    `).run(sessionToken, payloadString);
  }

  static async fetchLatestCheckpoint(sessionToken: string): Promise<any> {
    const row = db.prepare(`
      SELECT brain_payload FROM cortex_checkpoints 
      WHERE session_token = ? 
      LIMIT 1
    `).get(sessionToken);

    return row ? JSON.parse((row as any).brain_payload) : null;
  }
}
