#!/usr/bin/env node
/* pose_measure.cjs — how BIG is this model, and which way is it FACING, in bind pose?
 *
 *   node tools/model_diag/pose_measure.cjs assets/models/A.glb [B.glb ...]
 *   node tools/model_diag/pose_measure.cjs --ref BANNON_rigged.glb A.glb     (compare to a reference)
 *
 * WHY: a model that is banked, rigged and passing skinqa can still be unusable in the game because
 * it is the wrong SIZE or pointing the wrong WAY. Those are the two things that make a fighter read
 * as broken the instant he is spawned, and neither is visible in a skin-quality number -- skinqa
 * measures deformation, not scale or facing.
 *
 * OWNER LAW — MEASURE, DON'T GUESS. Height comes from the actual vertex extents after every node
 * transform on the path to the mesh is applied (a model can look 1.0 tall in its accessor min/max
 * and be 1.88 in the scene because a parent node scales it). Facing is derived from the SHOULDER
 * AXIS: a human is much wider across the shoulders than front-to-back, so whichever horizontal axis
 * the upper body is widest along is the axis the shoulders lie on, and the character faces the
 * OTHER one. That is read off the geometry rather than assumed from a name or an export convention.
 *
 * Dependency-free on purpose: the other tools in this directory parse GLB with nothing but fs, and
 * the container does not always have @gltf-transform installed.
 */
const fs = require('fs');
const path = require('path');

// ---- minimal GLB reader ----------------------------------------------------------------------
function readGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('not a GLB: ' + file);
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const chunk = buf.slice(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(chunk.toString('utf8'));
    else if (type === 0x004E4942) bin = chunk;
    off += 8 + len + ((4 - (len % 4)) % 4) * 0;
    off = off + ((4 - (off % 4)) % 4);
  }
  return { json, bin };
}

const COMPS = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2],
                5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function accessor(g, bin, i) {
  const a = g.accessors[i];
  const n = NUM[a.type], [Ctor, sz] = COMPS[a.componentType];
  const out = new Float64Array(a.count * n);
  if (a.bufferView == null) return { data: out, count: a.count, n };
  const bv = g.bufferViews[a.bufferView];
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const stride = bv.byteStride || n * sz;
  for (let e = 0; e < a.count; e++) {
    const o = base + e * stride;
    for (let c = 0; c < n; c++) {
      const view = new Ctor(bin.buffer, bin.byteOffset + o + c * sz, 1);
      out[e * n + c] = view[0];
    }
  }
  return { data: out, count: a.count, n };
}

