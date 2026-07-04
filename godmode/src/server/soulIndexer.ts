import fs from 'fs';
import path from 'path';

export class SoulIndexer {
    constructor(private db: any = null, private memorySpine: any = null) {}

    /**
     * Traverses project workspace directory extracting potential soul keywords from source scripts.
     */
    public indexProject(projectId: string, codebasePath: string): { candidates: string[]; totals: number } {
        const root = codebasePath === '.' ? process.cwd() : codebasePath;
        const keywordsFreq: Map<string, number> = new Map();

        const stopWords = new Set([
            'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
            'import', 'export', 'from', 'class', 'constructor', 'this', 'super', 'extends', 'async', 'await', 
            'try', 'catch', 'finally', 'default', 'interface', 'type', 'string', 'number', 'boolean', 'any', 'void',
            'null', 'undefined', 'true', 'false', 'private', 'public', 'protected', 'static', 'readonly', 'throw',
            'new', 'of', 'in', 'console', 'log', 'error', 'warn', 'info', 'get', 'set', 'as', 'key', 'value', 'from',
            'json', 'stringify', 'parse', 'length', 'push', 'shift', 'unshift', 'pop', 'join', 'split', 'map', 'filter',
            'reduce', 'find', 'includes', 'index', 'match', 'test', 'replace', 'regex', 'date', 'math', 'floor', 'random'
        ]);

        const traverse = (dir: string) => {
            if (!fs.existsSync(dir)) return;
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item === 'node_modules' || item === 'dist' || item === '.git' || item === 'data') continue;
                const full = path.join(dir, item);
                const stat = fs.statSync(full);
                if (stat.isDirectory()) {
                    traverse(full);
                } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
                    try {
                        const content = fs.readFileSync(full, 'utf-8');
                        // Extract words (3+ characters)
                        const words = content.match(/\b[a-zA-Z]{3,25}\b/g) || [];
                        for (const w of words) {
                            const lw = w.toLowerCase();
                            if (!stopWords.has(lw)) {
                                keywordsFreq.set(lw, (keywordsFreq.get(lw) || 0) + 1);
                            }
                        }
                    } catch (e) {
                        // ignore file read error
                    }
                }
            }
        };

        try {
            traverse(root);
        } catch (e) {
            console.error('[SoulIndexer] Index traverse failed:', e);
        }

        // Sort candidates
        const sorted = Array.from(keywordsFreq.entries())
            .filter(([word, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(([word]) => word);

        if (this.memorySpine) {
            this.memorySpine.recordEvent(
                projectId,
                'SYSTEM',
                'SOUL_INDEXED',
                `Indexed codebase vectors. Identified ${sorted.length} candidate soul keywords.`
            );
        }

        return {
            candidates: sorted,
            totals: sorted.length
        };
    }

    /**
     * Checks if your project's code patterns match the curation rules.
     */
    public detectSoulDrift(projectId: string, curationEngine: any): { driftDetected: boolean; driftDetails: string[]; recommendations: string[] } {
        const profile = curationEngine.getProfile(projectId);
        if (!profile) {
            return { driftDetected: false, driftDetails: [], recommendations: [] };
        }

        const projectPath = profile.projectId === 'GOD_MODE_OS' ? '.' : path.join(process.cwd(), 'data', 'projects', profile.projectId);
        const indexed = this.indexProject(projectId, projectPath);
        
        const driftDetails: string[] = [];
        const recommendations: string[] = [];

        // Check if top indexed terms match current soulKeywords
        const soulKeywordsList = (profile.soulKeywords || []) as string[];
        const profileKeywords = new Set(soulKeywordsList.map((k: string) => k.toLowerCase()));
        let missingMatches = 0;

        for (const candidate of indexed.candidates.slice(0, 10)) {
            if (!profileKeywords.has(candidate)) {
                missingMatches++;
                driftDetails.push(`Codebase frequently uses "${candidate}" but it is absent from project Curation profile.`);
                recommendations.push(`Approve emerging keyword "${candidate}" into curation list.`);
            }
        }

        const driftDetected = missingMatches >= 3;

        if (driftDetected && this.memorySpine) {
            this.memorySpine.recordEvent(
                projectId,
                'SYSTEM',
                'SOUL_DRIFT_DETECTED',
                `Warning! High style drift detected. Base codebase language diverges from profile parameters.`,
                { missingMatches, driftDetails }
            );
        }

        return {
            driftDetected,
            driftDetails,
            recommendations
        };
    }

    /**
     * Creates a density mapping metrics for visual graphics representations.
     */
    public buildSoulMap(projectId: string, curationEngine: any): any[] {
        const profile = curationEngine.getProfile(projectId);
        if (!profile) return [];

        const root = profile.projectId === 'GOD_MODE_OS' ? '.' : path.join(process.cwd(), 'data', 'projects', profile.projectId);
        const mapList: any[] = [];

        const traverse = (dir: string, relPath = '') => {
            if (!fs.existsSync(dir)) return;
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item === 'node_modules' || item === 'dist' || item === '.git' || item === 'data') continue;
                const full = path.join(dir, item);
                const rel = relPath ? `${relPath}/${item}` : item;
                const stat = fs.statSync(full);

                if (stat.isDirectory()) {
                    traverse(full, rel);
                } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
                    try {
                        const content = fs.readFileSync(full, 'utf-8');
                        const lowerContent = content.toLowerCase();
                        
                        let soulScore = 0;
                        const matchCounter: { [key: string]: number } = {};

                        const soulWords = (profile.soulKeywords || []) as string[];
                        soulWords.forEach((k: string) => {
                            const regex = new RegExp(`\\b${k.toLowerCase()}\\b`, 'g');
                            const matches = lowerContent.match(regex);
                            if (matches) {
                                soulScore += matches.length;
                                matchCounter[k] = matches.length;
                            }
                        });

                        let hasAntiKeyword = false;
                        const antiMatches: string[] = [];
                        const antiWords = (profile.antiKeywords || []) as string[];
                        antiWords.forEach((a: string) => {
                            if (lowerContent.includes(a.toLowerCase())) {
                                hasAntiKeyword = true;
                                antiMatches.push(a);
                            }
                        });

                        // Calculate density
                        const linesCount = content.split('\n').length;
                        const densityPercentage = Math.min(100, Math.round((soulScore / linesCount) * 100));

                        let alignment: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
                        if (densityPercentage > 20 && !hasAntiKeyword) alignment = 'HIGH';
                        else if (densityPercentage > 5 && !hasAntiKeyword) alignment = 'MODERATE';

                        mapList.push({
                            filepath: rel,
                            lines: linesCount,
                            keywordsCount: soulScore,
                            keywordDensity: densityPercentage,
                            antiDetected: hasAntiKeyword,
                            antiKeywords: antiMatches,
                            alignment,
                            breakdown: matchCounter
                        });
                    } catch (err) {
                        // skip
                    }
                }
            }
        };

        try {
            traverse(root);
        } catch (e) {
            console.error('[SoulIndexer] BuildSoulMap failed:', e);
        }

        return mapList;
    }
}
