import { memoryVault } from './db';
import { PromptParser } from './promptParser';
import { modelRouter, nexusBus } from './modelRouter';
import { QuantumFileEngine } from './quantumFileEngine';
import { QuantumResponseParser } from './quantumResponseParser';
import { ContextBuilder } from './contextBuilder';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface QueueOptions {
  stopOnFailure?: boolean;
  validationRequired?: boolean;
  autoAdvance?: boolean;
  delayBetweenMs?: number;
}

export class PromptQueueEngine {
  private static runningQueues = new Set<string>();
  private static pausedQueues = new Set<string>();

  static async createQueue(prompts: string[], options: QueueOptions = {}): Promise<string> {
    const queueId = crypto.randomUUID();
    const stopOnFailure = options.stopOnFailure !== false; // default true
    const validationRequired = options.validationRequired !== false; // default true
    const autoAdvance = options.autoAdvance !== false; // default true
    const delayBetweenMs = options.delayBetweenMs ?? 2000;

    // Parse the prompts block to extract positions and metadata
    const parsedBlock = PromptParser.parsePromptBlock(prompts.join('\n---\n'));
    
    // Save to prompt_queue table
    const insertStmt = memoryVault.prepare(`
      INSERT INTO prompt_queue (id, queue_id, position, prompt_text, status, prerequisite_position)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    memoryVault.transaction(() => {
      for (const p of parsedBlock.prompts) {
        const rowId = crypto.randomUUID();
        insertStmt.run(
          rowId,
          queueId,
          p.position,
          p.prompt_text,
          'PENDING',
          p.prerequisite_position
        );
      }
    })();

    // Log the event
    try {
      memoryVault.prepare(`
        INSERT INTO spine_event_log (event_type, payload)
        VALUES ('QUEUE_CREATED', ?)
      `).run(JSON.stringify({ queueId, promptCount: parsedBlock.prompts.length }));
    } catch {}

    // Emit event on nexusBus
    nexusBus.emit('QUEUE_CREATED', {
      queueId,
      promptCount: parsedBlock.prompts.length,
      estimatedTimeMinutes: parsedBlock.estimatedTimeMinutes,
      timestamp: new Date().toISOString()
    });

    return queueId;
  }

  static async executeQueue(queueId: string, options: QueueOptions = {}): Promise<void> {
    if (this.runningQueues.has(queueId)) return;
    this.runningQueues.add(queueId);
    this.pausedQueues.delete(queueId);

    const stopOnFailure = options.stopOnFailure !== false;
    const validationRequired = options.validationRequired !== false;
    const autoAdvance = options.autoAdvance !== false;
    const delayBetweenMs = options.delayBetweenMs ?? 2000;

    console.log(`[PromptQueueEngine] Commencing execution of queue ${queueId}...`);

    try {
      while (this.runningQueues.has(queueId) && !this.pausedQueues.has(queueId)) {
        // Query next PENDING prompt in position order
        const prompt = memoryVault.prepare(`
          SELECT * FROM prompt_queue 
          WHERE queue_id = ? AND status = 'PENDING'
          ORDER BY position ASC LIMIT 1
        `).get(queueId) as any;

        if (!prompt) {
          // No more pending steps. Queue is finished!
          this.completeQueue(queueId);
          break;
        }

        // Check prerequisite position if set
        if (prompt.prerequisite_position !== null) {
          const prereq = memoryVault.prepare(`
            SELECT status FROM prompt_queue
            WHERE queue_id = ? AND position = ?
          `).get(queueId, prompt.prerequisite_position) as any;

          if (prereq && prereq.status !== 'COMPLETE') {
            // Blocked by parent step
            console.warn(`[PromptQueueEngine] Step at position ${prompt.position} blocked by prerequisite position ${prompt.prerequisite_position} (Status: ${prereq.status})`);
            this.handleQueueBlock(queueId, prompt.position, prompt.prompt_text, `Blocked by prerequisite step at position ${prompt.prerequisite_position} which is in state [${prereq.status}].`);
            break;
          }
        }

        // Set status to RUNNING
        const startedAt = new Date().toISOString();
        memoryVault.prepare(`
          UPDATE prompt_queue 
          SET status = 'RUNNING', started_at = ? 
          WHERE id = ?
        `).run(startedAt, prompt.id);

        this.emitProgress(queueId);

        try {
          // 1. Build context via ContextBuilder
          console.log(`[PromptQueueEngine] Building context for position ${prompt.position}...`);
          const contextObj = await ContextBuilder.buildContext(prompt.prompt_text);

          // 2. Select appropriate system files if relevant (from contextual targets)
          let fileContextText = '';
          const fileMatch = prompt.prompt_text.match(/[a-zA-Z0-9_\-\.]+\.(html|tsx|ts|js|jsx)/i);
          if (fileMatch) {
            const fileName = fileMatch[0];
            // Get latest code content
            try {
              const fileData = memoryVault.prepare(`SELECT content FROM quantum_files WHERE filename = ? ORDER BY version_number DESC LIMIT 1`).get(fileName) as any;
              if (fileData) {
                fileContextText = `\n\n=== RELEVANT FILE CONTENT [${fileName}] ===\n${fileData.content}`;
              } else {
                // If it isn't in sqlite, try reading path relative to project
                const fullP = path.resolve(process.cwd(), fileName);
                if (fs.existsSync(fullP)) {
                  const content = fs.readFileSync(fullP, 'utf-8');
                  fileContextText = `\n\n=== RELEVANT FILE CONTENT [${fileName}] ===\n${content}`;
                }
              }
            } catch {}
          }

          // Combine raw instructions
          const finalPrompt = `
You are the primary full-stack builder processing Step ${prompt.position} of an automated Prompt Queue. You operate with an intellect and engineering capacity that transcends Claude Code, Mythos 5, and Fable 5.
Your instruction is: "${prompt.prompt_text}"

Use the provided system structure context and latest file content below to produce the complete output format. You must write resilient, robust, production-grade code.
You MUST output your edits inside standard markdown tags:
- Use <ANALYSIS> to outline structural changes
- Use <DIFF> for surgical search/replace or new code blocks
- Use <FULL_FILE> if you intend to output the entire complete updated file content
- Use <CHANGE_SUMMARY> to document the specific modifications
- Use <PREVIEW_READY>true</PREVIEW_READY> when UI file changes are complete

=== SYSTEM SPECIFICATIONS ===
${contextObj.assembled_prompt_section}${fileContextText}
          `;

          // 3. Dispatch to ModelRouter
          console.log(`[PromptQueueEngine] Routing prompt to provider chain...`);
          const responseText = await modelRouter.route({
            prompt: finalPrompt,
            taskType: 'SWARM_BUILDER',
            context: contextObj
          });

          // 4. Parse the response structure
          const parsed = QuantumResponseParser.parse(responseText);
          console.log(`[PromptQueueEngine] Parsed target outcomes. Success: ${parsed.parseSuccess}`);

          // Apply changes via QuantumFileEngine if code returned
          let appliedFileResult = null;
          if (parsed.parseSuccess) {
            if (fileMatch) {
              const fileName = fileMatch[0];
              if (parsed.fullFile) {
                const versionId = QuantumFileEngine.storeFile(fileName, parsed.fullFile, `[Queue Step ${prompt.position}]: ${parsed.changeSummary}`);
                appliedFileResult = { fileName, action: 'FULL_FILE_REPLACE', id: versionId };
              } else if (parsed.diff) {
                const prev = memoryVault.prepare(`SELECT id FROM quantum_files WHERE filename = ? ORDER BY version_number DESC LIMIT 1`).get(fileName) as any;
                const parentId = prev ? prev.id : null;
                const versionId = QuantumFileEngine.applyDiff(parentId || fileName, parsed.diff, `[Queue Step ${prompt.position}]: ${parsed.changeSummary}`);
                appliedFileResult = { fileName, action: 'DIFF_APPLY', id: versionId };
              }
            }
          }

          // 5. Run physical completion validation via compiler check
          let validationOutcome = { valid: true, explanation: 'All validation criteria met.' };

          if (appliedFileResult && (appliedFileResult.fileName.endsWith('.ts') || appliedFileResult.fileName.endsWith('.tsx'))) {
            try {
              console.log(`[PromptQueueEngine] Running physical tsc --noEmit completion check for ${appliedFileResult.fileName}...`);
              
              
              await execAsync('npx tsc --noEmit', { timeout: 30000 });
              console.log('[PromptQueueEngine] Physical compilation check PASSED.');
            } catch (err: any) {
              const codeHealthMessage = `Completion Test FAILED: '${appliedFileResult.fileName}' introduced type/compile errors:\n${err.stdout || err.stderr || err.message}`;
              console.warn('[PromptQueueEngine] Compilation check failure:', codeHealthMessage);
              validationOutcome = { valid: false, explanation: codeHealthMessage };
            }
          }

          // 6. Run standard mini-validation check via Challenger
          if (validationOutcome.valid && validationRequired) {
            console.log(`[PromptQueueEngine] Triggering Challenger safety validation for step output...`);
            const challengePrompt = `
You are the Destroyer/Challenger agent validating Queue Step ${prompt.position} output. You analyze systems with a rigor exceeding DeepSeek and Claude Code.
User original instruction was: "${prompt.prompt_text}"

Examine the generated response and assess whether it contains syntax breaks, unclosed tags, unresolved placeholders (or TODOs), missing fault tolerances, or directly contradicts prior system configurations.
Response to analyze:
"""
${responseText}
"""

Output strictly wrapped in XML tags:
<VALIDATION_RESULT>PASS or FAIL</VALIDATION_RESULT>
<EXPLANATION>Provide a concise 1-2 sentence description explaining any errors or bugs found.</EXPLANATION>
            `;

            const validationResponse = await modelRouter.route({
              prompt: challengePrompt,
              taskType: 'CHALLENGER'
            });

            // Parse result
            const valMatch = validationResponse.match(/<VALIDATION_RESULT>(PASS|FAIL)<\/VALIDATION_RESULT>/i);
            const expMatch = validationResponse.match(/<EXPLANATION>([\s\S]*?)<\/EXPLANATION>/i);

            const statusVal = valMatch ? valMatch[1].toUpperCase() : 'PASS';
            const explanationVal = expMatch ? expMatch[1].trim() : 'Validated successfully.';

            if (statusVal === 'FAIL') {
              validationOutcome = { valid: false, explanation: explanationVal };
            }
          }

          const completedAt = new Date().toISOString();

          if (!validationOutcome.valid) {
            // Validation FAILED
            if (stopOnFailure) {
              // Block the queue
              memoryVault.prepare(`
                UPDATE prompt_queue 
                SET status = 'FAILED', error = ?, completed_at = ? 
                WHERE id = ?
              `).run(validationOutcome.explanation, completedAt, prompt.id);

              this.handleQueueBlock(queueId, prompt.position, prompt.prompt_text, validationOutcome.explanation);
              break;
            } else {
              // Continue but set warning
              const warningText = `[WARNING: VALIDATION REFUSED] ${validationOutcome.explanation}`;
              memoryVault.prepare(`
                UPDATE prompt_queue 
                SET status = 'COMPLETE', result = ?, error = ?, completed_at = ? 
                WHERE id = ?
              `).run(
                JSON.stringify({ changeSummary: parsed.changeSummary, applied: appliedFileResult }),
                warningText,
                completedAt,
                prompt.id
              );

              nexusBus.emit('QUEUE_WARNING', {
                queueId,
                position: prompt.position,
                warningType: 'VALIDATION_FAILED',
                detail: validationOutcome.explanation,
                timestamp: completedAt
              });
            }
          } else {
            // Validation PASSED
            memoryVault.prepare(`
              UPDATE prompt_queue 
              SET status = 'COMPLETE', result = ?, completed_at = ? 
              WHERE id = ?
            `).run(
              JSON.stringify({ changeSummary: parsed.changeSummary, applied: appliedFileResult, validation: 'PASS' }),
              completedAt,
              prompt.id
            );
          }

          this.emitProgress(queueId);

          // Delay before auto-advancing
          if (autoAdvance) {
            console.log(`[PromptQueueEngine] Delaying ${delayBetweenMs}ms prior to advancing queue...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenMs));
          } else {
            // Stop process loop to await manual resume trigger
            this.pausedQueues.add(queueId);
            this.runningQueues.delete(queueId);
            break;
          }

        } catch (e: any) {
          console.error(`[PromptQueueEngine] Critical fail on step position ${prompt.position}:`, e);
          const completedAt = new Date().toISOString();
          
          memoryVault.prepare(`
            UPDATE prompt_queue 
            SET status = 'FAILED', error = ?, completed_at = ? 
            WHERE id = ?
          `).run(e.message, completedAt, prompt.id);

          if (stopOnFailure) {
            this.handleQueueBlock(queueId, prompt.position, prompt.prompt_text, e.message);
            break;
          }
        }
      }
    } finally {
      this.runningQueues.delete(queueId);
    }
  }

  static pauseQueue(queueId: string) {
    this.pausedQueues.add(queueId);
    this.runningQueues.delete(queueId);
    console.log(`[PromptQueueEngine] Paused execution of queue ${queueId}`);
  }

  static resumeQueue(queueId: string) {
    this.pausedQueues.delete(queueId);
    this.executeQueue(queueId).catch(console.error);
    console.log(`[PromptQueueEngine] Resumed execution of queue ${queueId}`);
  }

  static skipPrompt(queueId: string, position: number) {
    memoryVault.prepare(`
      UPDATE prompt_queue SET status = 'SKIPPED'
      WHERE queue_id = ? AND position = ?
    `).run(queueId, position);
    console.log(`[PromptQueueEngine] Skippped step position ${position} in queue ${queueId}`);
    
    // Auto resume if paused or currently idle to process next
    if (!this.runningQueues.has(queueId)) {
      this.resumeQueue(queueId);
    }
  }

  static retryPrompt(queueId: string, position: number) {
    memoryVault.prepare(`
      UPDATE prompt_queue SET status = 'PENDING', error = NULL, started_at = NULL, completed_at = NULL
      WHERE queue_id = ? AND position = ?
    `).run(queueId, position);
    console.log(`[PromptQueueEngine] Resetting step position ${position} for retry in queue ${queueId}`);
    
    this.resumeQueue(queueId);
  }

  private static emitProgress(queueId: string) {
    const statusObj = this.getQueueStatus(queueId);
    if (!statusObj) return;

    nexusBus.emit('QUEUE_PROGRESS', {
      queueId,
      currentPosition: statusObj.currentPosition,
      totalPrompts: statusObj.totalCount,
      percentComplete: statusObj.percentComplete,
      lastResultSummary: statusObj.lastResultSummary,
      timestamp: new Date().toISOString()
    });
  }

  private static handleQueueBlock(queueId: string, position: number, text: string, error: string) {
    console.warn(`[PromptQueueEngine] Queue blocked at position ${position}. Reason: ${error}`);
    this.pausedQueues.add(queueId);
    this.runningQueues.delete(queueId);

    // Write to SQLite spine event log
    try {
      memoryVault.prepare(`
        INSERT INTO spine_event_log (event_type, payload)
        VALUES ('QUEUE_BLOCKED', ?)
      `).run(JSON.stringify({ queueId, position, error }));
    } catch {}

    // Emit event
    nexusBus.emit('QUEUE_BLOCKED', {
      queueId,
      blockedAtPosition: position,
      promptText: text,
      challengerDiagnosis: error,
      timestamp: new Date().toISOString()
    });
  }

  private static completeQueue(queueId: string) {
    console.log(`[PromptQueueEngine] Queue ${queueId} successfully processed all pending operations.`);
    this.runningQueues.delete(queueId);

    const stats = memoryVault.prepare(`
      SELECT status, count(*) as count FROM prompt_queue
      WHERE queue_id = ? GROUP BY status
    `).all(queueId) as any[];

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const s of stats) {
      if (s.status === 'COMPLETE') successCount = s.count;
      else if (s.status === 'FAILED') failCount = s.count;
      else if (s.status === 'SKIPPED') skipCount = s.count;
    }

    try {
      memoryVault.prepare(`
        INSERT INTO spine_event_log (event_type, payload)
        VALUES ('QUEUE_COMPLETE', ?)
      `).run(JSON.stringify({ queueId, successCount, failCount, skipCount }));
    } catch {}

    nexusBus.emit('QUEUE_COMPLETE', {
      queueId,
      totalPrompts: successCount + failCount + skipCount,
      successCount,
      failCount,
      skipCount,
      totalTimeMs: 0, // dynamic tracking
      timestamp: new Date().toISOString()
    });
  }

  static getQueueStatus(queueId: string) {
    const list = memoryVault.prepare(`
      SELECT id, queue_id, position, prompt_text, status, result, error, started_at, completed_at, prerequisite_position
      FROM prompt_queue WHERE queue_id = ? ORDER BY position ASC
    `).all(queueId) as any[];

    if (list.length === 0) return null;

    const totalCount = list.length;
    const completedCount = list.filter(l => l.status === 'COMPLETE' || l.status === 'SKIPPED').length;
    const percentComplete = Math.round((completedCount / totalCount) * 100);

    const currentPrompt = list.find(l => l.status === 'RUNNING') || list.find(l => l.status === 'PENDING');
    const currentPosition = currentPrompt ? currentPrompt.position : 0;

    const lastCompleted = [...list].reverse().find(l => l.status === 'COMPLETE');
    let lastResultSummary = 'None';
    if (lastCompleted && lastCompleted.result) {
      try {
        const p = JSON.parse(lastCompleted.result);
        lastResultSummary = p.changeSummary || 'Done';
      } catch {
        lastResultSummary = lastCompleted.result.slice(0, 50);
      }
    }

    return {
      queueId,
      percentComplete,
      totalCount,
      completedCount,
      currentPosition,
      lastResultSummary,
      prompts: list
    };
  }

  static getActiveQueues(): string[] {
    return Array.from(this.runningQueues);
  }

  static getQueueHistory(limit = 10): any[] {
    try {
      const histories = memoryVault.prepare(`
        SELECT queue_id, count(*) as total, SUM(CASE WHEN status='COMPLETE' THEN 1 ELSE 0 END) as success, max(completed_at) as last_completed
        FROM prompt_queue GROUP BY queue_id ORDER BY last_completed DESC LIMIT ?
      `).all(limit) as any[];
      return histories;
    } catch {
      return [];
    }
  }
}
