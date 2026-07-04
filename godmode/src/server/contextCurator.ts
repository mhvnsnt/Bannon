import { memoryVault } from './db';
import { SemanticSearch } from './semanticSearch';
import crypto from 'crypto';

export interface WorldStateEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
  last_verified: string;
  source: string;
  expires_at?: string;
  stale: number;
  entity?: string;     // Backward compatibility
  parameter?: string;  // Backward compatibility
  last_updated?: string; // Backward compatibility
}

export class ContextCurator {
  static init() {
    // Schema creation
    try {
      memoryVault.exec(`
        CREATE TABLE IF NOT EXISTS world_state (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          confidence REAL DEFAULT 1.0,
          last_verified DATETIME DEFAULT CURRENT_TIMESTAMP,
          source TEXT,
          expires_at DATETIME,
          stale INTEGER DEFAULT 0
        );
      `);
      console.log("[ContextCurator] Database tables registered and active with back-compat schemas.");
    } catch (e: any) {
      console.error("[ContextCurator] DB init failed safely:", e.message);
    }

    // Interval to mark unverified data as stale every 30 minutes
    setInterval(() => {
      this.markStale();
    }, 30 * 60 * 1000);

    // Initial seeding if empty
    try {
      const countCheck = memoryVault.prepare("SELECT COUNT(*) as count FROM world_state").get() as { count: number };
      if (countCheck.count === 0) {
        this.seedWorldState();
      }
    } catch {}
  }

  private static seedWorldState() {
    console.log("[ContextCurator] Seeding ultimate world state structures...");
    const states = [
      { id: 'ws_cur_1', category: 'PROJECT_TRUTH', key: 'Core Architecture Base', value: 'Express Fullstack + Better-SQLite3 RAG Vault', confidence: 0.99, source: 'System Manifest' },
      { id: 'ws_cur_2', category: 'CURRENT_PHASE', key: 'Active Implementation', value: 'Convergence Phase (Layers 11, 12, 13 & Unified Interface)', confidence: 0.95, source: 'Adjudicator Spine' },
      { id: 'ws_cur_3', category: 'AGENT_MEMORY', key: 'Worker Capabilities Matrix', value: 'Structural Architect, Generative Force, Adversarial Destroyer, Synthesis Optimizer', confidence: 0.98, source: 'Swarm Orchestrator' },
      { id: 'ws_cur_4', category: 'OPEN_PROBLEMS', key: 'Joint Coupling Stabilizer', value: 'RAGDOLL_PULL threshold above 0.14 requires active dampers', confidence: 0.85, source: 'Telemetry Grid' },
      { id: 'ws_cur_5', category: 'DECISION_LOG', key: 'Local Model Strategy', value: 'Use Qwen-2.5-Coder for swift layout work, Llama-3.1-70B for deep reasoning sessions', confidence: 0.94, source: 'Model Router Config' },
      { id: 'ws_cur_6', category: 'PATTERN_LIBRARY', key: 'Resilience Circuit-Breaker', value: 'Automatic trigger of Resurrection Monitor on any express endpoint timeout', confidence: 0.92, source: 'Pattern Recognizer' }
    ];

    const stmt = memoryVault.prepare(`
       INSERT INTO world_state (id, category, key, value, confidence, last_verified, source, stale)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 0)
    `);
    for (const s of states) {
      try {
        stmt.run(s.id, s.category, s.key, s.value, s.confidence, s.source);
      } catch {}
    }
  }

  // Returns all world state rows mapped to old + new formats
  static getFullState(): WorldStateEntry[] {
    try {
      const rows = memoryVault.prepare("SELECT * FROM world_state ORDER BY category ASC, confidence DESC").all() as any[];
      return rows.map(r => ({
        ...r,
        entity: r.category,
        parameter: r.key,
        last_updated: r.last_verified
      }));
    } catch {
      return [];
    }
  }

  static deleteState(id: string): boolean {
    try {
      const info = memoryVault.prepare("DELETE FROM world_state WHERE id = ?").run(id);
      return info.changes > 0;
    } catch {
      return false;
    }
  }

