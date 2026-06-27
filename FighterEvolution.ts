import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MOVE_PRIMITIVES, MovePrimitive } from './CombatAI.js';
import {
  PLANES, Plane, planeForFrequency, frequencyForMove, resonance, ASPIRATION_WINDOW,
} from './Cosmology.js';
import { mirrorToCloud } from './CloudPersistence.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROSTER_FILE = path.join(__dirname, 'fighter_profiles.json');

/**
 * A move as it exists in the growing library. Primitives seed it; synthesized
 * combos (bred by CombatAI) and brane-leaked rival signatures get appended over
 * time, so the library is never a fixed hand-authored list.
 */
export interface LibraryMove {
  id: string;
  name: string;
  category: string;
  frequency: number;     // where it vibrates (which plane it belongs to)
  origin: 'primitive' | 'synthesized' | 'leaked';
  sequence?: string[];   // for synthesized combos
}

/**
 * A fighter is a standing wave. `signatureFreq` is the note they currently ring
 * at; the plane that frequency falls in is how "ascended" they are. `latent` is
 * their deep ocean — moves that exist for them only as probability amplitudes
 * until a win observes one and collapses it into `unlocked`.
 */
export interface FighterProfile {
  id: string;
  signatureFreq: number;
  wins: number;
  losses: number;
  styleWeights: Record<string, number>; // category -> preference, drifts with W/L
  unlocked: string[];                    // library move ids they can actually throw
  latent: Record<string, number>;        // library move id -> amplitude (0..1+)
  signatureMoves: string[];              // named moves discovered/owned by this fighter
  plane?: number;                        // cached, recomputed on read
  ascensions: { plane: number; at: string }[];
  lastUpdated: string;
}

interface RosterFile {
  fighters: Record<string, FighterProfile>;
  library: LibraryMove[];
}

function load(): RosterFile {
  try {
    if (fs.existsSync(ROSTER_FILE)) return JSON.parse(fs.readFileSync(ROSTER_FILE, 'utf-8'));
  } catch (_) { /* corrupt -> reseed */ }
  return { fighters: {}, library: [] };
}

/**
 * FighterEvolution — the "characters deepen and evolve as they battle" engine.
 *
 * Each match result ascends the winner's frequency (climbing the 10 planes),
 * collapses a new move out of their probability ocean into their permanent
 * moveset, and drifts the loser's style toward whatever just beat them. Rivals
 * leak signature moves across to each other (brane theory: gravity is the only
 * force that crosses between branes, so a devastating signature is the thing
 * that bleeds from one fighter's universe into the next). All of it persists,
 * so the roster genuinely grows and specializes the longer the game is played.
 */
export class FighterEvolution {
  private data: RosterFile;

  constructor() {
    console.log('[Node 9] Fighter Evolution Initialized — roster ascends the 10 planes as it fights');
    this.data = load();
    if (!this.data.library.length) this.seedLibrary();
  }

  /** The library starts as the move primitives, each placed on its plane by frequency. */
  private seedLibrary() {
    this.data.library = MOVE_PRIMITIVES.map((m: MovePrimitive) => ({
      id: m.id,
      name: m.id.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim(),
      category: m.category,
      frequency: frequencyForMove(m.category, m.riskiness),
      origin: 'primitive' as const,
    }));
  }

