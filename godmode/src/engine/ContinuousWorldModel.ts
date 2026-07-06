export interface WorldSnapshot {
  recentErrors: any[];
  fileChangesLastHour: number;
  buildHealthScore: number;
  openTasks: number;
  completedTasksToday: number;
  providers: Record<string, { online: boolean, latency: number }>;
  uptime: number;
  thinkCycles: number;
  lastSuccessfulBuild: number;
  swarmJobsActive: number;
  memoryUsageMB: number;
  lastUpdated: number;
  quietPeriod: boolean;
}

export class ContinuousWorldModel {
  private state: WorldSnapshot = this.buildEmpty();

  private buildEmpty(): WorldSnapshot {
    return {
      // Codebase health
      recentErrors: [],
      fileChangesLastHour: 0,
      buildHealthScore: 100,
      openTasks: 0,
      completedTasksToday: 0,
      
      // Provider health
      providers: {
        ollama: { online: false, latency: 9999 },
        groq: { online: false, latency: 9999 },
        gemini: { online: false, latency: 9999 },
      },
      
      // Self state
      uptime: 0,
      thinkCycles: 0,
      lastSuccessfulBuild: 0,
      swarmJobsActive: 0,
      memoryUsageMB: 0,
      
      // Temporal
      lastUpdated: Date.now(),
      quietPeriod: false,
    };
  }

  public async refresh(db: any): Promise<WorldSnapshot> {
    const now = Date.now();
    const hour = new Date().getHours();
    
    // Read from DB — real data
    try {
      this.state.recentErrors = db.prepare(`
        SELECT payload FROM spine_event_log 
        WHERE event_type IN ('RUNTIME_ERROR','TYPE_ERROR','BUILD_FAILED','UNCAUGHT-EXCEPTION','UNHANDLED-REJECTION')
        AND timestamp >= datetime('now', '-1 hour') ORDER BY timestamp DESC LIMIT 10
      `).all().map((r: any) => {
        try {
          return JSON.parse(r.payload);
        } catch(e) {
          return { message: r.payload };
        }
      });

      this.state.fileChangesLastHour = db.prepare(`
        SELECT COUNT(*) as c FROM spine_event_log 
        WHERE event_type = 'FILE_CHANGED' AND timestamp >= datetime('now', '-1 hour')
      `).get()?.c || 0;

      this.state.openTasks = db.prepare(`
        SELECT COUNT(*) as c FROM autonomous_tasks WHERE status = 'PENDING'
      `).get()?.c || 0;

      this.state.completedTasksToday = db.prepare(`
        SELECT COUNT(*) as c FROM autonomous_tasks 
        WHERE status = 'COMPLETED' AND created_at >= datetime('now', '-1 day')
      `).get()?.c || 0;

      this.state.swarmJobsActive = db.prepare(`
        SELECT COUNT(*) as c FROM swarm_jobs WHERE status = 'RUNNING'
      `).get()?.c || 0;

      // Extract provider status from logs
      const services = ['ollama', 'groq', 'gemini'];
      for (const svc of services) {
        const latestEvent = db.prepare(`
          SELECT event_type, payload FROM spine_event_log
          WHERE event_type IN ('NETWORK_STATUS', 'PROVIDER_DOWN')
          AND payload LIKE ?
          ORDER BY timestamp DESC LIMIT 1
        `).get(`%"service":"${svc}"%`);

        if (latestEvent) {
          try {
            const data = JSON.parse(latestEvent.payload);
            this.state.providers[svc] = {
              online: latestEvent.event_type === 'NETWORK_STATUS' && data.online !== false,
              latency: data.latency !== undefined ? data.latency : (latestEvent.event_type === 'NETWORK_STATUS' ? 100 : 9999)
            };
          } catch (pe) {}
        }
      }
    } catch(e) {
      console.error('[ContinuousWorldModel] db refresh error:', e.message);
    }

    // Memory
    const mem = process.memoryUsage();
    this.state.memoryUsageMB = Math.round(mem.heapUsed / 1024 / 1024);
    
    // Quiet period (overnight hours = good for heavy tasks)
    this.state.quietPeriod = hour >= 1 && hour <= 5;
    
    // Build health score (degrades on errors, recovers over time)
    const errorPenalty = this.state.recentErrors.length * 8;
    this.state.buildHealthScore = Math.max(0, 100 - errorPenalty);
    
    this.state.uptime = process.uptime();
    this.state.lastUpdated = now;
    
    return this.state;
  }

  public getState(): WorldSnapshot { return this.state; }
  
  public getSummaryForPrompt(): string {
    const s = this.state;
    return `=== LIVE WORLD STATE ===
Build Health: ${s.buildHealthScore}/100
Recent Errors: ${s.recentErrors.length} in last hour
File Changes: ${s.fileChangesLastHour} in last hour  
Open Tasks: ${s.openTasks} | Completed Today: ${s.completedTasksToday}
Active Swarm Jobs: ${s.swarmJobsActive}
Memory: ${s.memoryUsageMB}MB
Quiet Period: ${s.quietPeriod}
Providers: ${Object.keys(s.providers).map((k) => k + ':' + (s.providers[k].online ? '✓' : '✗')).join(' | ')}
========================`;
  }
}
