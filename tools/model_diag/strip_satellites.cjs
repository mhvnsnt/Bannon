#!/usr/bin/env node
/* BANNON satellite stripper — remove floating duplicate geometry (Tripo "mini model + bust" artifacts)
 * from a single-primitive skinned GLB while PRESERVING the skin, skeleton, inverse-bind matrices and
 * the baked texture. Keeps only the LARGEST welded connected component (the real full body); every
 * smaller island (the bust, the mini, stray shells) is dropped.
 *
 *   node tools/model_diag/strip_satellites.cjs <in.glb> [out.glb]
 *
 * Why weld-first: Tripo meshes are non-indexed-welded (every triangle has its own verts), so a naive
 * index-based component pass sees thousands of per-triangle islands. We weld by quantized position
 * (0.1mm grid), union-find over the welded verts, then keep the component with the most triangles.
 * The skin (JOINTS_0/WEIGHTS_0), the 16-joint skeleton nodes, skin.inverseBindMatrices and the
 * embedded JPEG are carried through untouched — only POSITION/NORMAL/TEXCOORD_0/JOINTS_0/WEIGHTS_0 and
 * the index buffer are subset to the kept vertices. Non-destructive: writes a new file.
 */
const fs = require('fs');

const SRC = process.argv[2];
if (!SRC) { console.error('usage: node strip_satellites.cjs <in.glb> [out.glb]'); process.exit(1); }
const OUT = process.argv[3] || SRC.replace(/\.glb$/i, '') + '_clean.glb';

const b = fs.readFileSync(SRC);
let off = 12, json = null, binOff = 0, binLen = 0;
while (off < b.length) {
  const clen = b.readUInt32LE(off), ctype = b.readUInt32LE(off + 4);
  if (ctype === 0x4E4F534A) json = JSON.parse(b.slice(off + 8, off + 8 + clen).toString('utf8'));
  else if (ctype === 0x004E4942) { binOff = off + 8; binLen = clen; }
  off += 8 + clen;
}
const bin = b.slice(binOff, binOff + binLen);
if (!json.meshes || json.meshes.length !== 1 || json.meshes[0].primitives.length !== 1) {
  console.error('expected exactly one mesh / one primitive; got meshes=' + (json.meshes || []).length); process.exit(2);
}
const prim = json.meshes[0].primitives[0];
const A = json.accessors, BV = json.bufferViews;
function view(ai) { const a = A[ai], bv = BV[a.bufferView]; return { a, base: (bv.byteOffset || 0) + (a.byteOffset || 0), stride: bv.byteStride || 0 }; }
const CSIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function readAccessor(ai) {
  const { a, base, stride } = view(ai); const nc = NCOMP[a.type], cs = CSIZE[a.componentType];
  const elStride = stride || nc * cs; const out = [];
  const rd = { 5120: (o) => bin.readInt8(o), 5121: (o) => bin.readUInt8(o), 5122: (o) => bin.readInt16LE(o),
               5123: (o) => bin.readUInt16LE(o), 5125: (o) => bin.readUInt32LE(o), 5126: (o) => bin.readFloatLE(o) }[a.componentType];
  for (let i = 0; i < a.count; i++) { const e = []; for (let c = 0; c < nc; c++) e.push(rd(base + i * elStride + c * cs)); out.push(e); }
  return { data: out, comp: a.componentType, type: a.type, nc, cs };
}

const posA = readAccessor(prim.attributes.POSITION);
const idxA = readAccessor(prim.indices);
const nV = posA.data.length, nI = idxA.data.length;
const pos = posA.data, idx = idxA.data.map((e) => e[0]);

