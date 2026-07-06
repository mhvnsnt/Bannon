import fs from 'fs';
import path from 'path';

export interface CurationScore {
    projectId: string;
    taskIntent: string;
    timestamp: number;
    toneScore: number;
    complexityScore: number;
    patternScore: number;
    namingScore: number;
    soulScore: number;
    totalScore: number;
    passed: boolean;
    flags: any[];
    recommendations: string[];
    blockingIssues: string[];
}

export interface HealEvent {
    id: string;
    timestamp: number;
    projectId: string;
    sessionId: string;
    errorType: string;
    errorMessage: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    level_reached: number;
    heal_attempts: string; // JSON string
    final_outcome: string;
    fix_applied?: string;
    time_to_heal_ms?: number;
    token_cost?: number;
    reflex_pattern_learned?: string;
}

export class MemorySpine {
    constructor(private db: any = null) {
        this.initTables();
    }

    private initTables() {
        if (!this.db) return;
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS memory_spine (
                    id TEXT PRIMARY KEY,
                    timestamp INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    layer_context TEXT NOT NULL,
                    message TEXT NOT NULL,
                    metadata TEXT
                );
                CREATE TABLE IF NOT EXISTS healing_events (
                    id TEXT PRIMARY KEY,
                    timestamp INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    error_type TEXT NOT NULL,
                    error_message TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    level_reached INTEGER NOT NULL,
                    heal_attempts TEXT NOT NULL,
                    final_outcome TEXT NOT NULL,
                    fix_applied TEXT,
                    time_to_heal_ms INTEGER,
                    token_cost REAL,
                    reflex_pattern_learned TEXT
                );
            `);
            console.log('✅ SQLite Memory Spine tables initialized');
        } catch (e) {
            console.error('[MemorySpine] Failed to initialize SQLite tables:', e);
        }
    }

    public recordEvent(projectId: string, sessionId: string, layerContext: string, message: string, metadata: any = null) {
        if (!this.db) return;
        try {
            const id = 'MEM-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
            const stmt = this.db.prepare(`
                INSERT INTO memory_spine (id, timestamp, project_id, session_id, layer_context, message, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(id, Date.now(), projectId, sessionId, layerContext, message, metadata ? JSON.stringify(metadata) : '');
        } catch (e) {
            console.error('[MemorySpine] Failed to record event:', e);
        }
    }

    public recordCurationEvent(projectId: string, sessionId: string, curationScore: CurationScore, outcome: string) {
        this.recordEvent(
            projectId,
            sessionId,
            "CURATION_ENGINE",
            `Project curated with score ${curationScore.totalScore.toFixed(1)}/100. Resolution outcome: ${outcome}`,
            curationScore
        );
    }

    public getCurationHistory(projectId?: string, limit: number = 30): any[] {
        if (!this.db) return [];
        try {
            if (projectId) {
                const rows = this.db.prepare(`
                    SELECT * FROM memory_spine 
                    WHERE layer_context = 'CURATION_ENGINE' AND project_id = ? 
                    ORDER BY timestamp DESC LIMIT ?
                `).all(projectId, limit);
                return rows.map((r: any) => ({
                    ...r,
                    metadata: r.metadata ? JSON.parse(r.metadata) : null
                }));
            } else {
                const rows = this.db.prepare(`
                    SELECT * FROM memory_spine 
                    WHERE layer_context = 'CURATION_ENGINE' 
                    ORDER BY timestamp DESC LIMIT ?
                `).all(limit);
                return rows.map((r: any) => ({
                    ...r,
                    metadata: r.metadata ? JSON.parse(r.metadata) : null
                }));
            }
        } catch (e) {
            console.error('[MemorySpine] Failed to fetch curation history:', e);
            return [];
        }
    }

    public recordHealEvent(healEvent: HealEvent) {
        if (!this.db) return;
        try {
            const stmt = this.db.prepare(`
                INSERT INTO healing_events (
                    id, timestamp, project_id, session_id, error_type, error_message, 
                    severity, level_reached, heal_attempts, final_outcome, fix_applied, 
                    time_to_heal_ms, token_cost, reflex_pattern_learned
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                healEvent.id,
                healEvent.timestamp,
                healEvent.projectId,
                healEvent.sessionId,
                healEvent.errorType,
                healEvent.errorMessage,
                healEvent.severity,
                healEvent.level_reached,
                healEvent.heal_attempts,
                healEvent.final_outcome,
                healEvent.fix_applied || '',
                healEvent.time_to_heal_ms || 0,
                healEvent.token_cost || 0.0,
                healEvent.reflex_pattern_learned || ''
            );
            this.recordEvent(
                healEvent.projectId,
                healEvent.sessionId,
                "HEAL_VERIFIED",
                `Healing event updated: ${healEvent.errorMessage} -> Final outcome: ${healEvent.final_outcome}. Severity: ${healEvent.severity}`,
                healEvent
            );
        } catch (e) {
            console.error('[MemorySpine] Failed to write healing event:', e);
        }
    }

    public getHealingPattern(errorType: string): string | null {
        if (!this.db) return null;
        try {
            const row = this.db.prepare(`
                SELECT fix_applied FROM healing_events 
                WHERE error_type = ? AND final_outcome = 'HEAL_VERIFIED' 
                ORDER BY timestamp DESC LIMIT 1
            `).get(errorType) as any;
            return row ? row.fix_applied : null;
        } catch (e) {
            console.error('[MemorySpine] Failed to query healing pattern:', e);
            return null;
        }
    }

    public getProjectHealthScore(projectId: string): { score: number; breakdown: any } {
        if (!this.db) return { score: 100, breakdown: { errorsCount: 0, healSuccessRate: 100, escalations: 0 } };
        try {
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            
            const rowErrors = this.db.prepare(`
                SELECT COUNT(*) as cnt FROM healing_events 
                WHERE project_id = ? AND timestamp > ?
            `).get(projectId, sevenDaysAgo) as any;
            const errorsCount = rowErrors ? rowErrors.cnt : 0;

            const rowSuccess = this.db.prepare(`
                SELECT COUNT(*) as cnt FROM healing_events 
                WHERE project_id = ? AND final_outcome = 'HEAL_VERIFIED' AND timestamp > ?
            `).get(projectId, sevenDaysAgo) as any;
            const successCount = rowSuccess ? rowSuccess.cnt : 0;

            const rowEsc = this.db.prepare(`
                SELECT COUNT(*) as cnt FROM healing_events 
                WHERE project_id = ? AND final_outcome LIKE '%ESCALATE%' AND timestamp > ?
            `).get(projectId, sevenDaysAgo) as any;
            const escalationsCount = rowEsc ? rowEsc.cnt : 0;

            let healSuccessRate = 100;
            if (errorsCount > 0) {
                healSuccessRate = Math.round((successCount / errorsCount) * 100);
            }

            // Deduct points from 100 base
            let score = 100;
            score -= errorsCount * 5; // -5 points per error
            score -= escalationsCount * 25; // -25 points per escalation
            if (healSuccessRate < 80) {
                score -= (80 - healSuccessRate) * 0.5;
            }

            score = Math.max(0, Math.min(100, score));

            return {
                score,
                breakdown: {
                    errorsCount,
                    healSuccessRate,
                    escalations: escalationsCount
                }
            };
        } catch (e) {
            console.error('[MemorySpine] Failed to calculate project health score:', e);
            return { score: 100, breakdown: { errorsCount: 0, healSuccessRate: 100, escalations: 0 } };
        }
    }
}
