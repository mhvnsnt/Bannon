import { memoryVault } from './db';
import { nexusBus } from './modelRouter';
import crypto from 'crypto';

export interface Pattern {
  id: string;
  pattern_type: string;
  description: string;
  confidence_score: number;
  evidence_count: number;
  first_seen: string;
  last_seen: string;
  actionable_recommendation: string;
}

export interface PatternSummary {
  type: string;
  description: string;
  frequency: number;
  lastSeen: string;
  affectedFiles: string[];
  recommendedAction: string;
  confidence: number;
}

export interface PatternReport {
  timestamp: string;
  patternsDiscovered: number;
  unresolvedBlockages: number;
  successVelocity: number;
}

export class PatternRecognizer {
  private static isRunning = false;

  static init() {
    this.scheduleAnalysis();
    // Run an initial analysis 10 seconds after boot
    setTimeout(() => {
      this.analyze().catch(err => console.error('[PatternRecognizer] Initial scan exception:', err));
    }, 10000);
  }

  // Orchestrator method to scan the codebase and cognitive streams for patterns
  static async analyze(): Promise<PatternReport> {
    if (this.isRunning) {
      return {
        timestamp: new Date().toISOString(),
        patternsDiscovered: 0,
        unresolvedBlockages: 0,
        successVelocity: 0
      };
    }
    this.isRunning = true;
    console.log('[PatternRecognizer] Starting deep autonomous pattern diagnostics...');

    const nowStr = new Date().toISOString();
    const discoveredPatterns: Omit<Pattern, 'id'>[] = [];

    // Analyze kinetic logs (last 500 entries)
    let kineticEntries: any[] = [];
    try {
      kineticEntries = memoryVault.prepare(`
        SELECT stage_transition, turbulence, timestamp FROM kinetic_logs 
        ORDER BY timestamp DESC LIMIT 500
      `).all() as any[];
    } catch {}

    // Analyze swarm results for blockages / friction
    let swarmJobs: any[] = [];
    try {
      swarmJobs = memoryVault.prepare(`
        SELECT * FROM swarm_jobs WHERE status IN ('FAILED', 'WARNING', 'BLOCKED')
      `).all() as any[];
    } catch {
      try {
        swarmJobs = memoryVault.prepare(`
          SELECT * FROM swarm_results WHERE status IN ('FAILED', 'WARNING', 'BLOCKED')
        `).all() as any[];
      } catch {}
    }

    // Analyze overnight logs
    let overnightLogs: any[] = [];
    try {
      overnightLogs = memoryVault.prepare(`
        SELECT * FROM overnight_log WHERE pending_review = 1
      `).all() as any[];
    } catch {}

    // Analyze mind logs
    let mindLogs: any[] = [];
    try {
      mindLogs = memoryVault.prepare(`
        SELECT directive_intent, status, timestamp FROM mind_log 
        ORDER BY timestamp DESC LIMIT 100
      `).all() as any[];
    } catch {}

    // 1. RECURRING_BLOCKAGE Detection
    const fileModificationCounts: Record<string, number> = {};
    const errorStringCounts: Record<string, number> = {};

    for (const ent of kineticEntries) {
      const stageTransition = ent.stage_transition || '';
      const fileMatch = stageTransition.match(/on\s+([a-zA-Z0-9_\-\.]+)/i);
      if (fileMatch) {
        const file = fileMatch[1];
        fileModificationCounts[file] = (fileModificationCounts[file] || 0) + 1;
      }
    }

    for (const job of swarmJobs) {
      const errorText = job.result || job.block_reason || job.destroyer_critique || '';
      if (errorText) {
        const firstLine = errorText.split('\n')[0].slice(0, 80);
        errorStringCounts[firstLine] = (errorStringCounts[firstLine] || 0) + 1;
      }
    }

    // Flag recurring file alterations
    for (const [file, count] of Object.entries(fileModificationCounts)) {
      if (count > 5) {
        discoveredPatterns.push({
          pattern_type: 'RECURRING_BLOCKAGE',
          description: `Code instability loop detected in '${file}'. High perturbation counts exceed 5 edits in local cycle.`,
          confidence_score: Math.min(0.7 + (count * 0.05), 0.99),
          evidence_count: count,
          first_seen: nowStr,
          last_seen: nowStr,
          actionable_recommendation: `Insulate modifications to '${file}' behind the Razor engine. Enforce strict pre-compile dry runs before saving subsequent increments.`
        });
      }
    }

    for (const [errText, count] of Object.entries(errorStringCounts)) {
      if (count > 3) {
        discoveredPatterns.push({
          pattern_type: 'RECURRING_BLOCKAGE',
          description: `Frequent swarm compiler error: "${errText}" surfaced ${count} times.`,
          confidence_score: Math.min(0.8 + (count * 0.03), 0.99),
          evidence_count: count,
          first_seen: nowStr,
          last_seen: nowStr,
          actionable_recommendation: `Refactor active prompt guidelines to guard against this error. Implement strict compiler guards on target templates.`
        });
      }
    }

    // 2. SUCCESS_PATTERN Detection
    if (mindLogs.length > 0) {
      const successCount = mindLogs.filter(m => m.status === 'SUCCESS' || m.status === 'DEPLOYED').length;
      const successPct = successCount / mindLogs.length;
      if (successPct > 0.85 && mindLogs.length >= 3) {
        discoveredPatterns.push({
          pattern_type: 'SUCCESS_PATTERN',
          description: `Premium cognitive success velocity achieved: ${(successPct*100).toFixed(1)}% across mind directives.`,
          confidence_score: successPct,
          evidence_count: mindLogs.length,
          first_seen: nowStr,
          last_seen: nowStr,
          actionable_recommendation: `Persist current context serialization headers. The current prompts provide strong grounding.`
        });
      }
    }

    // 3. CO_MUTATION_EVENT (Temporal coupling of file alterations)
    const fileCoChanges: Record<string, number> = {};
    let lastFile = '';
    let lastTime = 0;

    for (const log of kineticEntries) {
      const trans = log.stage_transition || '';
      const fileMatch = trans.match(/on\s+([a-zA-Z0-9_\-\.]+)/i);
      if (fileMatch) {
        const file = fileMatch[1];
        const time = new Date(log.timestamp).getTime();
        if (lastFile && lastFile !== file && Math.abs(time - lastTime) < 60000) {
          const pair = [lastFile, file].sort().join(' + ');
          fileCoChanges[pair] = (fileCoChanges[pair] || 0) + 1;
        }
        lastFile = file;
        lastTime = time;
      }
    }

    for (const [pair, count] of Object.entries(fileCoChanges)) {
      if (count >= 2) {
        discoveredPatterns.push({
          pattern_type: 'CO_MUTATION_EVENT',
          description: `Architectural coupling detected between ${pair} (${count} sequential mutations).`,
          confidence_score: 0.82,
          evidence_count: count,
          first_seen: nowStr,
          last_seen: nowStr,
          actionable_recommendation: `Verify structural interface definitions between these files. Modularize joint dependencies into a central type registry.`
        });
      }
    }

    // 4. FRICTION_POINT Detection
    const highTurbulenceFiles = kineticEntries.filter(k => k.turbulence > 1.5).length;
    if (highTurbulenceFiles > 3) {
      discoveredPatterns.push({
        pattern_type: 'FRICTION_POINT',
        description: `High developmental kinetic friction recorded across multiple workspace directories.`,
        confidence_score: 0.85,
        evidence_count: highTurbulenceFiles,
        first_seen: nowStr,
        last_seen: nowStr,
        actionable_recommendation: `Increase local cache ratios. Prevent rapid file write fluctuations by stacking queue prompts.`
      });
    }

    // 5. METAPHYSICAL_CONSTANTS (Nine Protocol) - ALWAYS PRESENCE, IMMUTABLE
    discoveredPatterns.push({
      pattern_type: 'METAPHYSICAL_CONSTANTS',
      description: 'Nine Protocol operates as an active reality compiler constant, skipping position nine in sequential counters.',
      confidence_score: 1.0,
      evidence_count: 9,
      first_seen: nowStr,
      last_seen: nowStr,
      actionable_recommendation: 'Immutable rule engaged. Skip index position nine in all sequential state machines and counters. Treated as an active architectural constant, never optimizer friction.'
    });

    // Write all discovered patterns to SQLite tables
    let activeUnresolvedBlockages = 0;
    for (const p of discoveredPatterns) {
      const id = crypto.createHash('md5').update(p.pattern_type + '_' + p.description).digest('hex');
      try {
        memoryVault.prepare(`
          INSERT INTO patterns (id, pattern_type, description, confidence_score, evidence_count, first_seen, last_seen, actionable_recommendation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            confidence_score = excluded.confidence_score,
            evidence_count = excluded.evidence_count,
            last_seen = excluded.last_seen,
            actionable_recommendation = excluded.actionable_recommendation
        `).run(id, p.pattern_type, p.description, p.confidence_score, p.evidence_count, p.first_seen, p.last_seen, p.actionable_recommendation);
        
        if (p.pattern_type === 'RECURRING_BLOCKAGE') {
          activeUnresolvedBlockages++;
        }
      } catch (err) {
        console.error('[PatternRecognizer] Fail writing pattern item to DB:', err);
      }
    }

    // Store log to pattern_log table
    try {
      const logHash = crypto.createHash('md5').update(JSON.stringify(discoveredPatterns)).digest('hex');
      memoryVault.prepare(`
        INSERT INTO pattern_log (id, timestamp, patterns_json)
        VALUES (?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(id) DO UPDATE SET
          patterns_json = excluded.patterns_json,
          timestamp = CURRENT_TIMESTAMP
      `).run(logHash, JSON.stringify(discoveredPatterns));
    } catch (err) {
      console.error('[PatternRecognizer] Fail storing pattern batch log:', err);
    }

    this.isRunning = false;

    // Emit event on communications spine
    nexusBus.emit('PATTERN_UPDATE', {
      discoveredCount: discoveredPatterns.length,
      timestamp: nowStr,
      trends: discoveredPatterns.map(d => ({ type: d.pattern_type, score: d.confidence_score }))
    });

    return {
      timestamp: nowStr,
      patternsDiscovered: discoveredPatterns.length,
      unresolvedBlockages: activeUnresolvedBlockages,
      successVelocity: mindLogs.length > 0 ? mindLogs.filter(m => m.status === 'SUCCESS').length / mindLogs.length : 1.0
    };
  }