// weld by quantized position
const map = new Map(), canon = new Int32Array(nV); let nc = 0; const Q = 1e4;
for (let i = 0; i < nV; i++) {
  const k = Math.round(pos[i][0] * Q) + '_' + Math.round(pos[i][1] * Q) + '_' + Math.round(pos[i][2] * Q);
  let c = map.get(k); if (c === undefined) { c = nc++; map.set(k, c); } canon[i] = c;
}
const par = new Int32Array(nc); for (let i = 0; i < nc; i++) par[i] = i;
const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
const uni = (a, c) => { a = find(a); c = find(c); if (a !== c) par[a] = c; };
for (let t = 0; t < nI; t += 3) { uni(canon[idx[t]], canon[idx[t + 1]]); uni(canon[idx[t + 1]], canon[idx[t + 2]]); }
// count triangles per component, pick the largest
const triCount = {};
for (let t = 0; t < nI; t += 3) { const r = find(canon[idx[t]]); triCount[r] = (triCount[r] || 0) + 1; }
const roots = Object.keys(triCount).map(Number).sort((a, c) => triCount[c] - triCount[a]);
const keepRoot = roots[0];
console.log('components:', roots.length, '| keeping largest (' + triCount[keepRoot] + ' tris); dropping ' +
  (roots.length - 1) + ' island(s): ' + roots.slice(1).map((r) => triCount[r] + 't').join(', '));

// kept triangles + vertex remap
const keepTris = [];
for (let t = 0; t < nI; t += 3) if (find(canon[idx[t]]) === keepRoot) keepTris.push(t);
const used = new Map(), vlist = [];
for (const t of keepTris) for (let k = 0; k < 3; k++) { const ov = idx[t + k]; if (!used.has(ov)) { used.set(ov, vlist.length); vlist.push(ov); } }
const m = vlist.length;

// subset every vertex attribute we carry; preserve component types exactly
const ATTRS = ['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0'].filter((k) => prim.attributes[k] != null);
const subset = {};
for (const name of ATTRS) { const src = readAccessor(prim.attributes[name]); subset[name] = { src, rows: vlist.map((ov) => src.data[ov]) }; }
const newIdx = []; for (const t of keepTris) for (let k = 0; k < 3; k++) newIdx.push(used.get(idx[t + k]));

// ---- serialize a fresh GLB: new geometry buffers + copied IBM + copied JPEG ----
const parts = [], views = [], accs = [];
function align() { const o = parts.reduce((a, x) => a + x.length, 0); const p = (4 - o % 4) % 4; if (p) parts.push(Buffer.alloc(p)); }
function writeArr(rows, comp, type, target, minmax) {
  align(); const nCmp = NCOMP[type], cs = CSIZE[comp]; const buf = Buffer.alloc(rows.length * nCmp * cs);
  const wr = { 5120: (o, v) => buf.writeInt8(v, o), 5121: (o, v) => buf.writeUInt8(v, o), 5122: (o, v) => buf.writeInt16LE(v, o),
               5123: (o, v) => buf.writeUInt16LE(v, o), 5125: (o, v) => buf.writeUInt32LE(v, o), 5126: (o, v) => buf.writeFloatLE(v, o) }[comp];
  let p = 0; for (const e of rows) for (let c = 0; c < nCmp; c++) { wr(p, e[c]); p += cs; }
  const boff = parts.reduce((a, x) => a + x.length, 0); parts.push(buf);
  views.push({ buffer: 0, byteOffset: boff, byteLength: buf.length, ...(target ? { target } : {}) });
  const acc = { bufferView: views.length - 1, componentType: comp, count: rows.length, type };
  if (minmax) { const mn = [], mx = []; for (let c = 0; c < nCmp; c++) { mn[c] = Infinity; mx[c] = -Infinity; } for (const e of rows) for (let c = 0; c < nCmp; c++) { if (e[c] < mn[c]) mn[c] = e[c]; if (e[c] > mx[c]) mx[c] = e[c]; } acc.min = mn; acc.max = mx; }
  accs.push(acc); return accs.length - 1;
}
function copyBytes(srcOff, len, target) {
  align(); const buf = Buffer.from(bin.slice(srcOff, srcOff + len)); const boff = parts.reduce((a, x) => a + x.length, 0); parts.push(buf);
  views.push({ buffer: 0, byteOffset: boff, byteLength: len, ...(target ? { target } : {}) }); return views.length - 1;
}

