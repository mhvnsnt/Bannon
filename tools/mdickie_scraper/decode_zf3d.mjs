#!/usr/bin/env node
/* decode_zf3d.mjs — MDickie .zf3d (Wrestling Revolution 3D / Hard Time III / Super City) → GLB.
 *
 * The .zf3d is a plain ZIP holding, per mesh part N:
 *   N.vertex     — raw float32 stream, sizePerVertex=8: POSITION(float3), NORMAL(float3), UV0(float2)
 *                  triangle list, NO index buffer (every 3 verts = 1 tri).
 *   N.animation  — float3x4 keyframes (12 floats / 48 bytes each). Bind/idle for static props.
 *   main.xml     — <surfaces> (which N.vertex feeds which node), <nodes> (name + float3x4 transform
 *                  + material), <materials>/<maps> (diffuse texture .JPG). Fully self-describing.
 *   *.JPG/*.jpg  — diffuse textures, embedded straight into the GLB (they load in three.js as-is).
 *
 * Owner has MDickie's explicit permission for this game. Output GLBs are used as ATTIRE/ENV bases and
 * are progressively morphed toward the proprietary Bannon universe — never shipped as MDickie's IP.
 *
 * Usage: node decode_zf3d.mjs <input.zf3d> <output.glb> [--bake-transforms]
 *   --bake-transforms (default on): apply each node's float3x4 into vertex positions so the GLB is a
 *   single static prop in world space. Omit with --local to keep per-node transforms as glTF nodes.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const IN = args[0];
const OUT = args[1];
const KEEP_LOCAL = args.includes('--local');
if (!IN || !OUT) { console.error('usage: node decode_zf3d.mjs <in.zf3d> <out.glb> [--local]'); process.exit(1); }

// ---- 1. extract the zip (use system unzip; zf3d is a stock ZIP) --------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zf3d-'));
execFileSync('unzip', ['-o', '-q', path.resolve(IN), '-d', tmp]);
const readf = (n) => fs.readFileSync(path.join(tmp, n));
const xml = fs.readFileSync(path.join(tmp, 'main.xml'), 'utf8');

// ---- 2. parse main.xml (small, regular — regex is enough) --------------------------------------
const attr = (tag, name) => { const m = tag.match(new RegExp(name + '="([^"]*)"')); return m ? m[1] : null; };
const grab = (block) => [...xml.matchAll(new RegExp('<' + block + '\\b[^>]*/?>', 'g'))].map(m => m[0]);

const surfaces = {}; // id -> {source, size}
for (const s of grab('surface')) surfaces[attr(s, 'id')] = { source: attr(s, 'source'), size: +attr(s, 'sizePerVertex') };
const maps = {};     // id -> texture filename
for (const m of grab('map')) maps[attr(m, 'id')] = attr(m, 'source');
const materials = {}; // id -> {name, map}
for (const mt of grab('material')) materials[attr(mt, 'id')] = { name: attr(mt, 'name'), map: null };
// diffuse map lives on a child <diffuse ... map="X"> — re-scan material *blocks*
for (const mb of xml.matchAll(/<material\b[^>]*id="(\d+)"[\s\S]*?<\/material>/g)) {
  const dm = mb[0].match(/<diffuse[^>]*map="(\d+)"/);
  if (dm && materials[mb[1]]) materials[mb[1]].map = dm[1];
}
const nodes = [];
for (const nb of xml.matchAll(/<node\b[^>]*\/?>/g)) {
  const n = nb[0];
  if (attr(n, 'type') !== 'mesh') continue;
  nodes.push({
    name: attr(n, 'name') || ('part' + nodes.length),
    surface: attr(n, 'surfaces'),
    material: attr(n, 'materials'),
    transform: (attr(n, 'transform') || '').split(',').map(Number),
  });
}

// ---- 3. read each node's vertex stream, optionally bake its float3x4 transform ------------------
// float3x4 layout (libgdx / MDickie): 9 basis floats (column-major) + 3 translation.
function apply(t, x, y, z) {
  if (!t || t.length < 12) return [x, y, z];
  // columns: c0=(t0,t1,t2) c1=(t3,t4,t5) c2=(t6,t7,t8), translation=(t9,t10,t11)
  return [
    t[0] * x + t[3] * y + t[6] * z + t[9],
    t[1] * x + t[4] * y + t[7] * z + t[10],
    t[2] * x + t[5] * y + t[8] * z + t[11],
  ];
}
function apply3(t, x, y, z) { // linear part only (normals)
  if (!t || t.length < 12) return [x, y, z];
  return [t[0] * x + t[3] * y + t[6] * z, t[1] * x + t[4] * y + t[7] * z, t[2] * x + t[5] * y + t[8] * z];
}

