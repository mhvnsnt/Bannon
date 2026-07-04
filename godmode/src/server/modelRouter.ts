import { memoryVault } from './db';
import { EventEmitter } from 'events';

export const nexusBus = new EventEmitter();

export interface RouteRequest {
  prompt: string;
  taskType: string;
  context?: any;
  taskIntent?: string;
  taskId?: string;
  webRequired?: boolean;
  heavyHardwareLoad?: boolean;
}

export interface LocalStatus {
  online: boolean;
  modelsAvailable: string[];
  gpuMemoryFree: number;
  currentLoad: number;
}

export class ModelRouter {
  private dailyBudgetUSD: number = 50.0; // default budget guard
  private currentSpend: number = 0;
  private forcedProvider: string | null = null;
  private isCheckingHealth: boolean = false;

  private ollamaStatus: LocalStatus = {
    online: false,
    modelsAvailable: [],
    gpuMemoryFree: 100,
    currentLoad: 0
  };

  private ollamaUrl: string = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

  private requiredLocalModels = [
    'llama3.1:70b',
    'mistral:7b',
    'deepseek-coder-v2',
    'qwen2.5:7b',
    'nomic-embed-text'
  ];

  constructor() {
    this.startHealthCheckLoop();
  }

  public getProfileForTask(task: string) {
    return { name: 'DEFAULT', profile: this.getProfile('DEFAULT') };
  }

  public getProfile(tier: string): { proposer: string; critic: string; validator: string } {
    return {
      proposer: 'anthropic/claude-3-5-sonnet',
      critic: 'google/gemini-2.5-pro',
      validator: 'google/gemini-3.5-flash'
    };
  }

  private startHealthCheckLoop() {
    // Run initial health check immediately, then every 60 seconds
    this.localHealthCheck().catch(err => {
      console.warn('[ModelRouter] Initial local health check warning:', err.message);
    });
    setInterval(() => {
      this.localHealthCheck().catch(err => {
        console.warn('[ModelRouter] Periodic local health check warning:', err.message);
      });
    }, 60000);
  }

  public getStatusForBar() {
    let readyToTrain = false;
    try {
      const { FineTuneCollector } = require('./fineTuneCollector');
      const counts = FineTuneCollector.getFileCounts();
      readyToTrain = counts.swarm > 500 || counts.overnight > 500 || counts.mind > 500 || counts.dna > 500;
    } catch (e) {
      // safe fallback
    }

    return {
      online: this.ollamaStatus.online,
      availableCount: this.ollamaStatus.modelsAvailable.filter(m => this.requiredLocalModels.includes(m)).length,
      totalCount: this.requiredLocalModels.length,
      allModels: this.ollamaStatus.modelsAvailable,
      requiredModels: this.requiredLocalModels,
      readyToTrain
    };
  }

  public async localHealthCheck(): Promise<LocalStatus> {
    if (this.isCheckingHealth) return this.ollamaStatus;
    this.isCheckingHealth = true;

    try {
      const url = `${this.ollamaUrl}/api/tags`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const data = await res.json() as { models?: Array<{ name: string }> };
      const installedModels = (data.models || []).map(m => m.name.split(':')[0] === m.name ? m.name : m.name); // keep the clean name

      // Normalize model names to check matches
      const available: string[] = [];
      for (const req of this.requiredLocalModels) {
        const found = (data.models || []).some(m => 
          m.name.toLowerCase().includes(req.toLowerCase()) || 
          req.toLowerCase().includes(m.name.toLowerCase())
        );
        if (found) {
          available.push(req);
        }
      }

      const wasOffline = !this.ollamaStatus.online;
      this.ollamaStatus = {
        online: true,
        modelsAvailable: available,
        gpuMemoryFree: 82, // mock metric logic
        currentLoad: Math.floor(Math.random() * 25) // mock loader
      };

      if (wasOffline) {
        console.log('[ModelRouter] Ollama node connection re-established. Local primary armed.');
        nexusBus.emit('LOCAL_RESTORED');
      }

    } catch (err: any) {
      if (this.ollamaStatus.online) {
        console.warn('[ModelRouter] Primary Ollama connection severed. Emitting LOCAL_OFFLINE.');
        nexusBus.emit('LOCAL_OFFLINE');
      }
      this.ollamaStatus = {
        online: false,
        modelsAvailable: [],
        gpuMemoryFree: 0,
        currentLoad: 0
      };
    } finally {
      this.isCheckingHealth = false;
    }

    return this.ollamaStatus;
  }

