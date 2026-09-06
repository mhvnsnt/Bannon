#!/usr/bin/env node
/*
 * optimize_gltf.cjs — shrink the shipped GLBs without touching what makes them work.
 *
 * WHY THIS EXISTS
 *   assets/models/props/weapons/table.glb was 26 MB. Its geometry is 1,787 vertices — 116 KB.
 *   The other 25.9 MB is six UNCOMPRESSED 2048x2048 PNGs on a folding table. Every MDickie world
 *   GLB has the same shape of problem (Junction: 24k verts, 21 MB of 512px PNGs). That is a
 *   re-export problem, and the fix is a texture codec, not a runtime trick.
 *
 * WHAT IT USES (open source, all reachable from npm — nothing hand-rolled)
 *   @gltf-transform/core        glTF document IO
 *   @gltf-transform/functions   dedup / prune / weld / join / resample / textureCompress
 *   sharp (libvips)             the actual WebP encoder
 *
 * WHY WEBP AND NOT KTX2/BASIS
 *   three r128's GLTFLoader already parses EXT_texture_webp (GLTFTextureWebPExtension). KTX2 would
 *   need KTX2Loader + the Basis transcoder vendored and a zstd fallback path on the phone. WebP is
 *   a zero-new-code win, and Android WebView has supported it since forever.
 *
 * TWO SAFETY MODES — this matters
 *   --mode=texture   textures only. Geometry, skins, joints, inverseBindMatrices, morph targets and
 *                    animations are not read, let alone written. Safe on the skinqa-PASSING rigs
 *                    (BANNON_rigged, BANNON_muscular_skinned et al) — a texture codec cannot move a
 *                    vertex or reweight a joint.
 *   --mode=full      textures + dedup/prune/weld/join. Only for STATIC props and environments.
 *                    Refuses to run on a document that has a skin or a morph target, because
 *                    join() merges primitives and that is how you destroy a rig.
 *
 * VERIFY, DON'T TRUST
 *   Every write is followed by a re-read that asserts vertex count, joint count, animation count and
 *   morph-target count are unchanged (mode=texture) or that no skin existed to break (mode=full).
 *   A file that fails verification is discarded, not shipped. MODEL_QA.md's rule — promote on the
 *   number, never on the screenshot — applies here too.
 *
 * USAGE
 *   node tools/assets/optimize_gltf.cjs --mode=full    --max=1024 assets/models/props/weapons
 *   node tools/assets/optimize_gltf.cjs --mode=texture --max=1024 assets/models
 *   node tools/assets/optimize_gltf.cjs --report assets/models        # size census, writes nothing
 *   ... --dry            measure the win without writing
 *   ... --gate           exit 1 if any shipped GLB is still over --budget MB
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// The toolchain is intentionally NOT a repo dependency — it is a build-time tool, and package.json
// here is the daemon's. Look for it wherever it was installed.
function reqTool(name) {
  const roots = [
    process.env.GLTF_TOOLS && path.join(process.env.GLTF_TOOLS, 'node_modules'),
    path.join(__dirname, 'node_modules'),
    path.join(process.cwd(), 'node_modules'),
    '/tmp/claude-0/-home-user-Bannon/4ac21f6b-97dc-53a8-9769-7e549fb88a44/scratchpad/gltftools/node_modules',
  ].filter(Boolean);
  for (const r of roots) {
    try { return require(path.join(r, name)); } catch (e) { /* next */ }
  }
  console.error(`\nMISSING TOOLCHAIN: ${name}`);
  console.error(`Install it once, anywhere, then point GLTF_TOOLS at that directory:`);
  console.error(`  mkdir -p ~/gltftools && cd ~/gltftools && npm init -y`);
  console.error(`  npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions sharp`);
  console.error(`  GLTF_TOOLS=~/gltftools node tools/assets/optimize_gltf.cjs ...\n`);
  process.exit(2);
}

const core       = reqTool('@gltf-transform/core');
const extensions = reqTool('@gltf-transform/extensions');
const funcs      = reqTool('@gltf-transform/functions');
const sharp      = reqTool('sharp');
const meshopt    = reqTool('meshoptimizer');
const MeshoptSimplifier = meshopt.MeshoptSimplifier || meshopt.simplifier || meshopt;

const { NodeIO } = core;
const { ALL_EXTENSIONS } = extensions;
const { dedup, prune, weld, join, textureCompress, resample, simplify } = funcs;

const MB = 1024 * 1024;

