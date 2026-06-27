import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CombatAI } from './CombatAI.js';
import { mirrorToCloud } from './CloudPersistence.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HISTORY_FILE = path.join(__dirname, 'fight_history.json');

interface FightRecord {
  winner: string;
  loser: string;
  date: string;
  type: string;
  moveSequence?: string[];
}

/**
 * MatchDirector — narrative pacing layer.
 *
 * Reads the persisted fight_history ledger to decide rivalry escalation,
 * and triggers CombatAI's evolution pass on a cadence so the roster of
 * combos/styles keeps growing as more matches are played, instead of
 * requiring a developer to manually add new content.
 */
export class MatchDirector {
  private combatAI: CombatAI;
  private evolveEveryNFights = 5;

  constructor(combatAI: CombatAI) {
    console.log("[Node 3] Match Director Initialized");
    this.combatAI = combatAI;
  }

  private readHistory(): FightRecord[] {
    try {
      if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (_) { /* ignore corrupt file, treat as empty */ }
    return [];
  }

  /** Rivalry heat: 0 (strangers) to 1+ (blood feud), scaled by recency-weighted encounter count. */
  public getRivalryHeat(fighterA: string, fighterB: string): number {
    const a = fighterA.toUpperCase(), b = fighterB.toUpperCase();
    const history = this.readHistory();
    const matches = history.filter(m =>
      (m.winner.toUpperCase() === a && m.loser.toUpperCase() === b) ||
      (m.winner.toUpperCase() === b && m.loser.toUpperCase() === a)
    );
    if (!matches.length) return 0;
    const now = Date.now();
    let heat = 0;
    for (const m of matches) {
      const ageDays = Math.max(0, (now - new Date(m.date).getTime()) / 86400000);
      heat += Math.exp(-ageDays / 30); // recent matches count more than old ones
    }
    return +heat.toFixed(3);
  }

  /** Call after a fight ends. Feeds CombatAI, persists the record, and may trigger evolution. */
  public reportFightResult(record: FightRecord): { evolved: boolean; newContent?: ReturnType<CombatAI['evolveContent']> } {
    const history = this.readHistory();
    history.push(record);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
    void mirrorToCloud('bannon_daemon', 'fight_history', history);

    if (record.moveSequence && record.moveSequence.length > 1) {
      this.combatAI.recordSequence(record.moveSequence, true);
    }

    if (history.length % this.evolveEveryNFights === 0) {
      const newContent = this.combatAI.evolveContent();
      return { evolved: true, newContent };
    }
    return { evolved: false };
  }

  public getStorylineBeat(fighterA: string, fighterB: string): string {
    const heat = this.getRivalryHeat(fighterA, fighterB);
    if (heat === 0) return 'first_encounter';
    if (heat < 1) return 'rekindled_rivalry';
    if (heat < 3) return 'blood_feud';
    return 'legendary_grudge';
  }
}
