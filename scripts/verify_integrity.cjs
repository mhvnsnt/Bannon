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
];

let bad = [];
if (lines < MIN_LINES) bad.push(`LINE COUNT ${lines} < ${MIN_LINES} (a merge likely reverted to an older baseline)`);
for (const [name, needle] of SENTINELS) if (src.indexOf(needle) < 0) bad.push(`MISSING system: ${name}  (sentinel "${needle}")`);

if (bad.length) {
  console.error('\n✗ BANNON INTEGRITY CHECK FAILED — a merge/edit dropped shipped work:\n');
  bad.forEach(b => console.error('   ' + b));
  console.error('\nDo NOT push. Recover the file (git checkout <last-good-commit> -- ' + F + ') and re-merge properly.\n');
  process.exit(1);
}
console.log(`✓ BANNON integrity OK — ${lines} lines, ${SENTINELS.length}/${SENTINELS.length} systems present.`);
