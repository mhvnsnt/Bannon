import fs from 'fs';
import path from 'path';

export interface CurationProfile {
    projectId: string;
    projectName: string;
    tone: {
        descriptors: string[];
        antiDescriptors: string[];
        exampleFunctionNames: string[];
        exampleVariableNames: string[];
        exampleUIcopy: string[];
    };
    complexityCeiling: {
        maxFunctionLines: number;
        minFunctionLines: number;
        maxFileLines: number;
        warningThreshold: number;
    };
    patternLanguage: {
        requiredPatterns: string[];
        allowedPatterns: string[];
        forbiddenPatterns: string[];
    };
    namingConventions: {
        prefixes: string[];
        suffixes: string[];
        caseStyle: 'camelCase' | 'PascalCase' | 'snake_case';
        exampleNames: string[];
        antiNames: string[];
    };
    soulKeywords: string[];
    antiKeywords: string[];
    referenceOutputs: string[];
}

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
    flags: string[];
    recommendations: string[];
    blockingIssues: string[];
}

export class CurationEngine {
    private profiles: Map<string, CurationProfile> = new Map();

    constructor(private db: any = null, private memorySpine: any = null) {
        this.initTables();
        this.autoCreateDefaultProfiles();
    }

    private initTables() {
        if (!this.db) return;
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS curation_profiles (
                    project_id TEXT PRIMARY KEY,
                    project_name TEXT NOT NULL,
                    profile_json TEXT NOT NULL
                );
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
                    token_cost REAL NOT NULL
                );
            `);
        } catch (e) {
            console.error('[CurationEngine] Schema creation failed:', e);
        }
    }

    private loadProfilesFromDB() {
        if (!this.db) return;
        try {
            const rows = this.db.prepare("SELECT * FROM curation_profiles").all();
            for (const r of rows) {
                const profile = JSON.parse(r.profile_json);
                this.profiles.set(r.project_id, profile);
            }
        } catch (e) {
            console.error('[CurationEngine] Failed to load curation profiles:', e);
        }
    }

    public autoCreateDefaultProfiles() {
        this.loadProfilesFromDB();

        // 1. PROFILE: BANNON_FIGHTER
        const bannonProfile: CurationProfile = {
            projectId: "BANNON_FIGHTER",
            projectName: "Bannon Fighter",
            tone: {
                descriptors: ["aggressive", "physical", "kinetic", "immediate", "visceral", "mechanical", "responsive"],
                antiDescriptors: ["gentle", "soft", "minimal", "corporate", "enterprise", "abstract"],
                exampleFunctionNames: ["applyGrapple", "spring1D", "updatePhysics"],
                exampleVariableNames: ["lockupState", "deliverMove"],
                exampleUIcopy: ["KO", "GRAVITY", "FIGHT"]
            },
            complexityCeiling: {
                maxFunctionLines: 150,
                minFunctionLines: 5,
                maxFileLines: 10000,
                warningThreshold: 120
            },
            patternLanguage: {
                requiredPatterns: ["Three.js geometry", "spring-damper physics", "state machine", "gamepad input", "animation loop"],
                allowedPatterns: ["canvas", "webgl", "renderer", "keys"],
                forbiddenPatterns: ["Vue.js", "Angular", "REST API endpoints", "database queries in game loop", "async/await in physics loop"]
            },
            namingConventions: {
                prefixes: ["add", "apply", "update"],
                suffixes: ["State", "Move", "Physics"],
                caseStyle: "camelCase",
                exampleNames: ["buildAnatomy", "applyGrapple", "spring1D", "updatePhysics", "MoveDict", "lockupState", "deliverMove"],
                antiNames: ["handleClick", "fetchData", "renderComponent", "apiCall", "dbQuery"]
            },
            soulKeywords: [
                "grapple", "suplex", "tombstone", "physics", "anatomy", "spring", "damper", "kinematic", "lockup",
                "deliver", "powerbomb", "chokeslam", "referee", "pin", "submission", "three.js", "geometry", "mesh",
                "rigidbody", "collision", "gamepad", "wrestler", "movedict", "stagger", "reversal"
            ],
            antiKeywords: ["checkout", "payment", "user profile", "dashboard", "analytics", "CRM", "invoice", "ticket"],
            referenceOutputs: []
        };

        // 2. PROFILE: GOD_MODE_OS
        const godModeProfile: CurationProfile = {
            projectId: "GOD_MODE_OS",
            projectName: "God Mode OS",
            tone: {
                descriptors: ["architectural", "precise", "layered", "systematic", "autonomous", "intelligent", "sovereign"],
                antiDescriptors: ["casual", "hacky", "temporary", "placeholder", "approximate", "rough"],
                exampleFunctionNames: ["voidEngine", "memorySpine", "parliamentSession"],
                exampleVariableNames: ["reflexHeal", "nexusInit"],
                exampleUIcopy: ["Sovereign Core Enabled"]
            },
            complexityCeiling: {
                maxFunctionLines: 500,
                minFunctionLines: 10,
                maxFileLines: 50000,
                warningThreshold: 400
            },
            patternLanguage: {
                requiredPatterns: ["TypeScript classes", "SQLite persistence", "React TSX", "OpenRouter API", "event emitters", "middleware pattern"],
                allowedPatterns: ["express", "router", "express-static", "sqlite"],
                forbiddenPatterns: ["inline SQL strings", "console.log without Memory Spine recording", "hardcoded API keys", "synchronous file reads", "callback hell"]
            },
            namingConventions: {
                prefixes: ["void", "nexus", "memory"],
                suffixes: ["Engine", "Spine", "Parliament", "Heal", "Init", "Orchestrator"],
                caseStyle: "camelCase",
                exampleNames: ["voidEngine", "memorySpine", "parliamentSession", "reflexHeal", "nexusInit", "curationEngine", "healingEngine", "modelParliament", "orchestrator"],
                antiNames: ["temp", "test123", "myFunction", "doStuff", "handleThing", "fixIt"]
            },
            soulKeywords: [
                "void", "compression", "parliament", "spine", "curation", "mastermind", "nexus", "healing",
                "orchestration", "forge", "reality", "quantum", "layer", "curation", "token", "semantic",
                "chunk", "skeletonize", "parliament", "proposer", "critic", "validator", "reflex"
            ],
            antiKeywords: ["shopping cart", "user login", "product page", "blog post", "contact form"],
            referenceOutputs: []
        };

        this.createProfile("BANNON_FIGHTER", bannonProfile);
        this.createProfile("GOD_MODE_OS", godModeProfile);
    }

    public createProfile(projectId: string, profile: CurationProfile): CurationProfile {
        if (this.db) {
            try {
                this.db.prepare(`
                    INSERT OR REPLACE INTO curation_profiles (project_id, project_name, profile_json)
                    VALUES (?, ?, ?)
                `).run(projectId, profile.projectName, JSON.stringify(profile));
            } catch (err) {
                console.error('[CurationEngine] Failed to insert profile into DB:', err);
            }
        }
        this.profiles.set(projectId, profile);
        
        if (this.memorySpine) {
            this.memorySpine.recordEvent(
                projectId, 
                "SYSTEM", 
                "CURATION_INIT", 
                `Curation profile initialized/reconfigured for project "${profile.projectName}". Dimensions registered: Tone, Complexity, Pattern, Naming, Soul.`
            );
        }
        return profile;
    }

    public updateProfile(projectId: string, updates: Partial<CurationProfile>): CurationProfile {
        const existing = this.profiles.get(projectId);
        if (!existing) {
            throw new Error(`Profile ${projectId} doesn't exist`);
        }

        const updated = {
            ...existing,
            ...updates,
            tone: { ...existing.tone, ...updates.tone },
            complexityCeiling: { ...existing.complexityCeiling, ...updates.complexityCeiling },
            patternLanguage: { ...existing.patternLanguage, ...updates.patternLanguage },
            namingConventions: { ...existing.namingConventions, ...updates.namingConventions },
            soulKeywords: [...new Set([...existing.soulKeywords, ...(updates.soulKeywords || [])])],
            antiKeywords: [...new Set([...existing.antiKeywords, ...(updates.antiKeywords || [])])],
        } as CurationProfile;

        this.createProfile(projectId, updated);
        return updated;
    }

    public getProfile(projectId: string): CurationProfile | undefined {
        return this.profiles.get(projectId);
    }

    public getAllProfiles(): CurationProfile[] {
        return Array.from(this.profiles.values());
    }

    public score(projectId: string, outputCode: string, taskIntent: string): CurationScore {
        const profile = this.profiles.get(projectId) || this.profiles.get('GOD_MODE_OS')!;
        
        const timestamp = Date.now();
        const flags: string[] = [];
        const recommendations: string[] = [];
        const blockingIssues: string[] = [];

        // 1. Score Tone
        const toneScore = this.scoreTone(outputCode, profile, flags, recommendations, blockingIssues);

        // 2. Score Complexity
        const complexityScore = this.scoreComplexity(outputCode, profile, flags, recommendations, blockingIssues);

        // 3. Score Pattern
        const patternScore = this.scorePattern(outputCode, profile, taskIntent, flags, recommendations, blockingIssues);

        // 4. Score Naming
        const namingScore = this.scoreNaming(outputCode, profile, flags, recommendations, blockingIssues);

        // 5. Score Soul
        const soulScore = this.scoreSoul(outputCode, profile, taskIntent, flags, recommendations, blockingIssues);

        // Weighted Average:
        // totalScore = toneScore*0.15 + complexityScore*0.20 + patternScore*0.30 + namingScore*0.15 + soulScore*0.20
        let totalScore = (toneScore * 0.15) + (complexityScore * 0.20) + (patternScore * 0.30) + (namingScore * 0.15) + (soulScore * 0.20);
        
        // Critical Rule: If any score is 0, the total score is 0
        if (toneScore === 0 || complexityScore === 0 || patternScore === 0 || namingScore === 0 || soulScore === 0) {
            totalScore = 0;
            blockingIssues.push("CURATION FAILURE: One of your dimensional curation scores was graded absolute zero due to violation.");
        }

        const passed = totalScore >= 70 && blockingIssues.length === 0;

        return {
            projectId,
            taskIntent,
            timestamp,
            toneScore,
            complexityScore,
            patternScore,
            namingScore,
            soulScore,
            totalScore: Math.round(totalScore),
            passed,
            flags,
            recommendations,
            blockingIssues
        };
    }

    private scoreTone(outputCode: string, profile: CurationProfile, flags: string[], recs: string[], blockings: string[]): number {
        const lowerCode = outputCode.toLowerCase();
        let descriptorHits = 0;
        let antiHits = 0;

        for (const desc of profile.tone.descriptors) {
            const regex = new RegExp(`\\b${desc.toLowerCase()}\\b`, 'g');
            const matches = lowerCode.match(regex);
            if (matches) descriptorHits += matches.length;
        }

        for (const anti of profile.tone.antiDescriptors) {
            const regex = new RegExp(`\\b${anti.toLowerCase()}\\b`, 'g');
            const matches = lowerCode.match(regex);
            if (matches) antiHits += matches.length;
        }

        const comments = outputCode.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || [];
        const commentString = comments.join(' ').toLowerCase();
        
        // Check for rough/hacky descriptors in comments
        if (commentString.includes('hack') || commentString.includes('temp') || commentString.includes('hardcoded')) {
            antiHits += 2;
        }

        const totalHits = descriptorHits + antiHits;
        if (totalHits === 0) return 80; // Baseline neutral score

        const antiDensity = antiHits / totalHits;
        if (antiDensity > 0.15) {
            flags.push("TONE_VIOLATION_HACKY: Excessive amount of informal/hacky terminology identified inside output.");
            recs.push(`Remove anti-descriptor style phrases such as: ${profile.tone.antiDescriptors.join(', ')}`);
            if (antiDensity > 0.40) {
                blockings.push("TONE_DISQUALIFIED: Raw stylistic composition failed tone standards completely.");
                return 0;
            }
        }

        const score = Math.max(0, Math.min(100, 100 - (antiDensity * 120) + (descriptorHits * 2.5)));
        return Math.round(score);
    }

    private scoreComplexity(outputCode: string, profile: CurationProfile, flags: string[], recs: string[], blockings: string[]): number {
        const lines = outputCode.split('\n');
        const fileLineCount = lines.length;

        if (fileLineCount > profile.complexityCeiling.maxFileLines) {
            flags.push("FILE_TOO_LARGE: Generated file is structurally bloated.");
            blockings.push(`FAIL_OVERSIZE: Source files size limits are capped at ${profile.complexityCeiling.maxFileLines} lines to preserve modular execution, but output was ${fileLineCount} lines.`);
            return 0;
        }

        // Custom fast line counting per function
        const functionBlocks = outputCode.match(/function\s+\w+\s*\([\s\S]*?\}|\w+\s*=\s*\([^)]*\)\s*=>\s*\{/g) || [];
        let score = 100;

        for (const fn of functionBlocks) {
            const fnLinesCount = fn.split('\n').length;
            if (fnLinesCount > profile.complexityCeiling.maxFunctionLines) {
                flags.push(`COMPLEXITY_CEILING_BREACH: function block exceeded safe limit of ${profile.complexityCeiling.maxFunctionLines} lines (measured ${fnLinesCount} lines).`);
                recs.push("Refactor large blocks into clean modular utility methods.");
                score -= 15;
            } else if (fnLinesCount < profile.complexityCeiling.minFunctionLines && !fn.includes('const ') && !fn.includes('export ')) {
                flags.push(`UNDER_ENGINEERED: micro-utility block is excessively tiny (${fnLinesCount} lines).`);
                score -= 3;
            }
        }

        return Math.max(10, Math.min(100, score));
    }

    private scorePattern(outputCode: string, profile: CurationProfile, taskIntent: string, flags: string[], recs: string[], blockings: string[]): number {
        let score = 100;

        for (const pattern of profile.patternLanguage.forbiddenPatterns) {
            if (outputCode.includes(pattern)) {
                flags.push(`FORBIDDEN_PATTERN_DETECTED: file references restricted framework patterns ("${pattern}").`);
                blockings.push(`CRITICAL_FORBIDDEN_PATTERN: Project pattern language forbids "${pattern}". Output blocked.`);
                return 0;
            }
        }

        // Auto determine if required patterns should reside based on intent keywords
        const lowerIntent = taskIntent.toLowerCase();
        for (const req of profile.patternLanguage.requiredPatterns) {
            const patternKeyword = req.split(' ')[0].toLowerCase();
            if (lowerIntent.includes(patternKeyword)) {
                // Must be mentioned/referenced in the outputCode
                const patternInCode = outputCode.toLowerCase().includes(patternKeyword);
                if (!patternInCode) {
                    flags.push(`MISSING_REQUIRED_PATTERN: Task focuses on ${req}, but implementation lacks respective pattern patterns.`);
                    recs.push(`Integrate standard ${req} paradigms to resolve drift.`);
                    score -= 20;
                }
            }
        }

        return Math.max(0, score);
    }

    private scoreNaming(outputCode: string, profile: CurationProfile, flags: string[], recs: string[], blockings: string[]): number {
        let score = 100;

        // Check for disallowed placeholder names
        for (const anti of profile.namingConventions.antiNames) {
            const regex = new RegExp(`\\b${anti}\\b`, 'g');
            if (regex.test(outputCode)) {
                flags.push(`ANTI_NAME_DETECTED: restricted placeholder identifier name "${anti}" detected inside code.`);
                recs.push(`Rename temporary / sloppy naming descriptors like "${anti}" to professional, descriptive items.`);
                score -= 15;
            }
        }

        // Validate basic casing conventions based on caseStyle
        if (profile.namingConventions.caseStyle === 'camelCase') {
            const invalidSnakeMatches = outputCode.match(/\b[a-z]+_[a-z0-9_]+\b/g) || [];
            // filter out popular libraries terms
            const filteredSnakes = invalidSnakeMatches.filter(name => !['created_at', 'updated_at', 'project_id', 'session_id', 'error_id', 'file_path', 'task_intent', 'key_value', 'key_name'].includes(name));
            if (filteredSnakes.length > 5) {
                flags.push(`WRONG_CASE_STYLE_DRIFT: Detected ${filteredSnakes.length} snake_case naming variables, violating camelCase convention guidelines.`);
                recs.push("Refactor snake_case variable indicators to proper camelCase syntax.");
                score -= 15;
            }
        }

        return Math.max(10, score);
    }

    private scoreSoul(outputCode: string, profile: CurationProfile, taskIntent: string, flags: string[], recs: string[], blockings: string[]): number {
        const lowerCode = outputCode.toLowerCase();
        
        // Zero toleration anti keyword check
        for (const anti of profile.antiKeywords) {
            if (lowerCode.includes(anti.toLowerCase())) {
                flags.push(`ANTI_KEYWORD_DETECTED: found anti-keyword "${anti}" from an unrelated project domain.`);
                blockings.push(`CRITICAL_DOMAIN_MISMATCH: Out-of-bounds cross-contamination of project terminology. "${anti}" has zero resonance here.`);
                return 0;
            }
        }

        let hits = 0;
        const matchedKeywords: string[] = [];
        for (const key of profile.soulKeywords) {
            if (lowerCode.includes(key.toLowerCase())) {
                hits++;
                matchedKeywords.push(key);
            }
        }

        const lowerIntent = taskIntent.toLowerCase();
        let expectedHits = 1;
        if (lowerIntent.includes('combat') || lowerIntent.includes('grapple') || lowerIntent.includes('physics')) expectedHits = 3;
        if (lowerIntent.includes('void') || lowerIntent.includes('parliament') || lowerIntent.includes('spine')) expectedHits = 3;

        if (hits < expectedHits) {
            flags.push(`SOUL_DEFICIT: Expected at least ${expectedHits} domainspecific terms but only found ${hits}`);
            recs.push(`Prime output soul alignment by weaving in related keywords: ${profile.soulKeywords.slice(0, 6).join(', ')}`);
            const soulScore = Math.max(20, Math.round((hits / expectedHits) * 100));
            return soulScore;
        }

        return 100;
    }

    public async onFail(curationScore: CurationScore, outputCode: string, sessionId?: string): Promise<string> {
        const profile = this.profiles.get(curationScore.projectId) || this.profiles.get('GOD_MODE_OS')!;
        
        const revisionPrompt = `CURATION REVISION REQUIRED
Project: ${profile.projectName}
Task Intent: ${curationScore.taskIntent}
Curation Score: ${curationScore.totalScore}/100

BLOCKING ISSUES (must fix before Parliament):
${curationScore.blockingIssues.map(b => `- ${b}`).join('\n')}

FLAGS RAISED:
${curationScore.flags.map(f => `- ${f}`).join('\n')}

RECOMMENDATIONS:
${curationScore.recommendations.map(r => `- ${r}`).join('\n')}

Revise the output code block completely. Keep the original exact functionality. Do not summarize or provide verbose dialogue text. Correct absolute violations immediately (rename antiNames, strip forbidden patterns or anti-keywords, split complex functions). Ensure output is valid complete script.`;

        if (this.memorySpine && sessionId) {
            this.memorySpine.recordCurationEvent(curationScore.projectId, sessionId, curationScore, "REVISION_TRIGGERED");
        }

        console.log(`[CurationEngine] Verification failed. revisionPrompt generated for: ${curationScore.projectId}`);
        return revisionPrompt;
    }

    public onPass(curationScore: CurationScore, outputCode: string, sessionId?: string): string {
        const timestampStr = new Date(curationScore.timestamp).toUTCString();
        const headerComment = `// CURATION APPROVED — Score: ${curationScore.totalScore}/100
// Tone: ${curationScore.toneScore} | Complexity: ${curationScore.complexityScore} | Pattern: ${curationScore.patternScore}
// Naming: ${curationScore.namingScore} | Soul: ${curationScore.soulScore}
// Curated: ${timestampStr}
`;

        if (this.memorySpine && sessionId) {
            this.memorySpine.recordCurationEvent(curationScore.projectId, sessionId, curationScore, "APPROVED");
        }

        console.log(`[CurationEngine] Output passed curation requirements successfully. Total Score: ${curationScore.totalScore}/100.`);
        
        // Add stamp comment on top of code
        return headerComment + outputCode;
    }

    public recordDecision(curationScore: CurationScore, sessionId: string, revisionCount: number, outcome: string) {
        if (!this.db) return;
        try {
            const id = 'CUR-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
            const stmt = this.db.prepare(`
                INSERT INTO curation_ledger (
                    id, timestamp, project_id, session_id, task_intent, 
                    tone_score, complexity_score, pattern_score, naming_score, soul_score, 
                    total_score, passed, flags, revision_count, final_outcome, token_cost
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                id,
                curationScore.timestamp,
                curationScore.projectId,
                sessionId,
                curationScore.taskIntent,
                curationScore.toneScore,
                curationScore.complexityScore,
                curationScore.patternScore,
                curationScore.namingScore,
                curationScore.soulScore,
                curationScore.totalScore,
                curationScore.passed ? 1 : 0,
                JSON.stringify(curationScore.flags),
                revisionCount,
                outcome,
                0.001
            );
        } catch (e) {
            console.error('[CurationEngine] Failed to record decision in ledger:', e);
        }
    }

    public getCurationStats(projectId?: string) {
        if (!this.db) {
            return {
                totalCuratedCount: 0,
                firstPassRate: 100,
                averageScores: { tone: 100, complexity: 100, pattern: 100, naming: 100, soul: 100 },
                failureReasons: ["None"],
                averageRevisions: 0,
                blockedPermanently: 0
            };
        }
        try {
            let totalRow, pass1Row, avgRow, blockageRow;

            if (projectId) {
                totalRow = this.db.prepare("SELECT COUNT(*) as cnt FROM curation_ledger WHERE project_id = ?").get(projectId) as any;
                pass1Row = this.db.prepare("SELECT COUNT(*) as cnt FROM curation_ledger WHERE project_id = ? AND passed = 1 AND revision_count = 0").get(projectId) as any;
                avgRow = this.db.prepare(`
                    SELECT AVG(tone_score) as t, AVG(complexity_score) as c, AVG(pattern_score) as p, AVG(naming_score) as n, AVG(soul_score) as s, AVG(revision_count) as rev
                    FROM curation_ledger WHERE project_id = ?
                `).get(projectId) as any;
                blockageRow = this.db.prepare("SELECT COUNT(*) as cnt FROM curation_ledger WHERE project_id = ? AND final_outcome = 'BLOCKED'").get(projectId) as any;
            } else {
                totalRow = this.db.prepare("SELECT COUNT(*) as cnt FROM curation_ledger").get() as any;
                pass1Row = this.db.prepare("SELECT COUNT(*) as cnt FROM curation_ledger WHERE passed = 1 AND revision_count = 0").get() as any;
                avgRow = this.db.prepare(`
                    SELECT AVG(tone_score) as t, AVG(complexity_score) as c, AVG(pattern_score) as p, AVG(naming_score) as n, AVG(soul_score) as s, AVG(revision_count) as rev
                    FROM curation_ledger
                `).get() as any;
                blockageRow = this.db.prepare("SELECT COUNT(*) as cnt FROM curation_ledger WHERE final_outcome = 'BLOCKED'").get() as any;
            }

            const totalCount = totalRow ? totalRow.cnt : 0;
            const pass1 = pass1Row ? pass1Row.cnt : 0;
            const blocked = blockageRow ? blockageRow.cnt : 0;

            const tone = avgRow && avgRow.t ? Math.round(avgRow.t) : 100;
            const complexity = avgRow && avgRow.c ? Math.round(avgRow.c) : 100;
            const pattern = avgRow && avgRow.p ? Math.round(avgRow.p) : 100;
            const naming = avgRow && avgRow.n ? Math.round(avgRow.n) : 100;
            const soul = avgRow && avgRow.s ? Math.round(avgRow.s) : 100;
            const avgRevs = avgRow && avgRow.rev ? parseFloat(avgRow.rev.toFixed(1)) : 0;

            // Extract popular failures
            const rows = this.db.prepare(`
                SELECT flags FROM curation_ledger WHERE passed = 0 ORDER BY timestamp DESC LIMIT 10
            `).all() as any[];
            const failSet = new Set<string>();
            rows.forEach(r => {
                const arr = JSON.parse(r.flags);
                arr.forEach((flag: string) => {
                    const clean = flag.split(':')[0];
                    failSet.add(clean);
                });
            });

            return {
                totalCuratedCount: totalCount,
                firstPassRate: totalCount > 0 ? Math.round((pass1 / totalCount) * 100) : 100,
                averageScores: { tone, complexity, pattern, naming, soul },
                failureReasons: failSet.size > 0 ? Array.from(failSet) : ["None"],
                averageRevisions: avgRevs,
                blockedPermanently: blocked
            };
        } catch (e) {
            console.error('[CurationEngine] Failed to retrieve ledger analytics stats:', e);
            return {
                totalCuratedCount: 0,
                firstPassRate: 100,
                averageScores: { tone: 100, complexity: 100, pattern: 100, naming: 100, soul: 100 },
                failureReasons: ["None"],
                averageRevisions: 0,
                blockedPermanently: 0
            };
        }
    }
}
