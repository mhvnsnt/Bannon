import { memoryVault } from './db';
import { SemanticSearch, SemanticResult, ContextPackage } from './semanticSearch';
import { PatternRecognizer, PatternSummary } from './patternRecognizer';

export interface DecisionEntry {
  id: string;
  decision: string;
  context: string;
  outcome: string;
  timestamp: string;
}

export interface WorldStateEntry {
  key: string;
  value: string;
  category: string;
  confidence: number;
}

export interface CuratedContext {
  identity: {
    systemName: string;
    currentPhase: string;
    dnaRank: string;
    activeProtocols: string[];
    builderPersonality: string;
  };
  relevantDecisions: DecisionEntry[];
  semanticMatches: SemanticResult[];
  activePatterns: PatternSummary[];
  worldStateSlice: WorldStateEntry[];
  tokenUsage: {
    identity: number;
    decisions: number;
    semantic: number;
    patterns: number;
    worldState: number;
    total: number;
    budget: number;
    utilization: number;
  };
  assembled_prompt_section?: string;
}

const estimateTokens = (obj: any): number => {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return Math.ceil(str.length / 4);
};

export const ContextBuilder = {
  async buildContext(
    taskIntent = 'general code optimization',
    options: {
      tokenBudget?: number;
      taskType?: string;
      includeIdentity?: boolean;
      includeDecisions?: boolean;
      includePatterns?: boolean;
    } = {}
  ): Promise<CuratedContext> {
    const budget = options.tokenBudget ?? 8000;
    const words = taskIntent.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // 1. Identity block setup (max 200 tokens)
    const identity = {
      systemName: 'Nexus God Mode OS',
      currentPhase: 'Phase 1: Localized Vector Grid Generation (Layer 8 - Semantic Memory)',
      dnaRank: 'MASTER',
      activeProtocols: ['Absolute Autonomy', 'Nine Protocol', 'Antigravity Resonance'],
      builderPersonality: 'Reality Compiler'
    };
    const identityTokens = estimateTokens(identity);

    // 2. Decisions setup (max 300 tokens)
    let relevantDecisions: DecisionEntry[] = [];
    let decisionsTokens = 0;
    if (options.includeDecisions !== false) {
      try {
        const rawDecisions = memoryVault.prepare(`
          SELECT * FROM world_state 
          WHERE category = 'DECISION_LOG' 
          ORDER BY last_verified DESC LIMIT 10
        `).all() as any[];

        const rated = rawDecisions.map(d => {
          let score = 0;
          const text = (d.key + ' ' + d.value + ' ' + (d.source || '')).toLowerCase();
          for (const w of words) {
            if (text.includes(w)) score += 1.0;
          }
          return { d, score };
        }).sort((a, b) => b.score - a.score);

        for (const item of rated) {
          const formatted: DecisionEntry = {
            id: item.d.id,
            decision: item.d.key,
            context: item.d.source || 'Historical System Log',
            outcome: item.d.value,
            timestamp: item.d.last_verified
          };
          const tokens = estimateTokens(formatted);
          if (decisionsTokens + tokens <= 300) {
            relevantDecisions.push(formatted);
            decisionsTokens += tokens;
          } else {
            break;
          }
        }
      } catch (err) {
        console.warn('[ContextBuilder] No decisions found or world_state table offline:', err);
      }
    }

    // 3. Patterns setup (max 150 tokens)
    let activePatterns: PatternSummary[] = [];
    let patternsTokens = 0;
    if (options.includePatterns !== false) {
      try {
        const summaries = await PatternRecognizer.getSummary(taskIntent);
        for (const p of summaries) {
          const tokens = estimateTokens(p);
          if (patternsTokens + tokens <= 150) {
            activePatterns.push(p);
            patternsTokens += tokens;
          } else {
            break;
          }
        }
      } catch (err) {
        console.warn('[ContextBuilder] Pattern analysis failed:', err);
      }
    }

    // 4. World State slice setup (max 150 tokens)
    let worldStateSlice: WorldStateEntry[] = [];
    let worldStateTokens = 0;
    try {
      const stateRows = memoryVault.prepare(`
        SELECT * FROM world_state 
        WHERE category != 'DECISION_LOG' 
        LIMIT 10
      `).all() as any[];

      const rated = stateRows.map(s => {
        let score = 0;
        const text = (s.key + ' ' + s.value).toLowerCase();
        for (const w of words) {
          if (text.includes(w)) score += 1.0;
        }
        return { s, score };
      }).sort((a, b) => b.score - a.score);

      for (const item of rated) {
        const formatted: WorldStateEntry = {
          key: item.s.key,
          value: item.s.value,
          category: item.s.category,
          confidence: item.s.confidence || 1.0
        };
        const tokens = estimateTokens(formatted);
        if (worldStateTokens + tokens <= 150) {
          worldStateSlice.push(formatted);
          worldStateTokens += tokens;
        } else {
          break;
        }
      }
    } catch (err) {
      console.warn('[ContextBuilder] No world state slice found:', err);
    }

    // 5. Semantic matches (fills remaining budget)
    const usedSoFar = identityTokens + decisionsTokens + patternsTokens + worldStateTokens;
    const remainingBudget = Math.max(budget - usedSoFar, 500);

    let semanticMatches: SemanticResult[] = [];
    let semanticTokens = 0;
    try {
      const packageRes = await SemanticSearch.searchForContext(taskIntent, remainingBudget);
      semanticMatches = packageRes.results;
      semanticTokens = packageRes.tokenEstimate;
    } catch (err) {
      console.error('[ContextBuilder] Semantic matches lookup failure:', err);
    }

    const totalUsage = identityTokens + decisionsTokens + patternsTokens + worldStateTokens + semanticTokens;

    const context: CuratedContext = {
      identity,
      relevantDecisions,
      semanticMatches,
      activePatterns,
      worldStateSlice,
      tokenUsage: {
        identity: identityTokens,
        decisions: decisionsTokens,
        semantic: semanticTokens,
        patterns: patternsTokens,
        worldState: worldStateTokens,
        total: totalUsage,
        budget,
        utilization: totalUsage / budget
      }
    };

    const assembled_prompt_section = ContextBuilder.serializeForPrompt(context);

    return {
      ...context,
      assembled_prompt_section
    };
  },

  serializeForPrompt(context: CuratedContext): string {
    const blocks: string[] = [];

    // Identity block (labelled with metadata headers)
    blocks.push(`=== CORE ARCHITECTURAL IDENTITY (Phase 1) ===
System ID: ${context.identity.systemName}
Active Phase: ${context.identity.currentPhase}
Master Rank: ${context.identity.dnaRank}
Active Directives: ${context.identity.activeProtocols.join(', ')}
Execution Personality: ${context.identity.builderPersonality}`);

    // Decisions block (labeled sections)
    if (context.relevantDecisions.length > 0) {
      const body = context.relevantDecisions.map(d => `[Decision: ${d.decision} (Outcome: ${d.outcome})]
Context: ${d.context}
Logged At: ${d.timestamp}`).join('\n---\n');
      blocks.push(`=== RELEVANT ARCHITECTURAL DECISIONS (Last 5) ===\n${body}`);
    }

    // Semantic Matches block (labeled sections)
    if (context.semanticMatches.length > 0) {
      const body = context.semanticMatches.map(m => `[RELEVANCE: ${Math.round(m.score * 100)}% | Table: ${m.sourceTable} | Row: ${m.sourceId}]
${m.content}`).join('\n---\n');
      blocks.push(`=== SEMANTICALLY MATCHED DECISIONS & OUTCOMES ===\n${body}`);
    }

    // Active Patterns block (labeled sections)
    if (context.activePatterns.length > 0) {
      const body = context.activePatterns.map(p => `[Confidence: ${Math.round(p.confidence * 100)}% | Type: ${p.type}]
Finding: ${p.description}
Actionable Recommendation: ${p.recommendedAction}`).join('\n---\n');
      blocks.push(`=== ACTIONABLE SYSTEM PATTERNS ===\n${body}`);
    }

    // World State block (labeled sections)
    if (context.worldStateSlice.length > 0) {
      const body = context.worldStateSlice.map(w => `[${w.category}] ${w.key} = ${w.value} (Confidence: ${w.confidence})`).join('\n');
      blocks.push(`=== CURRENT PHASE WORLD STATE SLICE ===\n${body}`);
    }

    // Budget metadata
    blocks.push(`=== METADATA & TELEMETRY BUDGET ===
Total token budget: ${context.tokenUsage.budget}
Calculated usage: ${context.tokenUsage.total} tokens
Capacity utilization: ${(context.tokenUsage.utilization * 100).toFixed(1)}%`);

    return blocks.join('\n\n=========================================\n\n');
  }
};
