#!/usr/bin/env node
/* audit_clip_refs.cjs — EVERY clip the engine can ask for, checked against what is on disk.
 *
 *   node tools/moves/audit_clip_refs.cjs           report
 *   node tools/moves/audit_clip_refs.cjs --gate    exit 1 if any reference is unresolvable
 *   node tools/moves/audit_clip_refs.cjs --fix     rewrite maps whose key only needs normalising
 *
 * WHY THIS EXISTS. The owner has said for months that combat plays as "physics based ragdoll
 * marionette animations". Walking the world in the harness showed the engine requesting clips and
 * getting 404s -- BRAINBUSTER, SUPLEX, DDT, NECKBREAKER, HURRICANERANA and more. A move whose clip
 * 404s does not fail loudly; it silently falls back to procedural posing, which is EXACTLY the
 * marionette look being reported. Nothing counted these, so nothing caught them.
 *
 * The known trap (hit twice before, once on tag moves): the baked index keys a capture
 * DOUBLESUPLEX while a map carries DoubleSuplex. Comparing raw strings silently finds nothing
 * wrong. Normalise before comparing, always.
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const MOVES = path.join(REPO, 'assets', 'moves');
const CLIPDIR = path.join(MOVES, 'clips');
const GATE = process.argv.includes('--gate');
const FIX = process.argv.includes('--fix');

// the engine's own normalisation: upper, non-alphanumerics collapsed to _
const norm = s => String(s).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// ---- what exists on disk ----
const onDisk = new Set();
const byNorm = new Map();
for (const f of fs.readdirSync(CLIPDIR)) {
  if (!f.endsWith('.json') || f === 'index.json') continue;
  const key = f.slice(0, -5);
  onDisk.add(key);
  const n = norm(key);
  if (!byNorm.has(n)) byNorm.set(n, []);
  byNorm.get(n).push(key);
}

// ---- every clip reference, and WHERE it came from ----
// A reference is any string that names a clip. Maps differ in shape, so pull values by the field
// names that actually carry a clip key rather than assuming one schema.
const refs = new Map();   // key -> Set(source)
const add = (k, src) => {
  if (!k || typeof k !== 'string') return;
  if (!/^[A-Za-z0-9_\- ()]+$/.test(k)) return;
  if (!refs.has(k)) refs.set(k, new Set());
  refs.get(k).add(src);
};
const CLIP_FIELDS = ['clip', 'clipKey', 'capture', 'fbx', 'key', 'src', 'anim', 'animation', 'recv', 'receiver'];
function walk(node, src, depth) {
  if (depth > 8 || node == null) return;
  if (Array.isArray(node)) { node.forEach(v => walk(v, src, depth + 1)); return; }
  if (typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'string' && CLIP_FIELDS.includes(k)) add(v, src);
    else if (v && typeof v === 'object') walk(v, src, depth + 1);
  }
}

const MAPS = ['combat_clip_map.json', 'move_clip_map.json', 'roster_movesets.json', 'tag_moves.json',
  'pin_moves.json', 'authored_clips.json', 'move_variants.json', 'bannon_move_library.json'];
for (const m of MAPS) {
  const p = path.join(MOVES, m);
  if (!fs.existsSync(p)) continue;
  let j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { console.error('unreadable: ' + m); continue; }
  // combat_clip_map / move_clip_map are flat {moveName: clipKey}
  if (j && typeof j === 'object' && !Array.isArray(j)) {
    for (const [k, v] of Object.entries(j)) {
      if (typeof v === 'string') add(v, m);
      else walk(v, m, 0);
    }
  } else walk(j, m, 0);
}

// ---- classify ----
const missing = [], fixable = [];
for (const [k, srcs] of refs) {
  if (onDisk.has(k)) continue;
  const n = norm(k);
  const cands = byNorm.get(n) || [];
  if (cands.length) fixable.push({ ref: k, becomes: cands[0], srcs: [...srcs] });
  else missing.push({ ref: k, srcs: [...srcs] });
}

console.log('CLIP REFERENCE AUDIT');
console.log('  clips on disk          : ' + onDisk.size);
console.log('  distinct clip refs      : ' + refs.size);
console.log('  resolve directly        : ' + (refs.size - fixable.length - missing.length));
console.log('  resolve only after norm : ' + fixable.length + (fixable.length ? '   <-- silent 404s today' : ''));
console.log('  NO CLIP AT ALL          : ' + missing.length);

if (fixable.length) {
  console.log('\n-- NAME-NORMALISATION MISSES (the file is there under another spelling) --');
  fixable.slice(0, 40).forEach(f => console.log('   ' + f.ref.padEnd(34) + ' -> ' + f.becomes.padEnd(34) + ' [' + f.srcs.join(',') + ']'));
  if (fixable.length > 40) console.log('   ... +' + (fixable.length - 40) + ' more');
}
if (missing.length) {
  console.log('\n-- GENUINELY ABSENT (needs a capture or a remap) --');
  missing.slice(0, 60).forEach(f => console.log('   ' + f.ref.padEnd(34) + ' [' + f.srcs.join(',') + ']'));
  if (missing.length > 60) console.log('   ... +' + (missing.length - 60) + ' more');
}

if (FIX && fixable.length) {
  // rewrite ONLY the exact strings that normalise onto a real file. Never invents a mapping, never
  // drops one -- if it does not normalise to something real it is left alone and reported above.
  const map = new Map(fixable.map(f => [f.ref, f.becomes]));
  let touched = 0;
  for (const m of MAPS) {
    const p = path.join(MOVES, m);
    if (!fs.existsSync(p)) continue;
    let raw = fs.readFileSync(p, 'utf8');
    const before = raw;
    for (const [from, to] of map) {
      raw = raw.split('"' + from + '"').join('"' + to + '"');
    }
    if (raw !== before) { fs.writeFileSync(p, raw); touched++; console.log('   rewrote ' + m); }
  }
  console.log('\n  --fix rewrote ' + touched + ' map file(s)');
}

if (GATE && (missing.length || fixable.length)) {
  console.error('\nGATE FAIL: ' + (fixable.length + missing.length) + ' clip references do not resolve.');
  process.exit(1);
}