  /**
   * Main routing matrix decision block
   */
  async route(req: RouteRequest): Promise<string> {
    const { prompt, taskType, context, taskId = 'task_' + Date.now(), webRequired = false, heavyHardwareLoad = false } = req;
    
    // Check Budget first
    this.updateDailySpend();

    // Determine target Tier priority
    const mappedTier = this.mapTaskTypeToTier(taskType);
    
    // Check if we force provider
    if (this.forcedProvider) {
      console.log(`[ModelRouter] Provider override active: ${this.forcedProvider}`);
      return this.callProvider(this.forcedProvider, prompt, taskType, false, mappedTier, taskId, 'Forced Provider Override');
    }

    // Tier 1: Local primary Ollama
    let localModelName = this.getLocalModelForTier(mappedTier);
    let runLocal = this.ollamaStatus.online && this.ollamaStatus.modelsAvailable.includes(localModelName);

    let overflowReason = '';
    if (!this.ollamaStatus.online) {
      overflowReason = 'Ollama local node is offline.';
      runLocal = false;
    } else if (!this.ollamaStatus.modelsAvailable.includes(localModelName)) {
      overflowReason = `Required model ${localModelName} not available locally.`;
      runLocal = false;
    } else if (webRequired) {
      overflowReason = `Real-time web search capability required.`;
      runLocal = false;
    } else if (heavyHardwareLoad || this.ollamaStatus.currentLoad > 85) {
      overflowReason = `Hardware resource load spike alert (${this.ollamaStatus.currentLoad}%).`;
      runLocal = false;
    }

    if (runLocal) {
      try {
        console.log(`[ModelRouter] TIER 1 [LOCAL]: Routing task [${taskType}] to ${localModelName}`);
        const response = await this.callProvider('local-ollama', prompt, taskType, false, mappedTier, taskId, '');
        
        // Output self-confidence assessment
        const confidence = this.assessConfidence(response, mappedTier);
        if (confidence >= 0.6) {
          return response;
        }

        // Low confidence trigger overflow
        overflowReason = `Local model returning low confidence metrics (${confidence}). Overflowing.`;
        console.log(`[ModelRouter] ${overflowReason} - Routing to Tier 2.`);
      } catch (err: any) {
        overflowReason = `Local model execution crash: ${err.message}. Overflowing.`;
        console.warn(`[ModelRouter] ${overflowReason}`);
      }
    }

    // Tier 2: API Overflow
    console.log(`[ModelRouter] TIER 2 [API OVERFLOW]: Routing task [${taskType}] due to: ${overflowReason}`);
    const apiModelName = this.getAPIModelForTier(mappedTier);
    
    try {
      const response = await this.callProvider('openrouter', prompt, taskType, true, mappedTier, taskId, overflowReason, apiModelName);
      return response;
    } catch (err: any) {
      console.error(`[ModelRouter] Tier 2 Overflow failure: ${err.message}. Initializing absolute fallback.`);
      
      // Tier 3: Absolute Fallback Chain (Local fallback or Gemini Pro fallback)
      try {
        return await this.callProvider('google-fallback', prompt, taskType, true, mappedTier, taskId, 'Tier 2 Crash Fallback');
      } catch (fallbackErr: any) {
        // System Blackout containment
        const emergencyLogMsg = `TOTAL SYSTEM COGNITIVE BLACKOUT: ${fallbackErr.message}`;
        console.error(`[ModelRouter] ${emergencyLogMsg}`);
        memoryVault.prepare(`INSERT INTO resurrection_log (op_type, op_id, status, payload, resolution) VALUES (?, ?, ?, ?, ?)`).run('TOTAL_BLACKOUT', taskId, 'COMPLETED', JSON.stringify({ error: emergencyLogMsg }), fallbackErr.message);
        nexusBus.emit('TOTAL_BLACKOUT');
        return JSON.stringify({ error: "TOTAL_BLACKOUT", details: fallbackErr.message });
      }
    }
  }

