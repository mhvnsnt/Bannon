import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawnStealthWorker } from '../tools/stealthBrowser';
import { logSecurityEvent } from '../securityVaultManager';
import { sendPushAlert } from '../notifications/pushService';

// The memory file for the 100% cloud-free local database equivalent (Replaces Pinecone)
const LOCAL_MEMORY_PATH = path.join(process.cwd(), 'vault', 'local_vectors.json');

export class ZeroCostLocalOrchestrator {
  constructor() {
    const vaultDir = path.dirname(LOCAL_MEMORY_PATH);
    if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
    if (!fs.existsSync(LOCAL_MEMORY_PATH)) fs.writeFileSync(LOCAL_MEMORY_PATH, JSON.stringify([]));
  }

  /**
   * Local Cognitive Engine Link
   * Routes processing directly to a locally running Ollama instance (Zero API Costs)
   */
  private async queryLocalLLM(prompt: string): Promise<string> {
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama3', // Adjust to mistral or deepseek based on your hardware rig
        prompt: prompt,
        stream: false
      }, { timeout: 30000 }); // extended timeout for heavy reasoning
      return response.data.response;
    } catch (error) {
      console.error('[LOCAL LLM ERROR]: Ensure Ollama is running locally on port 11434');
      throw error;
    }
  }

  /**
   * Analytical Multi-Agent Reasoning Pipeline
   * Handles local scraping and local LLM execution.
   */
  public async executeOperationalCycle() {
    console.log('[LOCAL ORCHESTRATOR]: Initiating fully local cognitive sweep...');
    const cycleStartTime = Date.now();
    const initialMemoryUsage = process.memoryUsage().heapUsed;

    try {
      // 1. Scraping execution runs via stealth local headless Chromium
      const rawData = await spawnStealthWorker('https://gamma-api.polymarket.com/events');

      // 2. Read local historical context from your local disk database
      let localMemoryData = "[]";
      try {
        localMemoryData = fs.readFileSync(LOCAL_MEMORY_PATH, 'utf8');
      } catch(e) {}
      
      const memoryContext = JSON.parse(localMemoryData || "[]").map((m: any) => m.insight).join('\n---\n');

      // 3. Process the dataset entirely on your own machine (Air-Gapped Logic)
      const prompt = `
        [HISTORICAL LOCAL CONTEXT]: ${memoryContext.slice(0, 1500) || "No prior data."}
        [TARGET RAW DATA]: ${rawData.slice(0, 3000)}
        
        CRITICAL INSTRUCTION: Analyze the market data against our local history. Find any asymmetric opportunities.
        If a clear risk-mitigated margin is found, respond precisely with the tactical insight. Keep it to 3 sentences.
      `;

      let decision = "";
      try {
         decision = await this.queryLocalLLM(prompt);
         logSecurityEvent('OLLAMA INFERENCE EXECUTION', 'Local Llama3 executed reasoning logic successfully.', 'localhost', 'SECURE');
      } catch(llmFault) {
         decision = "[FALLBACK] Local Ollama unreachable. Bypassing reasoning sequence.";
         logSecurityEvent('OLLAMA CONNECTION FAULT', 'Port 11434 unavailable. Ensure local rig is booted.', 'localhost', 'CRITICAL');
      }

      console.log('[LOCAL ANALYTICS RESULT]:', decision);

      // 4. Save new insights back to your local file system array (Persistent Disk Storage)
      const updatedMemory = JSON.parse(localMemoryData || "[]");
      updatedMemory.push({ timestamp: new Date().toISOString(), insight: decision.substring(0, 1000) });
      
      // Cleanup tail limits so physical drive isn't exhausted
      if (updatedMemory.length > 500) {
        updatedMemory.shift();
      }
      
      fs.writeFileSync(LOCAL_MEMORY_PATH, JSON.stringify(updatedMemory, null, 2));
      
      await sendPushAlert(
        `🛡️ [100% LOCAL OS SWEEP COMPLETED]\n\n` +
        `Data: Polymarket & DFS Anomalies\n` +
        `Cognitive Engine: Local Llama3\n` +
        `Result: ${decision.slice(0, 150)}...`
      );

      this.runHeuristicDiagnostics(cycleStartTime, initialMemoryUsage);
    } catch (fault: any) {
        this.handleSystemAnomaly(fault);
        this.runHeuristicDiagnostics(cycleStartTime, initialMemoryUsage, fault?.message);
    }
  }
  
  private runHeuristicDiagnostics(startTime: number, initialMemory: number, errorMsg?: string) {
     const elapsedMs = Date.now() - startTime;
     const memoryUsedDeltaMB = (process.memoryUsage().heapUsed - initialMemory) / 1024 / 1024;
     
     console.log(`[HEURISTIC_DEBUGGER] Cycle finalized: ${elapsedMs}ms | RAM delta: ${memoryUsedDeltaMB.toFixed(2)}MB`);
     
     if (errorMsg && (errorMsg.includes('CAPTCHA') || errorMsg.includes('HONEYPOT_DETECTED') || errorMsg.includes('Timeout'))) {
         logSecurityEvent('HONEYPOT TRIGGERED', `Heuristics blocked. Target deflected with ${errorMsg}. Patching RSI.`, 'TARGET', 'CRITICAL');
         try {
             const rsiLogPath = path.join(process.cwd(), 'vault', 'rsi_autopsy.log');
             fs.appendFileSync(rsiLogPath, `\n[${new Date().toISOString()}] HEURISTIC BLOCK: ${errorMsg}. Requires immediate routing patch.`);
         } catch(e) {}
     }
  }
  
  private handleSystemAnomaly(error: any) {
    console.error('[CRITICAL LOCAL ANOMALY DETECTED]:', error?.message || error);
    
    const traceSnapshot = {
      timestamp: new Date().toISOString(),
      errorPayload: error?.message || error,
      stackTrace: error?.stack || 'No stack trace provided'
    };

    // Append trace data directly to the server log for the RSI engine to ingest locally
    try {
        fs.appendFileSync(path.join(process.cwd(), 'vault', 'server.log'), `\n[LOCAL_TRADE_FAILED] ${JSON.stringify(traceSnapshot)}`);
    } catch(e) {}
  }
}
