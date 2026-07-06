import { memoryVault } from './db';

export class RealitySyncService {
  constructor(private db: any = memoryVault) {}

  public logEvent(eventType: string, data: any): void {
    try {
      this.db.prepare(`
        INSERT INTO spine_event_log (event_type, payload)
        VALUES (?, ?)
      `).run(eventType, JSON.stringify(data));
      console.log(`[REALITY-SYNC-SQLITE] Event logged: ${eventType}`);
    } catch(e: any) {
      console.error('[REALITY-SYNC-SQLITE] DB write failed:', e.message);
    }
  }

  public getLogs(limit = 100): any[] {
    try {
      return this.db.prepare(`
        SELECT timestamp, event_type, payload FROM spine_event_log
        ORDER BY timestamp DESC LIMIT ?
      `).all(limit).map((r: any) => ({
        timestamp: r.timestamp,
        event: r.event_type,
        details: JSON.parse(r.payload || '{}')
      }));
    } catch {
      return [];
    }
  }
}

export const realitySync = new RealitySyncService();

export function attachRealitySyncRoutes(router: any, realitySyncInstance: RealitySyncService = realitySync) {
    router.get('/sync/logs', (req: any, res: any) => {
        try {
            res.json({ success: true, logs: realitySyncInstance.getLogs() });
        } catch(e: any) {
            res.status(500).json({ error: e.message });
        }
    });
}
