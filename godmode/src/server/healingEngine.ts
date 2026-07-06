import fs from 'fs';
import path from 'path';
import { MemorySpine, HealEvent } from './memorySpine';

export interface Diagnosis {
    errorType: string;
    message: string;
    filePaths: string[];
    lineNumbers: number[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    snippets: string[];
}

export interface Hypothesis {
    vulnerability: string;
    explanations: string[];
    chosenExplanation: string;
    fileToModify: string;
    replacementContent: string;
    targetToReplace: string; // The specific code to replace
}

export class HealingEngine {
    private memorySpine: MemorySpine;

    constructor(private db: any = null) {
        this.memorySpine = new MemorySpine(db);
    }

    /**
     * Intercepts log streams and parses syntax/compilation issues
     */
    public diagnose(logText: string): Diagnosis {
        const filePaths: string[] = [];
        const lineNumbers: number[] = [];
        const snippets: string[] = [];
        let errorType = 'UNKNOWN_COMPILATION_ERROR';
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
        let message = logText;

        // Common regex matchers for TS/Vite/Node errors
        // Example: src/server/modelParliament.ts(120,25): error TS2304: Cannot find name 'x'
        const tsMatch = logText.match(/([a-zA-Z0-9_\-\.\/]+)\s*\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*([^\n]+)/);
        if (tsMatch) {
            filePaths.push(tsMatch[1]);
            lineNumbers.push(parseInt(tsMatch[2]));
            errorType = tsMatch[4]; // TS2304, etc.
            message = tsMatch[5];
            severity = 'HIGH';
        }

        // Example: Error: Cannot find module 'lodash'
        const nodeModuleMatch = logText.match(/Error:\s*Cannot find module\s*'([^']+)'/);
        if (nodeModuleMatch) {
            errorType = 'MISSING_DEPENDENCY';
            message = `Module is missing: ${nodeModuleMatch[1]}`;
            severity = 'CRITICAL';
        }

        // Example: ReferenceError: x is not defined
        const refErrorMatch = logText.match(/(ReferenceError|TypeError|SyntaxError):\s*([^\n]+)/);
        if (refErrorMatch) {
            errorType = refErrorMatch[1];
            message = refErrorMatch[2];
            severity = 'HIGH';
            
            // Try matching path in stacktrace
            const pathMatch = logText.match(/at\s+[^\(]*\(([^:]+):(\d+):(\d+)\)/);
            if (pathMatch) {
                filePaths.push(pathMatch[1]);
                lineNumbers.push(parseInt(pathMatch[2]));
            }
        }

        // Extract code snippet if we have file and lines
        if (filePaths.length > 0 && lineNumbers.length > 0) {
            const relativePath = filePaths[0];
            const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath);
            if (fs.existsSync(fullPath)) {
                try {
                    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
                    const targetLine = lineNumbers[0];
                    const start = Math.max(0, targetLine - 3);
                    const end = Math.min(lines.length - 1, targetLine + 3);
                    
                    const chunk = lines.slice(start, end + 1).join('\n');
                    snippets.push(chunk);
                } catch (e) {
                    console.error('[HealingEngine] Failed to read snippet file:', e);
                }
            }
        }

        return {
            errorType,
            message,
            filePaths,
            lineNumbers,
            severity,
            snippets
        };
    }

    /**
     * Look up Memory Spine for historical successful healing solutions of this code error type
     */
    public lookUpReflex(errorType: string): string | null {
        return this.memorySpine.getHealingPattern(errorType);
    }

    /**
     * Forms hypotheses and writes output solution payload
     */
    public async generateHypothesis(diagnosis: Diagnosis, context: string, reflex: string | null): Promise<Hypothesis> {
        const fileToModify = diagnosis.filePaths[0] || 'src/server/server.ts';
        let targetToReplace = '';
        let replacementContent = '';

        if (diagnosis.snippets.length > 0) {
            targetToReplace = diagnosis.snippets[0];
        }

        const apiKey = this.getApiKey();
        if (apiKey) {
            try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey });
                