  // Returns the optimal high-confidence world state context slice for a given token budget
  static getContextBundle(queryOrBudget: string | number = 6000): any {
    let tokenBudget = 6000;
    let queryFilter = "";

    if (typeof queryOrBudget === 'number') {
      tokenBudget = queryOrBudget;
    } else if (typeof queryOrBudget === 'string') {
      queryFilter = queryOrBudget;
    }

    let stateList: WorldStateEntry[] = [];
    try {
      if (queryFilter.trim()) {
        // Simple search filter
        const list = memoryVault.prepare(`
          SELECT * FROM world_state 
          WHERE stale = 0 AND (category LIKE ? OR key LIKE ? OR value LIKE ?)
          ORDER BY confidence DESC
        `).all(`%${queryFilter}%`, `%${queryFilter}%`, `%${queryFilter}%`) as WorldStateEntry[];
        stateList = list.map(r => ({ ...r, entity: r.category, parameter: r.key, last_updated: r.last_verified }));
      } else {
        const list = memoryVault.prepare(`
          SELECT * FROM world_state 
          WHERE stale = 0 
          ORDER BY confidence DESC
        `).all() as WorldStateEntry[];
        stateList = list.map(r => ({ ...r, entity: r.category, parameter: r.key, last_updated: r.last_verified }));
      }
    } catch (e: any) {
      console.error("[ContextCurator] Query error on world_state:", e.message);
    }

    let assembled = "=== QUANTUM NESTED WORLD STATE (ACTIVE PROJECT KNOWLEDGE) ===\n";
    let tokenCount = assembled.length / 4;

    for (const entry of stateList) {
      const line = `* [${entry.category}] Key: "${entry.key}" -> Value: "${entry.value}" (Confidence: ${(entry.confidence * 100).toFixed(0)}%, Source: ${entry.source})\n`;
      const lineTokens = Math.ceil(line.length / 4);

      if (tokenCount + lineTokens <= tokenBudget) {
        assembled += line;
        tokenCount += lineTokens;
      } else {
        break; 
      }
    }

    return {
      assembledSection: assembled,
      tokenUsage: Math.ceil(assembled.length / 4),
      rawStates: stateList
    };
  }

  // Update or insert a world state metric with signature overloading support
  static updateWorldState(
    category: string,
    key: string,
    value: string,
    confidenceOrSource: number | string = 0.95,
    maybeSource = 'Manual Context Entry'
  ): any {
    const safeCategory = category.trim();
    const safeKey = key.trim();
    
    let conf = 0.95;
    let src = 'Manual Context Entry';

    if (typeof confidenceOrSource === 'number') {
      conf = confidenceOrSource;
      src = maybeSource;
    } else if (typeof confidenceOrSource === 'string') {
      src = confidenceOrSource;
      if (typeof maybeSource === 'number') {
        conf = maybeSource;
      }
    }

    try {
      const existing = memoryVault.prepare("SELECT id FROM world_state WHERE category = ? AND key = ?").get(safeCategory, safeKey) as { id: string } | undefined;
      
      if (existing) {
        memoryVault.prepare(`
          UPDATE world_state 
          SET value = ?, confidence = ?, last_verified = CURRENT_TIMESTAMP, source = ?, stale = 0
          WHERE id = ?
        `).run(value, conf, src, existing.id);
      } else {
        const id = 'ws_dyn_' + crypto.randomBytes(4).toString('hex');
        memoryVault.prepare(`
          INSERT INTO world_state (id, category, key, value, confidence, last_verified, source, stale)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 0)
        `).run(id, safeCategory, safeKey, value, conf, src);
      }
      
      console.log(`[ContextCurator] Updated state category: [${safeCategory}] ${safeKey} (Cof: ${conf})`);
    } catch (err: any) {
      console.error("[ContextCurator] Failed world state database insert:", err.message);
    }
  }

  // Marks any unverified active knowledge older than 4 hours as stale
  static markStale(): void {
    try {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const info = memoryVault.prepare(`
        UPDATE world_state 
        SET stale = 1 
        WHERE last_verified < ? AND category != 'PROJECT_TRUTH'
      `).run(fourHoursAgo);
      
      if (info.changes > 0) {
        console.log(`[ContextCurator] Flagged ${info.changes} unverified context variables as stale.`);
      }
    } catch (e: any) {
      console.error("[ContextCurator] Failed markStale execution safely:", e.message);
    }
  }

  // Verifies and refreshes stale variables dynamically against indexes
  static async verifyAndRefresh(): Promise<void> {
    console.log("[ContextCurator] Syncing stale variables against memory archives...");
    try {
      const staleEntries = memoryVault.prepare("SELECT * FROM world_state WHERE stale = 1").all() as WorldStateEntry[];
      
      for (const entry of staleEntries) {
        const searchMatches = await SemanticSearch.search(entry.key, { limit: 1 });
        if (searchMatches && searchMatches.length > 0 && searchMatches[0].score >= 0.85) {
          memoryVault.prepare(`
            UPDATE world_state 
            SET stale = 0, confidence = ?, last_verified = CURRENT_TIMESTAMP, source = ?
            WHERE id = ?
          `).run(0.90, `Automated Semantic Alignment Sweep`, entry.id);
          console.log(`[ContextCurator] Successfully refreshed stale context value for '${entry.key}' via RAG.`);
        } else {
          // Clean up old stagnant variables
          if (entry.confidence < 0.60) {
            memoryVault.prepare("DELETE FROM world_state WHERE id = ?").run(entry.id);
            console.log(`[ContextCurator] Cleaned old, low-confidence stagnant state key: '${entry.key}'.`);
          }
        }
      }
    } catch (err: any) {
      console.warn("[ContextCurator] Verification sweep alignment skipped:", err.message);
    }
  }
}

// Spark up
ContextCurator.init();
