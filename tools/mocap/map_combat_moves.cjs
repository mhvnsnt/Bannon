#!/usr/bin/env node
/* COMBAT-TABLE move -> mocap-clip mapper (NON-MANUAL).
 *
 *   node tools/mocap/map_combat_moves.cjs
 *
 * THE BUG THIS FIXES. BANNON has two completely separate move vocabularies and only one of them was
 * ever mapped to animation:
 *
 *   * the MOVE LIBRARY (bannon_move_library + the MDickie imports) — 140 moves, mapped to clips by
 *     tools/mocap/auto_map_moves.cjs, consumed by BANNON_MOVE_LIBRARY.
 *   * the COMBAT TABLES inside BANNON_v150.html (FIRE JAB, LEO CROSS, SCORPIO HOOK, SAG KNEE …) —
 *     ~101 moves. THESE ARE THE MOVES THAT ACTUALLY FIRE WHEN YOU PRESS A BUTTON.
 *
 * The overlap between the two name sets is EXACTLY ZERO, case-insensitively. So every strike thrown
 * in a match had no clip, `studioApplyClipPose` was never reached, and the whole 202-clip mocap
 * library sat on disk while combat ran on procedural springs alone. Measured in the headless harness:
 * studioApplyClipPose called 0 times across a 25-second match. That is the "animations aren't
 * working / looks like action figures" report, and it was never a rigging problem.
 *
 * WHY MATCHING BY NAME WAS NEVER GOING TO WORK: no mocap clip is called "SCORPIO HOOK". But the
 * combat tables carry far better signal than a name — every move declares limb (LEFT JAB / RIGHT
 * CROSS / ELBOW / KNEE / RIGHT KICK / HEADBUTT), trajectory (STRAIGHT / HOOK / UPPERCUT / OVERHAND /
 * SPINNING / FLYING / SWEEP), height (HIGH / MID / LOW) and style (BOXING / MUAY THAI / KARATE /
 * CAPOEIRA / MMA …). This scores on THAT, which is what a human would match on anyway.
 *
 * Output: assets/moves/combat_clip_map.json, consumed at runtime by the BANNON_COMBAT_MOCAP module,
 * which stamps .clip onto the live move objects AND prefetches the clips before they are needed.
 * Re-run whenever moves or clips are added — zero manual authoring.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const HTML = path.join(ROOT, 'BANNON_v150.html');
const MOVES = path.join(ROOT, 'assets', 'moves');

// ── every clip actually on disk (the mapper must never name a file that is not there) ──────────
const onDisk = new Set();
for (const d of ['assets/mocap', 'assets/mocap/drive']) {
  try {
    for (const f of fs.readdirSync(path.join(ROOT, d))) {
      if (f.toLowerCase().endsWith('.fbx')) onDisk.add(f.replace(/\.fbx$/i, ''));
    }
  } catch (_) { /* dir may not exist */ }
}

// clip metadata (cat/pos/engine/style) where we have it; disk-only clips still get scored by name
let meta = {};
try {
  const fbx = JSON.parse(fs.readFileSync(path.join(MOVES, 'fbx_move_map.json'), 'utf8'));
  for (const c of (fbx.clips || [])) meta[c.clip] = c;
} catch (_) { /* optional */ }

// clips that are a character rig or a stray asset, never an action to play on a fighter
const NOT_AN_ACTION = /^(X Bot|Y Bot|arcee|passive_marker|Ch\d+_nonPBR|ShelbyIKRig|Lola |Paladin |Pumpkinhulk |Brian_Cage|Chris_Jericho|Andrade_|Fin_F10|NoFuture)/i;