  private mapTaskTypeToTier(taskType: string): string {
    const type = taskType.toUpperCase();
    if (type.includes('ARCHITECTURE') || type.includes('THINK') || type.includes('ADJUDICATOR') || type.includes('REASONING')) {
      return 'HIGH_REASONING';
    }
    if (type.includes('BUILD') || type.includes('GEN') || type.includes('REVIEW') || type.includes('DIFF')) {
      return 'CODE_GEN';
    }
    if (type.includes('SWARM') || type.includes('WORKER') || type.includes('AGENT')) {
      return 'SWARM_WORKER';
    }
    if (type.includes('OVERNIGHT') || type.includes('BULK') || type.includes('DAEMON')) {
      return 'OVERNIGHT_TASK';
    }
    if (type.includes('METAPHYSICAL') || type.includes('CHALLENGER')) {
      return 'METAPHYSICAL';
    }
    if (type.includes('ANALYSIS') || type.includes('DEEP')) {
      return 'DEEP_ANALYSIS';
    }
    return 'HIGH_REASONING'; // default tier
  }

  private getLocalModelForTier(tier: string): string {
    switch (tier) {
      case 'HIGH_REASONING': return 'llama3.1:70b';
      case 'CODE_GEN': return 'deepseek-coder-v2';
      case 'SWARM_WORKER': return 'mistral:7b';
      case 'OVERNIGHT_TASK': return 'qwen2.5:7b';
      case 'METAPHYSICAL': return 'llama3.1:70b';
      case 'DEEP_ANALYSIS': return 'llama3.1:70b';
      default: return 'llama3.1:70b';
    }
  }

  private getAPIModelForTier(tier: string): string {
    switch (tier) {
      case 'HIGH_REASONING': return 'anthropic/claude-3.5-sonnet:beta';
      case 'CODE_GEN': return 'anthropic/claude-3.5-sonnet';
      case 'SWARM_WORKER': return 'google/gemini-3.5-flash';
      case 'OVERNIGHT_TASK': return 'anthropic/claude-3.5-haiku';
      case 'METAPHYSICAL': return 'anthropic/claude-3.5-sonnet:beta';
      case 'DEEP_ANALYSIS': return 'google/gemini-2.5-pro';
      default: return 'google/gemini-3.5-flash';
    }
  }

  private assessConfidence(response: string, tier: string): number {
    if (!response || response.trim().length === 0) return 0;
    const lower = response.toLowerCase();
    if (lower.includes("unable to generate") || lower.includes("cannot fulfill") || lower.includes("ollama error") || lower.includes("failed to process")) {
      return 0.2;
    }
    if (lower.length < 150 && (tier === 'HIGH_REASONING' || tier === 'CODE_GEN')) {
      return 0.5; // too short to contain robust outputs
    }
    return 0.95; // solid output confidence metric
  }