const prims = []; // {name, pos:Float32Array, nrm, uv, texFile}
for (const nd of nodes) {
  const surf = surfaces[nd.surface];
  if (!surf) continue;
  const raw = readf(surf.source + '.vertex');
  const fl = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength >> 2);
  const stride = surf.size; // 8
  const vcount = fl.length / stride | 0;
  const pos = new Float32Array(vcount * 3), nrm = new Float32Array(vcount * 3), uv = new Float32Array(vcount * 2);
  for (let i = 0; i < vcount; i++) {
    const b = i * stride;
    let px = fl[b], py = fl[b + 1], pz = fl[b + 2];
    let nx = fl[b + 3], ny = fl[b + 4], nz = fl[b + 5];
    if (!KEEP_LOCAL) { [px, py, pz] = apply(nd.transform, px, py, pz);[nx, ny, nz] = apply3(nd.transform, nx, ny, nz); }
    const nl = Math.hypot(nx, ny, nz) || 1;
    pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
    nrm[i * 3] = nx / nl; nrm[i * 3 + 1] = ny / nl; nrm[i * 3 + 2] = nz / nl;
    uv[i * 2] = fl[b + 6]; uv[i * 2 + 1] = fl[b + 7];
  }
  const mat = materials[nd.material];
  const texFile = mat && mat.map != null ? maps[mat.map] : null;
  prims.push({ name: nd.name, pos, nrm, uv, texFile });
}

// ---- 4. assemble a GLB (single BIN chunk; textures embedded as bufferViews) --------------------
const bin = [];        // {data:Buffer} chunks, concatenated → the BIN blob
let binLen = 0;
const bufferViews = [], accessors = [], images = [], textures = [], glMaterials = [], meshPrims = [];
const texByFile = new Map();
function pushView(buf, target) {
  // 4-byte align
  while (binLen % 4) { bin.push(Buffer.from([0])); binLen++; }
  const off = binLen; bin.push(buf); binLen += buf.length;
  bufferViews.push(target != null ? { buffer: 0, byteOffset: off, byteLength: buf.length, target } : { buffer: 0, byteOffset: off, byteLength: buf.length });
  return bufferViews.length - 1;
}
function fAccessor(arr, comps, type, min, max) {
  const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  const bv = pushView(buf, 34962);
  accessors.push({ bufferView: bv, componentType: 5126, count: arr.length / comps, type, ...(min ? { min, max } : {}) });
  return accessors.length - 1;
}
function ensureTexture(file) {
  if (!file) return null;
  if (texByFile.has(file)) return texByFile.get(file);
  // find the extracted file case-insensitively
  const real = fs.readdirSync(tmp).find(f => f.toLowerCase() === file.toLowerCase());
  if (!real) return null;
  const jpg = fs.readFileSync(path.join(tmp, real));
  const bv = pushView(jpg, null);
  images.push({ bufferView: bv, mimeType: 'image/jpeg', name: file });
  textures.push({ source: images.length - 1 });
  const ti = textures.length - 1; texByFile.set(file, ti); return ti;
}

for (const p of prims) {
  // bbox for POSITION
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = p.pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
  const aPos = fAccessor(p.pos, 3, 'VEC3', mn, mx);
  const aNrm = fAccessor(p.nrm, 3, 'VEC3');
  const aUv = fAccessor(p.uv, 2, 'VEC2');
  const ti = ensureTexture(p.texFile);
  const matIdx = glMaterials.length;
  glMaterials.push({
    name: p.name,
    pbrMetallicRoughness: { metallicFactor: 0.0, roughnessFactor: 0.85, ...(ti != null ? { baseColorTexture: { index: ti } } : { baseColorFactor: [0.8, 0.8, 0.8, 1] }) },
    doubleSided: true,
  });
  meshPrims.push({ attributes: { POSITION: aPos, NORMAL: aNrm, TEXCOORD_0: aUv }, material: matIdx, mode: 4 });
}

const gltf = {
  asset: { version: '2.0', generator: 'bannon-decode_zf3d' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: path.basename(OUT, '.glb'), mesh: 0 }],
  meshes: [{ name: 'mdickie', primitives: meshPrims }],
  materials: glMaterials,
  ...(textures.length ? { textures, images, samplers: [{}] } : {}),
  accessors,
  bufferViews,
  buffers: [{ byteLength: binLen }],
};
if (textures.length) for (const t of textures) t.sampler = 0;

const binBuf = Buffer.concat(bin);
let jsonStr = JSON.stringify(gltf);
while (jsonStr.length % 4) jsonStr += ' ';
const jsonBuf = Buffer.from(jsonStr, 'utf8');
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546C67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8);
const jsonHdr = Buffer.alloc(8); jsonHdr.writeUInt32LE(jsonBuf.length, 0); jsonHdr.writeUInt32LE(0x4E4F534A, 4);
const binHdr = Buffer.alloc(8); binHdr.writeUInt32LE(binBuf.length, 0); binHdr.writeUInt32LE(0x004E4942, 4);
fs.writeFileSync(OUT, Buffer.concat([header, jsonHdr, jsonBuf, binHdr, binBuf]));
fs.rmSync(tmp, { recursive: true, force: true });

const tris = meshPrims.reduce((s, p) => s + accessors[p.attributes.POSITION].count / 3, 0);
console.log(`✓ ${path.basename(OUT)} — ${prims.length} parts, ${tris | 0} tris, ${textures.length} textures, ${(binLen / 1024) | 0}KB`);