// NOT A STRIKE, ever. Two classes of wrong match this kills, both of which the first pass produced:
//   * REACTIONS. "Hit To Head" is the capture of a man BEING hit. Playing it on the attacker means
//     your headbutt animates as flinching from one. Category metadata catches these — but only for
//     clips that HAVE metadata, and 20 of the 202 are disk-only, which is how the hole opened.
//   * LOCOMOTION AND DANCE. "Cross Jumps" scored on the token "cross" and won LEO CROSS, so a
//     straight right punch would have played a jumping drill.
const NEVER_A_STRIKE = /(crotchchop|dancing|breakdance|uprock|twerk|can can|house |walk|running|run to|jog|idle|climb|sneak|cover|drunk|zombie|dying|death|defeat|fall|landing|hang|crouch|turn|taunt|dwarf|shoulderbag|marker|swing|throw|hit on|hit to|hit reaction|block|evade|esquiva|defender|kip up|jumps)/i;
const REACTION_CATS = ['reaction', 'knockdown', 'getup', 'defense', 'locomotion', 'style_stance', 'taunt', 'character_rig'];

// Armada and Au are capoeira ACTION captures that fbx_move_map.json mislabels as character_rig.
// Excluding them left every capoeira move in the game with no capture while the file sat on disk.
const MISLABELLED_ACTIONS = new Set(['Armada', 'Au', 'Capoeira', 'Capoeira (1)', 'Queshada 2', 'Cartwheel']);
// THE ENGINE LOADS BAKED JSON, NOT FBX. This mapper was drawing its candidates from the .fbx files
// on disk, and the game runs with ALLOW_RUNTIME_FBX off — it loads assets/moves/clips/*.json. Those
// two sets are not the same, and nothing checked.
//
// MEASURED: of the 137 combat moves this file maps, FORTY-FOUR pointed at a capture with no baked
// clip behind it at all — "Body Jab Cross", "Baseball Hit". In play that is a move whose `clip` is
// set, whose STUDIO lookup fails, and which therefore falls through to the procedural path every
// single time. 44/137 is 32%, which is the 37% of moves measured reaching the engine un-animated.
//
// A move must never point at a capture we do not have. Candidates are now intersected with the
// baked index.
let BAKED = null;
try {
  const idx = JSON.parse(fs.readFileSync(path.join(MOVES, 'clips', 'index.json'), 'utf8'));
  BAKED = new Set();
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const k of Object.keys(idx)) BAKED.add(norm(k));
} catch (_) { BAKED = null; }
const isBaked = c => !BAKED || BAKED.has(String(c).toUpperCase().replace(/[^A-Z0-9]/g, ''));

const CLIPS = [...onDisk].filter(c => {
  if (NOT_AN_ACTION.test(c)) return false;
  if (!isBaked(c)) return false;          // no baked clip => the engine can never play it
  if (MISLABELLED_ACTIONS.has(c)) return true;
  return (meta[c] ? meta[c].cat !== 'character_rig' : true);
});
// the subset a STRIKE is allowed to draw from — name denylist AND category denylist, so a disk-only
// clip with no metadata still cannot sneak through on a token match
const STRIKE_CLIPS = CLIPS.filter(c => {
  if (NEVER_A_STRIKE.test(c)) return false;
  if (MISLABELLED_ACTIONS.has(c)) return true;
  if (meta[c] && REACTION_CATS.includes(meta[c].cat)) return false;
  return true;
});

// ── the combat tables, read straight out of the shipped HTML ───────────────────────────────────
// These objects are the real thing the engine poses from: {name, cat, limb, traj, height, power,
// speed, style, follow}. Parsed rather than duplicated so the mapper can never drift from the game.
const html = fs.readFileSync(HTML, 'utf8');
const moves = new Map();
{
  // Accept BOTH object styles. customMoves uses bare keys ({ name:"FIRE JAB", cat:"STRIKE" });
  // the per-character libraries (_LIB_BASE / _LIB_BANNON / _LIB_ZEPHYR) are JSON with QUOTED keys
  // ({"name":"ARMADA","cat":"KICK"}). Matching only bare keys silently skipped every per-character
  // moveset — including the entire capoeira set — which is most of the roster's actual vocabulary.
  const re = /\{\s*"?name"?\s*:\s*["']([^"']+)["']\s*,\s*"?cat"?\s*:\s*["']([^"']+)["']([^{}]*)\}/g;
  let m;
  while ((m = re.exec(html))) {
    const [, name, cat, rest] = m;
    if (moves.has(name)) continue;
    const field = k => { const r = new RegExp('"?' + k + '"?\\s*:\\s*["\']([^"\']+)["\']').exec(rest); return r ? r[1] : ''; };
    moves.set(name, { name, cat, limb: field('limb'), traj: field('traj'), height: field('height'), style: field('style') });
  }
}

