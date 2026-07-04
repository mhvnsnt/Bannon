import fs from 'fs';
import path from 'path';

export class RevisionEngine {
    constructor(private db: any = null) {}

    /**
     * Constructs a precise, focused revision prompt to address Critic critique comments.
     */
    public buildRevisionPrompt(originalTask: string, previousCode: string, critiqueReport: any, cycleNumber: number): string {
        const instructions = Array.isArray(critiqueReport.revisionInstructions)
            ? critiqueReport.revisionInstructions.map((inst: string, idx: number) => `${idx + 1}. ${inst}`).join('\n')
            : (critiqueReport.revisionInstructions || 'No structured criticisms identified.');

        return `REVISION SESSION — Parliament Cycle ${cycleNumber} of 3
Original task: ${originalTask}

The previous proposed solution had these specific issues:
${instructions}

Please revise the code to correct ONLY the listed issues. Do not rewrite from scratch. Address each feedback instruction carefully.
Preserve overall functional integrity and existing codebase structures. 
Output the complete corrected file. No stubs. No TODOs.

IMPORTANT: Wrap your code in a markdown block starting exactly with:
\`\`\`[language]
// File: [filepath]
[code here]
\`\`\``;
    }

    /**
     * Records revision history tracking data in our Memory Spine.
     */
    public trackRevisionCycle(sessionId: string, cycleNumber: number, revisionPrompt: string) {
        if (!this.db) {
            console.log(`[RevisionEngine] (No Database) Tracked Revision Cycle ${cycleNumber}`);
            return;
        }

        try {
            // Write to a system-wide or chat memory log table (quantum_conversations / logs)
            const logStmt = this.db.prepare(`
                INSERT INTO quantum_conversations (role, content) 
                VALUES (?, ?)
            `);
            logStmt.run(
                'system', 
                `[PARLIAMENT_REVISION_CYCLE_${cycleNumber}] Prompt: ${revisionPrompt.substring(0, 300)}...`
            );
        } catch (e) {
            console.error('[RevisionEngine] Failed to track revision cycle in DB:', e);
        }
    }

    /**
     * Calculates a simplified character-based or line-based unified side-by-side or inline diff
     * to highlight the additions/deletions clearly on UI boards/Forge issues.
     */
    public diffRevision(originalCode: string, revisedCode: string): string {
        const origLines = originalCode.split('\n');
        const revLines = revisedCode.split('\n');
        
        let diffText = '';
        const maxLen = Math.max(origLines.length, revLines.length);
        
        for (let i = 0; i < maxLen; i++) {
            const o = origLines[i] !== undefined ? origLines[i] : null;
            const r = revLines[i] !== undefined ? revLines[i] : null;

            if (o === r) {
                if (o !== null) {
                    // limit unmodified contexts shown, but for simple visualization, print common lines with spacing
                    diffText += `  ${o}\n`;
                }
            } else {
                if (o !== null) {
                    diffText += `- ${o}\n`;
                }
                if (r !== null) {
                    diffText += `+ ${r}\n`;
                }
            }
        }
        return diffText;
    }
}
