#!/usr/bin/env node
/* classify_tag_moves.cjs — WHICH CAPTURES ARE ACTUALLY TAG MOVES, counted rather than guessed.
 *
 *   node tools/moves/classify_tag_moves.cjs            # report
 *   node tools/moves/classify_tag_moves.cjs --write    # bank assets/moves/tag_moves.json
 *   node tools/moves/classify_tag_moves.cjs --gate     # non-zero if the manifest is stale
 *
 * WHY THIS IS NOT A NAME MATCH
 * Owner: "DOUBLESUPLEX and ASSISTEDDIVSENTON sound like tag moves and there's probably others u
 * should have put in the tag category". He is right on both, and on there being others — but the
 * obvious rule (anything called DOUBLE* or ASSISTED*) is wrong in both directions:
 *
 *   DOUBLE_LEG_TAKEDOWN   one wrestler, and the "double" is his opponent's TWO LEGS.
 *   DOUBLE_AXE_HANDLE     one wrestler, his own two arms.
 *   HAMMERLOCKDDT         no "double" or "assist" in the name; 519 animated bones, which LOOKS like
 *                         a crowd — but only TWO of them are body rigs. It is a singles move.
 *   STRONGZERO            no "double" or "assist" in the name either, and it is a genuine
 *                         three-man capture that a name rule would have missed entirely.
 *
 * WHAT IS ACTUALLY MEASURED (owner LAW #5: "TAG moves detected by # skeletons in the FBX")
 * Each baked clip carries its full bone table. Count the distinct SKELETON ROOTS in it:
 *
 *   J_Hips, J_Hips_2, J_Hips_3 ...   one per BODY in the capture
 *   C_Hips, C_Hips_2 ...             CLOTH rigs, not people — excluded, and this is the whole
 *                                    reason HAMMERLOCKDDT reads as 3 roots but 2 bodies
 *
 *   1 body   = solo (a taunt, a stance)
 *   2 bodies = attacker + victim — an ordinary singles grapple. CHOKESLAM, TOMBSTONE, SHARPSHOOTER.
 *   3+ bodies = TWO ATTACKERS ON ONE VICTIM = a tag move.
 *
 * The count is the classification. No name is consulted for the verdict; names only label the
 * output so a human can read it.
 */
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const CLIPS = path.join(REPO, 'assets', 'moves', 'clips');
const OUT = path.join(REPO, 'assets', 'moves', 'tag_moves.json');

// the suffixes harvest.py adds when it derives a variant — the variants inherit the base's rig count
const VARIANT_RX = /_(DELAYED|HARD|KNEELING|MIRROR|SITOUT|SLOW|SNAP)$/;

// A body root. `J_` is the joint/skeleton prefix in these captures; `C_` is cloth. mixamorig and a
// bare `Hips` are here so a future drop-in from a different pipeline still classifies.
function isBodyRoot(bone) {
  const b = String(bone);
  if (/^C_/.test(b)) return false;                       // cloth rig, not a person
  return /^J_Hips(_\d+)?$/.test(b) ||
         /^mixamorig\d*:Hips$/.test(b) ||
         /^Hips(_\d+)?$/.test(b) ||
         /^(Armature\d*\|)?Hips$/.test(b);
}

function bodiesIn(file) {
  let d;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
  const frames = d && d.keys;
  if (!Array.isArray(frames) || !frames.length) return null;
  const bones = frames[0] && frames[0].bones;
  if (!bones || typeof bones !== 'object') return null;
  const roots = Object.keys(bones).filter(isBodyRoot);
  return { bodies: roots.length, roots: roots, boneCount: Object.keys(bones).length };
}

