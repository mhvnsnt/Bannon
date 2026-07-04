
export interface CurationLedgerEntry {
    id: string;
    timestamp: number;
    project_id: string;
    session_id: string;
    task_intent: string;
    tone_score: number;
    complexity_score: number;
    pattern_score: number;
    naming_score: number;
    soul_score: number;
    total_score: number;
    passed: boolean;
    flags: string; // JSON Array
    revision_count: number;
    final_outcome: string;
    token_cost: number;
    is_canonical?: boolean;
}

export class CurationLedger {
    constructor(private db: any = null) {
        this.initTable();
    }

    private initTable() {
        if (!this.db) return;
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS curation_ledger (
                    id TEXT PRIMARY KEY,
                    timestamp INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    task_intent TEXT NOT NULL,
                    tone_score INTEGER NOT NULL,
                    complexity_score INTEGER NOT NULL,
                    pattern_score INTEGER NOT NULL,
                    naming_score INTEGER NOT NULL,
                    soul_score INTEGER NOT NULL,
                    total_score INTEGER NOT NULL,
                    passed BOOLEAN NOT NULL,
                    flags TEXT NOT NULL,
                    revision_count INTEGER NOT NULL,
                    final_outcome TEXT NOT NULL,
                    token_cost REAL NOT NULL,
                    is_canonical INTEGER DEFAULT 0
                );
            `);
            console.log('✅ SQLite curation_ledger table initialized');
        } catch (e) {
            console.error('[CurationLedger] Failed to initialize table:', e);
        }
    }

    public recordDecision(entry: CurationLedgerEntry) {
        if (!this.db) return;
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO curation_ledger (
                    id, timestamp, project_id, session_id, task_intent,
                    tone_score, complexity_score, pattern_score, naming_score, soul_score,
                    total_score, passed, flags, revision_count, final_outcome, token_cost
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                entry.id,
                entry.timestamp,
                entry.project_id,
                entry.session_id,
                entry.task_intent,
                entry.tone_score,
                entry.complexity_score,
                entry.pattern_score,
                entry.naming_score,
                entry.soul_score,
                entry.total_score,
                entry.passed ? 1 : 0,
                entry.flags,
                entry.revision_count,
                entry.final_outcome,
                entry.token_cost
            );
        } catch (e) {
            console.error('[CurationLedger] Failed to record decision:', e);
        }
    }

    public setCanonical(id: string, isCanonical: boolean) {
        if (!this.db) return;
        try {
            const stmt = this.db.prepare(`
                UPDATE curation_ledger 
                SET is_canonical = ? 
                WHERE id = ?
            `);
            stmt.run(isCanonical ? 1 : 0, id);
        } catch (e) {
            console.error('[CurationLedger] Failed to set canonical on entry:', e);
        }
    }

    public getCurationStats(projectId?: string) {
        if (!this.db) {
            return {
                totalOutputs: 0,
                firstPassRate: 0,
                avgTone: 0,
                avgComplexity: 0,
                avgPattern: 0,
                avgNaming: 0,
                avgSoul: 0,
                avgTotal: 0,
                avgRevisions: 0,
                failedPermanently: 0
            };
        }
        try {
            let totalQuery = 'SELECT COUNT(*) as cnt FROM curation_ledger';
            let firstPassQuery = "SELECT COUNT(*) as cnt FROM curation_ledger WHERE passed = 1 AND revision_count = 1";
            let avgQuery = `
                SELECT 
                    AVG(tone_score) as avgTone, 
                    AVG(complexity_score) as avgComp, 
                    AVG(pattern_score) as avgPat, 
                    AVG(naming_score) as avgNam, 
                    AVG(soul_score) as avgSoul, 
                    AVG(total_score) as avgTot,
                    AVG(revision_count) as avgRev 
                FROM curation_ledger
            `;
            let failedPermanentlyQuery = "SELECT COUNT(*) as cnt FROM curation_ledger WHERE final_outcome = 'BLOCKED'";

            const params: any[] = [];
            if (projectId) {
                totalQuery += ' WHERE project_id = ?';
                firstPassQuery += ' AND project_id = ?';
                avgQuery += ' WHERE project_id = ?';
                failedPermanentlyQuery += ' AND project_id = ?';
                params.push(projectId);
            }

            const total = (this.db.prepare(totalQuery).get(...params) as any).cnt;
            if (total === 0) {
                return {
                    totalOutputs: 0,
                    firstPassRate: 100,
                    avgTone: 100,
                    avgComplexity: 100,
                    avgPattern: 100,
                    avgNaming: 100,
                    avgSoul: 100,
                    avgTotal: 100,
                    avgRevisions: 0,
                    failedPermanently: 0
                };
            }

            const firstPass = (this.db.prepare(firstPassQuery).get(...params) as any).cnt;
            const avgRow = this.db.prepare(avgQuery).get(...params) as any;
            const failedPermanently = (this.db.prepare(failedPermanentlyQuery).get(...params) as any).cnt;

            return {
                totalOutputs: total,
                firstPassRate: Math.round((firstPass / total) * 100),
                avgTone: Math.round(avgRow.avgTone || 0),
                avgComplexity: Math.round(avgRow.avgComp || 0),
                avgPattern: Math.round(avgRow.avgPat || 0),
                avgNaming: Math.round(avgRow.avgNam || 0),
                avgSoul: Math.round(avgRow.avgSoul || 0),
                avgTotal: Math.round(avgRow.avgTot || 0),
                avgRevisions: parseFloat((avgRow.avgRev || 1).toFixed(1)),
                failedPermanently
            };
        } catch (e) {
            console.error('[CurationLedger] Failed to fetch stats:', e);
            return {
                totalOutputs: 0,
                firstPassRate: 0,
                avgTone: 0,
                avgComplexity: 0,
                avgPattern: 0,
                avgNaming: 0,
                avgSoul: 0,
                avgTotal: 0,
                avgRevisions: 0,
                failedPermanently: 0
            };
        }
    }

    public getWorstOutputs(projectId?: string, limit: number = 5): any[] {
        if (!this.db) return [];
        try {
            const query = projectId 
                ? 'SELECT * FROM curation_ledger WHERE project_id = ? ORDER BY total_score ASC LIMIT ?'
                : 'SELECT * FROM curation_ledger ORDER BY total_score ASC LIMIT ?';
            const params = projectId ? [projectId, limit] : [limit];
            return this.db.prepare(query).all(...params);
        } catch (e) {
            console.error('[CurationLedger] Failed to fetch worst outputs:', e);
            return [];
        }
    }

    public getBestOutputs(projectId?: string, limit: number = 5): any[] {
        if (!this.db) return [];
        try {
            const query = projectId 
                ? 'SELECT * FROM curation_ledger WHERE project_id = ? ORDER BY total_score DESC LIMIT ?'
                : 'SELECT * FROM curation_ledger ORDER BY total_score DESC LIMIT ?';
            const params = projectId ? [projectId, limit] : [limit];
            return this.db.prepare(query).all(...params);
        } catch (e) {
            console.error('[CurationLedger] Failed to fetch best outputs:', e);
            return [];
        }
    }

    public getCanonicalOutputs(projectId?: string): any[] {
        if (!this.db) return [];
        try {
            const query = projectId 
                ? 'SELECT * FROM curation_ledger WHERE project_id = ? AND is_canonical = 1 ORDER BY timestamp DESC'
                : 'SELECT * FROM curation_ledger WHERE is_canonical = 1 ORDER BY timestamp DESC';
            const params = projectId ? [projectId] : [];
            return this.db.prepare(query).all(...params);
        } catch (e) {
            console.error('[CurationLedger] Failed to fetch canonical outputs:', e);
            return [];
        }
    }
}