const newAttr = {};
for (const name of ATTRS) { const s = subset[name].src; newAttr[name] = writeArr(subset[name].rows, s.comp, s.type, 34962, name === 'POSITION'); }
const newIndexAcc = writeArr(newIdx.map((v) => [v]), 5125, 'SCALAR', 34963, false);

// preserve inverse-bind matrices (accessor -> copy raw bytes, new accessor)
let newSkin = null;
if (json.skins && json.skins.length) {
  const sk = json.skins[0]; const ibmA = A[sk.inverseBindMatrices]; const ibmV = view(sk.inverseBindMatrices);
  const ibmLen = ibmA.count * 16 * 4;
  const bvIdx = copyBytes(ibmV.base, ibmLen, 0);
  const ibmAccIdx = accs.push({ bufferView: bvIdx, componentType: 5126, count: ibmA.count, type: 'MAT4' }) - 1;
  newSkin = { joints: sk.joints.slice(), inverseBindMatrices: ibmAccIdx, ...(sk.skeleton != null ? { skeleton: sk.skeleton } : {}) };
}

// preserve the embedded texture image (copy JPEG/PNG bytes)
let newImages, newTextures, newSamplers, newMaterials;
if (json.images && json.images.length) {
  newImages = json.images.map((img) => {
    if (img.bufferView != null) { const iv = BV[img.bufferView]; const bvIdx = copyBytes(iv.byteOffset || 0, iv.byteLength); return { mimeType: img.mimeType, bufferView: bvIdx }; }
    return Object.assign({}, img);
  });
  newTextures = json.textures ? JSON.parse(JSON.stringify(json.textures)) : undefined;
  newSamplers = json.samplers ? JSON.parse(JSON.stringify(json.samplers)) : undefined;
}
newMaterials = json.materials ? JSON.parse(JSON.stringify(json.materials)) : [{ pbrMetallicRoughness: { baseColorFactor: [0.83, 0.62, 0.5, 1] } }];

// nodes: keep them all (mesh node + skeleton). Their transforms/hierarchy are untouched.
const g = {
  asset: { version: '2.0', generator: 'bannon strip_satellites (keep largest component, preserve skin+texture)' },
  scene: json.scene || 0, scenes: json.scenes || [{ nodes: [0] }],
  nodes: JSON.parse(JSON.stringify(json.nodes)),
  meshes: [{ name: json.meshes[0].name, primitives: [{ attributes: newAttr, indices: newIndexAcc, material: 0 }] }],
  materials: newMaterials,
  bufferViews: views, accessors: accs,
};
if (newSkin) g.skins = [newSkin];
if (newImages) g.images = newImages;
if (newTextures) g.textures = newTextures;
if (newSamplers) g.samplers = newSamplers;

let blob = Buffer.concat(parts); const bpad = (4 - blob.length % 4) % 4; if (bpad) blob = Buffer.concat([blob, Buffer.alloc(bpad)]);
g.buffers = [{ byteLength: blob.length }];
let js = Buffer.from(JSON.stringify(g)); const jpad = (4 - js.length % 4) % 4; if (jpad) js = Buffer.concat([js, Buffer.alloc(jpad, 0x20)]);
const header = Buffer.alloc(12); header.write('glTF', 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + js.length + 8 + blob.length, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4E4F534A, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(blob.length, 0); bh.writeUInt32LE(0x004E4942, 4);
fs.writeFileSync(OUT, Buffer.concat([header, jh, js, bh, blob]));
console.log('wrote ' + OUT + '  verts ' + nV + ' -> ' + m + ', tris ' + (nI / 3) + ' -> ' + keepTris.length +
  ', skin ' + (newSkin ? newSkin.joints.length + ' joints preserved' : 'none') + ', texture ' + (newImages ? 'preserved' : 'none') +
  '  (' + (fs.statSync(OUT).size / 1024 | 0) + ' KB)');