// ── scoring ────────────────────────────────────────────────────────────────────────────────────
const low = s => String(s || '').toLowerCase();
const has = (hay, ...needles) => needles.some(n => low(hay).includes(n));

// what body weapon does the clip show? Derived from the filename + its mapped engine key.
function clipTraits(c) {
  const n = low(c);
  const e = low(meta[c] && meta[c].engine);
  const cat = low(meta[c] && meta[c].cat);
  return {
    punch:  has(n, 'punch', 'jab', 'cross', 'boxing', 'forearm', 'chest beating', 'body blow', 'rib hit', 'bash', 'assassination', 'baseball hit') || e.includes('punch'),
    elbow:  has(n, 'elbow'),
    knee:   has(n, 'knee'),
    kick:   has(n, 'kick', 'superkick', 'armada', 'queshada', 'capoeira', 'au') || e.includes('kick'),
    spin:   has(n, 'hurricane', 'armada', 'queshada', 'corkscrew', 'spin', 'cartwheel', 'au'),
    fly:    has(n, 'drop kick', 'jump', 'dive', 'senton', 'stereo'),
    low:    has(n, 'sweep', 'baseball', 'foot stomp', 'rasteira'),
    body:   has(n, 'body', 'rib', 'chest'),
    capo:   has(n, 'capoeira', 'ginga', 'esquiva', 'armada', 'au', 'queshada'),
    box:    has(n, 'boxing', 'jab', 'cross', 'forearm'),
    isStrike: cat === 'strike' || has(n, 'punch', 'kick', 'elbow', 'knee', 'forearm', 'chop', 'boxing'),
    cat
  };
}

function score(mv, clip) {
  const t = clipTraits(clip);
  const limb = low(mv.limb), traj = low(mv.traj), h = low(mv.height), st = low(mv.style);
  const cat = low(mv.cat);
  let s = 0;

  // 1. THE LIMB IS THE STRONGEST SIGNAL. A knee move must not play a punch clip.
  if (limb.includes('kick'))          s += t.kick ? 10 : (t.punch || t.elbow ? -8 : 0);
  else if (limb === 'knee')           s += t.knee ? 12 : (t.kick ? 4 : -6);
  else if (limb === 'elbow')          s += t.elbow ? 12 : (t.punch ? 3 : -6);
  else if (limb === 'headbutt')       s += has(clip, 'headcrack', 'head') ? 8 : -4;
  else if (limb)                      s += t.punch ? 9 : (t.kick ? -8 : 0);   // any hand strike

  // 2. trajectory
  if (traj === 'spinning' && t.spin) s += 6;
  if (traj === 'flying'   && t.fly)  s += 6;
  if (traj === 'sweep'    && t.low)  s += 6;
  if (traj === 'uppercut' && has(clip, 'uppercut', 'rib', 'body blow')) s += 4;

  // 3. height
  if (h === 'mid' && t.body) s += 4;
  if (h === 'low' && t.low)  s += 4;
  if (h === 'high' && t.body) s -= 2;

  // 4. style — capoeira moves get capoeira capture, boxing gets boxing capture
  if (st.includes('capoeira') && t.capo) s += 8;
  if (st.includes('boxing') && t.box)    s += 5;
  if (!st.includes('capoeira') && t.capo) s -= 4;   // don't give a boxer a ginga

  // 5. category sanity — a STRIKE should get a strike capture
  if ((cat === 'strike' || cat === 'kick') && t.isStrike) s += 3;
  if ((cat === 'strike' || cat === 'kick') && ['grapple', 'locomotion', 'taunt', 'getup', 'knockdown', 'submission'].includes(t.cat)) s -= 10;

  // 6. direct token overlap on the name, when it happens to exist
  const mt = new Set(low(mv.name).split(/[^a-z0-9]+/).filter(x => x.length > 2));
  for (const tok of low(clip).split(/[^a-z0-9]+/)) if (tok.length > 2 && mt.has(tok)) s += 4;

  return s;
}