  private persist() {
    fs.writeFileSync(ROSTER_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    void mirrorToCloud('bannon_daemon', 'fighter_profiles', this.data);
  }

  /** Get (or first-time seed) a fighter. New fighters start at the dense physical plane. */
  public getFighter(id: string): FighterProfile {
    const key = id.toUpperCase();
    let f = this.data.fighters[key];
    if (!f) {
      f = {
        id: key,
        signatureFreq: 0.05, // born on the physical plane
        wins: 0, losses: 0,
        styleWeights: { strike: 0.4, grapple: 0.25, submission: 0.15, slam: 0.12, aerial: 0.08 },
        unlocked: [],
        latent: {},
        signatureMoves: [],
        ascensions: [],
        lastUpdated: new Date().toISOString(),
      };
      // seed unlocked with the moves resonant with the physical plane, latent with the rest.
      for (const mv of this.data.library) {
        if (resonance(mv.frequency, f.signatureFreq) > 0.6) f.unlocked.push(mv.id);
        else f.latent[mv.id] = 0.05;
      }
      this.data.fighters[key] = f;
    }
    f.plane = planeForFrequency(f.signatureFreq).index;
    return f;
  }

  /**
   * Observe the wave. A win lets the fighter collapse one latent move into a
   * real one — weighted by amplitude AND resonance with the plane they're now
   * on (you can only pull down notes you can already almost hear). Returns the
   * move that materialized, or null if nothing was ripe yet.
   */
  private collapseOneMove(f: FighterProfile): LibraryMove | null {
    let best: LibraryMove | null = null;
    let bestScore = 0;
    for (const mv of this.data.library) {
      if (f.unlocked.includes(mv.id)) continue;
      const amp = f.latent[mv.id] ?? 0.02;
      const res = resonance(mv.frequency, f.signatureFreq);
      // a move only becomes observable once it's within the aspiration window
      // above the fighter's current note — you cannot leap octaves.
      if (mv.frequency > f.signatureFreq + ASPIRATION_WINDOW) continue;
      const score = amp * res;
      if (score > bestScore) { bestScore = score; best = mv; }
    }
    if (best && bestScore > 0.08) {
      f.unlocked.push(best.id);
      delete f.latent[best.id];
      return best;
    }
    return null;
  }

  /** Dominant move category for a fighter, from their style weights. */
  private dominant(f: FighterProfile): string {
    return Object.entries(f.styleWeights).sort((a, b) => b[1] - a[1])[0]?.[0] || 'strike';
  }

  /**
   * Process a completed match. Mutates and persists both fighters.
   * Returns a report of everything that changed so the client can narrate it.
   */
  public processMatchResult(opts: {
    winnerId: string;
    loserId: string;
    winnerMoveSeq?: string[];
    dominantCategoryUsed?: string;
  }) {
    const w = this.getFighter(opts.winnerId);
    const l = this.getFighter(opts.loserId);
    const report: any = { winner: w.id, loser: l.id, events: [] as string[] };

    w.wins += 1;
    l.losses += 1;

    // --- WINNER ASCENDS: signature frequency climbs toward the next plane. ---
    const prevPlane = planeForFrequency(w.signatureFreq).index;
    // climb scales with the freq-headroom remaining (asymptotic toward the crown)
    const climb = (1.0 - w.signatureFreq) * 0.06 + 0.004;
    w.signatureFreq = Math.min(1.0, +(w.signatureFreq + climb).toFixed(4));
    const newPlane = planeForFrequency(w.signatureFreq).index;
    if (newPlane > prevPlane) {
      const p: Plane = PLANES[newPlane - 1];
      w.ascensions.push({ plane: newPlane, at: new Date().toISOString() });
      report.events.push(`${w.id} ascended to plane ${newPlane} — ${p.heaven} (${p.dimension})`);
    }

    // --- WINNER GROWS AMPLITUDES: moves resonant with how they won get louder. ---
    const usedCat = opts.dominantCategoryUsed || this.dominant(w);
    for (const mv of this.data.library) {
      if (w.unlocked.includes(mv.id)) continue;
      const res = resonance(mv.frequency, w.signatureFreq);
      const catBonus = mv.category === usedCat ? 1.6 : 1.0;
      w.latent[mv.id] = +(((w.latent[mv.id] ?? 0.02) + 0.05 * res * catBonus)).toFixed(4);
    }

    // --- WINNER OBSERVES: collapse a new move into the real moveset. ---
    const learned = this.collapseOneMove(w);
    if (learned) report.events.push(`${w.id} learned a new maneuver: ${learned.name} (${learned.category}, plane ${planeForFrequency(learned.frequency).index})`);

    // --- WINNER's style sharpens toward what's working. ---
    w.styleWeights[usedCat] = +((w.styleWeights[usedCat] ?? 0.1) + 0.04).toFixed(4);
    this.renormalize(w.styleWeights);

    // --- BRANE LEAKAGE: the winner's top signature move bleeds into the loser's ---
    // latent ocean. Gravity is the one force that crosses between branes; a
    // devastating signature is the gravity of a fighting style.
    if (w.signatureMoves.length) {
      const sig = w.signatureMoves[w.signatureMoves.length - 1];
      const libMove = this.data.library.find(m => m.id === sig || m.name === sig);
      if (libMove && !l.unlocked.includes(libMove.id)) {
        l.latent[libMove.id] = +(((l.latent[libMove.id] ?? 0) + 0.10)).toFixed(4);
        report.events.push(`${libMove.name} leaked across the brane into ${l.id}'s repertoire (latent)`);
      }
    }

    // --- LOSER LEARNS FROM DEFEAT: style drifts toward the winner's dominant ---
    // category and their note nudges up toward the higher vibration that beat them.
    l.styleWeights[usedCat] = +((l.styleWeights[usedCat] ?? 0.1) + 0.05).toFixed(4);
    this.renormalize(l.styleWeights);
    if (w.signatureFreq > l.signatureFreq) {
      l.signatureFreq = +(l.signatureFreq + (w.signatureFreq - l.signatureFreq) * 0.10).toFixed(4);
      report.events.push(`${l.id} felt the higher frequency and shifted toward plane ${planeForFrequency(l.signatureFreq).index}`);
    }

    w.lastUpdated = l.lastUpdated = new Date().toISOString();
    w.plane = planeForFrequency(w.signatureFreq).index;
    l.plane = planeForFrequency(l.signatureFreq).index;
    this.persist();
    return report;
  }

  private renormalize(weights: Record<string, number>) {
    const total = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
    for (const k of Object.keys(weights)) weights[k] = +(weights[k] / total).toFixed(4);
  }

  /**
   * Register a freshly-synthesized combo (from CombatAI.evolveContent) into the
   * growing library, and award it as a signature move to its discoverer. This is
   * how brand-new named maneuvers permanently enter the game without anyone
   * hand-authoring them.
   */
  public registerSynthesizedMove(move: { id: string; name: string; category: string; sequence: string[] }, discovererId?: string): LibraryMove {
    let lib = this.data.library.find(m => m.id === move.id);
    if (!lib) {
      // a combo's frequency = the average vibration of its component moves, lifted
      // a touch (the whole is higher than the sum — emergence pushes it up an octave-fraction).
      const freqs = move.sequence.map(id => {
        const prim = MOVE_PRIMITIVES.find(p => p.id === id);
        return prim ? frequencyForMove(prim.category, prim.riskiness) : 0.3;
      });
      const avg = freqs.reduce((s, v) => s + v, 0) / (freqs.length || 1);
      lib = {
        id: move.id,
        name: move.name,
        category: move.category,
        frequency: Math.min(1.0, +(avg + 0.06).toFixed(4)),
        origin: 'synthesized',
        sequence: move.sequence,
      };
      this.data.library.push(lib);
    }
    if (discovererId) {
      const f = this.getFighter(discovererId);
      if (!f.signatureMoves.includes(lib.name)) f.signatureMoves.push(lib.name);
      if (!f.unlocked.includes(lib.id)) f.unlocked.push(lib.id);
    }
    this.persist();
    return lib;
  }

  public getRoster(): FighterProfile[] {
    return Object.values(this.data.fighters).map(f => {
      f.plane = planeForFrequency(f.signatureFreq).index;
      return f;
    });
  }

  public getLibrary(): LibraryMove[] {
    return this.data.library;
  }

  /** A readable progression card for one fighter — current plane, moveset, what's almost unlocked. */
  public getFighterCard(id: string) {
    const f = this.getFighter(id);
    const plane = planeForFrequency(f.signatureFreq);
    const nextUp = Object.entries(f.latent)
      .map(([mid, amp]) => {
        const mv = this.data.library.find(m => m.id === mid);
        return mv ? { name: mv.name, amplitude: amp, resonance: resonance(mv.frequency, f.signatureFreq) } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.amplitude * b.resonance) - (a.amplitude * a.resonance))
      .slice(0, 3);
    return {
      id: f.id,
      record: { wins: f.wins, losses: f.losses },
      signatureFrequency: f.signatureFreq,
      plane: { index: plane.index, heaven: plane.heaven, dimension: plane.dimension, note: plane.note },
      styleWeights: f.styleWeights,
      unlockedMoves: f.unlocked,
      signatureMoves: f.signatureMoves,
      surfacing: nextUp, // moves rising out of the deep ocean toward observation
    };
  }
}
