import { modelRouter } from './modelRouter';
import { swarmEvents } from './swarmOrchestrator';

export interface WorkerResult {
  workerIndex: number;
  result: string;
  confidence: number;
  duration: number;
  tokensUsed: number;
}

export class SwarmWorker {
  static async run(
    jobId: string,
    workerIndex: number,
    roleName: string,
    systemPrompt: string,
    taskIntent: string,
    context: string
  ): Promise<WorkerResult> {
    const startTime = Date.now();
    console.log(`[SwarmWorker] Worker ${workerIndex} (${roleName}) starting on Job ${jobId}...`);

    // Emit initial status
    swarmEvents.emit('swarm-worker-update', {
      jobId,
      workerIndex,
      roleName,
      status: 'RUNNING',
      partial: `Worker initialized as ${roleName}. Accessing Quantum Context...`
    });

    const fullPrompt = `
SYSTEM PROMPT (ROLE: ${roleName}):
${systemPrompt}

CONTEXT INJECTED:
${context}

USER REQUEST:
${taskIntent}

Generate your complete, non-stubbed solution now. Ensure zero placeholders. Format appropriately within your direct, authoritative tone.
    `.trim();

    // 90 second independent timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Worker ${workerIndex} elapsed 90 second hard execution threshold. Terminating.`));
      }, 90000);
    });

    try {
      // Worker execution promise
      const executionPromise = (async () => {
        const result = await modelRouter.route({
          prompt: fullPrompt,
          taskType: `SWARM_WORKER_${workerIndex}`
        });

        const duration = Date.now() - startTime;
        const tokensUsed = Math.ceil((fullPrompt.length + result.length) / 4);
        
        // Calculate deterministic semantic confidence based on keyword density and layout correctness
        let confidence = 0.85;
        if (result.includes('TODO') || result.includes('stub') || result.includes('placeholder')) {
          confidence -= 0.30;
        }
        if (result.length > 500) confidence += 0.05;
        if (result.includes('export') || result.includes('class') || result.includes('function')) {
          confidence += 0.05;
        }
        confidence = Math.max(0.1, Math.min(0.99, confidence));

        // Emit completion status
        swarmEvents.emit('swarm-worker-update', {
          jobId,
          workerIndex,
          roleName,
          status: 'COMPLETED',
          partial: result.slice(0, 300) + '...'
        });

        return {
          workerIndex,
          result,
          confidence,
          duration,
          tokensUsed
        };
      })();

      // Race against timeout
      return await Promise.race([executionPromise, timeoutPromise]);
    } catch (err: any) {
      console.error(`[SwarmWorker] Worker ${workerIndex} failed:`, err.message);
      swarmEvents.emit('swarm-worker-update', {
        jobId,
        workerIndex,
        roleName,
        status: 'FAILED',
        partial: `Error: ${err.message}`
      });

      return {
        workerIndex,
        result: `ERROR_STATE: ${err.message}`,
        confidence: 0.1,
        duration: Date.now() - startTime,
        tokensUsed: 0
      };
    }
  }
}