// ---- matrix helpers --------------------------------------------------------------------------
function ident() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
function mul(a, b) {           // column-major, glTF convention
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function trs(node) {
  if (node.matrix) return node.matrix.slice();
  const t = node.translation || [0,0,0], r = node.rotation || [0,0,0,1], s = node.scale || [1,1,1];
  const [x,y,z,w] = r;
  const x2=x+x, y2=y+y, z2=z+z;
  const xx=x*x2, xy=x*y2, xz=x*z2, yy=y*y2, yz=y*z2, zz=z*z2, wx=w*x2, wy=w*y2, wz=w*z2;
  return [
    (1-(yy+zz))*s[0], (xy+wz)*s[0],     (xz-wy)*s[0],     0,
    (xy-wz)*s[1],     (1-(xx+zz))*s[1], (yz+wx)*s[1],     0,
    (xz+wy)*s[2],     (yz-wx)*s[2],     (1-(xx+yy))*s[2], 0,
    t[0], t[1], t[2], 1
  ];
}
function xform(m, v) {
  return [ m[0]*v[0] + m[4]*v[1] + m[8]*v[2]  + m[12],
           m[1]*v[0] + m[5]*v[1] + m[9]*v[2]  + m[13],
           m[2]*v[0] + m[6]*v[1] + m[10]*v[2] + m[14] ];
}

function measure(file) {
  const { json: g, bin } = readGLB(file);
  const scene = g.scenes[g.scene || 0];
  const pts = [];                       // world-space vertices
  let verts = 0, tris = 0, prims = 0;

  for (const r of scene.nodes) (function walk(idx, parent) {
    const node = g.nodes[idx];
    const world = mul(parent, trs(node));
    if (node.mesh != null) {
      for (const prim of g.meshes[node.mesh].primitives) {
        if (prim.attributes.POSITION == null) continue;
        prims++;
        const p = accessor(g, bin, prim.attributes.POSITION);
        verts += p.count;
        tris += prim.indices != null ? g.accessors[prim.indices].count / 3 : p.count / 3;
        const step = Math.max(1, Math.floor(p.count / 40000));
        for (let i = 0; i < p.count; i += step)
          pts.push(xform(world, [p.data[i*3], p.data[i*3+1], p.data[i*3+2]]));
      }
    }
    for (const c of (node.children || [])) walk(c, world);
  })(r, ident());

  const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
  for (const v of pts) for (let k = 0; k < 3; k++) {
    if (v[k] < min[k]) min[k] = v[k];
    if (v[k] > max[k]) max[k] = v[k];
  }
  const size = [max[0]-min[0], max[1]-min[1], max[2]-min[2]];

  // FACING, from the shoulders. Take the slab of the body between 72% and 88% of its height —
  // that is the shoulder/upper-chest band on any humanoid — and compare its X spread to its Z
  // spread. The shoulders lie along the WIDER axis; the character faces the narrower one.
  const yLo = min[1] + size[1] * 0.72, yHi = min[1] + size[1] * 0.88;
  let sx = [Infinity,-Infinity], sz = [Infinity,-Infinity], nBand = 0;
  for (const v of pts) {
    if (v[1] < yLo || v[1] > yHi) continue;
    nBand++;
    if (v[0] < sx[0]) sx[0] = v[0]; if (v[0] > sx[1]) sx[1] = v[0];
    if (v[2] < sz[0]) sz[0] = v[2]; if (v[2] > sz[1]) sz[1] = v[2];
  }
  const shoulderX = sx[1] - sx[0], shoulderZ = sz[1] - sz[0];
  const shoulderAxis = shoulderX >= shoulderZ ? 'X' : 'Z';
  const ratio = Math.max(shoulderX, shoulderZ) / Math.max(1e-6, Math.min(shoulderX, shoulderZ));

  const skinJoints = (g.skins || []).map(s => (s.joints || []).length);
  return { file, verts, tris: Math.round(tris), prims, min, max, size,
           upAxis: ['X','Y','Z'][size.indexOf(Math.max(...size))],
           shoulderX, shoulderZ, shoulderAxis, shoulderRatio: ratio, nBand,
           skins: skinJoints, nodes: g.nodes.length };
}

function report(m, ref) {
  const f = n => (n >= 0 ? ' ' : '') + n.toFixed(3);
  console.log('\n=== ' + path.basename(m.file) + ' ===');
  console.log('  geometry   ' + m.verts + ' verts, ' + m.tris + ' tris, ' + m.prims + ' primitives');
  console.log('  skins      ' + (m.skins.length ? m.skins.join(', ') + ' joints' : 'NONE (rigid)'));
  console.log('  bbox min  [' + m.min.map(f).join(', ') + ' ]');
  console.log('  bbox max  [' + m.max.map(f).join(', ') + ' ]');
  console.log('  size       width(X)=' + m.size[0].toFixed(3) +
              '  height(Y)=' + m.size[1].toFixed(3) +
              '  depth(Z)=' + m.size[2].toFixed(3));
  console.log('  longest    ' + m.upAxis + (m.upAxis === 'Y' ? '  (upright, correct)' : '  <-- NOT UPRIGHT'));
  console.log('  shoulders  X spread ' + m.shoulderX.toFixed(3) + ', Z spread ' + m.shoulderZ.toFixed(3) +
              '  -> shoulder axis ' + m.shoulderAxis + ' (ratio ' + m.shoulderRatio.toFixed(2) +
              ', ' + m.nBand + ' pts)');
  console.log('  faces      ' + (m.shoulderAxis === 'X' ? 'Z (standard glTF facing)'
                                                        : 'X  <-- ROTATED ~90 degrees'));
  if (ref) {
    const scale = ref.size[1] / m.size[1];
    console.log('  vs ' + path.basename(ref.file) + ':');
    console.log('     height ' + m.size[1].toFixed(3) + ' vs ' + ref.size[1].toFixed(3) +
                '   -> needs x' + scale.toFixed(4));
    console.log('     facing ' + (m.shoulderAxis === ref.shoulderAxis
      ? 'MATCHES reference' : 'DIFFERS from reference -> needs ~90 degree yaw'));
    console.log('     feet at y=' + m.min[1].toFixed(3) + ' vs reference ' + ref.min[1].toFixed(3));
  }
}

const args = process.argv.slice(2);
let refFile = null;
const ri = args.indexOf('--ref');
if (ri >= 0) { refFile = args[ri + 1]; args.splice(ri, 2); }
if (!args.length) {
  console.error('usage: pose_measure.cjs [--ref REF.glb] MODEL.glb [MODEL2.glb ...]');
  process.exit(2);
}
const ref = refFile ? measure(refFile) : null;
if (ref) report(ref);
for (const f of args) { try { report(measure(f), ref); } catch (e) { console.log('\n=== ' + f + ' ===\n  FAILED: ' + e.message); } }