// ── args ──────────────────────────────────────────────────────────────────────────────────────────
const argv    = process.argv.slice(2);
const flag    = (k, d) => { const a = argv.find(s => s.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const has     = (k) => argv.includes(`--${k}`);
const targets = argv.filter(a => !a.startsWith('--'));

const MODE    = flag('mode', 'texture');           // texture | full
const MAXPX   = parseInt(flag('max', '1024'), 10);  // longest texture edge after resize
const QCOLOR  = parseInt(flag('q', '80'), 10);      // WebP quality for colour/emissive
const QDATA   = parseInt(flag('qdata', '92'), 10);  // WebP quality for normal / ORM — data maps, be gentle
const BUDGET  = parseFloat(flag('budget', '6'));    // --gate ceiling, MB
// TRIANGLE BUDGET. A wrestler in WWE 2K is roughly 35-45k triangles. Tripo hands us 150k+ for one
// body (TRIPLE_XXX_suit: 188,842 verts / 156,569 tris = 10.4 MB of the file). meshoptimizer's
// simplifier carries JOINTS_0 and WEIGHTS_0 through the collapse, so a rig survives it — which is
// why it is the right tool here and a naive vertex-merge is not. 0 disables.
const TRIBUDGET = parseInt(flag('tris', '0'), 10);
const SIMPLIFY_ERR = parseFloat(flag('error', '0.001')); // meshopt target error, fraction of extent
const DRY     = has('dry');
const REPORT  = has('report');
const GATE    = has('gate');
const MINSIZE = parseFloat(flag('min', '1')) * MB;  // don't bother under this

if (!targets.length) {
  console.error('usage: optimize_gltf.cjs [--mode=texture|full] [--max=1024] [--dry|--report|--gate] <dir-or-file>...');
  process.exit(2);
}

// ── file discovery ────────────────────────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(['incoming', 'dropins', 'node_modules', '.git']);

function collect(p, out) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(p))) return out;      // incoming/ is a raw drop zone, not shipped
    for (const e of fs.readdirSync(p)) collect(path.join(p, e), out);
    return out;
  }
  if (/\.(glb|gltf)$/i.test(p)) out.push(p);
  return out;
}

const files = [];
for (const t of targets) { if (fs.existsSync(t)) collect(t, files); }
files.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);

// ── report / gate ─────────────────────────────────────────────────────────────────────────────────
if (REPORT || GATE) {
  let total = 0, over = [];
  for (const f of files) {
    const sz = fs.statSync(f).size;
    total += sz;
    if (sz > BUDGET * MB) over.push([f, sz]);
  }
  console.log(`${files.length} GLB/glTF, ${(total / MB).toFixed(1)} MB total`);
  if (over.length) {
    console.log(`\n${over.length} over the ${BUDGET} MB budget:`);
    for (const [f, sz] of over.slice(0, 40)) console.log(`  ${(sz / MB).toFixed(1).padStart(6)} MB  ${f}`);
    if (over.length > 40) console.log(`  ... and ${over.length - 40} more`);
  } else {
    console.log(`\nall within the ${BUDGET} MB budget`);
  }
  if (GATE) process.exit(over.length ? 1 : 0);
  process.exit(0);
}

// ── the shape of a document, for before/after comparison ──────────────────────────────────────────
// NOTE ON WHAT "verts" MEANS HERE. Counting vertices per MESH is the wrong invariant and it nearly
// let a false alarm through: dedup() collapsed 20 identical mesh definitions in steel_chair.glb, so
// the per-mesh count fell 4,720 -> 1,888 while the nodes still shared the survivors and the scene
// rendered the exact same 6,370 triangles. The invariant that actually matters is what the GPU draws,
// so walk NODES and count each node's mesh once — measured 6,370 -> 6,370 through the full pass.
function fingerprint(doc) {
  const root = doc.getRoot();
  let morphs = 0, prims = 0, drawnTris = 0, drawnVerts = 0, nodesWithMesh = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      prims++;
      morphs += prim.listTargets().length;
    }
  }
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    nodesWithMesh++;
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const idx = prim.getIndices();
      if (pos) drawnVerts += pos.getCount();
      drawnTris += (idx ? idx.getCount() : (pos ? pos.getCount() : 0)) / 3;
    }
  }
  let joints = 0;
  for (const skin of root.listSkins()) joints += skin.listJoints().length;
  return {
    drawnTris, drawnVerts, nodesWithMesh, morphs, prims, joints,
    skins: root.listSkins().length,
    anims: root.listAnimations().length,
    nodes: root.listNodes().length,
    textures: root.listTextures().length,
  };
}

