#!/usr/bin/env node
/* BANNON SELF-HEAL — the counter-layer for the "AI-Studio clobbered the game / shipped a broken stub"
 * problem. verify_integrity.cjs only DETECTS a clobber; this REPAIRS it automatically.
 *
 * On every push (guard.yml), this:
 *   1. Checks the current BANNON_v150.html for HEALTH: line floor + every shipped SENTINEL + all
 *      inline <script> blocks parse + not a stub.
 *   2. If healthy → make sure index.html / public/index.html are byte-identical copies (re-sync if not).
 *   3. If BROKEN → walk git history for BANNON_v150.html, find the most recent commit whose version is
 *      healthy, restore that file to all three entry points, and (in CI) commit + push a [heal] fix.
 *
 * This means a bad merge / stub-swap on main SELF-REPAIRS within one CI run instead of shipping a dead
 * game. Run: node scripts/heal_clobber.cjs [--write]   (--write restores files; without it, dry-run report)
 */
const fs = require('fs');
const cp = require('child_process');

const F = 'BANNON_v150.html';
const MIN_LINES = 39000;
const SENTINELS = [
  'MATCH RULES + MULTI-MAN ENGINE', 'FINISHER_MOVES', 'MARQUIS_PERSONAS', 'THE STRUCTURAL COLLAPSE',
  '_ARCH_STATS', 'BROADCAST_GRADE', '_bindFighterGltf', 'BANNON_DNA', 'resolveGrapPos',
  'BANNON_LEGACY', 'BANNON_JUKEBOX', 'BANNON_WEAPONS_CATALOG', '_modelReqId',
];
// A file is a STUB if it's tiny, or it's mostly print/cout narrative with no real game systems.
function health(src) {
  if (!src) return { ok: false, reason: 'empty' };
  const lines = src.split('\n').length;
  if (lines < MIN_LINES) return { ok: false, reason: `line count ${lines} < ${MIN_LINES}` };
  for (const s of SENTINELS) if (src.indexOf(s) < 0) return { ok: false, reason: `missing sentinel "${s}"` };
  // syntax: every inline <script> must parse (top-level-await is a known false positive)
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi; let m, bad = 0;
  while ((m = re.exec(src))) { try { new Function(m[1]); } catch (e) { if (!/await is only valid|reserved word/.test(e.message)) bad++; } }
  if (bad > 0) return { ok: false, reason: `${bad} script block(s) fail to parse` };
  return { ok: true, lines };
}

const WRITE = process.argv.includes('--write');
const cur = fs.existsSync(F) ? fs.readFileSync(F, 'utf8') : '';
const h = health(cur);

if (h.ok) {
  // healthy — enforce the copies stay in sync (a divergent index.html is the "upgrades never hit" bug)
  let resynced = [];
  for (const dst of ['index.html', 'public/index.html']) {
    try { if (fs.readFileSync(dst, 'utf8') !== cur) { if (WRITE) fs.writeFileSync(dst, cur); resynced.push(dst); } }
    catch (e) { if (WRITE) fs.writeFileSync(dst, cur); resynced.push(dst); }
  }
  if (resynced.length) console.log(`✓ game healthy (${h.lines} lines); re-synced copies: ${resynced.join(', ')}${WRITE ? '' : ' (dry-run)'}`);
  else console.log(`✓ game healthy (${h.lines} lines); all entry points in sync.`);
  process.exit(0);
}

// BROKEN — find the last-good version in history and restore it
console.error(`✗ ${F} is BROKEN: ${h.reason}. Searching history for the last healthy version…`);
let commits = [];
try { commits = cp.execSync(`git log --format=%H -n 200 -- ${F}`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean); }
catch (e) { console.error('cannot read git history:', e.message); process.exit(2); }

for (const c of commits) {
  let blob;
  try { blob = cp.execSync(`git show ${c}:${F}`, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }); } catch (e) { continue; }
  const bh = health(blob);
  if (bh.ok) {
    console.error(`→ last healthy ${F}: commit ${c.slice(0, 8)} (${bh.lines} lines).`);
    if (WRITE) {
      fs.writeFileSync(F, blob); fs.writeFileSync('index.html', blob);
      try { fs.writeFileSync('public/index.html', blob); } catch (e) {}
      console.error(`✓ HEALED — restored ${F} + index.html + public/index.html from ${c.slice(0, 8)}.`);
    } else {
      console.error(`(dry-run) would restore from ${c.slice(0, 8)} — re-run with --write.`);
    }
    process.exit(WRITE ? 10 : 1);   // exit 10 = a heal was written (guard.yml commits it)
  }
}
console.error('✗ no healthy version found in the last 200 commits — manual recovery needed.');
process.exit(2);
