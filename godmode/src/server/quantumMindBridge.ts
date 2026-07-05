import { EventEmitter } from 'events';
import { nexusBus } from './modelRouter';
import { memoryVault } from './db';
import { QuantumFileEngine } from './quantumFileEngine';
import { QuantumContextManager } from './quantumContextManager';
import { QuantumResponseParser } from './quantumResponseParser';
import { modelRouter } from './modelRouter';

export interface PendingDirective {
  id: string;
  sessionId: string;
  fileId: string;
  intent: string;
  timestamp: number;
}

export class QuantumMindBridge {
  private static pending: PendingDirective[] = [];
  private static autonomousSessions: Record<string, { autonomous: boolean; trust: boolean }> = {};

  static init() {
    nexusBus.on('MIND_DIRECTIVE', async (event: { sessionId: string; fileId: string; intent: string }) => {
      console.log(`[QuantumMindBridge] Caught MIND_DIRECTIVE: ${event.intent}`);
      
      const config = this.getSessionConfig(event.sessionId, event.fileId);

      if (config.autonomous) {
        if (config.trust) {
          // Skip approval, direct apply!
          await this.applyDirective(event.sessionId, event.fileId, event.intent);
        } else {
          // Place into pending approval queue
          this.pending.push({
            id: 'dir_' + Date.now(),
            sessionId: event.sessionId,
            fileId: event.fileId,
            intent: event.intent,
            timestamp: Date.now()
          });
          nexusBus.emit('PENDING_DIRECTIVE_ADDED', event.sessionId);
        }
      } else {
        // Enforce staging queue for manual application
        this.pending.push({
          id: 'dir_' + Date.now(),
          sessionId: event.sessionId,
          fileId: event.fileId,
          intent: event.intent,
          timestamp: Date.now()
        });
        nexusBus.emit('PENDING_DIRECTIVE_ADDED', event.sessionId);
      }
    });
  }

  static getSessionConfig(sessionId: string, fileId: string) {
    const key = `${sessionId}_${fileId}`;
    if (!this.autonomousSessions[key]) {
      this.autonomousSessions[key] = { autonomous: false, trust: false };
    }
    return this.autonomousSessions[key];
  }

  static updateSessionConfig(sessionId: string, fileId: string, autonomous: boolean, trust: boolean) {
    const key = `${sessionId}_${fileId}`;
    this.autonomousSessions[key] = { autonomous, trust };
  }

  static getPending(sessionId: string): PendingDirective[] {
    return this.pending.filter(p => p.sessionId === sessionId);
  }

  static resolvePending(directiveId: string, approve: boolean) {
    const idx = this.pending.findIndex(p => p.id === directiveId);
    if (idx === -1) return;

    const dir = this.pending[idx];
    this.pending.splice(idx, 1);

    if (approve) {
      this.applyDirective(dir.sessionId, dir.fileId, dir.intent);
    }
  }

  private static async applyDirective(sessionId: string, fileId: string, intent: string) {
    console.log(`[QuantumMindBridge] Applying autonomous action: ${intent}`);
    QuantumContextManager.saveMessage(sessionId, fileId, 'user', `[AUTONOMOUS DIRECTIVE]: ${intent}`);

    try {
      const { prompt } = await QuantumContextManager.buildPrompt(sessionId, fileId, `[AUTONOMOUS COMPILER ACTION]: ${intent}`, intent);
      const responseText = await modelRouter.route({
        prompt,
        taskType: 'DIFF_GENERATION'
      });

      const parsed = QuantumResponseParser.parse(responseText);
      if (parsed.parseSuccess) {
        let loggedVer = 1;
        if (parsed.fullFile) {
          // Store complete updated source version
          const newId = QuantumFileEngine.storeFile(fileId, parsed.fullFile, `Autonomous: ${parsed.changeSummary}`);
          const fileInfo = QuantumFileEngine.getCurrentFile(newId);
          if (fileInfo) loggedVer = fileInfo.version_number;
        } else if (parsed.diff) {
          const newId = QuantumFileEngine.applyDiff(fileId, parsed.diff, `Autonomous: ${parsed.changeSummary}`);
          const fileInfo = QuantumFileEngine.getCurrentFile(newId);
          if (fileInfo) loggedVer = fileInfo.version_number;
        }
        
        console.log(`[QuantumMindBridge] DNA mutated autonomously to version v${loggedVer}. Let-nexus-drive active; skipping physical browser download trigger to maintain continuous zero-friction compile.`);

        QuantumContextManager.saveMessage(sessionId, fileId, 'assistant', parsed.analysis);
        nexusBus.emit('QUANTUM_AUTONOMOUS_CHANGE', { success: true, sessionId, fileId, analysis: parsed.analysis });

        // Immediately check for the next pending directive in the session queue
        const nextIdx = this.pending.findIndex(p => p.sessionId === sessionId && p.fileId === fileId);
        if (nextIdx !== -1) {
          const nextDir = this.pending[nextIdx];
          this.pending.splice(nextIdx, 1);
          console.log(`[QuantumMindBridge] Automatically cascading to next queued directive: ${nextDir.intent}`);
          // Defer slightly to avoid recursion call stack issues
          setTimeout(() => {
            this.applyDirective(sessionId, fileId, nextDir.intent);
          }, 100);
        }
      } else {
        nexusBus.emit('QUANTUM_AUTONOMOUS_CHANGE', { success: false, error: 'PARSE_ERROR' });
      }
    } catch (e: any) {
      console.error(e);
      nexusBus.emit('QUANTUM_AUTONOMOUS_CHANGE', { success: false, error: e.message });
    }
  }
}

if (process.env.ENABLE_BACKGROUND_DAEMONS === 'true') {
  QuantumMindBridge.init();
}