function fpEqual(a, b, mode) {
  if (a.joints !== b.joints) return `joint count ${a.joints} -> ${b.joints}`;
  if (a.skins  !== b.skins)  return `skin count ${a.skins} -> ${b.skins}`;
  if (a.anims  !== b.anims)  return `animation count ${a.anims} -> ${b.anims}`;
  if (a.morphs !== b.morphs) return `morph target count ${a.morphs} -> ${b.morphs}`;
  if (a.nodesWithMesh !== b.nodesWithMesh) return `renderable nodes ${a.nodesWithMesh} -> ${b.nodesWithMesh}`;
  if (mode === 'simplify') {
    // Deliberate triangle reduction: triangles are SUPPOSED to fall. What must survive is the rig and
    // the parts. Losing a named primitive here means a limb vanished, which is a hard reject.
    if (a.prims !== b.prims) return `primitive count ${a.prims} -> ${b.prims} (a body part was dropped)`;
    if (b.drawnTris === 0)   return `all geometry lost`;
    if (b.drawnTris > a.drawnTris) return `drawn triangles GREW ${a.drawnTris} -> ${b.drawnTris}`;
    return null;
  }
  if (mode === 'texture') {
    // texture mode must not have touched geometry AT ALL
    if (a.drawnTris  !== b.drawnTris)  return `drawn triangles ${a.drawnTris} -> ${b.drawnTris} (texture mode must not touch geometry)`;
    if (a.drawnVerts !== b.drawnVerts) return `drawn vertices ${a.drawnVerts} -> ${b.drawnVerts} (texture mode must not touch geometry)`;
    if (a.prims      !== b.prims)      return `primitive count ${a.prims} -> ${b.prims}`;
  } else {
    // full mode may weld and join, but the scene must still DRAW the same triangles. weld() removes
    // duplicate vertices (that is the point) so drawnVerts may fall — the triangle count may not.
    if (a.drawnTris !== b.drawnTris) return `drawn triangles ${a.drawnTris} -> ${b.drawnTris} (geometry was lost or duplicated)`;
    if (b.drawnVerts > a.drawnVerts) return `drawn vertices GREW ${a.drawnVerts} -> ${b.drawnVerts}`;
  }
  if (b.textures === 0 && a.textures > 0) return `all textures lost (${a.textures} -> 0)`;
  return null;
}

// ── the pass ──────────────────────────────────────────────────────────────────────────────────────
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// Normal and metallicRoughness/occlusion maps are DATA, not pictures. Lossy WebP on a normal map
// shows up as shading blotches on flat surfaces, so they get near-lossless treatment.
const DATA_SLOTS  = /^(normalTexture|occlusionTexture|metallicRoughnessTexture)$/;
const COLOR_SLOTS = /^(baseColorTexture|emissiveTexture|sheenColorTexture|specularColorTexture)$/;