  // Retrieve top actionable patterns semantically filtered (or general)
  static async getSummary(taskIntent?: string): Promise<PatternSummary[]> {
    const rawPatterns = this.getHighConfidencePatterns(0.1);
    
    const mapped = rawPatterns.map(p => {
      // Find affected files inside description if mentioned
      const fileMatch = p.description.match(/'([^']+)'/g);
      const affectedFiles = fileMatch ? fileMatch.map(m => m.replace(/'/g, '')) : [];
      return {
        type: p.pattern_type,
        description: p.description,
        frequency: p.evidence_count,
        lastSeen: p.last_seen,
        affectedFiles,
        recommendedAction: p.actionable_recommendation,
        confidence: p.confidence_score
      };
    });

    if (!taskIntent) {
      return mapped.slice(0, 5);
    }

    // Filter based on query word relevance
    const words = taskIntent.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = mapped.map(p => {
      let score = 0;
      const text = (p.description + ' ' + p.type + ' ' + p.recommendedAction).toLowerCase();
      
      // Nine Protocol always matches metaphysical intent or nine protocol query
      if (p.type === 'METAPHYSICAL_CONSTANTS' && (taskIntent.toLowerCase().includes('nine') || taskIntent.toLowerCase().includes('protocol') || taskIntent.toLowerCase().includes('meta'))) {
         score += 10.0;
      }

      for (const w of words) {
        if (text.includes(w)) score += 1.0;
      }
      return { p, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.p)
      .slice(0, 5);
  }

  // Get high confidence rows directly from SQLite
  static getHighConfidencePatterns(minConfidence = 0.70): Pattern[] {
    try {
      return memoryVault.prepare(`
        SELECT * FROM patterns WHERE confidence_score >= ? ORDER BY confidence_score DESC
      `).all(minConfidence) as Pattern[];
    } catch {
      return [];
    }
  }

  // Manually log a novel success pattern or friction point
  static logPattern(patternType: string, description: string, confidence: number, actionableRec: string): void {
    const id = crypto.createHash('md5').update(patternType + '_' + description).digest('hex');
    const nowStr = new Date().toISOString();
    try {
      memoryVault.prepare(`
        INSERT INTO patterns (id, pattern_type, description, confidence_score, evidence_count, first_seen, last_seen, actionable_recommendation)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          confidence_score = (confidence_score + excluded.confidence_score) / 2.0,
          evidence_count = evidence_count + 1,
          last_seen = excluded.last_seen,
          actionable_recommendation = excluded.actionable_recommendation
      `).run(id, patternType, description, confidence, nowStr, nowStr, actionableRec);
      
      console.log(`[PatternRecognizer] Logged dynamic pattern: ${patternType} - ${description}`);
    } catch (err) {
      console.error('[PatternRecognizer] Error logging manual pattern:', err);
    }
  }

  // Inject active patterns as system intelligence block
  static injectIntoMindCycle(thinkContext: any): any {
    if (!thinkContext) thinkContext = {};
    
    try {
      const topPatterns = this.getHighConfidencePatterns(0.70).slice(0, 3);
      if (topPatterns.length > 0) {
        thinkContext.SYSTEM_INTELLIGENCE = {
          activePatterns: topPatterns.map(p => ({
            type: p.pattern_type,
            finding: p.description,
            mitigationDirective: p.actionable_recommendation
          }))
        };
      }
    } catch (err) {
      console.error('[PatternRecognizer] Context injection error ignored:', err);
    }

    return thinkContext;
  }

  // Schedules regular recurring analysis
  static scheduleAnalysis(): void {
    console.log('[PatternRecognizer] Arming cognitive analysis scheduler (6 hour recurrence loop)...');
    setInterval(() => {
      this.analyze().catch(err => console.error('[PatternRecognizer] Task loop exception:', err));
    }, 6 * 60 * 60 * 1000); 
  }
}

// Spark up capabilities
PatternRecognizer.init();
