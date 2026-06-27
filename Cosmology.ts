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
  enoch: string;          // the literal 2-Enoch heaven this plane maps to (the canon column)
}

/**
 * The holographic / quantum-contextuality layer — the WHY under the ladder.
 * From the Enoch + M-theory source material: reality is a hologram (every part
 * contains the whole), it is non-local (distance is an illusion of perspective),
 * and it only resolves into something definite when a question is asked of it
 * (quantum contextuality — "reality requires a question"). In the engine this is
 * literal: a fighter's latent moves are a smear of probability until a WIN asks
 * the question and collapses one into a solid maneuver.
 */
export const HOLOGRAPHIC = {
  principle: 'Every part contains the whole. A fighter is a small, complete image of the roster, not a fragment of it — cut the hologram and you get two whole images, not two halves.',
  contextuality: 'Reality requires a question. A move has no fixed value until the context of a match measures it; the win is the measurement that makes it real.',
  nonLocality: 'Distance is an illusion of perspective. A signature can entangle two fighters across the roster — Enoch did not travel through space to the next heaven, he shifted his resonance to access a different fold of the same fabric.',
  ocean: 'Space and the deep ocean were the same thing to the ancients: the surface is measurable matter, the deep is crushing alien (quantum) pressure, and the water itself is dark matter — undefinable, but it holds everything together and gives the wildlife a medium to exist.',
};

/**
 * The 10 planes, dense -> divine. Each is one octave of the same reality:
 * a string-theory dimension AND a Hermetic heaven, because they are the same
 * structure described twice.
 */
export const PLANES: Plane[] = [
  { index: 1,  heaven: 'Malkuth · Physical',     dimension: '3 of space',                band: [0.00, 0.10], resonantCategories: ['strike'],                 note: 'dense matter — waves crashing on the surface, fast and easy to measure', enoch: '1st Heaven — storehouses of ice and snow, great seas above the clouds; the angels of the stars and the weather' },
  { index: 2,  heaven: 'Yesod · Etheric',        dimension: '4th: time',                 band: [0.10, 0.20], resonantCategories: ['strike', 'grapple'],      note: 'the vital current under the skin; conditioning and tempo', enoch: '2nd Heaven — the deep, cold, gloomy abyss; rebel angels bound in darkness awaiting judgment' },
  { index: 3,  heaven: 'Hod · Astral',           dimension: '5th: 1st compactified',     band: [0.20, 0.30], resonantCategories: ['grapple'],                note: 'emotion and momentum — the crowd, the heat, the read on fear', enoch: '3rd Heaven — Paradise (Tree of Life, rivers of milk/honey/oil/wine) on one side, the realm of fire and torment on the other' },
  { index: 4,  heaven: 'Netzach · Lower Mental',  dimension: '6th: compactified',         band: [0.30, 0.42], resonantCategories: ['grapple', 'submission'],  note: 'thought made into counters; you see the move before it lands', enoch: '4th Heaven — the astronomical order; sun, moon and stars run their precise tracks through the gates' },
  { index: 5,  heaven: 'Tiphareth · Causal',     dimension: '7th: compactified',         band: [0.42, 0.55], resonantCategories: ['submission', 'slam'],     note: 'cause and effect — setups, chains, the deep currents running the system', enoch: '5th Heaven — the Grigori / Watchers, mourning in silent grief for their sins' },
  { index: 6,  heaven: 'Geburah · Buddhic',      dimension: '8th: compactified',         band: [0.55, 0.68], resonantCategories: ['slam'],                   note: 'unity of motion; combos flow as one continuous wave', enoch: '6th Heaven — archangels governing the stars, seasons and natural laws in gentle unbroken song' },
  { index: 7,  heaven: 'Chesed · Atmic',         dimension: '9th: compactified',         band: [0.68, 0.80], resonantCategories: ['slam', 'aerial'],         note: 'pure will — the finisher that ends arguments', enoch: '7th Heaven — the Cherubim and Seraphim, the highest angelic orders before the throne' },
  { index: 8,  heaven: 'Binah · Monadic',        dimension: '10th: full space',          band: [0.80, 0.90], resonantCategories: ['aerial'],                 note: 'the brane itself; gravity leaks across to the page next door', enoch: '8th Heaven — Muzaloth, home of the twelve constellations that turn the cycles' },
  { index: 9,  heaven: 'Chokmah · Logoic',       dimension: 'the bulk between branes',   band: [0.90, 0.97], resonantCategories: ['aerial', 'submission'],   note: 'the dark-matter medium — undefinable, but it holds the whole structure together', enoch: '9th Heaven — Kuchavim, the celestial mechanism ruling rain, drought and the movement of the firmament' },
  { index: 10, heaven: 'Kether · Adi / Crown',   dimension: 'the singular point',        band: [0.97, 1.01], resonantCategories: ['strike','grapple','slam','aerial','submission'], note: 'all frequencies at once — the probability wave before anything observes it', enoch: '10th Heaven — Aravoth, overwhelming burning light, the fiery throne; the source of all cosmic order' },
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
