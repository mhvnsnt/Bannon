import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mirrorToCloud } from './CloudPersistence.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FITNESS_FILE = path.join(__dirname, 'move_fitness.json');
const LEARNED_FILE = path.join(__dirname, 'learned_content.json');

// ---- Move primitive seed table -----------------------------------------
// This is the only hand-authored content the system ever needs. Everything
// downstream (new combos, new finishers, new fighter archetypes) is
// synthesized from these primitives by the bandit + genetic layers below,
// so the roster grows without anyone hand-writing new moves one at a time.
export interface MovePrimitive {
  id: string;
  category: 'strike' | 'grapple' | 'slam' | 'aerial' | 'submission';
  riskiness: number;   // 0..1, chance of being countered if attempted
  damage: [number, number]; // [min, max]
  staminaCost: number;
}

export const MOVE_PRIMITIVES: MovePrimitive[] = [
  { id: 'jab', category: 'strike', riskiness: 0.10, damage: [2, 5], staminaCost: 3 },
  { id: 'haymaker', category: 'strike', riskiness: 0.35, damage: [8, 14], staminaCost: 9 },
  { id: 'lowKick', category: 'strike', riskiness: 0.15, damage: [4, 8], staminaCost: 5 },
  { id: 'spinningElbow', category: 'strike', riskiness: 0.30, damage: [9, 15], staminaCost: 8 },
  { id: 'clinch', category: 'grapple', riskiness: 0.20, damage: [0, 2], staminaCost: 4 },
  { id: 'suplex', category: 'slam', riskiness: 0.30, damage: [10, 18], staminaCost: 12 },
  { id: 'powerbomb', category: 'slam', riskiness: 0.45, damage: [16, 26], staminaCost: 18 },
  { id: 'backSuplex', category: 'slam', riskiness: 0.35, damage: [12, 20], staminaCost: 14 },
  { id: 'submissionHold', category: 'submission', riskiness: 0.25, damage: [3, 6], staminaCost: 10 },
  { id: 'aerialDive', category: 'aerial', riskiness: 0.55, damage: [14, 24], staminaCost: 16 },
  { id: 'forkliftCarry', category: 'grapple', riskiness: 0.25, damage: [0, 3], staminaCost: 10 },
  { id: 'craneSlam', category: 'slam', riskiness: 0.40, damage: [15, 25], staminaCost: 17 },
];

interface FitnessRecord {
  uses: number;
  wins: number;
  totalDamage: number;
  lastUsed: string;
}

interface SynthesizedCombo {
  id: string;
  name: string;
  sequence: string[];
  category: string;
  generation: number;
  discoveredAt: string;
  fitness: number;
}

interface SynthesizedStyle {
  id: string;
  name: string;
  categoryWeights: Record<string, number>;
  generation: number;
  discoveredAt: string;
}

interface LearnedContent {
  combos: SynthesizedCombo[];
  styles: SynthesizedStyle[];
  generation: number;
}

function loadJSON<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (_) { /* fall through to fallback */ }
  return fallback;
}

function saveJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * CombatAI — the "BANNON learns" engine.
 *
 * Instead of hand-authoring every move/combo/character, this tracks how
 * each move primitive actually performs across real fights (a multi-armed
 * bandit over MOVE_PRIMITIVES) and periodically breeds the best-performing
 * sequences and style distributions into brand-new named combos and fighter
 * archetypes (a small genetic/evolutionary layer). Both layers persist to
 * disk so the roster keeps growing across server restarts.
 */
export class CombatAI {
  private fitness: Record<string, FitnessRecord>;
  private transitions: Record<string, Record<string, number>>; // moveA -> moveB -> co-occurrence count in WINNING sequences
  private learned: LearnedContent;

