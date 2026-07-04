import { nexusBus } from './modelRouter';
import { memoryVault } from './db';
import { MemoryVaultTool } from './memoryVault';

export class SpineWiring {
  static init() {
    console.log('[SpineWiring] Initializing core synapse listener...');

    // Wire 11 — Queue blocked triggers Mind attention
    nexusBus.on('QUEUE_BLOCKED', async (event: { queueId: string; blockedAtPosition: number; promptText: string; challengerDiagnosis: string; timestamp: string }) => {
      console.log(`[SpineWiring] [SYNAPSE 11] QUEUE_BLOCKED on queue ${event.queueId} at position ${event.blockedAtPosition}. Triggering active Mind attention...`);
      
      const mindReasoningContext = `
The prompt queue blocked at position ${event.blockedAtPosition} with diagnosis: ${event.challengerDiagnosis}. 
Analyze whether this represents a systemic architectural issue or a one-time prompt error and recommend whether to retry, skip, or restructure the remaining queue.
      `.trim();

      // Write direct Mind reasoning diagnostic report into mind_log
      try {
        memoryVault.prepare(`
          INSERT INTO mind_log (directive_intent, reasoning, status, full_context_snapshot)
          VALUES (?, ?, ?, ?)
        `).run(
          `AUTO_QUEUE_RESOLUTION_REFIT_VAL`,
          mindReasoningContext,
          'PAUSED_BLOCKED',
          JSON.stringify(event)
        );
      } catch (e: any) {
        console.error('[SpineWiring] Failed to write mind resolution log:', e.message);
      }
    });

    // Wire 12 — Queue complete updates roadmap
    nexusBus.on('QUEUE_COMPLETE', async (event: { queueId: string; totalPrompts: number; successCount: number; failCount: number; skipCount: number; totalTimeMs: number; timestamp: string }) => {
      console.log(`[SpineWiring] [SYNAPSE 12] QUEUE_COMPLETE on queue ${event.queueId}. Recording roadmap progress...`);
      
      const summaryText = `Prompt Queue execution complete. ID: ${event.queueId}. Processed: ${event.totalPrompts} instructions with outcome: ${event.successCount} complete, ${event.failCount} failed, ${event.skipCount} skipped. Real-time roadmap features parsed successfully.`;
      
      // Update memory_user_edits persistent fact store roadmap position
      try {
        const memories = MemoryVaultTool.view() as any[];
        const roadmapMemory = memories.find(m => m.content.toLowerCase().includes('roadmap'));
        
        if (roadmapMemory) {
          const updatedContent = `${roadmapMemory.content}\n- Run report: ${summaryText}`;
          MemoryVaultTool.replace(roadmapMemory.id, updatedContent);
        } else {
          MemoryVaultTool.add(`Memory 3 — Roadmap State\nPhase 0 complete. Prompt Queue complete: ${summaryText}`);
        }
      } catch (e: any) {
        console.error('[SpineWiring] Failed to update memory_vault roadmap:', e.message);
      }
    });

    // Wire 13 — PATTERN_UPDATE writes logs to SQLite
    nexusBus.on('PATTERN_UPDATE', async (event: { discoveredCount: number; timestamp: string; trends: any[] }) => {
      console.log(`[SpineWiring] [SYNAPSE 13] PATTERN_UPDATE received. Discovered ${event.discoveredCount} trends. Logging pattern event context...`);
      try {
        const id = crypto.createHash('md5').update(`pattern_update_${event.timestamp}_${event.discoveredCount}`).digest('hex');
        memoryVault.prepare(`
          INSERT INTO pattern_log (id, timestamp, patterns_json)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `).run(id, event.timestamp, JSON.stringify(event.trends));
      } catch (e: any) {
        console.error('[SpineWiring] Failed logging PATTERN_UPDATE to pattern_log table:', e.message);
      }
    });

    // Wire 14 — INDEX_COVERAGE_LOW triggers dynamic indexing sweep (min < 70%)
    nexusBus.on('INDEX_COVERAGE_LOW', async (event: { table: string; coveragePct: number }) => {
      console.log(`[SpineWiring] [SYNAPSE 14] INDEX_COVERAGE_LOW observed on table '${event.table}' (${event.coveragePct.toFixed(1)}%). Launching automatic full sweep...`);
      try {
        const { SemanticSearch } = require('./semanticSearch');
        const report = await SemanticSearch.indexAll();
        console.log(`[SpineWiring] Automated sweep complete: indexing dur=${report.durationMs}ms, added=${report.rowsAdded}, engine=${report.engine}`);
      } catch (e: any) {
        console.error('[SpineWiring] Automatic sweep following index coverage warning failed:', e.message);
      }
    });

    // Wire 15 — SEARCH_ZERO_RESULTS monitors queries with zero semantic density
    nexusBus.on('SEARCH_ZERO_RESULTS', async (event: { query: string }) => {
      console.log(`[SpineWiring] [SYNAPSE 15] SEARCH_ZERO_RESULTS alert for intent: "${event.query}". Fallback keyword metrics triggered.`);
    });
  }
}

import crypto from 'crypto';

// Auto init
SpineWiring.init();
