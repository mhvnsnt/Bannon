#!/usr/bin/env node
/*
 * ingest_dataset.cjs — turn a downloaded motion CAPTURE DATASET into playable BANNON clips.
 *
 *   node tools/mocap/ingest_dataset.cjs --src /path/to/dataset --name bandai2 --limit 400
 *   node tools/mocap/ingest_dataset.cjs --list                       # what is registered and its licence
 *   node tools/mocap/ingest_dataset.cjs --src ... --commercial-only  # refuse anything not ship-safe
 *
 * WHY THIS EXISTS AND NOT A ONE-OFF SCRIPT PER DATASET: the owner's instruction was "pull in and
 * install all the data sets mentioned and more, don't just note and record them." The datasets do
 * not agree on anything — BVH vs SMPL vs FBX, centimetres vs metres, Y-up vs Z-up, and every one of
 * them has a different skeleton. What they DO share is that once you have world joint positions per
 * frame, the retarget we already wrote for video_to_clip and text_to_clip takes it the rest of the
 * way. So this is one converter with a per-source adapter, not five scripts.
 *
 * ── LICENCE IS A FIRST-CLASS FIELD, NOT A README NOTE ────────────────────────────────────────────
 * BANNON is a commercial game. Two of the most-recommended combat motion sources cannot ship in one,
 * and finding that out after the animations are baked in is the expensive way to find out:
 *
 *   Bandai Namco Research Motiondataset   CC BY-NC 4.0        NON-COMMERCIAL. 3,077 BVH, beautiful
 *                                                             style labels (active / elderly /
 *                                                             masculine / feminine / youthful), but
 *                                                             NC means it cannot be in a game you
 *                                                             sell. Usable as reference and for
 *                                                             non-commercial builds only.
 *   CombatMotion (CMP / CMR, AnimationGPT) DERIVED FROM        The AnimationGPT *code* is MIT and is
 *                                          GAME ASSETS        genuinely useful. The DATASET is, in
 *                                                             its authors' own words, "derived from
 *                                                             game assets" — the annotation
 *                                                             vocabulary (Katana, Sacred Seal,
 *                                                             Charged Heavy Attack) is lifted
 *                                                             straight out of a shipped commercial
 *                                                             title. That is someone else's IP in
 *                                                             our animation data.
 *   CMU Motion Capture Database            FREE FOR ALL USES  Explicitly including commercial. The
 *                                                             clean bulk source.
 *   Mixamo                                 Adobe licence      Royalty-free for commercial use.
 *   Truebones (CC0 subset)                 CC0                Public domain.
 *   AI4Animation                           research/academic  Code is usable; the motion data is
 *                                                             mostly licensed per-source.
 *   FreeMoCap                              AGPL-3.0 (tool)    It is a CAPTURE tool, not a dataset —
 *                                                             motion you record with it is YOURS.
 *
 * `--commercial-only` refuses any source whose row is not marked ship-safe, so it is impossible to
 * bake an NC dataset into a shipping build by accident. Without the flag a source is still ingested
 * but every clip carries its licence in the manifest and lands under a dev/ prefix.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const OUTDIR = path.join(REPO, 'assets', 'moves', 'datasets');

const SOURCES = {
  bandai1:  { label:'Bandai Namco Research Motiondataset 1', licence:'CC BY-NC 4.0', commercial:false, format:'bvh',
              url:'https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset' },
  bandai2:  { label:'Bandai Namco Research Motiondataset 2', licence:'CC BY-NC 4.0', commercial:false, format:'bvh',
              url:'https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset' },
  combat:   { label:'CombatMotion CMP/CMR (AnimationGPT)',   licence:'derived from commercial game assets', commercial:false, format:'smpl',
              url:'https://github.com/fyyakaxyy/AnimationGPT' },
  cmu:      { label:'CMU Motion Capture Database',           licence:'free for all uses incl. commercial', commercial:true, format:'bvh',
              url:'http://mocap.cs.cmu.edu/' },
  mixamo:   { label:'Mixamo',                                licence:'Adobe — royalty-free commercial',    commercial:true, format:'fbx',
              url:'https://www.mixamo.com/' },
  truebones:{ label:'Truebones Zoo (CC0 subset)',            licence:'CC0',                                commercial:true, format:'bvh',
              url:'https://truebones.gumroad.com/' },
  own:      { label:'Own capture (FreeMoCap / video_to_clip)', licence:'ours',                             commercial:true, format:'bvh',
              url:'https://freemocap.org/' }
};

const argv = process.argv.slice(2);
// accept both --k=v and --k v; a path with a space in it is otherwise silently dropped
const flag = (k, d) => {
  const eq = argv.find(s => s.startsWith('--' + k + '='));
  if (eq) return eq.split('=').slice(1).join('=');
  const i = argv.indexOf('--' + k);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return d;
};
const has  = k => argv.includes('--' + k);

if (has('list')){
  console.log('REGISTERED MOTION SOURCES');
  console.log('='.repeat(96));
  for (const k of Object.keys(SOURCES)){
    const s = SOURCES[k];
    console.log('  ' + (s.commercial ? 'SHIP-SAFE ' : 'DEV ONLY  ') + k.padEnd(10) + s.label.padEnd(44) + s.licence);
  }
  console.log('\nDEV ONLY sources are ingested under a dev/ prefix and refused entirely under --commercial-only.');
  process.exit(0);
}

// ── BVH ────────────────────────────────────────────────────────────────────────────────────────
// A small, dependency-free BVH reader. We only need the joint hierarchy, the channel order and the
// per-frame values; everything else in the format is presentation.
function parseBVH(text){
  const toks = text.replace(/\r/g, '').split(/\s+/).filter(Boolean);
  let i = 0;
  const next = () => toks[i++];
  const expect = w => { const t = next(); if (t.toUpperCase() !== w) throw new Error('expected ' + w + ' got ' + t); };

  const joints = [];
  function readJoint(parent){
    const type = next();                       // ROOT | JOINT | End
    const name = type === 'End' ? (parent.name + '_End') : next();
    if (type === 'End') next();                // "Site"
    expect('{');
    expect('OFFSET');
    const off = [parseFloat(next()), parseFloat(next()), parseFloat(next())];
    const j = { name, parent: parent ? parent.index : -1, offset: off, channels: [], index: joints.length, end: type === 'End' };
    joints.push(j);
    for (;;){
      const t = toks[i];
      if (t === '}'){ i++; break; }
      if (t.toUpperCase() === 'CHANNELS'){ i++; const n = parseInt(next(), 10); for (let c = 0; c < n; c++) j.channels.push(next()); continue; }
      if (t === 'JOINT' || t === 'End'){ readJoint(j); continue; }
      i++;                                      // anything else we do not model
    }
    return j;
  }
  expect('HIERARCHY');
  readJoint(null);
  expect('MOTION');
  expect('FRAMES:');
  const nFrames = parseInt(next(), 10);
  expect('FRAME'); expect('TIME:');
  const frameTime = parseFloat(next());
  const nCh = joints.reduce((a, j) => a + j.channels.length, 0);
  const data = new Float32Array(nFrames * nCh);
  for (let f = 0; f < nFrames * nCh; f++) data[f] = parseFloat(toks[i++]);
  return { joints, nFrames, frameTime, nCh, data };
}

// Forward kinematics to WORLD joint positions for one frame. 3x3 matrices, no dependency.
function mul(a, b){
  const o = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
    o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
}
function rot(axis, deg){
  const t = deg * Math.PI / 180, s = Math.sin(t), c = Math.cos(t);
  if (axis === 'X') return [1,0,0, 0,c,-s, 0,s,c];
  if (axis === 'Y') return [c,0,s, 0,1,0, -s,0,c];
  return [c,-s,0, s,c,0, 0,0,1];
}
function fk(bvh, frame){
  const { joints, nCh, data } = bvh;
  const base = frame * nCh;
  const pos = [], mats = [];
  let ch = 0;
  for (let k = 0; k < joints.length; k++){
    const j = joints[k];
    let tx = j.offset[0], ty = j.offset[1], tz = j.offset[2];
    let R = [1,0,0, 0,1,0, 0,0,1];
    for (const c of j.channels){
      const v = data[base + ch++];
      if (c === 'Xposition') tx = v; else if (c === 'Yposition') ty = v; else if (c === 'Zposition') tz = v;
      else if (c === 'Xrotation') R = mul(R, rot('X', v));
      else if (c === 'Yrotation') R = mul(R, rot('Y', v));
      else if (c === 'Zrotation') R = mul(R, rot('Z', v));
    }
    if (j.parent < 0){ pos.push([tx, ty, tz]); mats.push(R); }
    else {
      const P = pos[j.parent], M = mats[j.parent];
      pos.push([ P[0] + M[0]*tx + M[1]*ty + M[2]*tz,
                 P[1] + M[3]*tx + M[4]*ty + M[5]*tz,
                 P[2] + M[6]*tx + M[7]*ty + M[8]*tz ]);
      mats.push(mul(M, R));
    }
  }
  return pos;
}

// Which BVH joint feeds which of OUR joints.
//
// Datasets do not agree on ANY of it. Mixamo writes `mixamorig:LeftForeArm`, Bandai writes
// `LowerArm_L`, CMU writes `lradius`, Truebones writes `L_Elbow`. Listing every spelling is a losing
// game, so the name is NORMALISED first — separators dropped, the side extracted whether it is a
// prefix (`Left…`), a suffix (`…_L`) or a leading letter (`lradius`) — and only the bare part name
// is matched. Adding a dataset with a new convention is then usually zero work.
function normaliseBone(raw){
  let n = String(raw).replace(/^mixamorig:?/i, '').replace(/[:\s]/g, '');
  let side = '';
  // suffix side:  UpperArm_L / UpperArm.R / UpperArmLeft
  let m = n.match(/^(.*?)[_.\-]?(left|right|l|r)$/i);
  if (m && m[1].length > 1){ n = m[1]; side = m[2][0].toUpperCase(); }
  else {
    // prefix side: LeftForeArm / L_Elbow / lradius
    m = n.match(/^(left|right)(.+)$/i);
    if (m){ side = m[1][0].toUpperCase(); n = m[2]; }
    else {
      m = n.match(/^([lr])[_.\-](.+)$/i);
      if (m){ side = m[1].toUpperCase(); n = m[2]; }
    }
  }
  return { part: n.replace(/[_.\-]/g, '').toLowerCase(), side };
}
// part patterns, side-free
const PARTS = {
  pelvis:  /^(hips?|pelvis)$/,
  // a bare armature root sits at world origin ON THE FLOOR — it is NOT the pelvis. Bandai ships
  // joint_Root as the parent of Hips, and taking it made every body's pelvis read as y=0.
  rootOnly:/^(root|jointroot|reference|armature)$/,
  spineLow:/^(spine|spine0?1|lowerback|abdomen)$/,
  spineMid:/^(spine0?2|spine1|chest)$/,
  chest:   /^(spine0?3|spine2|upperchest|chest1|thorax)$/,
  neck:    /^(neck|neck1)$/,
  head:    /^(head)$/,
  sh:      /^(shoulder|clavicle|collar)$/,
  up:      /^(upperarm|arm|humerus)$/,
  el:      /^(lowerarm|forearm|elbow|radius)$/,
  ha:      /^(hand|wrist)$/,
  hip:     /^(upperleg|upleg|thigh|hip|femur)$/,
  kn:      /^(lowerleg|leg|shin|knee|tibia)$/,
  ft:      /^(foot|ankle)$/
};
function buildMap(joints){
  const out = {};
  const put = (k, i) => { if (out[k] === undefined) out[k] = i; };
  for (let i = 0; i < joints.length; i++){
    if (joints[i].end) continue;
    const { part, side } = normaliseBone(joints[i].name);
    for (const key in PARTS){
      if (!PARTS[key].test(part)) continue;
      if (key === 'rootOnly'){ if (out.pelvis === undefined) out._rootFallback = i; break; }
      if (['pelvis','spineLow','spineMid','chest','neck','head'].indexOf(key) >= 0){
        if (key === 'pelvis') out.pelvis = i; else put(key, i); break; }
      if (!side) break;
      // `sh` is the clavicle and `up` is the upper arm; our shL/shR is the SHOULDER JOINT, which is
      // where the upper arm starts. Prefer the upper arm, fall back to the clavicle.
      if (key === 'up') out['sh' + side] = i;
      else if (key === 'sh') put('sh' + side, i);
      else out[key + side] = i;
      break;
    }
  }
  if (out.pelvis === undefined && out._rootFallback !== undefined) out.pelvis = out._rootFallback;
  delete out._rootFallback;
  return out;
}

// ── motion energy trim (same test harvest.py segments video with) ───────────────────────────────
function trimToMotion(frames){
  if (frames.length < 6) return [0, frames.length - 1];
  const e = [];
  for (let f = 1; f < frames.length; f++){
    let s = 0;
    for (const j in frames[f]){
      const a = frames[f][j], b = frames[f - 1][j];
      if (!a || !b) continue;
      s += Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]);
    }
    e.push(s);
  }
  const peak = Math.max.apply(null, e) || 1, thr = peak * 0.14;
  let a = 0, b = e.length - 1;
  while (a < b && e[a] < thr) a++;
  while (b > a && e[b] < thr) b--;
  return [Math.max(0, a - 2), Math.min(frames.length - 1, b + 3)];
}

function convert(file, srcKey, maxKeys){
  const bvh = parseBVH(fs.readFileSync(file, 'utf8'));
  const jmap = buildMap(bvh.joints);
  const nMapped = Object.keys(jmap).length;
  if (nMapped < 10) return { err: 'only ' + nMapped + ' joints mapped' };

  // BVH is conventionally centimetres and Y-up; normalise to metres by the skeleton's own height so
  // a dataset in different units still lands at our scale.
  const p0 = fk(bvh, 0);
  let minY = Infinity, maxY = -Infinity;
  for (const k in jmap){ const p = p0[jmap[k]]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  const span = Math.max(1e-6, maxY - minY);
  const scale = 1.70 / span;                      // normalise every skeleton to a 1.70 m frame

  const frames = [];
  for (let f = 0; f < bvh.nFrames; f++){
    const p = fk(bvh, f), o = {};
    for (const k in jmap){
      const q = p[jmap[k]];
      o[k] = [ +(q[0] * scale).toFixed(4), +((q[1] - minY) * scale).toFixed(4), +(q[2] * scale).toFixed(4) ];
    }
    frames.push(o);
  }
  const [a, b] = trimToMotion(frames);
  const kept = frames.slice(a, b + 1);
  const dur = kept.length * bvh.frameTime;

  // resample down to at most maxKeys — the engine interpolates between keys, and a 120 Hz capture
  // is 100x more data than a move that lasts under a second needs.
  const step = Math.max(1, Math.ceil(kept.length / maxKeys));
  const keys = [];
  for (let f = 0; f < kept.length; f += step){
    keys.push({ t: +((f / Math.max(1, kept.length - 1)) * dur).toFixed(4), pose: kept[f] });
  }
  if (keys.length && keys[keys.length - 1].t < dur) keys.push({ t: +dur.toFixed(4), pose: kept[kept.length - 1] });
  return { clip: { keys, dur: +dur.toFixed(4), joints: nMapped, src: srcKey, fps: +(1 / bvh.frameTime).toFixed(1) } };
}

// ── run ─────────────────────────────────────────────────────────────────────────────────────────
const SRC = flag('src', '');
const NAME = flag('name', '');
const LIMIT = parseInt(flag('limit', '99999'), 10);
const MAXKEYS = parseInt(flag('keys', '28'), 10);
if (!SRC || !NAME){ console.error('usage: --src <dir> --name <' + Object.keys(SOURCES).join('|') + '>  [--limit N] [--keys N] [--commercial-only]'); process.exit(2); }
const meta = SOURCES[NAME];
if (!meta){ console.error('unknown source "' + NAME + '" — run --list'); process.exit(2); }
if (has('commercial-only') && !meta.commercial){
  console.error('REFUSED: ' + meta.label + ' is ' + meta.licence + ' and --commercial-only was passed.');
  console.error('This dataset cannot ship in a commercial build. Drop the flag to ingest it as dev-only reference.');
  process.exit(3);
}

function walk(dir, out){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })){
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.bvh$/i.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(SRC, []).slice(0, LIMIT);
if (!files.length){ console.error('no .bvh under ' + SRC); process.exit(1); }

const prefix = meta.commercial ? '' : 'dev/';
const dest = path.join(OUTDIR, prefix + NAME);
fs.mkdirSync(dest, { recursive: true });

let ok = 0, fail = 0, keysTotal = 0;
const index = [];
for (const f of files){
  const base = path.basename(f, path.extname(f));
  let r;
  try{ r = convert(f, NAME, MAXKEYS); }catch(e){ r = { err: e.message }; }
  if (r.err){ fail++; continue; }
  fs.writeFileSync(path.join(dest, base + '.json'), JSON.stringify(r.clip));
  keysTotal += r.clip.keys.length;
  // the filename IS the label in every dataset worth using — bandai encodes
  // dataset-2_<action>_<style>_<take>.bvh, which is exactly the style tagging we want
  const parts = base.split('_');
  index.push({ id: base, action: parts[1] || base, style: parts[2] || null,
               dur: r.clip.dur, keys: r.clip.keys.length, joints: r.clip.joints });
  ok++;
  if (ok % 250 === 0) process.stdout.write('  ' + ok + '…\n');
}

fs.writeFileSync(path.join(dest, '_manifest.json'), JSON.stringify({
  _note: 'AUTO-GENERATED by tools/mocap/ingest_dataset.cjs. LICENCE IS BINDING — read it before shipping.',
  source: NAME, label: meta.label, licence: meta.licence,
  commercialUse: meta.commercial,
  shipSafe: meta.commercial,
  url: meta.url,
  generated: new Date().toISOString().slice(0, 10),
  clips: ok, clipIndex: index
}, null, 1));

console.log(meta.label);
console.log('  licence         : ' + meta.licence + (meta.commercial ? '  (SHIP-SAFE)' : '  ** DEV ONLY — cannot ship **'));
console.log('  converted       : ' + ok + ' clips  (' + fail + ' skipped)');
console.log('  average keys    : ' + (ok ? (keysTotal / ok).toFixed(1) : 0));
console.log('  styles seen     : ' + [...new Set(index.map(x => x.style).filter(Boolean))].join(', ').slice(0, 160));
console.log('  actions seen    : ' + [...new Set(index.map(x => x.action))].length);
console.log('  wrote           : ' + path.relative(REPO, dest));
