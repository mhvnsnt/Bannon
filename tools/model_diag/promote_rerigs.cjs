#!/usr/bin/env node
/* promote_rerigs.cjs — replace a shipped model with its 28-joint re-rig ONLY if the numbers improve.
 *
 *   node tools/model_diag/promote_rerigs.cjs --dry     # what would move, and why
 *   node tools/model_diag/promote_rerigs.cjs           # promote the ones that earned it
 *
 * MODEL_QA law: never promote on a screenshot, promote on the number. And the number that matters
 * for the defect the owner photographed is MAX residual, not p95 -- a stretched sheet is a handful
 * of vertices, and p95 cannot see 0.1% of a mesh. VIPER scored p95 0.044 PASS while visibly broken.
 *
 * So the gate here is:
 *   * joints must go UP (that is the whole point -- 16 cannot deform a torso)
 *   * MAX residual must not get worse
 *   * the mesh must still have all four key bone groups driving it
 * Anything that fails is left alone and reported, never quietly shipped.
 *
 * No backup copies are written. Git history is the backup, and duplicating 60 models to be safe
 * would double the repo for nothing.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const DIR = path.join(REPO, 'assets', 'models');
const DRY = process.argv.includes('--dry');

const pairs = fs.readdirSync(DIR)
  .filter(f => f.endsWith('_rig28.glb'))
  .map(f => ({ rig: f, orig: f.replace(/_rig28\.glb$/, '.glb') }))
  .filter(p => fs.existsSync(path.join(DIR, p.orig)));

if (!pairs.length) { console.log('no *_rig28.glb pairs found'); process.exit(0); }
console.log('candidates: ' + pairs.length);

// one skinqa run over everything — booting a browser per model would take an hour
const files = [];
pairs.forEach(p => { files.push(p.orig, p.rig); });
let out = '';
try {
  out = execFileSync('/opt/node22/bin/node', [path.join(__dirname, 'skinqa.cjs'), ...files],
    { encoding: 'utf8', maxBuffer: 1 << 28, env: Object.assign({}, process.env, { NODE_PATH: '/opt/node22/lib/node_modules' }) });
} catch (e) { out = (e.stdout || '') + (e.stderr || ''); }

const stats = {};
out.split('\n').forEach(line => {
  const m = line.match(/^(PASS|WEAK|FAIL|ERR)\s+(\S+)\s+(\{.*\})\s*$/);
  if (!m) return;
  try { stats[m[2]] = Object.assign({ verdict: m[1] }, JSON.parse(m[3])); } catch (e) {}
});

let promoted = 0, held = 0;
for (const p of pairs) {
  const a = stats[p.orig], b = stats[p.rig];
  if (!a || !b) { console.log('  ?  ' + p.orig + '  (no measurement: orig=' + !!a + ' rig=' + !!b + ')'); held++; continue; }
  const jointsUp = (b.joints || 0) > (a.joints || 0);
  const maxOk = (b.max != null && a.max != null) ? (b.max <= a.max + 1e-6) : false;
  const bonesOk = b.keyBones && b.keyBones.lArm && b.keyBones.rArm && b.keyBones.spine && b.keyBones.lLeg;
  const ok = jointsUp && maxOk && bonesOk;
  const why = 'joints ' + a.joints + '->' + b.joints
    + '  max ' + (a.max != null ? a.max.toFixed(4) : '?') + '->' + (b.max != null ? b.max.toFixed(4) : '?')
    + '  p95 ' + (a.p95 != null ? a.p95.toFixed(4) : '?') + '->' + (b.p95 != null ? b.p95.toFixed(4) : '?');
  if (!ok) {
    console.log('  HOLD ' + p.orig.padEnd(34) + why
      + (jointsUp ? '' : '  [joints did not increase]')
      + (maxOk ? '' : '  [max residual got WORSE]')
      + (bonesOk ? '' : '  [key bones not driven]'));
    held++;
    continue;
  }
  console.log('  ' + (DRY ? 'would ' : '') + 'PROMOTE ' + p.orig.padEnd(30) + why);
  if (!DRY) {
    fs.copyFileSync(path.join(DIR, p.rig), path.join(DIR, p.orig));
    fs.unlinkSync(path.join(DIR, p.rig));
  }
  promoted++;
}
console.log('\n  ' + (DRY ? 'would promote ' : 'promoted ') + promoted + ', held ' + held);
if (!DRY && promoted) console.log('  re-gate: node tools/model_diag/rig_audit.cjs');
