#!/usr/bin/env node
/* rig_audit.cjs — every character model, how many bones its rig actually has, and whether that is
 * enough to deform a human body without smearing.
 *
 *   node tools/model_diag/rig_audit.cjs            # audit assets/models
 *   node tools/model_diag/rig_audit.cjs --gate     # exit 1 if any wired model is under-boned
 *
 * WHY. Owner: "make sure all the damn models have the correct amount of bones in their damn rig."
 * He is right that this is the root of the deformation, and the evidence backs him: VIPER carries a
 * 16-JOINT skin.cjs rig -- Hips, Head, LeftArm, LeftForeArm and little else. No spine chain, no
 * shoulders, no hand or foot links. With 16 joints there is no intermediate joint to carry the
 * torso, so the rigger hands a torso vertex 61% Spine and 39% LeftUpLeg because those are simply
 * the nearest things it has. Cross-body weights are the SYMPTOM; the coarse rig is the disease.
 *
 * This reads the GLB directly -- no browser, no GPU -- so it can sweep the whole roster in seconds.
 *
 * THRESHOLDS, and why:
 *   >= 24  a real humanoid rig. Mixamo ships 65; UniRig gives us 28. Spine chain, both clavicles,
 *          full arm and leg chains, hands and feet all get their own joint.
 *   16-23  UNDER-BONED. Deformable, but the torso and shoulders have nothing to bend around, which
 *          is exactly the smearing being reported.
 *   < 16   the skin.cjs signature. Documented in CLAUDE.md as catastrophic (p95 0.3131 on the
 *          Heavyweight before it was re-rigged by weight transfer).
 *   none   no skin at all: a rigid prop or an un-rigged Tripo dump. Cannot animate.
 *
 * The documented fix for anything below the bar is tools/model_diag/transfer_weights.cjs from a
 * model that already passes -- that is what beat a degraded UniRig service for the Heavyweight and
 * what took VIPER from a 16-joint rig to 28.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const DIR = path.join(REPO, 'assets', 'models');
const GATE = process.argv.includes('--gate');
const GOOD = 24, POOR = 16;

function readGLB(p) {
  const b = fs.readFileSync(p);
  if (b.length < 12 || b.readUInt32LE(0) !== 0x46546C67) return null;
  let off = 12, json = null;
  while (off + 8 <= b.length) {
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    if (type === 0x4E4F534A) { try { json = JSON.parse(b.slice(off + 8, off + 8 + len).toString('utf8')); } catch (e) { return null; } break; }
    off += 8 + len + ((4 - len % 4) % 4);
  }
  return json;
}

// which models the game actually wires — a broken rig on a file nothing loads is not urgent
let wired = new Set();
try {
  const html = fs.readFileSync(path.join(REPO, 'BANNON_v150.html'), 'utf8');
  const re = /([A-Za-z0-9_\-]+\.glb)/g; let m;
  while ((m = re.exec(html))) wired.add(m[1]);
} catch (e) {}

const rows = [];
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.glb')) continue;
  const j = readGLB(path.join(DIR, f));
  if (!j) { rows.push({ f, err: 'unreadable' }); continue; }
  const skins = j.skins || [];
  const joints = skins.reduce((a, s) => a + (s.joints ? s.joints.length : 0), 0);
  let verts = 0;
  (j.meshes || []).forEach(me => (me.primitives || []).forEach(p => {
    const a = j.accessors[p.attributes.POSITION]; if (a) verts += a.count;
  }));
  // does the rig have the joints a humanoid needs? derived from the node NAMES present, which is a
  // hint only -- the count above is the measurement.
  const names = (j.nodes || []).map(n => (n.name || '').toLowerCase());
  const has = re => names.some(n => re.test(n));
  const parts = {
    spineChain: names.filter(n => /spine/.test(n)).length >= 2,
    clavicles: has(/clav|shoulder/),
    hands: has(/hand/),
    feet: has(/foot|toe/),
    neck: has(/neck/)
  };
  rows.push({ f, joints, skins: skins.length, verts, parts,
    wired: wired.has(f), mb: +(fs.statSync(path.join(DIR, f)).size / 1048576).toFixed(1) });
}

rows.sort((a, b) => (a.joints || 0) - (b.joints || 0));
const grade = r => r.joints == null ? '?' : r.joints === 0 ? 'NO SKIN' : r.joints < POOR ? 'skin.cjs' : r.joints < GOOD ? 'UNDER' : 'ok';

console.log('RIG AUDIT — ' + rows.length + ' models in assets/models\n');
console.log('  bones  verts     MB  wired  missing                         model');
let bad = 0;
for (const r of rows) {
  if (r.err) { console.log('  ' + 'ERR'.padStart(5) + '                          ' + r.f + '  (' + r.err + ')'); continue; }
  const g = grade(r);
  const miss = r.joints ? Object.entries(r.parts).filter(([, v]) => !v).map(([k]) => k).join(',') : '';
  const flag = (g === 'ok') ? '   ' : '>> ';
  if (g !== 'ok' && r.wired) bad++;
  console.log(flag + String(r.joints).padStart(4) + '  ' + String(r.verts).padStart(7)
    + ' ' + String(r.mb).padStart(6) + '  ' + (r.wired ? ' yes ' : '  .  ') + '  '
    + (miss || '-').padEnd(30) + '  ' + r.f + (g === 'ok' ? '' : '   [' + g + ']'));
}
const wiredBad = rows.filter(r => !r.err && r.wired && grade(r) !== 'ok');
console.log('\n  ok(>=' + GOOD + ' bones): ' + rows.filter(r => grade(r) === 'ok').length
  + '   under(' + POOR + '-' + (GOOD - 1) + '): ' + rows.filter(r => grade(r) === 'UNDER').length
  + '   skin.cjs(<' + POOR + '): ' + rows.filter(r => grade(r) === 'skin.cjs').length
  + '   no skin: ' + rows.filter(r => grade(r) === 'NO SKIN').length);
console.log('  WIRED INTO THE GAME AND UNDER-BONED: ' + wiredBad.length);
wiredBad.forEach(r => console.log('     ' + r.f + '  (' + r.joints + ' bones)'));
console.log('\n  fix: node tools/model_diag/transfer_weights.cjs assets/models/BANNON_rigged.glb assets/models/<M>.glb assets/models/<M>_rig28.glb');
if (GATE && wiredBad.length) process.exit(1);
