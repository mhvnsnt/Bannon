import * as fs from 'fs';
import * as path from 'path';
import { memoryVault } from './db';
import { ProjectOrchestrator, Project } from './projectOrchestrator';
import { ContextBuilder } from './contextBuilder';
import { modelRouter, nexusBus } from './modelRouter';
import { PromptQueueEngine } from './promptQueueEngine';
import { ContinuousWorldModel } from '../engine/ContinuousWorldModel';

export interface MindCycleResult {
  projectId: string;
  projectName: string;
  success: boolean;
  directive?: string;
  reasoning?: string;
  queueId?: string | null;
  timestamp: string;
  error?: string;
}

export class NexusMind {
  private static projectsQueue: string[] = []; // In-memory project IDs for round-robin
  private static registered = false;

  public static liveWorldState: any = {};
  public static cycleCount = 0;
  private static worldModel = new ContinuousWorldModel();

  public static getInstance() {
     return this;
  }

  public static perceive(eventType: string, data: any): void {
     try {
       memoryVault.prepare(`
         INSERT INTO spine_event_log (event_type, payload)
         VALUES (?, ?)
       `).run(eventType, JSON.stringify(data));
     } catch(e) {
       console.error('[NexusMind] Failed to insert into spine_event_log:', e.message);
     }

     const critical = ['RUNTIME_ERROR', 'TYPE_ERROR', 'BUILD_FAILED', 'PROVIDER_DOWN'];
     if (critical.includes(eventType) && data.severity !== 'LOW') {
       setImmediate(() => this.actOnCritical(eventType, data));
     }

     if (!this.liveWorldState) this.liveWorldState = {};
     this.liveWorldState[eventType] = { ...data, at: Date.now() };
  }

  private static actOnCritical(eventType: string, data: any): void {
    console.log(`[NexusMind] CRITICAL perception: ${eventType}`, data);
    if (eventType === 'RUNTIME_ERROR' || eventType === 'BUILD_FAILED') {
      try {
        memoryVault.prepare(`
          INSERT INTO autonomous_tasks (id, prompt, status, priority, created_at)
          VALUES (?, ?, 'PENDING', 'CRITICAL', ?)
        `).run(
          "auto-" + Date.now().toString(),
          `CRITICAL AUTO-HEAL: Fix this error immediately and completely:\n${data.message}`,
          Date.now()
        );
      } catch (e) {}
    }
  }