  constructor() {
    console.log("[Node 7] Combat AI Initialized — bandit + genetic move-learning online");
    this.fitness = loadJSON(FITNESS_FILE, {} as Record<string, FitnessRecord>);
    this.transitions = loadJSON(FITNESS_FILE + '.transitions', {} as Record<string, Record<string, number>>);
    this.learned = loadJSON(LEARNED_FILE, { combos: [], styles: [], generation: 0 });
    for (const m of MOVE_PRIMITIVES) {
      if (!this.fitness[m.id]) {
        this.fitness[m.id] = { uses: 0, wins: 0, totalDamage: 0, lastUsed: '' };
      }
    }
  }

  private persistFitness() {
    saveJSON(FITNESS_FILE, this.fitness);
    void mirrorToCloud('bannon_daemon', 'move_fitness', this.fitness);
  }

  private persistLearned() {
    saveJSON(LEARNED_FILE, this.learned);
    void mirrorToCloud('bannon_daemon', 'learned_content', this.learned);
  }

  /** Call once per executed move during/after a fight. */
  public recordMoveOutcome(moveId: string, opts: { hit: boolean; damageDealt: number; won: boolean }) {
    if (!this.fitness[moveId]) this.fitness[moveId] = { uses: 0, wins: 0, totalDamage: 0, lastUsed: '' };
    const rec = this.fitness[moveId];
    rec.uses += 1;
    if (opts.hit) rec.totalDamage += Math.max(0, opts.damageDealt);
    if (opts.won) rec.wins += 1;
    rec.lastUsed = new Date().toISOString();
    this.persistFitness();
  }

  /** Call once per fight with the ordered list of move ids that fighter used, and whether they won. */
  public recordSequence(moveSequence: string[], won: boolean) {
    if (!won || moveSequence.length < 2) return;
    for (let i = 0; i < moveSequence.length - 1; i++) {
      const a = moveSequence[i], b = moveSequence[i + 1];
      this.transitions[a] = this.transitions[a] || {};
      this.transitions[a][b] = (this.transitions[a][b] || 0) + 1;
    }
    saveJSON(FITNESS_FILE + '.transitions', this.transitions);
  }

  /** UCB1-flavored bandit score: exploit known winners, but keep exploring under-tried moves. */
  private ucbScore(moveId: string, totalPulls: number): number {
    const rec = this.fitness[moveId] || { uses: 0, wins: 0, totalDamage: 0, lastUsed: '' };
    if (rec.uses === 0) return Infinity; // always try untested moves first
    const meanWinRate = rec.wins / rec.uses;
    const meanDamage = rec.totalDamage / rec.uses;
    const exploitScore = meanWinRate * 10 + meanDamage * 0.3;
    const explorationBonus = Math.sqrt((2 * Math.log(totalPulls + 1)) / rec.uses);
    return exploitScore + explorationBonus;
  }

  /** Pick the next move id BANNON's AI should attempt, given a candidate pool and the last move used. */
  public suggestNextMove(availableMoveIds: string[], lastMoveId?: string): string {
    const totalPulls = Object.values(this.fitness).reduce((s, r) => s + r.uses, 0);
    let best = availableMoveIds[0];
    let bestScore = -Infinity;
    for (const id of availableMoveIds) {
      let score = this.ucbScore(id, totalPulls);
      if (lastMoveId && this.transitions[lastMoveId]?.[id]) {
        score += Math.log(1 + this.transitions[lastMoveId][id]) * 0.5; // favor learned winning chains
      }
      if (score > bestScore) { bestScore = score; best = id; }
    }
    return best;
  }

