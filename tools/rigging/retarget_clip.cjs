#!/usr/bin/env node
/* retarget_clip.cjs — game-agnostic animation retargeting (offline).
 *
 * Bakes an animation from a source GLB onto a skinned target GLB and writes
 * a new GLB with the clip embedded on the target's skeleton.
 *
 * Method (rest-pose robust "delta" retarget, no rest-pose matching required):
 *   For each mapped joint pair, per frame:
 *     delta   = srcWorld(t) * conj(srcRestWorld)      # world-space motion delta
 *     dstWorld(t) = delta * dstRestWorld               # same delta, target rest
 *     dstLocal(t) = conj(dstParentWorld(t)) * dstWorld(t)
 * Root translation is copied scaled by skeleton-height ratio (rootMotion: auto).
 *
 * Joint correspondence comes from a portable JSON map (jointmaps/*.json) —
 * no game-specific names in this script. Bannon's proving-ground map:
 * jointmaps/mixamo_to_bannon58.json.
 *
 * Usage:
 *   node retarget_clip.cjs <target.glb> <source_anim.glb> -o <out.glb>
 *     [--map jointmaps/mixamo_to_bannon58.json] [--clip 0] [--fps 30]
 *
 * Deps (MIT): @gltf-transform/core, @gltf-transform/extensions, meshoptimizer.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./lib/rigmath.cjs');
const A = require('./lib/animsample.cjs');

function arg(n, d) { const i = process.argv.indexOf(n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; }

async function loadIO() {
  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const { MeshoptDecoder, MeshoptEncoder } = require('meshoptimizer');
  await MeshoptDecoder.ready; await MeshoptEncoder.ready;
  return new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
}

async function main() {
  const [tgtFile, srcFile] = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const outFile = arg('-o', null);
  if (!tgtFile || !srcFile || !outFile) {
    console.error('Usage: node retarget_clip.cjs <target.glb> <source_anim.glb> -o <out.glb> [--map jointmaps/mixamo_to_bannon58.json] [--clip 0] [--fps 30]');
    process.exit(1);
  }
  const mapFile = arg('--map', path.join(__dirname, 'jointmaps/mixamo_to_bannon58.json'));
  const fps = parseFloat(arg('--fps', '30'));
  const clipIdx = parseInt(arg('--clip', '0'), 10);
  const jmap = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

  const io = await loadIO();
  const tgtDoc = await io.readBinary(fs.readFileSync(tgtFile));
  const srcDoc = await io.readBinary(fs.readFileSync(srcFile));

  const tgt = A.rigOf(tgtDoc, true);
  const src = A.rigOf(srcDoc, false);
  const tracks = A.sampleAnimTracks(srcDoc, clipIdx);

  // skeleton height ratio for root motion (bounding-box height of joint world positions)
  function skelHeight(rig) {
    const W = A.worldQuats(rig, rig.restQ);
    let mn = 1e9, mx = -1e9;
    const P = new Array(rig.nodes.length);
    const wp = (i) => {
      if (P[i] !== undefined) return P[i];
      const p = rig.parent[i];
      const lp = R.xform(R.compose(rig.restT[i], rig.restQ[i], [1,1,1]), [0,0,0]);
      P[i] = p >= 0 ? (() => { const pp = wp(p);
        const r = R.xform(R.q2m(W[p]), lp); return [pp[0]+r[0], pp[1]+r[1], pp[2]+r[2]]; })() : lp;
      return P[i];
    };
    for (let i = 0; i < rig.nodes.length; i++) { const y = wp(i)[1]; if (y < mn) mn = y; if (y > mx) mx = y; }
    return mx - mn;
  }
  const hRatio = skelHeight(tgt) / Math.max(1e-6, skelHeight(src));

  const srcRestW = A.worldQuats(src, src.restQ);
  const tgtRestW = A.worldQuats(tgt, tgt.restQ);

  // mapped pairs
  // mapped pairs (exact name first, then sanitized-name fallback for FBX importers
  // that strip characters like colons: mixamorig:Hips -> mixamorigHips)
  const resolve = (rig, name) => {
    let i = rig.nameToIdx.get(name);
    if (i === undefined) i = rig.normToIdx.get(A.normName(name));
    return i;
  };
  const pairs = [];
  for (const [sName, dName] of Object.entries(jmap.map)) {
    if (dName == null) continue;
    const si = resolve(src, sName), di = resolve(tgt, dName);
    if (si === undefined || di === undefined) continue;
    pairs.push({ si, di, sName, dName });
  }
  const rmSrc = resolve(src, jmap.rootMotion.source);
  const rmDst = resolve(tgt, jmap.rootMotion.target);

  const dur = tracks.dur;
  const nF = Math.max(2, Math.round(dur * fps) + 1);
  const times = []; for (let f = 0; f < nF; f++) times.push(dur * f / (nF - 1));

  // per-frame: sample source locals -> source world -> delta -> target world -> target local
  const outRot = new Map(); // di -> [quats]
  const outPos = new Map(); // di -> [vecs] (root only)
  for (const { di } of pairs) outRot.set(di, []);
  if (rmDst !== undefined) outPos.set(rmDst, []);

  for (const t of times) {
    const srcLocal = src.restQ.map((q, i) => {
      const n = src.nodes[i].getName();
      return A.sampleQuat(tracks.rot.get(n), q, t);
    });
    const srcW = A.worldQuats(src, srcLocal);
    // target world quats via delta
    const tgtW = new Array(tgt.nodes.length);
    for (const { si, di } of pairs) {
      const delta = R.qmul(srcW[si], R.qconj(srcRestW[si]));
      tgtW[di] = R.qnorm(R.qmul(delta, tgtRestW[di]));
    }
    // convert to local top-down
    const tgtLocal = new Array(tgt.nodes.length).fill(null);
    const tOrder = [];
    const vis = (i) => { if (tgtLocal[i] !== null) return; const p = tgt.parent[i]; if (p >= 0) vis(p);
      if (tgtW[i] === undefined) { tgtLocal[i] = tgt.restQ[i]; }
      else {
        const pw = p >= 0 ? (tgtW[p] !== undefined ? tgtW[p] : tgtRestW[p]) : [0,0,0,1];
        tgtLocal[i] = R.qnorm(R.qmul(R.qconj(pw), tgtW[i]));
      }
      tOrder.push(i); };
    for (const { di } of pairs) vis(di);
    for (const { di } of pairs) outRot.get(di).push(tgtLocal[di]);

    // root motion
    if (rmSrc !== undefined && rmDst !== undefined) {
      const sT = A.sampleVec(tracks.pos.get(src.nodes[rmSrc].getName()), src.restT[rmSrc], t);
      const rT = src.restT[rmSrc];
      const d = [(sT[0]-rT[0])*hRatio, (sT[1]-rT[1])*hRatio, (sT[2]-rT[2])*hRatio];
      const base = tgt.restT[rmDst];
      outPos.get(rmDst).push([base[0]+d[0], base[1]+d[1], base[2]+d[2]]);
    }
  }

  // write animation into target doc (reuse existing buffer — GLB allows 0-1)
  const buffers = tgtDoc.getRoot().listBuffers();
  const buffer = buffers.length ? buffers[0] : tgtDoc.createBuffer();
  const anim = tgtDoc.createAnimation(tracks.name + '_retargeted');
  const timesAcc = tgtDoc.createAccessor()
    .setType('SCALAR').setArray(new Float32Array(times)).setBuffer(buffer);
  for (const [di, quats] of outRot) {
    const flat = new Float32Array(quats.length*4);
    quats.forEach((q, i) => flat.set(q, i*4));
    const acc = tgtDoc.createAccessor().setType('VEC4').setArray(flat).setBuffer(buffer);
    const smp = tgtDoc.createAnimationSampler().setInput(timesAcc).setOutput(acc).setInterpolation('LINEAR');
    const ch = tgtDoc.createAnimationChannel().setTargetNode(tgt.nodes[di]).setTargetPath('rotation').setSampler(smp);
    anim.addChannel(ch); anim.addSampler(smp);
  }
  for (const [di, vecs] of outPos) {
    const flat = new Float32Array(vecs.length*3);
    vecs.forEach((v, i) => flat.set(v, i*3));
    const acc = tgtDoc.createAccessor().setType('VEC3').setArray(flat).setBuffer(buffer);
    const smp = tgtDoc.createAnimationSampler().setInput(timesAcc).setOutput(acc).setInterpolation('LINEAR');
    const ch = tgtDoc.createAnimationChannel().setTargetNode(tgt.nodes[di]).setTargetPath('translation').setSampler(smp);
    anim.addChannel(ch); anim.addSampler(smp);
  }

  const out = await io.writeBinary(tgtDoc);
  fs.writeFileSync(outFile, Buffer.from(out));
  console.log(JSON.stringify({
    out: path.basename(outFile), clip: tracks.name, dur: +dur.toFixed(3),
    frames: nF, fps, jointsDriven: outRot.size, rootMotion: outPos.size > 0,
    heightRatio: +hRatio.toFixed(3)
  }));
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
