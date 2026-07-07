#!/usr/bin/env node
/* BANNON INTEGRITY GUARD — catches the "merge clobbered newer work" failure.
 * The game lives in one file (BANNON_v150.html). When CODEDUMMY (or any tool)
 * merges an OLDER baseline of that file forward, it silently drops thousands of
 * lines of newer systems. This asserts (a) a minimum line count and (b) that every
 * named system's SENTINEL string is still present. Add a sentinel here the moment
 * you ship a system, so a future clobber fails loudly instead of shipping.
 * Run: node scripts/verify_integrity.cjs   (exit 1 on any missing system)
 */
const fs = require('fs');
const F = 'BANNON_v150.html';
const src = fs.readFileSync(F, 'utf8');
const lines = src.split('\n').length;

const MIN_LINES = 33000;   // raise this as the file legitimately grows; never let a merge sink below it
const SENTINELS = [
  ['multi-man match engine',      'MATCH RULES + MULTI-MAN ENGINE'],
  ['menu multi-slots',            'MULTI_TYPES'],
  ['per-slot payback/manager',    'PER-SLOT STATE'],
  ['ring-post env contact',       'ENV CONTACT'],
  ['2K reversal',                 '__tryReversal'],
  ['stun mash-out',               '__stunMash'],
  ['signature/finisher bank',     '_finBank'],
  ['named finishers',             'FINISHER_MOVES'],
  ['Marquis persona stack',       'MARQUIS_PERSONAS'],
  ["Bannon canon finisher",       'THE STRUCTURAL COLLAPSE'],
  ['full canon roster seeding',   '_ARCH_STATS'],
  ['broadcast color grade',       'BROADCAST_GRADE'],
  ['arena rope instancing',       '__ropeIM'],
  ['crowd instancing',            '__crowdIMs'],
  ['mesh density knobs',          'BBODY_SUB'],
  ['anatomical muscle relief',    'ANATOMICAL ARM RELIEF'],
  ['weight-strike tuning',        'strikeMass'],
  ['PD grapple coupling',         'PD LOAD COUPLING'],
  ['grounded facing zones',       'groundFacingOf'],
  ['vault variants',              '_vaultPending'],
  ['GLB import binding',          '_bindFighterGltf'],
  ['DNA-CAW save/load',           'BANNON_DNA'],
  ['joint crease relief',         'ELBOW CREASE'],
  ['AAA base body library',       'Wrestler Base (AAA)'],
  ['high-end aerial catalog',     'HIGH-END AERIAL CATALOG'],
  ['corner back arsenal',         'CORNER BACK vs FRONT'],
  ['struggle-lift physics',       'STRUGGLE-LIFT'],
  ['any-move-any-position',       'resolveGrapPos'],
];

let bad = [];
if (lines < MIN_LINES) bad.push(`LINE COUNT ${lines} < ${MIN_LINES} (a merge likely reverted to an older baseline)`);
for (const [name, needle] of SENTINELS) if (src.indexOf(needle) < 0) bad.push(`MISSING system: ${name}  (sentinel "${needle}")`);

// index.html IS the served/played game (server.ts sendFile). It must stay in SYNC with the canonical
// BANNON_v150.html — the bug where index.html sat at an old v116 (no BANNON_DNA, none of the newer
// systems) is exactly why "none of the upgrades ever hit" and the freeze persisted. Guard it: it must
// exist, not sink below the line floor, and carry the newer-engine sentinels.
try {
  const idx = fs.readFileSync('index.html', 'utf8');
  const idxLines = idx.split('\n').length;
  if (idxLines < MIN_LINES) bad.push(`index.html LINE COUNT ${idxLines} < ${MIN_LINES} — the PLAYED file reverted to an older build (this is the "upgrades never hit" bug)`);
  for (const needle of ['BANNON_DNA', 'mkEye', 'equippedMoves']) if (idx.indexOf(needle) < 0) bad.push(`index.html MISSING "${needle}" — the played file is a stale build; re-sync it from BANNON_v150.html`);
} catch (e) { bad.push('index.html MISSING — the served game file is gone'); }

if (bad.length) {
  console.error('\n✗ BANNON INTEGRITY CHECK FAILED — a merge/edit dropped shipped work:\n');
  bad.forEach(b => console.error('   ' + b));
  console.error('\nDo NOT push. Recover the file (git checkout <last-good-commit> -- ' + F + ') and re-merge properly.\n');
  process.exit(1);
}
console.log(`✓ BANNON integrity OK — ${lines} lines, ${SENTINELS.length}/${SENTINELS.length} systems present.`);