  /**
   * Genetic synthesis pass: breed new content from what's already proven to work.
   * Call periodically (e.g. after every N recorded fights) from MatchDirector.
   * Returns whatever new combos/styles were discovered this pass (empty array if nothing new yet).
   */
  public evolveContent(): { newCombos: SynthesizedCombo[]; newStyles: SynthesizedStyle[] } {
    const newCombos: SynthesizedCombo[] = [];
    const newStyles: SynthesizedStyle[] = [];
    this.learned.generation += 1;

    // 1) Combo synthesis: take the strongest 2-3 move transition chains and name them.
    const chains: { seq: string[]; weight: number }[] = [];
    for (const a of Object.keys(this.transitions)) {
      const targets = Object.entries(this.transitions[a]).sort((x, y) => y[1] - x[1]);
      if (!targets.length) continue;
      const [b, w1] = targets[0];
      const seq = [a, b];
      let weight = w1;
      if (this.transitions[b]) {
        const next = Object.entries(this.transitions[b]).sort((x, y) => y[1] - x[1])[0];
        if (next && next[0] !== a) { seq.push(next[0]); weight += next[1]; }
      }
      chains.push({ seq, weight });
    }
    chains.sort((x, y) => y.weight - x.weight);
    const existingComboKeys = new Set(this.learned.combos.map(c => c.sequence.join('>')));
    for (const chain of chains.slice(0, 2)) {
      const key = chain.seq.join('>');
      if (existingComboKeys.has(key) || chain.weight < 3) continue;
      const combo: SynthesizedCombo = {
        id: `combo_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: this.nameCombo(chain.seq),
        sequence: chain.seq,
        category: this.dominantCategory(chain.seq),
        generation: this.learned.generation,
        discoveredAt: new Date().toISOString(),
        fitness: chain.weight,
      };
      this.learned.combos.push(combo);
      newCombos.push(combo);
    }

    // 2) Style synthesis: cluster the move-category preferences of the current top performers
    // into a new fighter archetype (a category-weight distribution), so new "characters" can
    // be spun up from data rather than hand-authored each time.
    const categoryTotals: Record<string, number> = {};
    for (const m of MOVE_PRIMITIVES) {
      const rec = this.fitness[m.id];
      if (!rec || rec.uses === 0) continue;
      const score = (rec.wins / rec.uses) * rec.uses; // weight by both win-rate and sample size
      categoryTotals[m.category] = (categoryTotals[m.category] || 0) + score;
    }
    const total = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    if (total > 0 && this.learned.styles.length < 12) {
      const weights: Record<string, number> = {};
      for (const cat of Object.keys(categoryTotals)) weights[cat] = +(categoryTotals[cat] / total).toFixed(3);
      const style: SynthesizedStyle = {
        id: `style_gen${this.learned.generation}`,
        name: this.nameStyle(weights),
        categoryWeights: weights,
        generation: this.learned.generation,
        discoveredAt: new Date().toISOString(),
      };
      this.learned.styles.push(style);
      newStyles.push(style);
    }

    if (newCombos.length || newStyles.length) this.persistLearned();
    return { newCombos, newStyles };
  }

  private dominantCategory(seq: string[]): string {
    const counts: Record<string, number> = {};
    for (const id of seq) {
      const prim = MOVE_PRIMITIVES.find(m => m.id === id);
      if (prim) counts[prim.category] = (counts[prim.category] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'strike';
  }

  private nameCombo(seq: string[]): string {
    const prefixes = ['Apex', 'Ouroboros', 'Structural', 'Warped', 'Kayfabe', 'Hollow', 'Gravity', 'Babel'];
    const suffixes = ['Collapse', 'Rupture', 'Cascade', 'Reckoning', 'Genome', 'Protocol', 'Verdict'];
    const p = prefixes[seq.join('').length % prefixes.length];
    const s = suffixes[(seq.join('').length * 7) % suffixes.length];
    return `${p} ${s}`;
  }

  private nameStyle(weights: Record<string, number>): string {
    const top = Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0] || 'strike';
    const labels: Record<string, string> = {
      strike: 'Striker', grapple: 'Grappler', slam: 'Powerhouse', aerial: 'High-Flyer', submission: 'Technician',
    };
    return `${labels[top] || 'Hybrid'} Archetype`;
  }

  public getFitnessSnapshot() {
    return { fitness: this.fitness, transitions: this.transitions };
  }

  public getLearnedContent(): LearnedContent {
    return this.learned;
  }
}