  private static startNetworkSense(): void {
    const probe = async () => {
      const targets = [
        { name: 'ollama',  url: 'http://localhost:11434/api/tags' },
        { name: 'groq',    url: 'https://api.groq.com/openai/v1/models', 
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }},
        { name: 'gemini',  url: `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}` },
      ];
      for (const t of targets) {
        try {
          const start = Date.now();
          const res = await fetch(t.url, { 
            headers: t.headers || {},
            signal: AbortSignal.timeout(4000) as any
          });
          const latency = Date.now() - start;
          const online = res.ok;
          this.perceive('NETWORK_STATUS', { service: t.name, online, latency });
        } catch {
          this.perceive('PROVIDER_DOWN', { service: t.name, online: false });
        }
      }
    };
    probe();
    setInterval(probe, 60000);
  }

  static init() {
    if (this.registered) return;
    this.registered = true;
    
    this.startNetworkSense();

    console.log('[NexusMind] Initialization complete. Absolute Autonomy Round-Robin orchestrator online.');
    
    // Ticks every 3 mins to think on projects round-robin
    setInterval(() => {
      this.executeNextRoundRobinCycle().catch(err => {
        console.error('[NexusMind] Round-Robin thinking cycle exception:', err.message);
      });
    }, 3 * 60 * 1000);
  }

  /**
   * Automatically selects the next project in the list and runs thinking pass
   */
  static async executeNextRoundRobinCycle(): Promise<MindCycleResult | null> {
    const projects = ProjectOrchestrator.getAllProjects();
    if (projects.length === 0) {
      console.log('[NexusMind] No projects available for round-robin execution.');
      return null;
    }

    // Refresh our round-robin queue if empty
    if (this.projectsQueue.length === 0) {
      this.projectsQueue = projects.map(p => p.id);
    }

    // Pop the next project to execute
    const nextProjectId = this.projectsQueue.shift();
    if (!nextProjectId) return null;

    const targetProject = projects.find(p => p.id === nextProjectId);
    if (!targetProject) {
      console.log(`[NexusMind] Project ${nextProjectId} not found in database. Skipping.`);
      return this.executeNextRoundRobinCycle();
    }

    console.log(`[NexusMind] Round-Robin thinking tick. Selected: ${targetProject.name} [ID: ${targetProject.id}]`);

    // Temporarily switch active context so that file watch and other engines react
    ProjectOrchestrator.switchActiveContext(targetProject.id);

    try {
      const result = await this.runThinkCycle(targetProject.id);
      nexusBus.emit('NEXUS_MIND_TICK_COMPLETE', result);
      return result;
    } catch (err: any) {
      console.error(`[NexusMind] Thinking cycle failed for ${targetProject.id}:`, err.message);
      return {
        projectId: targetProject.id,
        projectName: targetProject.name,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Core think logic for a specific project.
   * Leverages the context builder scoped to this project to synthesize next best move.
   */
  static async runThinkCycle(projectId: string): Promise<MindCycleResult> {
    const projects = ProjectOrchestrator.getAllProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) {
      throw new Error(`Project ${projectId} does not exist.`);
    }

    console.log(`[NexusMind] Compiling project-isolated context for "${proj.name}" (project_id: "${proj.id}")...`);

    // Retrieve active project's database-specific constants and records
    let designDna = '{}';
    try {
      const dnaRow = memoryVault.prepare(`
        SELECT config_json FROM dna_archive 
        WHERE project_id = ? AND run_status = 'MASTER' 
        ORDER BY timestamp DESC LIMIT 1
      `).get(projectId) as { config_json: string } | undefined;
      
      if (dnaRow) {
        designDna = dnaRow.config_json;
      }
    } catch (err: any) {
      console.warn('[NexusMind] DNA archive query failure scoped to project:', err.message);
    }

    // Retrieve memories specific to this project
    let memoriesText = '';
    try {
      const memories = memoryVault.prepare(`
        SELECT content FROM memory_user_edits 
        WHERE project_id = ? 
        ORDER BY id ASC
      `).all(projectId) as { content: string }[];
      
      memoriesText = memories.map((m, idx) => `Memory ${idx + 1}:\n${m.content}`).join('\n\n');
    } catch (err: any) {
      console.warn('[NexusMind] Memory User Edits query failure scoped to project:', err.message);
    }

    // Read proven successful patterns from training data
    let fewShotMemory = '';
    try {
      const pairsPath = path.join(process.cwd(), 'training_data', 'swarm_pairs.jsonl');
      if (fs.existsSync(pairsPath)) {
        const lines = fs.readFileSync(pairsPath, 'utf8')
          .split('\n').filter(Boolean);
        
        // Take last 5 successful pairs only
        const recent = lines.slice(-5).map((l: string) => {
          try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
        
        if (recent.length > 0) {
          fewShotMemory = '\n=== PROVEN SUCCESSFUL PATTERNS ===\n' +
            recent.map((p: any) => 
              `TASK: ${p.input?.slice(0,120)}\nOUTPUT SUMMARY: ${p.output?.slice(0,200)}`
            ).join('\n---\n') + '\n=== END PATTERNS ===\n';
        }
      }
    } catch(e) {}

    let worldSummary = '';
    try {
      await this.worldModel.refresh(memoryVault);
      worldSummary = this.worldModel.getSummaryForPrompt();
    } catch(e) {}

    let semanticMemoryText = '';
    try {
      const { SemanticSearch } = await import('./semanticSearch');
      const searchIntent = `Optimize and complete project files for ${proj.name}`;
      const searchResults = await SemanticSearch.search(searchIntent, { limit: 5, minScore: 0.5 });
      if (searchResults && searchResults.length > 0) {
        semanticMemoryText = '\n=== RETRIEVED SEMANTIC CONTEXT (PAST SOLUTIONS) ===\n' +
          searchResults.map((r: any) => `[Source: ${r.sourceTable}] Score: ${r.score.toFixed(2)}\nContent: ${r.content.slice(0, 300)}...`).join('\n---\n') +
          '\n=== END RETRIEVED CONTEXT ===\n';
      }
    } catch (err: any) {
      console.warn('[NexusMind] SemanticSearch query failure for think cycle:', err.message);
    }

    const systemPrompt = `You are the executive neocortex ("The Mind") of the Absolute Autonomy System. Heed the Nine Protocol: NEVER use the word "sovereign", use "Absolute Autonomy".
Your mission is to evaluate the currently isolated Workspace project state, identify files needing optimization or completion, and formulate a single structural code mutation task (SwarmTask prompt).

PROMPT CONTEXT FOR PROJECT: "${proj.name}" (Root file: "${proj.root_file}")
=== DNA CONSTANTS ===
${designDna}

${worldSummary}

=== MEMORY VAULT PERSISTENT TRUTH ===
${memoriesText || 'No custom memory records in database registry.'}
${fewShotMemory}
${semanticMemoryText}

Formulate your response as a JSON block with two fields:
1. "directive": A high-altitude strategic design intent prompt for the swarm worker (e.g., "Adjust GRAVITY and REACH parameters within bannon.html to tighten combat recovery loop")
2. "reasoning": Your deep physical or mathematical justification.
`;

    try {
      const textResponse = await modelRouter.route({
        prompt: systemPrompt,
        taskType: 'MIND_THINK'
      });

      let directive = `Optimize kinetic structures in target file: ${proj.root_file}`;
      let reasoning = 'Autonomous code improvement execution.';

      try {
        // Strip out markdown or parse cleanly
        const cleanJson = textResponse.includes('{') 
          ? textResponse.substring(textResponse.indexOf('{'), textResponse.lastIndexOf('}') + 1)
          : textResponse;
        
        const parsed = JSON.parse(cleanJson);
        if (parsed.directive) directive = parsed.directive;
        if (parsed.reasoning) reasoning = parsed.reasoning;
      } catch {
        // fallback
        directive = textResponse || directive;
      }

      console.log(`[NexusMind] Derived directive for "${proj.name}": "${directive}"`);

      // Spawn swarm tasks under promptQueueEngine
      let queueId: string | null = null;
      try {
        const fullTaskText = `${directive}\n\nStrictly target: ${proj.root_file}. Ensure compilation succeeds and preserve code integrity.`;
        queueId = await PromptQueueEngine.createQueue([fullTaskText], {
          stopOnFailure: true,
          validationRequired: true,
          autoAdvance: true
        });

        // Fire-and-forget execution
        PromptQueueEngine.executeQueue(queueId).catch(err => {
          console.error(`[NexusMind] Prompt Queue ${queueId} failed in execution:`, err.message);
        });
      } catch (queueErr: any) {
        console.warn(`[NexusMind] Could not launch PromptQueueEngine for ${proj.id}:`, queueErr.message);
      }

      // Log thinking step in local db
      try {
        memoryVault.prepare(`
          INSERT INTO mind_log (directive_intent, reasoning, status, project_id)
          VALUES (?, ?, ?, ?)
        `).run(directive, reasoning, 'EXECUTING', projectId);
      } catch (dbErr: any) {
        console.error('[NexusMind] Failed to insert mind_log entry:', dbErr.message);
      }

      return {
        projectId,
        projectName: proj.name,
        success: true,
        directive,
        reasoning,
        queueId,
        timestamp: new Date().toISOString()
      };

    } catch (err: any) {
      console.error(`[NexusMind] GPT thinking dispatch failed for project ${projectId}:`, err.message);
      return {
        projectId,
        projectName: proj.name,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Self boot
NexusMind.init();
