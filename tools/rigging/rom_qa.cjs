#!/usr/bin/env node
/* rom_qa.cjs — game-agnostic procedural range-of-motion deformation QA.
 *
 * Drives each major joint through its range of motion procedurally (no
 * animation data needed) and measures deformation at every step with the
 * same LBS metrics as qa_pose.cjs: spikes (>2.5x edge stretch), p95 residual,
 * worst spike ratio. Reports the worst joint/angle — this is the
 * shoulder/delt-pec twist finder: bad twist shows up as spike clusters on
 * arm-raise and abduction long before a static pose catches the pattern.
 *
 * Joint discovery is by fuzzy name token, so it works on Mixamo, Biped,
 * Tripo, or any custom rig — no game-specific names in this script.
 *
 * Usage: node rom_qa.cjs <model.glb> [--steps 5]
 * Output: JSON { file, joints, perJoint:[{joint, worstSpikes, worstP95, worstAngle, worstRatio}], verdict }
 *
 * Deps (MIT): @gltf-transform/core, @gltf-transform/extensions, meshoptimizer.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./lib/rigmath.cjs');
const A = require('./lib/animsample.cjs');

function arg(n, d) { const i = process.argv.indexOf(n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; }

/* Joint test groups: tokens to find the joint, axes/angles to sweep. */
const GROUPS = [
  { name: 'shoulder/arm', tokens: ['shoulder', 'arm'], not: ['fore', 'hand'],
    tests: [ {axis:[1,0,0], angles:[-70,-35,35]}, {axis:[0,0,1], angles:[-45,45]}, {axis:[0,1,0], angles:[-30,30]} ] },
  { name: 'forearm/elbow', tokens: ['fore'], tests: [ {axis:[1,0,0], angles:[-90,-45]} ] },
  { name: 'hip/upleg', tokens: ['upleg', 'thigh', 'hip'], not: ['hips'],
    tests: [ {axis:[1,0,0], angles:[-45,45]}, {axis:[0,0,1], angles:[-30,30]} ] },
  { name: 'knee/leg', tokens: ['leg', 'shin', 'knee', 'calf'], not: ['upleg', 'thigh'],
    tests: [ {axis:[1,0,0], angles:[-90,90]} ] },
  { name: 'spine', tokens: ['spine', 'chest', 'pelvis'], not: ['hips'],
    tests: [ {axis:[0,1,0], angles:[-25,25]}, {axis:[1,0,0], angles:[-15,15]} ] },
  { name: 'neck/head', tokens: ['neck', 'head'], tests: [ {axis:[0,1,0], angles:[-30,30]} ] },
  { name: 'hand', tokens: ['hand', 'wrist'], tests: [ {axis:[1,0,0], angles:[-30,30]} ] },
  { name: 'foot', tokens: ['foot', 'ankle'], tests: [ {axis:[1,0,0], angles:[-20,20]} ] },
];

function findJoints(rig, group) {
  const out = [];
  rig.nodes.forEach((n, i) => {
    const nm = n.getName().toLowerCase();
    if (!group.tokens.some(t => nm.includes(t))) return;
    if (group.not && group.not.some(t => nm.includes(t))) return;
    out.push({ i, name: n.getName() });
  });
  return out;
}

async function main() {
  const file = process.argv.slice(2).find(a => !a.startsWith('-'));
  if (!file) { console.error('Usage: node rom_qa.cjs <model.glb> [--steps 5]'); process.exit(1); }

  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const { MeshoptDecoder } = require('meshoptimizer');
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.readBinary(fs.readFileSync(file));
  const skin = R.loadSkin(doc);
  if (!skin) { console.log(JSON.stringify({ file: path.basename(file), error: 'no skin' })); return; }
  const rig = A.rigOf(doc, true);

  const perJoint = [];
  for (const g of GROUPS) {
    for (const { i, name } of findJoints(rig, g)) {
      let wSpikes = 0, wP95 = 0, wRatio = 0, wAngle = null;
      for (const t of g.tests) {
        for (const deg of t.angles) {
          const lq = rig.restQ.map(q => q.slice());
          lq[i] = R.qnorm(R.qmul(R.axisAngle(t.axis, deg), lq[i]));
          const W = A.worldMats(rig, rig.restT, lq);
          const qa = R.deformQA(skin, W, skin.height);
          if (qa.spikes > wSpikes) {
            wSpikes = qa.spikes; wP95 = qa.p95; wRatio = qa.worst;
            wAngle = `${g.name} axis[${t.axis}] ${deg}deg`;
          }
        }
      }
      perJoint.push({ joint: name, group: g.name, worstSpikes: wSpikes,
                      worstP95: +wP95.toFixed(4), worstRatio: +wRatio.toFixed(1), worstAngle: wAngle });
    }
  }
  perJoint.sort((a, b) => b.worstSpikes - a.worstSpikes);
  const top = perJoint[0];
  let verdict = 'PASS';
  if (top && top.worstSpikes > 800) verdict = 'FAIL';
  else if (top && top.worstSpikes > 250) verdict = 'WATCH';

  console.log(JSON.stringify({
    file: path.basename(file), joints: skin.joints.length, verdict,
    perJoint: perJoint.slice(0, 15),
    note: 'worstSpikes = max spike triangles across all ROM steps for that joint',
  }, null, 1));
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