// ── map, spreading across variants so 40 punches do not all play "Boxing" ──────────────────────
const used = new Map();                       // clip -> how many moves already assigned to it
const out = {};
let hit = 0;
const byName = [...moves.values()].sort((a, b) => a.name.localeCompare(b.name));

// DIRECT NAME MATCH first. The named finishers in the combat tables (CHOKESLAM HEX, TOMBSTONE
// DRIVER, HAMMERLOCK DDT, VERTICAL BRAINBUSTER …) are the moves the clips were captured FOR — the
// clip is literally called Chokeslam / Tombstone / HammerlockDDT. Those need no scoring, just a
// normalised comparison, and scoring was never going to find them because they carry no limb/traj.
const norm = s => low(s).replace(/[^a-z0-9]/g, '');
const byNorm = new Map();
for (const c of CLIPS) if (!byNorm.has(norm(c))) byNorm.set(norm(c), c);

for (const mv of byName) {
  const nm = norm(mv.name);
  let direct = byNorm.get(nm);
  if (!direct) {
    // drop a trailing descriptor the combat table adds: "CHOKESLAM HEX" -> Chokeslam,
    // "TOMBSTONE DRIVER" -> Tombstone, "DOUBLE-HOOK SUPLEX" -> DoubleSuplex
    for (const [k, c] of byNorm) {
      if (k.length >= 6 && (nm.startsWith(k) || nm.endsWith(k))) { direct = c; break; }
    }
  }
  if (direct) {
    out[mv.name] = { clip: direct, limb: mv.limb, traj: mv.traj, score: 99, exact: true };
    used.set(direct, (used.get(direct) || 0) + 1);
    hit++;
    continue;
  }

  // a STRIKE may only draw from the strike-safe pool; anything else may use the full set
  const isStrikeMove = /strike|kick/i.test(mv.cat) || !!mv.limb;
  const pool = isStrikeMove ? STRIKE_CLIPS : CLIPS;
  let best = null, bs = 0;
  for (const c of pool) {
    // VARIETY: each additional reuse costs a point, so near-equal candidates spread out instead of
    // every jab in the game playing the same capture — which reads as canned, the exact MDickie
    // complaint the owner has about repetition.
    const s = score(mv, c) - (used.get(c) || 0);
    if (s > bs) { bs = s; best = c; }
  }
  if (best && bs >= 6) {                       // below this the match is a guess, and a wrong clip
    out[mv.name] = { clip: best, limb: mv.limb, traj: mv.traj, score: bs };   // is worse than none
    used.set(best, (used.get(best) || 0) + 1);
    hit++;
  }
}

fs.writeFileSync(path.join(MOVES, 'combat_clip_map.json'), JSON.stringify({
  _note: 'AUTO-GENERATED by tools/mocap/map_combat_moves.cjs — the in-HTML COMBAT TABLE moves (the ones that fire when you press a button) mapped to real mocap clips by limb/trajectory/height/style. Consumed at runtime by BANNON_COMBAT_MOCAP, which stamps .clip onto the live move objects and prefetches the files.',
  generated: new Date().toISOString().slice(0, 10),
  moves: moves.size, mapped: hit, clipsConsidered: CLIPS.length,
  map: out
}, null, 1));

console.log('combat moves found in BANNON_v150.html : ' + moves.size);
console.log('animation clips considered            : ' + CLIPS.length + ' (of ' + onDisk.size + ' on disk)');
console.log('mapped to a real capture              : ' + hit + '  (' + Math.round(hit / moves.size * 100) + '%)');
console.log('distinct clips used                   : ' + used.size);
const unmapped = byName.filter(m => !out[m.name]);
if (unmapped.length) {
  console.log('\nUNMAPPED (no capture scored high enough — these stay procedural, which is correct):');
  unmapped.slice(0, 30).forEach(m => console.log('   ' + m.name.padEnd(24) + m.limb + ' / ' + m.traj));
  if (unmapped.length > 30) console.log('   … and ' + (unmapped.length - 30) + ' more');
}
console.log('\nwrote assets/moves/combat_clip_map.json');
