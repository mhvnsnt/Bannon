import fs from 'fs';
import path from 'path';

export interface ReflexPattern {
    pattern: string;
    fixType: string;
    source: 'MANUAL' | 'LEARNED_FROM_DIAGNOSTIC' | 'LEARNED_FROM_PARLIAMENT';
    triggerCount: number;
    lastTriggered?: number;
}

export class ReflexLookupTable {
    private patterns: ReflexPattern[] = [];

    constructor(private db: any = null, private memorySpine: any = null) {
        this.initTableSchema();
        this.buildInitialTable();
    }

    private initTableSchema() {
        if (!this.db) return;
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS reflex_patterns (
                    pattern TEXT PRIMARY KEY,
                    fix_type TEXT NOT NULL,
                    source TEXT NOT NULL,
                    trigger_count INTEGER DEFAULT 0,
                    last_triggered INTEGER
                );
            `);
        } catch (e) {
            console.error('[ReflexLookupTable] Schema initialization failed:', e);
        }
    }

    public buildInitialTable() {
        const defaultPatterns: ReflexPattern[] = [
            {
                pattern: "Cannot find module",
                fixType: "NPM_INSTALL_MISSING",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "SyntaxError: Unexpected token",
                fixType: "SYNTAX_REPAIR_PROMPT",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "EADDRINUSE",
                fixType: "PORT_KILL_RESTART",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "SQLITE_CONSTRAINT",
                fixType: "DATABASE_ROLLBACK_RETRY",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "Cannot read properties of undefined",
                fixType: "CHECK_REGRESSION_OR_ASSERT",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "Railway deployment failed: build error",
                fixType: "TRIGGER_DIAGNOSTIC_BUILD_HEAL",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "TS2304", // TS cannot find name
                fixType: "TS_AUTO_IMPORT_CORRECTION",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "TS2345", // Argument type mismatch
                fixType: "TS_TYPE_CAST_OR_RECODE",
                source: "MANUAL",
                triggerCount: 0
            },
            {
                pattern: "TS7006", // Implicit any
                fixType: "TS_EXPLICIT_ANY_ANNOTATION",
                source: "MANUAL",
                triggerCount: 0
            }
        ];

        if (this.db) {
            try {
                const insertStmt = this.db.prepare(`
                    INSERT OR IGNORE INTO reflex_patterns (pattern, fix_type, source, trigger_count)
                    VALUES (?, ?, ?, ?)
                `);
                for (const p of defaultPatterns) {
                    insertStmt.run(p.pattern, p.fixType, p.source, p.triggerCount);
                }
                this.loadFromDB();
            } catch (err) {
                console.error('[ReflexLookupTable] Failed to seed default patterns:', err);
                this.patterns = defaultPatterns;
            }
        } else {
            this.patterns = defaultPatterns;
        }
    }

    private loadFromDB() {
        if (!this.db) return;
        try {
            const rows = this.db.prepare("SELECT * FROM reflex_patterns").all();
            this.patterns = rows.map((r: any) => ({
                pattern: r.pattern,
                fixType: r.fix_type,
                source: r.source as any,
                triggerCount: r.trigger_count,
                lastTriggered: r.last_triggered || undefined
            }));
        } catch (e) {
            console.error('[ReflexLookupTable] Failed to load patterns:', e);
        }
    }

    public addPattern(errorPattern: string, fixType: string, source: 'MANUAL' | 'LEARNED_FROM_DIAGNOSTIC' | 'LEARNED_FROM_PARLIAMENT') {
        const p: ReflexPattern = {
            pattern: errorPattern,
            fixType,
            source,
            triggerCount: 0
        };

        if (this.db) {
            try {
                this.db.prepare(`
                    INSERT OR REPLACE INTO reflex_patterns (pattern, fix_type, source, trigger_count, last_triggered)
                    VALUES (?, ?, ?, ?, ?)
                `).run(errorPattern, fixType, source, 0, null);
                this.loadFromDB();
            } catch (e) {
                console.error('[ReflexLookupTable] Failed to store pattern:', e);
            }
        } else {
            this.patterns = this.patterns.filter(item => item.pattern !== errorPattern);
            this.patterns.push(p);
        }

        if (this.memorySpine) {
            this.memorySpine.recordEvent(
                'God Mode OS',
                'SYSTEM',
                'REFLEX_LEARNING',
                `Learned new reflex pattern signature: "${errorPattern}" mapped to "${fixType}" (${source})`
            );
        }
        console.log(`[ReflexLookupTable] Pattern added successfully: ${errorPattern} -> ${fixType}`);
    }

    public matchError(errorMessage: string): { match: ReflexPattern | null; confidence: number } {
        let bestMatch: ReflexPattern | null = null;
        let maxOverlap = 0;

        for (const p of this.patterns) {
            if (errorMessage.toLowerCase().includes(p.pattern.toLowerCase())) {
                const overlapScore = p.pattern.length / errorMessage.length;
                // Favor exact matches or matches that cover a larger portion of the pattern, or simple inclusion
                const confidence = Math.min(1.0, 0.5 + (overlapScore * 0.5));
                
                if (confidence > maxOverlap) {
                    maxOverlap = confidence;
                    bestMatch = p;
                }
            }
        }

        // If simple keyword match found, confidence is at least 0.8
        if (bestMatch) {
            return { match: bestMatch, confidence: 0.85 };
        }

        return { match: null, confidence: 0.0 };
    }

    public learnFromHeal(errorEvent: any, successfulFix: string, healLevel: string) {
        // Try to generalise error patterns. If the error includes specific filenames or paths, generalise by replacing them with a broad category.
        const msg = errorEvent.errorMessage;
        
        let generalizedMessage = msg;
        let inferredFixType = 'SURGICAL_CODE_PATCH';

        if (msg.includes('Cannot find module')) {
            generalizedMessage = 'Cannot find module';
            inferredFixType = 'NPM_INSTALL_MISSING';
        } else if (msg.includes('SyntaxError')) {
            generalizedMessage = 'SyntaxError';
            inferredFixType = 'SYNTAX_REPAIR_PROMPT';
        } else if (msg.includes('EADDRINUSE')) {
            generalizedMessage = 'EADDRINUSE';
            inferredFixType = 'PORT_KILL_RESTART';
        }

        // Ignore learning already existing broad patterns
        const existing = this.patterns.find(p => p.pattern.toLowerCase() === generalizedMessage.toLowerCase());
        if (!existing) {
            const src = healLevel === 'LEVEL_2' ? 'LEARNED_FROM_DIAGNOSTIC' : 'LEARNED_FROM_PARLIAMENT';
            this.addPattern(generalizedMessage, inferredFixType, src);
        }
    }

    public incrementTrigger(pattern: string) {
        if (this.db) {
            try {
                this.db.prepare(`
                    UPDATE reflex_patterns 
                    SET trigger_count = trigger_count + 1, last_triggered = ?
                    WHERE pattern = ?
                `).run(Date.now(), pattern);
                this.loadFromDB();
            } catch (e) {
                console.error('[ReflexLookupTable] Failed to update trigger count:', e);
            }
        } else {
            const p = this.patterns.find(x => x.pattern === pattern);
            if (p) {
                p.triggerCount++;
                p.lastTriggered = Date.now();
            }
        }
    }

    public getTableStats() {
        const total = this.patterns.length;
        const manual = this.patterns.filter(p => p.source === 'MANUAL').length;
        const learned = this.patterns.filter(p => p.source !== 'MANUAL').length;
        const triggerTotals = this.patterns.reduce((sum, p) => sum + p.triggerCount, 0);

        return {
            totalPatterns: total,
            manualPatterns: manual,
            learnedPatterns: learned,
            totalTriggers: triggerTotals,
            patternsList: this.patterns
        };
    }
}
