#!/usr/bin/env node
/* clip_deform_qa.cjs — game-agnostic per-frame deformation QA for animated GLBs.
 *
 * Plays the embedded animation clip(s) of any skinned GLB headlessly (pure-JS
 * LBS, same math as the repair program's qa_pose.cjs) and reports, per frame:
 *   p95 residual vs rigid bone-follow, spike triangles (>2.5x edge stretch),
 *   worst spike ratio. Plus motion sanity: hips bob range and foot travel —
 *   proving the clip actually moves the model instead of playing frozen.
 * Spike attribution: worst frames list the top spiking joints by name.
 *
 * This is the "fight-ready" proof: a model passes when a full walk/strike
 * plays without the mesh tearing (the Cronenberg test), not just a static pose.
 *
 * Usage:
 *   node clip_deform_qa.cjs <baked.glb> [--clip 0] [--frames 31]
 *
 * Verdict thresholds (calibrated on Bannon roster, portable as guidance):
 *   PASS  spikes/frame p95 < 40 and worst frame spikes < 150
 *   WATCH spikes/frame p95 40-150
 *   FAIL  spikes/frame p95 > 150 or worst spike ratio > 100x on any frame
 *
 * Deps (MIT): @gltf-transform/core, @gltf-transform/extensions, meshoptimizer.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./lib/rigmath.cjs');
const A = require('./lib/animsample.cjs');

function arg(n, d) { const i = process.argv.indexOf(n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; }

async function main() {
  const file = process.argv.slice(2).find(a => !a.startsWith('-'));
  if (!file) { console.error('Usage: node clip_deform_qa.cjs <baked.glb> [--clip 0] [--frames 31]'); process.exit(1); }
  const clipIdx = parseInt(arg('--clip', '0'), 10);
  const nFrames = parseInt(arg('--frames', '31'), 10);

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
  const tracks = A.sampleAnimTracks(doc, clipIdx);
  const hygiene = R.weightHygiene(skin);

  const times = [];
  for (let f = 0; f < nFrames; f++) times.push(tracks.dur * f / Math.max(1, nFrames - 1));

  const frames = [];
  const hipY = [], footL = [], footR = [];
  const jHips = rig.nameToIdx.get('mixamorig:Hips') ?? rig.nameToIdx.get('Hips');
  const jFL = [...rig.nameToIdx.keys()].find(n => /foot.*left|left.*foot/i.test(n));
  const jFR = [...rig.nameToIdx.keys()].find(n => /foot.*right|right.*foot/i.test(n));
  const iFL = jFL !== undefined ? rig.nameToIdx.get(jFL) : -1;
  const iFR = jFR !== undefined ? rig.nameToIdx.get(jFR) : -1;

  for (const t of times) {
    const { localT, localQ } = A.poseAt(rig, tracks, t);
    const W = A.worldMats(rig, localT, localQ);
    const qa = R.deformQA(skin, W, skin.height);
    // attribute spikes to joint names
    const sj = [...qa.spikeJoints.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([ji, c]) => ({ joint: rig.nodes[ji] ? rig.nodes[ji].getName() : '?', tris: c }));
    frames.push({ t: +t.toFixed(3), p95: +qa.p95.toFixed(4), spikes: qa.spikes,
                  worst: +qa.worst.toFixed(1), topJoints: sj });
    if (jHips !== undefined) hipY.push(R.xform(W[jHips], [0,0,0])[1]);
    if (iFL >= 0) footL.push(R.xform(W[iFL], [0,0,0]));
    if (iFR >= 0) footR.push(R.xform(W[iFR], [0,0,0]));
  }

  const spikesArr = frames.map(f => f.spikes).sort((a, b) => a - b);
  const med = spikesArr[Math.floor(spikesArr.length/2)];
  const p95s = spikesArr[Math.floor(spikesArr.length*0.95)];
  const maxWorst = Math.max(...frames.map(f => f.worst));
  const worstFrames = [...frames].sort((a, b) => b.spikes - a.spikes).slice(0, 5);

  const range = (a) => a.length ? +((Math.max(...a) - Math.min(...a)).toFixed(3)) : 0;
  const pathLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += R.dist(pts[i-1], pts[i]); return +s.toFixed(3); };
  const motion = {
    hipsBobY: range(hipY),
    footLTravel: footL.length ? pathLen(footL) : 0,
    footRTravel: footR.length ? pathLen(footR) : 0,
    frozen: range(hipY) < 0.005 && (!footL.length || pathLen(footL) < 0.01),
  };

  let verdict = 'PASS';
  if (motion.frozen) verdict = 'FAIL_FROZEN';
  else if (p95s > 150 || maxWorst > 100) verdict = 'FAIL';
  else if (p95s > 40) verdict = 'WATCH';

  console.log(JSON.stringify({
    file: path.basename(file), clip: tracks.name, dur: +tracks.dur.toFixed(3), frames: nFrames,
    joints: skin.joints.length,
    hygiene, motion,
    spikesMedian: med, spikesP95: p95s, worstRatio: +maxWorst.toFixed(1),
    verdict, worstFrames,
  }, null, 1));
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