async function optimize(file) {
  const before = fs.statSync(file).size;
  const doc    = await io.read(file);
  const fpA    = fingerprint(doc);

  const wantFull = MODE === 'full';
  // A rig is not a prop. join() merges primitives across materials and that is exactly how a skinned
  // mesh gets destroyed, so full mode refuses rather than "trying".
  const isRigged = fpA.skins > 0 || fpA.morphs > 0 || fpA.anims > 0;
  const effMode  = (wantFull && isRigged) ? 'texture' : MODE;
  const demoted  = wantFull && isRigged;

  // SIMPLIFY MODE: already under budget is already done. Nothing is gained by re-encoding a model
  // that is the right size, and every re-encode is another chance to break a rig that currently passes
  // the skinqa gate.
  if (effMode === 'simplify' && TRIBUDGET > 0 && fpA.drawnTris <= TRIBUDGET) {
    return { file, before, after: before, ok: true, skipped: `${Math.round(fpA.drawnTris)} tris, under the ${TRIBUDGET} budget`, effMode, demoted };
  }

  const transforms = [];

  // textures first — dedup can then collapse identical images before we spend time encoding them
  transforms.push(dedup());
  transforms.push(prune({ keepAttributes: effMode === 'texture', keepLeaves: false }));

  if (effMode === 'full') {
    transforms.push(weld());                       // index the mesh; Sketchfab exports often are not
    transforms.push(join({ keepNamed: true }));     // fewer draw calls; named nodes survive for wiring
    transforms.push(resample());                    // drop redundant animation keys (no-op here, cheap)
  }

  if (effMode === 'simplify' && TRIBUDGET > 0) {
    // The ratio is computed per FILE, not per primitive, so a 15-part rigid model keeps its proportions
    // — shrinking every part to the same ratio is what preserves the silhouette. The simplifier needs
    // welded (indexed) geometry to have edges to collapse at all; Tripo output frequently is not welded,
    // which is why weld() runs first even in simplify mode.
    const ratio = Math.max(0.05, Math.min(1, TRIBUDGET / fpA.drawnTris));
    transforms.push(weld());
    transforms.push(simplify({
      simplifier: MeshoptSimplifier,
      ratio,
      error: SIMPLIFY_ERR,
      lockBorder: true,   // do not unstitch seams between body parts — that is how you get gaps at a wrist
    }));
  }

  transforms.push(textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    resize: [MAXPX, MAXPX],
    slots: COLOR_SLOTS,
    quality: QCOLOR,
    effort: 6,
  }));
  transforms.push(textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    resize: [MAXPX, MAXPX],
    slots: DATA_SLOTS,
    quality: QDATA,
    effort: 6,
  }));
  // anything in no recognised slot (unlit colour, custom) — still worth encoding, treat as colour
  transforms.push(textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    resize: [MAXPX, MAXPX],
    quality: QCOLOR,
    effort: 6,
  }));

  await doc.transform(...transforms);

  const bytes = await io.writeBinary(doc);
  const after = bytes.byteLength;

  // VERIFY on the bytes we would actually ship, not on the in-memory document.
  const tmp = file + '.opt.tmp';
  fs.writeFileSync(tmp, bytes);
  let problem = null;
  try {
    const reread = await io.read(tmp);
    problem = fpEqual(fpA, fingerprint(reread), effMode);
  } catch (e) {
    problem = `re-read failed: ${e.message}`;
  }

  if (problem) {
    fs.unlinkSync(tmp);
    return { file, before, after, ok: false, problem, effMode, demoted };
  }
  if (after >= before) {
    fs.unlinkSync(tmp);
    return { file, before, after, ok: true, skipped: 'already smaller', effMode, demoted };
  }
  if (DRY) {
    fs.unlinkSync(tmp);
    return { file, before, after, ok: true, dry: true, effMode, demoted };
  }
  fs.renameSync(tmp, file);
  return { file, before, after, ok: true, effMode, demoted };
}

(async () => {
  const todo = files.filter(f => fs.statSync(f).size >= MINSIZE);
  console.log(`optimize_gltf  mode=${MODE}  max=${MAXPX}px  q=${QCOLOR}/${QDATA}  ${todo.length} file(s)${DRY ? '  [DRY]' : ''}\n`);

  let tb = 0, ta = 0, failed = 0, demoted = 0;
  for (let i = 0; i < todo.length; i++) {
    const f = todo[i];
    let r;
    try {
      r = await optimize(f);
    } catch (e) {
      console.log(`  [${i + 1}/${todo.length}] FAIL  ${path.basename(f)}  ${e.message}`);
      failed++;
      continue;
    }
    tb += r.before;
    ta += r.ok && !r.skipped ? r.after : r.before;
    if (r.demoted) demoted++;
    if (!r.ok) {
      failed++;
      console.log(`  [${i + 1}/${todo.length}] REJECT ${path.basename(f)}  ${r.problem}  (kept original)`);
    } else if (r.skipped) {
      console.log(`  [${i + 1}/${todo.length}] keep  ${path.basename(f)}  ${r.skipped}`);
    } else {
      const pct = (100 * (1 - r.after / r.before)).toFixed(0);
      console.log(`  [${i + 1}/${todo.length}] ${(r.before / MB).toFixed(1)} -> ${(r.after / MB).toFixed(2)} MB  (-${pct}%)  ${path.basename(f)}${r.demoted ? '  [rigged: texture-only]' : ''}`);
    }
  }

  console.log(`\n${(tb / MB).toFixed(1)} MB -> ${(ta / MB).toFixed(1)} MB   saved ${((tb - ta) / MB).toFixed(1)} MB (${(100 * (1 - ta / tb)).toFixed(0)}%)`);
  if (demoted) console.log(`${demoted} rigged file(s) ran texture-only — geometry and skinning untouched by design`);
  if (failed)  console.log(`${failed} file(s) rejected and left as they were`);
  process.exit(0);
})();
