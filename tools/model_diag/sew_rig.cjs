#!/usr/bin/env node
/* sew_rig.cjs — SEW AN ACTION FIGURE BACK INTO A BODY.
 *
 *   node tools/model_diag/sew_rig.cjs assets/models/BANNON_rigged.glb
 *   node tools/model_diag/sew_rig.cjs <in.glb> [out.glb] [--weld] [--check]
 *
 * WHAT THIS IS FOR. rig_continuity.cjs found exactly one SEVERED rig in the 73-model roster, and it
 * is BANNON_rigged.glb — the DEFAULT PLAYER MODEL. Fifteen separate skinned primitives named after
 * our own joint keys: chest elL elR ftL ftR haL haR head hipL hipR knL knR pelvis shL shR. The body
 * is cut at every joint, so there is no surface across the elbow, knee, shoulder or neck. The pieces
 * rotate past each other. That is an action figure, and it is exactly what the owner has been
 * describing for weeks as "procedural puppets in strings" — while every check I owned said the GLB
 * was bound, skinned and animating, because it was.
 *
 * WHY NOTHING CAUGHT IT: skinqa measures how far a vertex drifts from where its weights predict.
 * A piece welded rigidly to one bone never drifts, so a severed rig scores a PERFECT deformation
 * result. It is the one defect that looks ideal to a deformation test while being unable to deform.
 *
 * THE CUT IS REVERSIBLE, MEASURED BEFORE WRITING ANY OF THIS: 1,244 positions are shared EXACTLY
 * between pieces, and the pairs are anatomical — chest~head 131, chest~shR 120, chest~shL 115,
 * hipL~pelvis 62, ftL~knL 40, ftR~knR 35. This body was one mesh and somebody cut it at the joints,
 * duplicating the boundary ring. All fifteen pieces share ONE material and identical semantics
 * (POSITION, JOINTS_0, WEIGHTS_0, NORMAL, TEXCOORD_0), so they concatenate exactly.
 *
 * WHAT IT DOES:
 *   1. concatenates the primitives into ONE, offsetting indices. Geometry is bit-identical; only the
 *      grouping changes. This is also what transfer_weights.cjs requires of a target.
 *   2. --weld additionally fuses vertices that share a position AND agree on normal direction, which
 *      physically closes the seam ring. Position alone is NOT enough: in bind pose a hand rests
 *      against a hip and 32 of those vertex pairs are coincidental (haL~hipL), not a seam. Welding
 *      those would glue the arm to the hip. The normal test rejects them.
 *
 * SEWING ALONE DOES NOT MAKE IT BEND — the weights are still one-bone-per-piece. Follow with
 * transfer_weights.cjs from a WHOLE sibling on the same 58-joint skeleton, which gives both sides of
 * every seam near-identical blended influences because they sit at the same point in space.
 *
 * EVERY WRITE IS RE-READ FROM THE SHIPPED BYTES and checked: triangles, vertices (welding may only
 * REDUCE, never add), joints, skins, morph targets, and the bind bounding box.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const args = process.argv.slice(2);
const FLAG = n => args.includes('--' + n);
const files = args.filter(a => !a.startsWith('--'));
const IN = files[0];
if (!IN){ console.error('usage: sew_rig.cjs <in.glb> [out.glb] [--weld] [--check]'); process.exit(2); }
const CHECK = FLAG('check');
const WELD  = FLAG('weld');
const SRC = path.isAbsolute(IN) ? IN : (fs.existsSync(IN) ? IN : path.join(ROOT, 'assets', 'models', path.basename(IN)));
const OUT = files[1] ? (path.isAbsolute(files[1]) ? files[1] : path.join(ROOT, files[1])) : SRC;

const core = require('@gltf-transform/core');
const ext  = require('@gltf-transform/extensions');
const { MeshoptEncoder, MeshoptDecoder } = require('meshoptimizer');
const { normalizeBuffer } = require('./fix_extensions_used.cjs');
const { NodeIO } = core, { ALL_EXTENSIONS } = ext;

const SEM = ['POSITION', 'NORMAL', 'TANGENT', 'TEXCOORD_0', 'TEXCOORD_1', 'COLOR_0', 'JOINTS_0', 'WEIGHTS_0'];
const NC  = { POSITION:3, NORMAL:3, TANGENT:4, TEXCOORD_0:2, TEXCOORD_1:2, COLOR_0:4, JOINTS_0:4, WEIGHTS_0:4 };

function stats(doc){
  let tris = 0, verts = 0, prims = 0, morphs = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()){
    prims++; morphs += p.listTargets().length;
    const i = p.getIndices(), P = p.getAttribute('POSITION');
    tris += i ? i.getCount()/3 : (P ? P.getCount()/3 : 0);
    verts += P ? P.getCount() : 0;
  }
  const box = [ [Infinity,Infinity,Infinity], [-Infinity,-Infinity,-Infinity] ];
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()){
    const P = p.getAttribute('POSITION'); if (!P) continue; const e = [0,0,0];
    for (let v = 0; v < P.getCount(); v++){ P.getElement(v, e);
      for (let c = 0; c < 3; c++){ if (e[c] < box[0][c]) box[0][c] = e[c]; if (e[c] > box[1][c]) box[1][c] = e[c]; } }
  }
  return { tris: Math.round(tris), verts, prims, morphs,
    skins: doc.getRoot().listSkins().length,
    joints: doc.getRoot().listSkins().reduce((n,s)=>n+s.listJoints().length,0),
    box: box.map(v => v.map(x => Math.round(x*1e4)/1e4)) };
}

(async () => {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.readBinary(normalizeBuffer(fs.readFileSync(SRC)));
  const s0 = stats(doc);

  // ── collect every skinned primitive. They must agree on material and on which attributes exist,
  //    or concatenation would silently invent data for the ones that are missing it.
  const group = [];
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives())
      if (p.getAttribute('JOINTS_0') && p.getAttribute('WEIGHTS_0')) group.push({ mesh: m, prim: p });

  if (group.length < 2){ console.log('  nothing to sew — ' + group.length + ' skinned primitive(s)'); return; }
  const mat0 = group[0].prim.getMaterial();
  const sem0 = group[0].prim.listSemantics().slice().sort().join(',');
  for (const g of group){
    if (g.prim.getMaterial() !== mat0){ console.error('  REFUSED: primitives use different materials — sewing would drop one.'); process.exit(3); }
    if (g.prim.listSemantics().slice().sort().join(',') !== sem0){ console.error('  REFUSED: primitives disagree on attributes (' + sem0 + ' vs ' + g.prim.listSemantics().sort().join(',') + ').'); process.exit(3); }
    if (g.prim.listTargets().length){ console.error('  REFUSED: morph targets present — merging would reindex them.'); process.exit(3); }
  }
  const used = SEM.filter(s => group[0].prim.getAttribute(s));

  // ── concatenate
  const data = {}; used.forEach(s => data[s] = []);
  const idx = [];
  let base = 0;
  for (const g of group){
    const P = g.prim.getAttribute('POSITION'), n = P.getCount();
    for (const s of used){
      const A = g.prim.getAttribute(s), k = NC[s], e = new Array(k).fill(0);
      for (let v = 0; v < n; v++){ A.getElement(v, e); for (let c = 0; c < k; c++) data[s].push(e[c]); }
    }
    const I = g.prim.getIndices();
    if (I) for (let i = 0; i < I.getCount(); i++) idx.push(I.getScalar(i) + base);
    else   for (let i = 0; i < n; i++) idx.push(i + base);
    base += n;
  }

  // ── optional weld: same position AND agreeing normal. Position alone glues a resting hand to a hip.
  let welded = 0;
  let remap = null;
  if (WELD){
    const POS = data.POSITION, NRM = data.NORMAL;
    const key = i => Math.round(POS[i*3]*1e5)+'_'+Math.round(POS[i*3+1]*1e5)+'_'+Math.round(POS[i*3+2]*1e5);
    const first = new Map();
    remap = new Int32Array(base);
    for (let i = 0; i < base; i++){
      const k = key(i), prev = first.get(k);
      if (prev == null){ first.set(k, i); remap[i] = i; continue; }
      let agree = true;
      if (NRM){ const d = NRM[i*3]*NRM[prev*3] + NRM[i*3+1]*NRM[prev*3+1] + NRM[i*3+2]*NRM[prev*3+2]; agree = d > 0.5; }
      if (agree){ remap[i] = prev; welded++; } else { remap[i] = i; }
    }
    // compact
    const keep = [], newIdx = new Int32Array(base).fill(-1);
    for (let i = 0; i < base; i++) if (remap[i] === i){ newIdx[i] = keep.length; keep.push(i); }
    for (let i = 0; i < idx.length; i++) idx[i] = newIdx[remap[idx[i]]];
    for (const s of used){
      const k = NC[s], src = data[s], out = new Array(keep.length * k);
      for (let j = 0; j < keep.length; j++){ const i = keep[j]; for (let c = 0; c < k; c++) out[j*k+c] = src[i*k+c]; }
      data[s] = out;
    }
    base = keep.length;
  }

  // ── rebuild as ONE mesh / ONE primitive on the SAME skin
  const buf = doc.getRoot().listBuffers()[0];
  const prim = doc.createPrimitive().setMaterial(mat0);
  const F32 = { POSITION:1, NORMAL:1, TANGENT:1, TEXCOORD_0:1, TEXCOORD_1:1, COLOR_0:1, WEIGHTS_0:1 };
  const TYPE = { POSITION:'VEC3', NORMAL:'VEC3', TANGENT:'VEC4', TEXCOORD_0:'VEC2', TEXCOORD_1:'VEC2', COLOR_0:'VEC4', JOINTS_0:'VEC4', WEIGHTS_0:'VEC4' };
  for (const s of used){
    const arr = F32[s] ? new Float32Array(data[s])
              : (base > 65535 ? new Uint32Array(data[s]) : new Uint16Array(data[s]));
    prim.setAttribute(s, doc.createAccessor(s).setType(TYPE[s]).setArray(arr).setBuffer(buf));
  }
  prim.setIndices(doc.createAccessor('idx').setType('SCALAR')
    .setArray(base > 65535 ? new Uint32Array(idx) : new Uint16Array(idx)).setBuffer(buf));

  const merged = doc.createMesh('BANNON_SEWN_MESH').addPrimitive(prim);
  // the node that carries the skin keeps carrying it; every other severed node goes away
  const host = doc.getRoot().listNodes().find(n => n.getMesh() && n.getSkin());
  if (!host){ console.error('  REFUSED: no node carries both a mesh and a skin.'); process.exit(3); }
  const skin = host.getSkin();
  host.setMesh(merged).setName('BANNON_SEWN');
  for (const n of doc.getRoot().listNodes()){
    if (n === host) continue;
    const m = n.getMesh(); if (!m) continue;
    if (group.some(g => g.mesh === m)){ n.setMesh(null); if (!n.listChildren().length) n.dispose(); }
  }
  for (const g of group) if (g.mesh.listParents().filter(p => p.propertyType === 'Node').length === 0) g.mesh.dispose();
  host.setSkin(skin);

  const bytes = Buffer.from(await io.writeBinary(doc));
  if (CHECK){ console.log('  --check: not written. ' + group.length + ' skinned prims -> 1' +
    (WELD ? (', ' + welded + ' vertices would weld') : '') ); return; }
  fs.writeFileSync(OUT, bytes);

  // ── re-read the SHIPPED bytes and prove the invariants
  const back = await io.readBinary(new Uint8Array(fs.readFileSync(OUT)));
  const s1 = stats(back);
  const bad = [];
  if (s1.prims !== 1) bad.push('expected 1 primitive, got ' + s1.prims);
  if (s1.tris !== s0.tris) bad.push('triangles ' + s0.tris + ' -> ' + s1.tris);
  if (s1.verts > s0.verts) bad.push('vertices GREW ' + s0.verts + ' -> ' + s1.verts);
  if (s1.joints !== s0.joints) bad.push('joints ' + s0.joints + ' -> ' + s1.joints);
  if (s1.skins !== s0.skins) bad.push('skins ' + s0.skins + ' -> ' + s1.skins);
  if (s1.morphs !== s0.morphs) bad.push('morph targets ' + s0.morphs + ' -> ' + s1.morphs);
  for (let i = 0; i < 2; i++) for (let c = 0; c < 3; c++)
    if (Math.abs(s1.box[i][c] - s0.box[i][c]) > 1e-3) bad.push('bind box moved on axis ' + c);

  console.log('  ' + path.basename(SRC));
  console.log('    primitives ' + s0.prims + ' -> ' + s1.prims + '   vertices ' + s0.verts.toLocaleString() +
    ' -> ' + s1.verts.toLocaleString() + (welded ? ('  (' + welded + ' seam vertices welded)') : '') +
    '   triangles ' + s1.tris.toLocaleString() + '   joints ' + s1.joints);
  if (bad.length){ console.log('    INVARIANT BROKEN: ' + bad.join('; ')); process.exit(1); }
  console.log('    invariants hold — geometry, skeleton and bind box unchanged.');
})();
