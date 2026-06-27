/**
 * Cosmology.ts — the blueprint.
 *
 * This is the single place where the game's metaphysics is encoded as actual
 * engine data instead of flavor text. String theory and ancient cosmology are
 * the same map in two languages, so we store both columns side by side:
 *
 *   - 10 dimensions of string theory  <->  10 heavens / spheres of Hermetic cosmology
 *   - a string's vibration frequency  <->  the "plane" a thing resonates on
 *   - matter vs light is just freq    <->  a strike vs a finisher is just freq
 *
 * Everything downstream (FighterEvolution) reads from here. A fighter's growth
 * is literally their signature frequency climbing the 10 planes; the moves they
 * can reach are the ones whose vibration sits in a band they've ascended into.
 *
 * Frequencies are symbolic (a normalized 0..1 "octave" of reality), not Hz —
 * 0 is the densest physical plane, 1 is the crown / 10th dimension where all
 * possibility collapses to a point.
 */

export interface Plane {
  index: number;          // 1..10
  heaven: string;         // esoteric name (the sphere / heaven)
  dimension: string;      // physics analog (the string-theory dimension it maps to)
  band: [number, number]; // normalized frequency band [lo, hi) this plane occupies
  resonantCategories: string[]; // move categories that "vibrate" naturally here
  note: string;           // one-line gloss tying the two languages together
}

/**
 * The 10 planes, dense -> divine. Each is one octave of the same reality:
 * a string-theory dimension AND a Hermetic heaven, because they are the same
 * structure described twice.
 */
export const PLANES: Plane[] = [
  { index: 1,  heaven: 'Malkuth · Physical',     dimension: '3 of space',                band: [0.00, 0.10], resonantCategories: ['strike'],                 note: 'dense matter — waves crashing on the surface, fast and easy to measure' },
  { index: 2,  heaven: 'Yesod · Etheric',        dimension: '4th: time',                 band: [0.10, 0.20], resonantCategories: ['strike', 'grapple'],      note: 'the vital current under the skin; conditioning and tempo' },
  { index: 3,  heaven: 'Hod · Astral',           dimension: '5th: 1st compactified',     band: [0.20, 0.30], resonantCategories: ['grapple'],                note: 'emotion and momentum — the crowd, the heat, the read on fear' },
  { index: 4,  heaven: 'Netzach · Lower Mental',  dimension: '6th: compactified',         band: [0.30, 0.42], resonantCategories: ['grapple', 'submission'],  note: 'thought made into counters; you see the move before it lands' },
  { index: 5,  heaven: 'Tiphareth · Causal',     dimension: '7th: compactified',         band: [0.42, 0.55], resonantCategories: ['submission', 'slam'],     note: 'cause and effect — setups, chains, the deep currents running the system' },
  { index: 6,  heaven: 'Geburah · Buddhic',      dimension: '8th: compactified',         band: [0.55, 0.68], resonantCategories: ['slam'],                   note: 'unity of motion; combos flow as one continuous wave' },
  { index: 7,  heaven: 'Chesed · Atmic',         dimension: '9th: compactified',         band: [0.68, 0.80], resonantCategories: ['slam', 'aerial'],         note: 'pure will — the finisher that ends arguments' },
  { index: 8,  heaven: 'Binah · Monadic',        dimension: '10th: full space',          band: [0.80, 0.90], resonantCategories: ['aerial'],                 note: 'the brane itself; gravity leaks across to the page next door' },
  { index: 9,  heaven: 'Chokmah · Logoic',       dimension: 'the bulk between branes',   band: [0.90, 0.97], resonantCategories: ['aerial', 'submission'],   note: 'the dark-matter medium — undefinable, but it holds the whole structure together' },
  { index: 10, heaven: 'Kether · Adi / Crown',   dimension: 'the singular point',        band: [0.97, 1.01], resonantCategories: ['strike','grapple','slam','aerial','submission'], note: 'all frequencies at once — the probability wave before anything observes it' },
];

/** Which plane a given normalized frequency resonates on. */
export function planeForFrequency(freq: number): Plane {
  const f = Math.max(0, Math.min(1.0, freq));
  for (const p of PLANES) if (f >= p.band[0] && f < p.band[1]) return p;
  return PLANES[PLANES.length - 1];
}

/**
 * Base frequency of a move, derived from its category + riskiness. A move is a
 * vibrating string: the category sets the octave, riskiness pushes it higher
 * (the riskier/more devastating the maneuver, the higher it vibrates). This is
 * the "matter vs light is just frequency" rule applied to moves.
 */
const CATEGORY_OCTAVE: Record<string, number> = {
  strike: 0.05,
  grapple: 0.22,
  submission: 0.40,
  slam: 0.58,
  aerial: 0.78,
};

export function frequencyForMove(category: string, riskiness: number): number {
  const base = CATEGORY_OCTAVE[category] ?? 0.30;
  // riskiness lifts the move up to ~0.18 of an octave higher, capped at the crown.
  return Math.min(1.0, +(base + Math.max(0, Math.min(1, riskiness)) * 0.18).toFixed(4));
}

/** How strongly a move at `moveFreq` resonates for a fighter sitting at `sigFreq` (0..1). */
export function resonance(moveFreq: number, sigFreq: number): number {
  const d = Math.abs(moveFreq - sigFreq);
  // a fighter can always reach a little above their plane (aspiration) but
  // resonance falls off with frequency distance — you can't yet play notes
  // far above the octave you've ascended to.
  return +Math.exp(-(d * d) / (2 * 0.12 * 0.12)).toFixed(4);
}

/** The crown holds every possibility; a fighter's reachable ceiling is their signature + an aspiration window. */
export const ASPIRATION_WINDOW = 0.14;
