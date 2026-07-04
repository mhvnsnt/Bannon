import { ContextBuilder } from './contextBuilder';
import { memoryVault } from './db';
import { modelRouter } from './modelRouter';
import { SemanticSearch } from './semanticSearch';
import { PatternRecognizer } from './patternRecognizer';
import { SwarmWorker } from './swarmWorker';
import { EventEmitter } from 'events';

export const swarmEvents = new EventEmitter();

export interface SwarmJob {
  jobId: string;
  task: string;
  workerCount: number;
  strategy: 'parallel' | 'competitive' | 'iterative';
  mergeStrategy: 'best' | 'concat' | 'vote';
  timeout: number;
  createdAt: string;
  completedAt?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: string;
  confidence?: number;
}

export interface SwarmResult {
  confidence: number;
  winningWorkerIndex: number;
  mergedContent: string;
  workerOutputs: string[];
}

export class SwarmOrchestrator {
  private activeJobs: Map<string, SwarmJob> = new Map();

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    try {
      memoryVault.exec(`
        CREATE TABLE IF NOT EXISTS swarm_jobs (
          jobId TEXT PRIMARY KEY,
          task TEXT NOT NULL,
          workerCount INTEGER NOT NULL,
          strategy TEXT NOT NULL,
          mergeStrategy TEXT NOT NULL,
          status TEXT NOT NULL,
          result TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          completedAt DATETIME,
          confidence REAL
        );
      `);
      console.log("[SwarmOrchestrator] swarm_jobs persistence layout aligned.");
    } catch (e: any) {
      console.error("[SwarmOrchestrator] DB alignment failed:", e.message);
    }
  }

  // Generate sequence-counter Job ID, skippin position nine
  public getNextJobId(): string {
    try {
      const rows = memoryVault.prepare("SELECT jobId FROM swarm_jobs ORDER BY createdAt DESC").all() as { jobId: string }[];
      let maxNum = 0;
      for (const r of rows) {
        const match = r.jobId.match(/Job-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      let nextNum = maxNum + 1;
      if (nextNum === 9) {
        nextNum = 10; // Skip nine in absolute sequence alignment
      }
      return `Job-${nextNum}`;
    } catch {
      return 'Job-1';
    }
  }

  async dispatch(taskInput: {
    task: string;
    workerCount?: number;
    strategy?: 'parallel' | 'competitive' | 'iterative';
    mergeStrategy?: 'best' | 'concat' | 'vote';
    timeout?: number;
  }): Promise<SwarmJob> {
    const jobId = this.getNextJobId();
    const task = taskInput.task;
    const workerCount = Math.max(1, Math.min(8, taskInput.workerCount ?? 3));
    const strategy = taskInput.strategy ?? 'competitive';
    const mergeStrategy = taskInput.mergeStrategy ?? 'best';
    const timeout = taskInput.timeout ?? 90;

    const job: SwarmJob = {
      jobId,
      task,
      workerCount,
      strategy,
      mergeStrategy,
      timeout,
      createdAt: new Date().toISOString(),
      status: 'RUNNING'
    };

    this.activeJobs.set(jobId, job);
    
    // Save to database
    try {
      memoryVault.prepare(`
        INSERT INTO swarm_jobs (jobId, task, workerCount, strategy, mergeStrategy, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(jobId, task, workerCount, strategy, mergeStrategy, 'RUNNING', job.createdAt);
    } catch (e: any) {
      console.error("[SwarmOrchestrator] Failed creating job line in SQLite:", e.message);
    }

    swarmEvents.emit('SWARM_UPDATE', { jobId, status: 'RUNNING', message: `Job ${jobId} dispatched with ${workerCount} workers...` });

    // Execute background worker processing thread asynchronously to avoid blockin Express endpoint
    this.executeJobThread(job).catch(err => {
      console.error(`[SwarmOrchestrator] Thread crash on Job ${jobId}:`, err);
    });

    return job;
  }

  private async executeJobThread(job: SwarmJob) {
    const jobId = job.jobId;
    try {
      // 1. Build and curate active structural context from SQLite + Memory indexes
      const curatedContextObj = await ContextBuilder.buildContext(job.task, { tokenBudget: 4000 });
      const curatedContextStr = JSON.stringify(curatedContextObj);

      // 2. Spawn workers based on strategy and merge
      const workerResults = await this.spawnSwarm(job, curatedContextStr);

      // 3. Query historical semantic results for past approved references with > 0.85 resemblance match
      let pastJobContext = "";
      try {
        const matches = await SemanticSearch.search(job.task, { tables: ['swarm_results'], limit: 1 });
        if (matches && matches.length > 0 && matches[0].score >= 0.85) {
          pastJobContext = `[HISTORICAL PRECEDENCE REFERENCE MATCH STRENGTH: ${(matches[0].score * 100).toFixed(0)}%] ${matches[0].content}`;
          console.log(`[SwarmOrchestrator] Surface past ähnlich swarm match (score ${matches[0].score.toFixed(2)}) as reference...`);
        }
      } catch (err: any) {
        console.warn("[SwarmOrchestrator] Past index alignment fetch failed:", err.message);
      }

      // 4. Merge workers' outcomes based on the merge strategy
      const mergeOutput = await this.mergeResults(job, workerResults, pastJobContext);

      // Update state
      job.status = 'COMPLETED';
      job.result = mergeOutput.mergedContent;
      job.confidence = mergeOutput.confidence;
      job.completedAt = new Date().toISOString();

      this.activeJobs.set(jobId, job);

      // Update SQLite DB
      try {
        memoryVault.prepare(`
          UPDATE swarm_jobs
          SET status = 'COMPLETED', result = ?, confidence = ?, completedAt = ?
          WHERE jobId = ?
        `).run(job.result, job.confidence, job.completedAt, jobId);

        // Record in old swarm_results table for system compatibility and indexing
        memoryVault.prepare(`
          INSERT INTO swarm_results (task_id, builder_output, destroyer_critique, optimizer_synthesis, adjudicator_ruling, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          jobId,
          workerResults[0]?.result || '',
          workerResults[2]?.result || 'No adversarial findings reported.',
          job.result,
          `APPROVED BY SWARM AUTO-ADJUDICATOR (Confidence: ${job.confidence.toFixed(2)})`,
          'DEPLOYED'
        );
      } catch (dbErr: any) {
        console.error("[SwarmOrchestrator] Failed SQLite synchronization for swarm job:", dbErr.message);
      }

      // 5. Write success pattern log
      PatternRecognizer.logPattern(
        'SUCCESS_PATTERN',
        `Swarm alignment successful on Job ${jobId}: "${job.task.slice(0, 80)}..."`,
        job.confidence,
        "System optimized code structure via multi-perspective execution safely."
      );

      // Emit final result event
      swarmEvents.emit('SWARM_RESULT', {
        jobId,
        status: 'COMPLETED',
        result: job.result,
        confidence: job.confidence,
        workerOutputs: mergeOutput.workerOutputs
      });

    } catch (err: any) {
      console.error(`[SwarmOrchestrator] Swarm Job ${jobId} failed:`, err);
      job.status = 'FAILED';
      job.result = `CRITICAL_FAILURE: ${err.message}`;
      job.completedAt = new Date().toISOString();
      this.activeJobs.set(jobId, job);

      try {
        memoryVault.prepare(`
          UPDATE swarm_jobs
          SET status = 'FAILED', result = ?, completedAt = ?
          WHERE jobId = ?
        `).run(job.result, job.completedAt, jobId);
      } catch {}

      // Write friction point log
      PatternRecognizer.logPattern(
        'FRICTION_POINT',
        `Swarm execution collapsed on Job ${jobId}: "${job.task.slice(0, 80)}..."`,
        0.50,
        `Friction and blockages encountered: ${err.message}`
      );

      swarmEvents.emit('SWARM_RESULT', {
        jobId,
        status: 'FAILED',
        error: err.message
      });
    }
  }

  private async spawnSwarm(job: SwarmJob, contextStr: string): Promise<any[]> {
    const promises: Promise<any>[] = [];

    // Worker Roles System directives
    const getWorkerRole = (index: number) => {
      if (index === 0) {
        return {
          roleName: 'Worker 0 STRUCTURAL',
          prompt: `You are the STRUCTURAL architect agent. Build the most robust, cleanest interfaces, and highly modular code structure. Focus on complete type safety, correct imports, explicit error handling, and separation of concerns. Do not couple layers unnecessarily. Absolute zero hacks or stubs.`
        };
      } else if (index === 1) {
        return {
          roleName: 'Worker 1 GENERATIVE',
          prompt: `You are the GENERATIVE implementation force. Ensure the output is completely feature-rich, comprehensive, and has absolutely any requested logic filled in without exceptions. Handle every edge case. Write out full helper blocks, actual functional loops, and realistic data matrices. Zero todos.`
        };
      } else if (index === 2) {
        return {
          roleName: 'Worker 2 ADVERSARIAL',
          prompt: `You are the ADVERSARIAL quality boundary. Review the task thoroughly. Focus exclusively on finding potential failure modes: race conditions, null pointers, buffer overflows, missing try-catch blocks, token budget overflows, and UI state traps. Output a complete implementation modified specifically to survive extreme failure stresses. Highlight your safeguards.`
        };
      } else {
        return {
          roleName: `Worker ${index} SYNTHESIS`,
          prompt: `You are the SYNTHESIS system optimizer. Analyze past patterns, task requirements, and combine structures elegantly. Implement clean logic that reflects lessons learned from high-confidence historical achievements.`
        };
      }
    };

    if (job.strategy === 'iterative') {
      // Iterative strategy: Worker N receives output of Worker N-1
      const results: any[] = [];
      let currentCarrierContext = contextStr;

      for (let i = 0; i < job.workerCount; i++) {
        const { roleName, prompt } = getWorkerRole(i);
        swarmEvents.emit('SWARM_UPDATE', { jobId: job.jobId, status: 'RUNNING', message: `Iterating Worker ${i} (${roleName}) into sequence...` });
        
        const res = await SwarmWorker.run(job.jobId, i, roleName, prompt, job.task, currentCarrierContext);
        results.push(res);
        
        // Append current results as context for next step
        currentCarrierContext += `\n\n--- PREVIOUS WORKER ${i} SUGGESTION ---\n${res.result}\n`;
      }
      return results;

    } else {
      // Parallel / Competitive strategies: run N workers in parallel concurrently
      for (let i = 0; i < job.workerCount; i++) {
        const { roleName, prompt } = getWorkerRole(i);
        promises.push(
          SwarmWorker.run(job.jobId, i, roleName, prompt, job.task, contextStr)
        );
      }
      return await Promise.all(promises);
    }
  }

  private async mergeResults(
    job: SwarmJob,
    workerResults: any[],
    pastJobContext: string
  ): Promise<SwarmResult> {
    const workerOutputs = workerResults.map(w => w.result);
    
    // Choose winner index based on confidence scores
    let bestIndex = 0;
    let highestConfidence = 0;
    for (let i = 0; i < workerResults.length; i++) {
      if (workerResults[i].confidence > highestConfidence) {
        highestConfidence = workerResults[i].confidence;
        bestIndex = i;
      }
    }

    let mergedContent = "";

    if (job.mergeStrategy === 'concat') {
      mergedContent = workerResults.map((r, i) => `=== WORKER index ${i} (${r.confidence ? r.confidence.toFixed(2) : '0.10'}) ===\n${r.result}`).join('\n\n');
    } else if (job.mergeStrategy === 'vote') {
      // Chooses the most prevalent or highly scored consensus code structure
      // For voting, we let a system-level synthesis optimizer model vote and refit on top of our past context
      const solverPrompt = `
You are the absolute Master Adjudicator System. 
A team of ${job.workerCount} independent workers executed the task: "${job.task}"

Here are their generated proposals:
${workerResults.map((r, idx) => `PROPOSAL ${idx} (Worker ${idx}):\n${r.result}`).join('\n\n')}

${pastJobContext ? `CONSIDER THIS HIGH-CONFIDENCE HISTORICAL REFERENCE BEFORE RESOLVING CONTROVERSIES:\n${pastJobContext}\n` : ''}

Refine these proposals. Synthesize them into ONE ultimate clean production module that retains the absolute best elements of structural patterns, high-density performance, and perfect resilience. Ensure zero placeholders.
      `.trim();

      try {
        mergedContent = await modelRouter.route({
          prompt: solverPrompt,
          taskType: 'SWARM_OPTIMIZER'
        });
      } catch (err: any) {
        console.warn("[SwarmOrchestrator] Automated voting model failed, falling back to best-index result:", err.message);
        mergedContent = workerResults[bestIndex].result;
      }
    } else {
      // Default: 'best' - uses the optimizer model to combine structural + generative with reference context
      const optimizerPrompt = `
You are the Master Optimizer.
Combine these candidate worker programs into one finalized supreme script.
Task: "${job.task}"

Candidate 1 (Structural):
${workerResults[0]?.result || '(Unresponsive)'}

Candidate 2 (Complete Implementations):
${workerResults[1]?.result || '(Unresponsive)'}

Candidate 3 (Failsafes & Protections):
${workerResults[2]?.result || '(Unresponsive)'}

Analyze Destroyer warnings and produce the complete merged script with ZERO stubs.
      `.trim();

      try {
        mergedContent = await modelRouter.route({
          prompt: optimizerPrompt,
          taskType: 'SWARM_OPTIMIZER'
        });
      } catch (err: any) {
        console.warn("[SwarmOrchestrator] Synthesis model failed, falling back to best result:", err.message);
        mergedContent = workerResults[bestIndex].result;
      }
    }

    return {
      confidence: highestConfidence,
      winningWorkerIndex: bestIndex,
      mergedContent,
      workerOutputs
    };
  }

  getStatus() {
    // Collect active jobs
    const active = Array.from(this.activeJobs.values()).filter(j => j.status === 'RUNNING');
    return {
      status: active.length > 0 ? 'RUNNING' : 'IDLE',
      activeJobs: active
    };
  }

  getHistory(limit = 20) {
    try {
      return memoryVault.prepare('SELECT * FROM swarm_jobs ORDER BY createdAt DESC LIMIT ?').all(limit);
    } catch {
      return [];
    }
  }
}

export const swarmOrchestrator = new SwarmOrchestrator();
export default swarmOrchestrator;