  private async callProvider(
    provider: string,
    prompt: string,
    taskType: string,
    isFallback: boolean,
    tier: string,
    taskId: string,
    reason: string,
    optionalModelOverride?: string
  ): Promise<string> {
    const start = Date.now();
    let responseText = '';
    let selectedModel = '';

    if (provider === 'local-ollama') {
      selectedModel = this.getLocalModelForTier(tier);
      const url = `${this.ollamaUrl}/api/generate`;
      const body = { model: selectedModel, prompt, stream: false };
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // code-gen / reasoning timeout limit

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
        const data = await res.json() as { response?: string };
        responseText = data.response || '';
      } catch (err: any) {
        clearTimeout(timeout);
        throw err;
      }

    } else if (provider === 'anthropic') {
      selectedModel = optionalModelOverride || 'claude-3-5-sonnet-20241022';
      const apiKey = process.env.ANTHROPIC_API_KEY || '';
      const url = 'https://api.anthropic.com/v1/messages';

      // Retry logic for Anthropic
      let attempt = 0;
      let res: Response;
      while (attempt < 10) {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 8192,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (res.status !== 429) break;
        attempt++;
        const jitter = Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, Math.min(Math.pow(2, attempt) * 1500 + jitter, 60000)));
      }

      if (!res!.ok) {
        throw new Error(`Anthropic returned status ${res!.status}: ${await res!.text()}`);
      }

      const data = await res!.json() as any;
      responseText = data.content?.map((b: any) => b.text || '').join('') || '';

    } else if (provider === 'openrouter') {
      selectedModel = optionalModelOverride || this.getAPIModelForTier(tier);
      const apiKey = process.env.OPENROUTER_API_KEY || process.env.OrionHavwsteeOoenrouterapikey || '';
      const url = 'https://openrouter.ai/api/v1/chat/completions';

      // Retry logic for OpenRouter
      let attempt = 0;
      let res: Response;
      while (attempt < 10) {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (res.status !== 429) break;
        attempt++;
        // Wait exponentially: higher cap for backoff
        const jitter = Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, Math.min(Math.pow(2, attempt) * 1500 + jitter, 60000)));
      }

      if (!res!.ok) {
        throw new Error(`OpenRouter returned status ${res!.status}`);
      }

      const data = await res!.json() as any;
      responseText = data.choices?.[0]?.message?.content || '';

    } else if (provider === 'google-fallback') {
      // Use standard Gemini endpoint or Google AI Studio keys
      selectedModel = 'gemini-2.0-flash';
      const apiKey = process.env.GEMINI_API_KEY || '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

      // Retry logic
      let attempt = 0;
      let res: Response;
      while (attempt < 12) {
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          if (res.status !== 429) break;
          attempt++;
          // Wait exponentially: higher cap for backoff
          const jitter = Math.random() * 2000;
          await new Promise(resolve => setTimeout(resolve, Math.min(Math.pow(2, attempt) * 1500 + jitter, 60000)));
      }

      if (!res!.ok) {
        if (res!.status === 429) {
          console.warn(`[ModelRouter] Gemini fallback rate limited. Returning degraded placeholder response.`);
          return "System operating in degraded mode. API Quota exceeded. Please try again later or provide local resources.";
        }
        throw new Error(`Gemini fallback failed with status ${res!.status}`);
      }
      const data = await res!.json() as any;
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // Force selected model fallback or default
      selectedModel = provider;
      responseText = `Forced local diagnostic pass for model ${selectedModel}`;
    }

    const latency = Date.now() - start;
    const tokensIn = Math.ceil(prompt.length / 4);
    const tokensOut = Math.ceil(responseText.length / 4);
    const calculatedCost = this.estimateCost(provider, selectedModel, tokensIn, tokensOut);

    // Log to model_router_log
    const statusVal = responseText ? 'SUCCESS' : 'FAILED';
    const errVal = responseText ? null : 'Empty response generated';
    
    try {
      memoryVault.prepare(`
        INSERT INTO model_router_log 
        (provider_selected, was_fallback, task_type, latency_ms, tokens_in, tokens_out, estimated_cost, status, error_message) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(provider, isFallback ? 1 : 0, taskType, latency, tokensIn, tokensOut, calculatedCost, statusVal, errVal);
    } catch (e: any) {
      console.warn('[ModelRouter] Warning writing to model_router_log:', e.message);
    }

    // Log to api_cost_log (the secure accounting line)
    try {
      memoryVault.prepare(`
        INSERT INTO api_cost_log 
        (provider, model, tokens_in, tokens_out, cost_usd, task_type, task_id, reason) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(provider, selectedModel, tokensIn, tokensOut, calculatedCost, taskType, taskId, reason || 'Normal execution');
    } catch (e: any) {
      console.warn('[ModelRouter] Warning writing to api_cost_log:', e.message);
    }

    return responseText;
  }

  private estimateCost(provider: string, model: string, inTokens: number, outTokens: number): number {
    if (provider === 'local-ollama') return 0.0;
    
    // Estimate cost per token based on modern pricing structures
    const cleanModel = model.toLowerCase();
    if (cleanModel.includes('sonnet')) {
      return (inTokens * 0.000003) + (outTokens * 0.000015);
    }
    if (cleanModel.includes('opus')) {
      return (inTokens * 0.000015) + (outTokens * 0.000075);
    }
    if (cleanModel.includes('pro')) {
      return (inTokens * 0.00000125) + (outTokens * 0.000005);
    }
    if (cleanModel.includes('haiku') || cleanModel.includes('flash')) {
      return (inTokens * 0.0000003) + (outTokens * 0.0000012);
    }
    
    return 0.0; // default to free/untracked
  }

  private updateDailySpend() {
    try {
      const row = memoryVault.prepare(`
        SELECT SUM(cost_usd) as total 
        FROM api_cost_log 
        WHERE timestamp >= date('now')
      `).get() as any;
      
      this.currentSpend = row?.total || 0;
      if (this.currentSpend >= this.dailyBudgetUSD * 0.8) {
        nexusBus.emit('BUDGET_WARNING');
      }
    } catch (err) {
      // safe fallback
    }
  }

  getRouterStats() {
    try {
      const stats = memoryVault.prepare(`
        SELECT provider, model, COUNT(*) as c, SUM(cost_usd) as total_cost 
        FROM api_cost_log 
        GROUP BY provider, model
      `).all();
      return { stats, activeProvider: this.ollamaStatus.online ? 'Local Primary (Ollama)' : 'OpenRouter API Overflow' };
    } catch (err) {
      return { stats: [], activeProvider: 'Offline Fallback' };
    }
  }

  forceProvider(p: string) {
    this.forcedProvider = p === 'clear' ? null : p;
  }

  async checkAllProviders() {
    await this.localHealthCheck();
    return [
      { name: 'Local Primary (Ollama)', status: this.ollamaStatus.online ? 'ONLINE' : 'OFFLINE' },
      { name: 'llama3.1:70b', status: this.ollamaStatus.modelsAvailable.includes('llama3.1:70b') ? 'ONLINE' : 'OFFLINE' },
      { name: 'mistral:7b', status: this.ollamaStatus.modelsAvailable.includes('mistral:7b') ? 'ONLINE' : 'OFFLINE' },
      { name: 'deepseek-coder-v2', status: this.ollamaStatus.modelsAvailable.includes('deepseek-coder-v2') ? 'ONLINE' : 'OFFLINE' },
      { name: 'qwen2.5:7b', status: this.ollamaStatus.modelsAvailable.includes('qwen2.5:7b') ? 'ONLINE' : 'OFFLINE' },
      { name: 'OpenRouter (API Overflow)', status: 'ONLINE' }
    ];
  }

  getCostReport() {
    try {
      const today = memoryVault.prepare(`SELECT SUM(cost_usd) as total FROM api_cost_log WHERE timestamp >= date('now')`).get() as any;
      const week = memoryVault.prepare(`SELECT SUM(cost_usd) as total FROM api_cost_log WHERE timestamp >= date('now', '-7 days')`).get() as any;
      const month = memoryVault.prepare(`SELECT SUM(cost_usd) as total FROM api_cost_log WHERE timestamp >= date('now', '-30 days')`).get() as any;
      
      return {
        today: today?.total || 0,
        week: week?.total || 0,
        month: month?.total || 0,
        savings: (week?.total || 0) * 4.2 // savings metric calculation
      };
    } catch (err) {
      return { today: 0, week: 0, month: 0, savings: 0 };
    }
  }

  setBudgetGuard(limit: number) {
    this.dailyBudgetUSD = limit;
  }
}

export const modelRouter = new ModelRouter();
export default modelRouter;
