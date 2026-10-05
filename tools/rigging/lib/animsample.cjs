#!/usr/bin/env node
/* animsample.cjs — shared glTF animation sampling for tools/rigging/.
 * Game-agnostic: works on any GLB with skin + animation channels.
 * Deps (MIT): @gltf-transform/core.
 */
'use strict';
const R = require('./rigmath.cjs');

function decomposeTRS(m) { // col-major mat4 -> {t,q,s} (no skew assumed)
  const t = [m[12], m[13], m[14]];
  const sx = Math.hypot(m[0], m[1], m[2]), sy = Math.hypot(m[4], m[5], m[6]), sz = Math.hypot(m[8], m[9], m[10]);
  // row-major rotation elements
  const R00=m[0]/sx, R01=m[4]/sy, R02=m[8]/sz;
  const R10=m[1]/sx, R11=m[5]/sy, R12=m[9]/sz;
  const R20=m[2]/sx, R21=m[6]/sy, R22=m[10]/sz;
  const tr = R00+R11+R22;
  let q;
  if (tr > 0) {
    const s = Math.sqrt(tr+1)*2; q = [(R21-R12)/s, (R02-R20)/s, (R10-R01)/s, 0.25*s];
  } else if (R00 > R11 && R00 > R22) {
    const s = Math.sqrt(1+R00-R11-R22)*2; q = [0.25*s,(R01+R10)/s,(R02+R20)/s,(R21-R12)/s];
  } else if (R11 > R22) {
    const s = Math.sqrt(1+R11-R00-R22)*2; q = [(R01+R10)/s,0.25*s,(R12+R21)/s,(R02-R20)/s];
  } else {
    const s = Math.sqrt(1+R22-R00-R11)*2; q = [(R02+R20)/s,(R12+R21)/s,0.25*s,(R10-R01)/s];
  }
  return { t, q: R.qnorm(q), s: [sx, sy, sz] };
}

function nodeTRS(n) {
  if (n.getMatrix()) return decomposeTRS(Array.from(n.getMatrix()));
  return { t: n.getTranslation() ? Array.from(n.getTranslation()) : [0,0,0],
           q: n.getRotation() ? R.qnorm(Array.from(n.getRotation())) : [0,0,0,1],
           s: n.getScale() ? Array.from(n.getScale()) : [1,1,1] };
}

/* { nodes, nameToIdx, normToIdx, parent, restT, restQ } — onlyJoints=true restricts to skin joints.
 * normToIdx keys are sanitized (lowercase, alphanumeric only) so Mixamo names
 * survive FBX importers that strip colons (mixamorig:Hips -> mixamorigHips). */
function normName(n) { return n.toLowerCase().replace(/[^a-z0-9]/g, ''); }
function rigOf(doc, onlyJoints) {
  const root = doc.getRoot();
  let nodes = root.listNodes();
  if (onlyJoints) {
    const skins = root.listSkins();
    nodes = skins.length ? skins[0].listJoints() : [];
  }
  const nameToIdx = new Map(nodes.map((n, i) => [n.getName(), i]));
  const normToIdx = new Map(nodes.map((n, i) => [normName(n.getName()), i]));
  const parent = new Array(nodes.length).fill(-1);
  const idxOf = new Map(nodes.map((n, i) => [n, i]));
  for (let i = 0; i < nodes.length; i++)
    for (const c of nodes[i].listChildren()) if (idxOf.has(c)) parent[idxOf.get(c)] = i;
  const restT = [], restQ = [];
  for (const n of nodes) { const trs = nodeTRS(n); restT.push(trs.t); restQ.push(trs.q); }
  return { nodes, nameToIdx, normToIdx, normName, parent, restT, restQ, doc };
}

function worldQuats(rig, localQ) {
  const W = new Array(rig.nodes.length);
  const visit = (i) => { if (W[i] !== undefined) return; const p = rig.parent[i]; if (p >= 0) visit(p);
    W[i] = p >= 0 ? R.qnorm(R.qmul(W[p], localQ[i])) : R.qnorm(localQ[i]); };
  for (let i = 0; i < rig.nodes.length; i++) visit(i);
  return W;
}

/* Full world matrices from per-node local {t,q}. */
function worldMats(rig, localT, localQ) {
  const W = new Array(rig.nodes.length);
  const visit = (i) => { if (W[i] !== undefined) return; const p = rig.parent[i]; if (p >= 0) visit(p);
    const L = R.compose(localT[i], localQ[i], [1,1,1]);
    W[i] = p >= 0 ? R.mul(W[p], L) : L; };
  for (let i = 0; i < rig.nodes.length; i++) visit(i);
  return W;
}

/* Read a clip's rotation/translation tracks keyed by node name. */
function sampleAnimTracks(doc, clipIdx) {
  const anims = doc.getRoot().listAnimations();
  if (!anims.length) throw new Error('GLB has no animations');
  const anim = anims[clipIdx || 0];
  const rot = new Map(), pos = new Map();
  let dur = 0;
  for (const ch of anim.listChannels()) {
    const node = ch.getTargetNode(); if (!node) continue;
    const path = ch.getTargetPath();
    const smp = ch.getSampler(); if (!smp) continue;
    const times = Array.from(smp.getInput().getArray());
    const out = Array.from(smp.getOutput().getArray());
    const interp = smp.getInterpolation();
    if (times.length) dur = Math.max(dur, times[times.length-1]);
    const name = node.getName();
    if (path === 'rotation') {
      const quats = [];
      for (let i = 0; i < times.length; i++) quats.push(R.qnorm([out[i*4],out[i*4+1],out[i*4+2],out[i*4+3]]));
      rot.set(name, { times, quats, interp });
    } else if (path === 'translation') {
      const vals = [];
      for (let i = 0; i < times.length; i++) vals.push([out[i*3],out[i*3+1],out[i*3+2]]);
      pos.set(name, { times, vals, interp });
    }
  }
  return { dur, rot, pos, name: anim.getName() || 'clip0' };
}

function sampleQuat(track, rest, t) {
  if (!track) return rest;
  const { times, quats, interp } = track;
  if (t <= times[0]) return quats[0];
  if (t >= times[times.length-1]) return quats[quats.length-1];
  if (interp === 'STEP') { let i = 0; while (times[i+1] <= t) i++; return quats[i]; }
  let i = 0; while (times[i+1] < t) i++;
  const f = (t - times[i]) / Math.max(1e-9, times[i+1] - times[i]);
  return R.slerp(quats[i], quats[i+1], f);
}
function sampleVec(track, rest, t) {
  if (!track) return rest;
  const { times, vals, interp } = track;
  if (t <= times[0]) return vals[0];
  if (t >= times[times.length-1]) return vals[vals.length-1];
  if (interp === 'STEP') { let i = 0; while (times[i+1] <= t) i++; return vals[i]; }
  let i = 0; while (times[i+1] < t) i++;
  const f = (t - times[i]) / Math.max(1e-9, times[i+1] - times[i]);
  const a = vals[i], b = vals[i+1];
  return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
}

/* Pose the rig at time t: returns { localT, localQ } arrays. */
function poseAt(rig, tracks, t) {
  const localT = rig.restT.map((v, i) => sampleVec(tracks.pos.get(rig.nodes[i].getName()), v, t));
  const localQ = rig.restQ.map((q, i) => sampleQuat(tracks.rot.get(rig.nodes[i].getName()), q, t));
  return { localT, localQ };
}

module.exports = { decomposeTRS, nodeTRS, rigOf, normName, worldQuats, worldMats, sampleAnimTracks, sampleQuat, sampleVec, poseAt };