function main() {
  const write = process.argv.includes('--write');
  const gate = process.argv.includes('--gate');

  let idx;
  try { idx = JSON.parse(fs.readFileSync(path.join(CLIPS, 'index.json'), 'utf8')); }
  catch (e) { console.error('no baked clip index at ' + CLIPS); process.exit(2); }

  // Only clips with a real bone table are worth opening. The vast majority of the 833 baked clips
  // are single-body retargets whose index entry records a small bone count; reading every one of
  // them costs seconds for no new information, so the cheap index number gates the expensive read.
  // The threshold is deliberately far below the smallest two-body capture (~496).
  const CANDIDATE_BONES = 150;

  const scanned = [];
  for (const name of Object.keys(idx)) {
    const e = idx[name];
    if (!e || !e.file) continue;
    if ((e.bones || 0) < CANDIDATE_BONES) continue;
    const r = bodiesIn(path.join(CLIPS, e.file));
    if (!r) continue;
    scanned.push({ clip: name, base: name.replace(VARIANT_RX, ''), variant: VARIANT_RX.test(name),
                   bodies: r.bodies, roots: r.roots, bones: r.boneCount, src: e.src || null });
  }

  // group by base capture — every derived variant is the same rig
  const byBase = {};
  scanned.forEach(s => {
    const b = byBase[s.base] = byBase[s.base] || { base: s.base, bodies: 0, roots: [], clips: [], src: s.src };
    if (s.bodies > b.bodies) { b.bodies = s.bodies; b.roots = s.roots; }
    b.clips.push(s.clip);
  });

  // Pull in the DERIVED VARIANTS of each base. harvest.py re-bakes _DELAYED/_HARD/_SNAP/... leaner,
  // so their index bone counts fall under the candidate threshold and they never get opened — but a
  // variant of a three-body capture is a three-body move by construction. This is lineage, not a
  // name guess: the BASE was classified by measurement first, and only then do its own children
  // inherit the verdict.
  Object.keys(idx).forEach(name => {
    if (!VARIANT_RX.test(name)) return;
    const base = name.replace(VARIANT_RX, '');
    const b = byBase[base];
    if (b && b.clips.indexOf(name) < 0) b.clips.push(name);
  });

  const bases = Object.values(byBase).sort((a, b) => b.bodies - a.bodies || a.base.localeCompare(b.base));
  const tag = bases.filter(b => b.bodies >= 3);
  const pair = bases.filter(b => b.bodies === 2);
  const solo = bases.filter(b => b.bodies <= 1);

  console.log('TAG MOVE CLASSIFICATION — by body-rig count, not by name');
  console.log('='.repeat(76));
  console.log('scanned ' + scanned.length + ' clips over ' + bases.length + ' base captures ' +
              '(of ' + Object.keys(idx).length + ' baked clips; the rest are single-body)');
  console.log('');
  console.log('TAG  (3+ bodies = two attackers on one victim) — ' + tag.length + ' captures, ' +
              tag.reduce((n, b) => n + b.clips.length, 0) + ' clips with variants');
  tag.forEach(b => console.log('   ' + b.base.padEnd(30) + b.bodies + ' bodies   ' +
    b.clips.length + ' clips   ' + b.roots.join(',')));
  console.log('');
  console.log('SINGLES (2 bodies = attacker + victim) — ' + pair.length + ' captures');
  console.log('   ' + pair.map(b => b.base).join(', '));
  if (solo.length) { console.log(''); console.log('SOLO (1 body) — ' + solo.map(b => b.base).join(', ')); }

  // names a naive rule would have got wrong, called out so the next person does not re-introduce it
  const nameRule = /DOUBLE|ASSIST|TAG|STEREO|TANDEM|PARTNER/i;
  const falsePos = pair.concat(solo).filter(b => nameRule.test(b.base)).map(b => b.base);
  const falseNeg = tag.filter(b => !nameRule.test(b.base)).map(b => b.base);
  console.log('');
  console.log('WHY NOT A NAME MATCH:');
  console.log('  a name rule would WRONGLY tag: ' + (falsePos.length ? falsePos.join(', ') : '(none in this set)'));
  console.log('  a name rule would MISS:        ' + (falseNeg.length ? falseNeg.join(', ') : '(none)'));

  const manifest = {
    _note: 'AUTO-GENERATED by tools/moves/classify_tag_moves.cjs. A capture is a TAG move when it ' +
           'contains 3+ BODY skeleton roots (J_Hips*) — two attackers and a victim. C_Hips* are ' +
           'cloth rigs and are not counted. Never classify these by name: DOUBLE_LEG_TAKEDOWN is ' +
           'one wrestler and STRONGZERO is a real three-man capture with neither word in its name.',
    generated: new Date().toISOString().slice(0, 10),
    rule: '3+ body skeleton roots',
    tagCaptures: tag.length,
    tagClips: tag.reduce((n, b) => n + b.clips.length, 0),
    tag: tag.map(b => ({ base: b.base, bodies: b.bodies, clips: b.clips.sort(), src: b.src })),
    singles: pair.map(b => b.base),
    solo: solo.map(b => b.base)
  };

  if (write) {
    fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1));
    console.log('\nwrote ' + path.relative(REPO, OUT));
  }
  if (gate) {
    let cur = null;
    try { cur = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) {}
    const same = cur && JSON.stringify(cur.tag) === JSON.stringify(manifest.tag);
    if (!same) { console.error('\nGATE FAILED — tag_moves.json is stale; run with --write'); process.exit(1); }
    console.log('\nGATE OK — manifest matches the clips on disk');
  }
}

main();