                const prompt = `Error healing diagnostic.
We have a compilation or runtime error.
Error Type: ${diagnosis.errorType}
Error Message: ${diagnosis.message}
Target File: ${fileToModify}
Snippet of crash location:
\`\`\`
${targetToReplace}
\`\`\`
Reflex cache from memory spine (if any): ${reflex || 'None available.'}

Analyze the error. Output EXACTLY a JSON HypothesesReport:
{
  "vulnerability": "What went wrong",
  "explanations": ["Hypothesis 1", "Hypothesis 2", "Hypothesis 3"],
  "chosenExplanation": "The most logical hypothesis",
  "fileToModify": "File path",
  "targetToReplace": "The exact multi-line string in the file to swap",
  "replacementContent": "The complete replacement code string"
}`;

                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-pro',
                    contents: prompt,
                    config: {
                        systemInstruction: "You are the HEALING_ENGINE_INTAKE supervisor. Output only valid JSON with the exact structures specified."
                    }
                });

                const parsed = JSON.parse(response.text || '{}');
                if (parsed.replacementContent && parsed.targetToReplace) {
                    return parsed as Hypothesis;
                }
            } catch (err) {
                console.error('[HealingEngine] Model-based hypothesis failed, falling back to static rules:', err);
            }
        }

        // Static fallbacks for standard common build issues
        let detectedVulnerability = '';
        let chosenExplanation = `The targeted coordinate token needs standard variable correction.`;

        if (diagnosis.errorType === 'MISSING_DEPENDENCY') {
            const missingMod = diagnosis.message.match(/Module is missing:\s*([^\s]+)/)?.[1] || '';
            detectedVulnerability = `Missing required dependency module: ${missingMod}`;
            replacementContent = `// AutoHeal initiated run command: npm install ${missingMod}`;
        } else {
            detectedVulnerability = `Syntax error or typo in "${diagnosis.message}"`;
        }

        if (diagnosis.errorType === 'TS2304' && targetToReplace) {
            // Missing variable declaration or bad import statement
            const missingName = diagnosis.message.match(/Cannot find name\s*'([^']+)'/)?.[1] || '';
            if (missingName) {
                chosenExplanation = `Import block or declaration for '${missingName}' was omitted or truncated.`;
                replacementContent = `import { ${missingName} } from './${missingName.toLowerCase()}';\n` + targetToReplace;
            }
        }

        return {
            vulnerability: detectedVulnerability,
            explanations: ["H1: Import missing", "H2: Syntax mistake in method parameter", "H3: Outdated function module signature"],
            chosenExplanation,
            fileToModify,
            replacementContent: replacementContent || targetToReplace,
            targetToReplace: targetToReplace || ''
        };
    }

    /**
     * Autonomously modifies the disk content
     */
    public applyFix(projectId: string, hypothesis: Hypothesis): boolean {
        try {
            const rootDir = projectId === 'God Mode OS' || projectId === '.' 
                ? process.cwd() 
                : path.join(process.cwd(), 'data', 'projects', projectId);

            const destPath = path.join(rootDir, hypothesis.fileToModify);
            if (!fs.existsSync(destPath)) {
                console.error(`[HealingEngine] File to modify not found: ${destPath}`);
                return false;
            }

            const currentContent = fs.readFileSync(destPath, 'utf8');
            if (hypothesis.targetToReplace && currentContent.includes(hypothesis.targetToReplace)) {
                const refreshed = currentContent.replace(hypothesis.targetToReplace, hypothesis.replacementContent);
                fs.writeFileSync(destPath, refreshed, 'utf8');
                console.log(`[HealingEngine] Auto-Healing applied surgically to disk: ${destPath}`);
                return true;
            } else {
                // If it can't match, append safely or write replacements
                console.warn(`[HealingEngine] Surgical match failed in ${hypothesis.fileToModify}. Direct overwrite fallback.`);
                return false;
            }
        } catch (e) {
            console.error('[HealingEngine] Surgical applyFix failed:', e);
            return false;
        }
    }

    /**
     * Executes the autonomous closed-loop self-healing sequence
     */
    public async autoHeal(
        projectId: string, 
        logText: string, 
        compileCommand: string, 
        runFunc: () => Promise<boolean>
    ): Promise<{ healed: boolean; level: number; outcome: string; attempts: any[] }> {
        console.log(`[HealingEngine] INCOMING ERROR DETECTED under node [${projectId}]. Initiating Healing System...`);
        
        const timestamp = Date.now();
        const sessionId = 'HEAL-' + Date.now().toString(36);
        const attempts: any[] = [];
        let compiled = false;
        let loopLevel = 0;

        const diagnosis = this.diagnose(logText);
        console.log(`[HealingEngine] Diagnosed Issue: ${diagnosis.errorType} | File: ${diagnosis.filePaths[0] || 'Unknown'}`);

        while (!compiled && loopLevel < 3) {
            loopLevel++;
            console.log(`[HealingEngine] Level ${loopLevel} Healing Protocol active...`);

            // 1. Look up reflex memory spine
            const reflex = this.lookUpReflex(diagnosis.errorType);
            if (reflex) {
                console.log(`[HealingEngine] Matching Memory Spine reflex pattern loaded: "${reflex.substring(0,60)}..."`);
            }

            // 2. Formulate hypothesis proposal
            const hypothesis = await this.generateHypothesis(diagnosis, logText, reflex);
            attempts.push({
                level: loopLevel,
                vulnerability: hypothesis.vulnerability,
                action: `Modify ${hypothesis.fileToModify}`,
                fixProposed: hypothesis.replacementContent
            });

            // 3. Apply the surgery code fix
            const applied = this.applyFix(projectId, hypothesis);
            if (applied) {
                // 4. Test compilation/run status again
                console.log(`[HealingEngine] Fix applied for loop level ${loopLevel}. Initiating compilation status verification...`);
                try {
                    compiled = await runFunc();
                } catch (compileErr) {
                    compiled = false;
                }
            } else {
                compiled = false;
            }

            if (compiled) {
                console.log(`[HealingEngine] LEVEL ${loopLevel} HEAL VERIFIED. Success!`);
                break;
            }
        }

        const final_outcome = compiled ? 'HEAL_VERIFIED' : 'ESCALATION_REQUIRED';
        
        const healRecord: HealEvent = {
            id: 'HEAL-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
            timestamp,
            projectId,
            sessionId,
            errorType: diagnosis.errorType,
            errorMessage: diagnosis.message,
            severity: diagnosis.severity,
            level_reached: loopLevel,
            heal_attempts: JSON.stringify(attempts),
            final_outcome,
            fix_applied: compiled && attempts.length > 0 ? attempts[attempts.length - 1].fixProposed : undefined,
            time_to_heal_ms: Date.now() - timestamp,
            token_cost: 0.002,
            reflex_pattern_learned: compiled && attempts.length > 0 ? attempts[attempts.length - 1].action : undefined
        };

        this.memorySpine.recordHealEvent(healRecord);

        return {
            healed: compiled,
            level: loopLevel,
            outcome: final_outcome,
            attempts
        };
    }

    private getApiKey(): string {
        if (!this.db) return process.env.GEMINI_API_KEY || '';
        try {
            const row = this.db.prepare('SELECT key_value FROM settings WHERE key_name = ?').get('GEMINI_API_KEY') as any;
            return row ? row.key_value : (process.env.GEMINI_API_KEY || '');
        } catch (e) {
            return process.env.GEMINI_API_KEY || '';
        }
    }
}
export default HealingEngine;
