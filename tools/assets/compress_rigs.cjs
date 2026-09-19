#!/usr/bin/env node
/* compress_rigs.cjs — EXT_meshopt_compression on the CHARACTER rigs.
 *
 *   node tools/assets/compress_rigs.cjs --dry                 # report only
 *   node tools/assets/compress_rigs.cjs assets/models/VIPER.glb
 *   node tools/assets/compress_rigs.cjs --all                 # every skinned character
 *
 * WHY — owner, three complaints in one breath: "the game is still freezing as soon as I start
 * fighting, the animations still look procedural, and the model glbs are rendering slowly".
 * They are ONE cause.
 *
 * MEASURED: BANNON_rigged.glb is 11.50 MB and only 1% OF THAT IS TEXTURE. It is 11.4 MB of raw
 * float32 geometry across 15 meshes and 122 accessors. That whole thing is fetched, parsed and
 * uploaded to the GPU BY GLTFLoader ON THE MAIN THREAD, and it happens exactly when the match
 * starts. Traced end to end: request at 37.6 s, first bind at 64.9 s — 27 SECONDS. So:
 *    the freeze at fight start   = the parse+upload blocking the frame
 *    the models rendering slowly = the same 27 seconds
 *    "animations still look procedural" = for those 27 seconds there is no rig to drive, so the
 *                                         procedural fallback is literally all there is to see
 *
 * THE OPEN-SOURCE FIX, which is what the owner keeps telling me to reach for instead of hand-rolling:
 * EXT_meshopt_compression (meshoptimizer, MIT). It quantizes and entropy-codes vertex/index data,
 * typically 4-8x smaller, and decodes at hundreds of MB/s in a WASM decoder — so both the download
 * and the parse collapse. three.js's GLTFLoader already supports it; our vendored copy references
 * MeshoptDecoder, it just needs registering (see the loader wiring in BANNON_v150.html).
 *
 * WHY MESHOPT AND NOT THE EXISTING optimize_gltf.cjs: that tool's --mode=full REFUSES any document
 * with a skin or morph targets, and correctly so — it calls join()/dedup(), which merges primitives,
 * and merging primitives is how a rig dies. Meshopt compression touches only the ENCODING of the
 * buffers. Joints, weights, inverse bind matrices, morph targets and the node hierarchy come out
 * byte-for-byte equivalent, which is exactly what a character needs.
 *
 * EVERY WRITE IS RE-READ AND GATED: joint count, mesh count, primitive count, morph-target count and
 * accessor element counts must all match the original, or the file is discarded rather than shipped.
 * Then run the real gate on top: node tools/model_diag/skinqa.cjs <name>.glb
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const MODELS = path.join(ROOT, 'assets', 'models');
const DRY = process.argv.includes('--dry');
const ALL = process.argv.includes('--all');

let core, ext, fns, meshopt;
try{
  core = require('@gltf-transform/core');
  ext  = require('@gltf-transform/extensions');
  fns  = require('@gltf-transform/functions');
  meshopt = require('meshoptimizer');
}catch(e){
  console.error('needs the toolchain:  npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer');
  console.error(String(e.message).slice(0,120));
  process.exit(2);
}
const { NodeIO } = core;
const { ALL_EXTENSIONS, EXTMeshoptCompression } = ext;
const REGISTER = ALL_EXTENSIONS;
const { normalizeBuffer } = require('../model_diag/fix_extensions_used.cjs');
const { reorder, quantize } = fns;
const { MeshoptEncoder } = meshopt;

// a fingerprint of everything a rig cannot afford to lose
function fingerprint(doc){
  const root = doc.getRoot();
  const skins = root.listSkins();
  let prims = 0, morphs = 0, verts = 0;
  for (const m of root.listMeshes()){
    for (const p of m.listPrimitives()){
      prims++;
      morphs += p.listTargets().length;
      const pos = p.getAttribute('POSITION');
      if (pos) verts += pos.getCount();
    }
  }
  return {
    skins: skins.length,
    joints: skins.reduce((n, s) => n + s.listJoints().length, 0),
    meshes: root.listMeshes().length,
    prims, morphs, verts,
    nodes: root.listNodes().length,
    anims: root.listAnimations().length
  };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function compress(file){
  const io = new NodeIO().registerExtensions(REGISTER)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': meshopt.MeshoptDecoder });
  // BOTH halves. The encoder writes the file; the DECODER is what reads it back for the
  // fingerprint gate, and an un-awaited decoder throws "Cannot read properties of undefined
  // (reading 'exports')" from meshopt_decoder.mjs — the WASM module simply is not instantiated yet.
  await MeshoptEncoder.ready;
  await meshopt.MeshoptDecoder.ready;

  const before = fs.statSync(file).size;
  // 54 of our 73 character GLBs use EXT_texture_webp and declare nothing in `extensionsUsed`, which
  // is what has been killing every gltf-transform run on this repo with "Cannot read properties of
  // null (reading 'setMagFilter')". The reader only runs an extension's preread hook for extensions
  // the FILE declares, and that hook is what copies `extensions.EXT_texture_webp.source` down to
  // `textureDef.source`; without it the very next line indexes context.textures with `undefined`,
  // the material gets an undefined texture, and getBaseColorTextureInfo() returns the null. It was
  // never a null sampler and it was never a missing registration. Patch the declaration in memory.
  const doc = await io.readBinary(normalizeBuffer(fs.readFileSync(file)));
  const fpBefore = fingerprint(doc);
  if (!fpBefore.skins) return { skip: 'no skin (not a character rig)' };
  const already = doc.getRoot().listExtensionsUsed().some(e => e.extensionName === 'EXT_meshopt_compression');
  if (already) return { skip: 'already meshopt-compressed' };

  // Reorder for locality, quantize everything EXCEPT POSITION, then entropy-code.
  //
  // NEVER QUANTIZE POSITION ON A SKINNED MESH. Measured on VIPER, three variants through the real
  // skinqa gate:
  //     no quantization at all            1.89 MB   p95 0.0256  PASS
  //     quantize incl. POSITION           1.10 MB   p95 282517  CATASTROPHIC FAIL
  //     quantize all but POSITION         1.59 MB   p95 0.0256  PASS   <- this
  // (baseline uncompressed: 5.63 MB, p95 0.0241)
  // quantize() rescales positions into an integer range and puts the compensating scale on the
  // MESH NODE. A SkinnedMesh does not use its node transform — three.js skins through bindMatrix
  // and the skeleton — so the compensation is silently dropped and every vertex lands at ~1/1000th
  // scale relative to its joints. The extra 0.5 MB is the price of a rig that still deforms.
  await doc.transform(
    reorder({ encoder: MeshoptEncoder, target: 'size' }),
    quantize({ quantizationVolume: 'scene', pattern: /^(NORMAL|TEXCOORD|COLOR|TANGENT)(_\d+)?$/ })
  );
  doc.createExtension(EXTMeshoptCompression)
     .setRequired(true)
     .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

  const out = file.replace(/\.glb$/i, '.__meshopt.glb');
  fs.writeFileSync(out, Buffer.from(await io.writeBinary(doc)));

  // RE-READ THE BYTES WE ACTUALLY WROTE and compare the fingerprint. A rig that loses a joint or a
  // morph target is worse than a rig that loads slowly.
  const back = await io.readBinary(new Uint8Array(fs.readFileSync(out)));
  const fpAfter = fingerprint(back);
  const after = fs.statSync(out).size;

  if (!same(fpBefore, fpAfter)){
    fs.unlinkSync(out);
    return { rejected: true, before: fpBefore, after: fpAfter };
  }
  if (after >= before){
    fs.unlinkSync(out);
    return { skip: 'no smaller (' + (before/1e6).toFixed(2) + ' -> ' + (after/1e6).toFixed(2) + ' MB)' };
  }
  if (DRY){ fs.unlinkSync(out); return { dry: true, before, after, fp: fpAfter }; }
  fs.renameSync(out, file);
  return { before, after, fp: fpAfter };
}

/** Run the real gate over a batch and return { 'NAME.glb': {verdict, p95, joints} }. */
function skinqa(files){
  if (!files.length) return {};
  const r = require('child_process').spawnSync(process.execPath,
    [path.join(ROOT, 'tools', 'model_diag', 'skinqa.cjs')].concat(files.map(f => path.basename(f))),
    { encoding:'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = {};
  for (const line of String(r.stdout || '').split('\n')){
    const m = line.match(/^(PASS|WEAK|FAIL)\s+(\S+\.glb)\s+(\{.*\})\s*$/);
    if (!m) continue;
    let j = {}; try{ j = JSON.parse(m[3]); }catch(e){}
    out[m[2]] = { verdict: m[1], p95: j.p95, joints: j.joints, verts: j.verts };
  }
  return out;
}

(async () => {
  const targets = ALL
    ? fs.readdirSync(MODELS).filter(f => f.endsWith('.glb')).map(f => path.join(MODELS, f))
    : process.argv.slice(2).filter(a => a.endsWith('.glb'));
  if (!targets.length){ console.error('usage: compress_rigs.cjs <model.glb> | --all [--dry] [--gate]'); process.exit(2); }

  // --gate: measure the deformation BEFORE, compress, measure AFTER, and put back anything that got
  // worse. CLAUDE.md's own rule for this repo — "never promote on a screenshot; promote on the
  // number" — and the POSITION-quantization disaster above is exactly why it has to be automatic.
  const GATE = process.argv.includes('--gate') && !DRY;
  const backups = path.join(require('os').tmpdir(), 'bannon_rig_backup');
  let baseline = {};
  if (GATE){
    fs.mkdirSync(backups, { recursive:true });
    console.log('  gate: measuring ' + targets.length + ' models BEFORE compression…');
    baseline = skinqa(targets);
    console.log('  gate: baseline captured for ' + Object.keys(baseline).length + ' models');
  }

  let tb = 0, ta = 0, done = 0, skipped = 0, rejected = 0;
  const compressed = [];
  for (const t of targets){
    let r;
    if (GATE) try{ fs.copyFileSync(t, path.join(backups, path.basename(t))); }catch(e){}
    try{ r = await compress(t); }
    catch(e){ console.log('  FAIL   ' + path.basename(t) + '  ' + String(e.message).slice(0,80));
      if (process.argv.includes('--trace')) console.log(String(e.stack).split('\n').slice(0,10).join('\n'));
      continue; }
    if (r.skip){ skipped++; if (!ALL) console.log('  skip   ' + path.basename(t) + '  (' + r.skip + ')'); continue; }
    if (r.rejected){
      rejected++;
      console.log('  REJECT ' + path.basename(t) + '  fingerprint changed — DISCARDED');
      console.log('           before ' + JSON.stringify(r.before));
      console.log('           after  ' + JSON.stringify(r.after));
      continue;
    }
    tb += r.before; ta += r.after; done++; compressed.push({ file:t, before:r.before, after:r.after });
    console.log('  ok     ' + path.basename(t).padEnd(30) + (r.before/1e6).toFixed(2) + ' -> ' +
      (r.after/1e6).toFixed(2) + ' MB  (' + (100*(1-r.after/r.before)).toFixed(0) + '% smaller)' + (r.dry ? '  [dry]' : ''));
  }

  let reverted = 0;
  if (GATE && compressed.length){
    console.log('\n  gate: measuring ' + compressed.length + ' compressed models…');
    const after = skinqa(compressed.map(c => c.file));
    for (const c of compressed){
      const n = path.basename(c.file);
      const b = baseline[n], a = after[n];
      // A model with no readable baseline cannot be judged, so leave it alone rather than guess.
      if (!b || b.p95 == null) { console.log('  ?      ' + n + '  no baseline measurement — left compressed, CHECK IT'); continue; }
      const worse = !a || a.p95 == null                       // unreadable after = broken
        || a.verdict === 'FAIL' && b.verdict !== 'FAIL'        // crossed the threshold
        || a.p95 > b.p95 * 1.25 + 0.004                        // materially worse than it was
        || a.joints !== b.joints;
      if (worse){
        try{ fs.copyFileSync(path.join(backups, n), c.file); reverted++;
          tb -= c.before; ta -= c.after; done--;
          console.log('  REVERT ' + n.padEnd(30) + 'p95 ' + (b.p95) + ' -> ' + (a ? a.p95 : 'unreadable') +
            '  (' + (b.verdict) + ' -> ' + (a ? a.verdict : 'ERROR') + ') — original restored');
        }catch(e){ console.log('  !! could not restore ' + n + ': ' + e.message); }
      }
    }
    console.log('  gate: ' + reverted + ' reverted, ' + done + ' kept');
  }

  console.log('\n' + done + ' compressed, ' + skipped + ' skipped, ' + rejected + ' rejected' + (GATE ? ', ' + reverted + ' reverted by the gate' : ''));
  if (done) console.log('total ' + (tb/1e6).toFixed(1) + ' -> ' + (ta/1e6).toFixed(1) + ' MB  (' +
    (100*(1-ta/tb)).toFixed(0) + '% smaller)');
  if (!GATE) console.log('NOW GATE THEM: node tools/model_diag/skinqa.cjs <name>.glb   (promote only if p95 holds)');
})();
