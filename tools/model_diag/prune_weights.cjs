#!/usr/bin/env node
/* prune_weights.cjs — kill the cross-body skin weights that draw stretched sheets mid-match.
 *
 *   node tools/model_diag/prune_weights.cjs VIPER.glb                 # writes VIPER_pruned.glb
 *   node tools/model_diag/prune_weights.cjs VIPER.glb out.glb --factor=2.5
 *   node tools/model_diag/prune_weights.cjs --inplace VIPER.glb
 *
 * THE DEFECT (measured by spikes.cjs, from the owner's match screenshots):
 *   VIPER.glb   a 0.3cm triangle becomes 51.8cm when posed   Spine:0.61 LeftUpLeg:0.39
 *   TARZANIAN   a 0.4cm triangle becomes 22.2cm              Hips:0.41  LeftArm:0.40
 * Every spike is a vertex sharing influence roughly 50/50 between joints at OPPOSITE ENDS of the
 * skeleton. In bind pose those bones agree and nothing shows -- which is why the models look
 * perfect in the select screen. In a match they rotate apart, the vertex is dragged between them,
 * and the triangles around it are drawn as a sheet across the screen.
 *
 * WHERE THEY COME FROM: nearest-neighbour weight transfer. In a T/A-pose bind THE ARMS HANG BESIDE
 * THE HIPS, so a spatial search weighting a hip vertex happily grabs arm vertices a few centimetres
 * away. transfer_weights.cjs does exactly this, which is why models it produced carry the defect.
 *
 * THE TEST IS GEOMETRIC, NOT BY NAME (owner LAW: derive from the data, never from a label). For each
 * vertex we measure the distance to each influencing BONE SEGMENT in bind space. An influence whose
 * bone is much farther away than the nearest influencing bone cannot be legitimate -- skin is driven
 * by the bones it lies on. Those are dropped and the remaining weights renormalised. No joint names,
 * no skeleton conventions, works on any rig.
 *
 * Rewrites JOINTS_0/WEIGHTS_0 IN PLACE in the binary chunk: same accessors, same counts, same byte
 * layout, so nothing else about the asset can shift.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const INPLACE = args.includes('--inplace');
const flag = (k, d) => { const a = args.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const FACTOR = parseFloat(flag('factor', '2.5'));   // drop an influence this many times farther than the nearest
const files = args.filter(a => !a.startsWith('--'));
if (!files.length) { console.error('usage: prune_weights.cjs <model.glb> [out.glb] [--factor=2.5] [--inplace]'); process.exit(1); }

const IN = path.isAbsolute(files[0]) ? files[0] : path.join('/home/user/Bannon/assets/models', files[0]);
const OUT = INPLACE ? IN : (files[1]
  ? (path.isAbsolute(files[1]) ? files[1] : path.join('/home/user/Bannon/assets/models', files[1]))
  : IN.replace(/\.glb$/i, '') + '_pruned.glb');

// ── GLB ───────────────────────────────────────────────────────────────────────────────────────────
function readGLB(p) {
  const b = fs.readFileSync(p);
  if (b.readUInt32LE(0) !== 0x46546C67) throw new Error('not a GLB: ' + p);
  let off = 12, json = null, bin = null;
  while (off < b.length) {
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    const chunk = b.slice(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(chunk.toString('utf8'));
    else if (type === 0x004E4942) bin = chunk;
    off += 8 + len + ((4 - len % 4) % 4);
  }
  return { json, bin, buf: b };
}
const CSIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const READ = { 5120: 'readInt8', 5121: 'readUInt8', 5122: 'readInt16LE', 5123: 'readUInt16LE', 5125: 'readUInt32LE', 5126: 'readFloatLE' };
const WRITE = { 5120: 'writeInt8', 5121: 'writeUInt8', 5122: 'writeInt16LE', 5123: 'writeUInt16LE', 5125: 'writeUInt32LE', 5126: 'writeFloatLE' };

function view(g, accIndex) {
  const a = g.json.accessors[accIndex];
  const bv = g.json.bufferViews[a.bufferView];
  const n = NCOMP[a.type], cs = CSIZE[a.componentType];
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const stride = bv.byteStride || n * cs;
  return { a, n, cs, base, stride, count: a.count,
    get(i, k) { return g.bin[READ[a.componentType]](base + i * stride + k * cs); },
    set(i, k, v) { g.bin[WRITE[a.componentType]](v, base + i * stride + k * cs); } };
}

// ── bind-space bone segments, from the inverse bind matrices ──────────────────────────────────────
// inverse(IBM) is the joint's world matrix at bind time; its translation is where the joint sits.
// A bone is the segment from a joint to each of its children, so skin near a limb is near a segment
// rather than near a point -- distance to the segment is the honest measure.
function invTranslation(m) {
  // m is column-major 4x4. For the inverse of a rigid-ish matrix, solving for translation directly is
  // safest: t = -R^-1 * m_translation. Use a general 3x3 inverse so non-uniform scale still works.
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g_ = m[2], h = m[6], i = m[10];
  const A = e * i - f * h, B = -(d * i - f * g_), C = d * h - e * g_;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return [-m[12], -m[13], -m[14]];
  const id = 1 / det;
  const i00 = A * id, i01 = -(b * i - c * h) * id, i02 = (b * f - c * e) * id;
  const i10 = B * id, i11 = (a * i - c * g_) * id, i12 = -(a * f - c * d) * id;
  const i20 = C * id, i21 = -(a * h - b * g_) * id, i22 = (a * e - b * d) * id;
  const tx = m[12], ty = m[13], tz = m[14];
  return [-(i00 * tx + i01 * ty + i02 * tz), -(i10 * tx + i11 * ty + i12 * tz), -(i20 * tx + i21 * ty + i22 * tz)];
}

function distToSegment(p, a, b) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const apx = p[0] - a[0], apy = p[1] - a[1], apz = p[2] - a[2];
  const len2 = abx * abx + aby * aby + abz * abz;
  let t = len2 > 1e-12 ? (apx * abx + apy * aby + apz * abz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

const g = readGLB(IN);
if (!g.json.skins || !g.json.skins.length) { console.error('no skin in ' + IN); process.exit(2); }

let totalPruned = 0, totalVerts = 0, totalRescued = 0;

for (const skin of g.json.skins) {
  const joints = skin.joints;
  const ibmA = g.json.accessors[skin.inverseBindMatrices];
  const ibmV = view(g, skin.inverseBindMatrices);
  const jointPos = [];
  for (let j = 0; j < ibmA.count; j++) {
    const m = []; for (let k = 0; k < 16; k++) m.push(ibmV.get(j, k));
    jointPos.push(invTranslation(m));
  }
  // child list, so each joint gets real segments rather than a bare point
  const nodeToJoint = new Map(joints.map((n, i) => [n, i]));
  const kids = joints.map(() => []);
  joints.forEach((nodeIdx, ji) => {
    const node = g.json.nodes[nodeIdx];
    (node.children || []).forEach(c => { if (nodeToJoint.has(c)) kids[ji].push(nodeToJoint.get(c)); });
  });

  const dist = (p, ji) => {
    if (!kids[ji].length) {
      const a = jointPos[ji];
      return Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]);
    }
    let best = Infinity;
    for (const c of kids[ji]) best = Math.min(best, distToSegment(p, jointPos[ji], jointPos[c]));
    return best;
  };

  for (const mesh of g.json.meshes) {
    for (const prim of mesh.primitives) {
      if (prim.attributes.JOINTS_0 == null || prim.attributes.WEIGHTS_0 == null) continue;
      const P = view(g, prim.attributes.POSITION);
      const J = view(g, prim.attributes.JOINTS_0);
      const W = view(g, prim.attributes.WEIGHTS_0);
      const normalisedW = W.a.componentType !== 5126;   // ubyte/ushort weights are normalised ints
      const wMax = W.a.componentType === 5121 ? 255 : (W.a.componentType === 5123 ? 65535 : 1);

      for (let i = 0; i < P.count; i++) {
        totalVerts++;
        const p = [P.get(i, 0), P.get(i, 1), P.get(i, 2)];
        const inf = [];
        for (let k = 0; k < 4; k++) {
          const raw = W.get(i, k);
          const w = normalisedW ? raw / wMax : raw;
          if (w <= 0) continue;
          const ji = J.get(i, k);
          if (ji < 0 || ji >= jointPos.length) continue;
          inf.push({ k, ji, w, d: dist(p, ji) });
        }
        if (inf.length < 2) continue;

        const dMin = Math.min(...inf.map(x => x.d));
        // An influence whose bone is FACTOR times farther from this vertex than the closest
        // influencing bone is not driving this piece of skin. That is the cross-body pair.
        const keep = inf.filter(x => x.d <= dMin * FACTOR + 1e-6);
        if (keep.length === inf.length) continue;

        const dropped = inf.length - keep.length;
        totalPruned += dropped;
        if (keep.length === 1) totalRescued++;

        let sum = keep.reduce((a, x) => a + x.w, 0);
        if (sum <= 1e-8) { keep.forEach(x => x.w = 1 / keep.length); sum = 1; }
        // write back: kept slots renormalised, dropped slots zeroed
        const newW = new Array(4).fill(0);
        keep.forEach(x => { newW[x.k] = x.w / sum; });
        for (let k = 0; k < 4; k++) {
          const v = newW[k];
          W.set(i, k, normalisedW ? Math.round(v * wMax) : v);
          if (v === 0) J.set(i, k, 0);      // a zero-weight joint index is ignored, keep it tidy
        }
        // integer rounding can drift off 1.0; push the remainder into the dominant slot
        if (normalisedW) {
          let tot = 0; for (let k = 0; k < 4; k++) tot += W.get(i, k);
          if (tot !== wMax) {
            let bi = 0, bv = -1;
            for (let k = 0; k < 4; k++) { const v = W.get(i, k); if (v > bv) { bv = v; bi = k; } }
            W.set(i, bi, Math.max(0, Math.min(wMax, bv + (wMax - tot))));
          }
        }
      }
    }
  }
}

fs.writeFileSync(OUT, g.buf);
console.log(path.basename(IN) + ' -> ' + path.basename(OUT));
console.log('  vertices ' + totalVerts + ', influences pruned ' + totalPruned
  + ', vertices reduced to a single bone ' + totalRescued + '  (factor ' + FACTOR + ')');
console.log('  NEXT: node tools/model_diag/spikes.cjs ' + path.basename(OUT) + '   (must show 0 spikes)');
