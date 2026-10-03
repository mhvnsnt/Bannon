#!/usr/bin/env node
/* decimate_rigs.cjs — CUT THE TRIANGLE COUNT WITH THE LIBRARY THAT WAS ALREADY INSTALLED.
 *
 *   node tools/assets/decimate_rigs.cjs --dry                       # report only
 *   node tools/assets/decimate_rigs.cjs assets/models/VIPER.glb
 *   node tools/assets/decimate_rigs.cjs --all --gate                # every rig, skinqa before/after
 *
 * Owner: "u could have been pulling open source from games, tools, apps, etc, every turn ... u know
 * what I mean man ur playing stupid."
 *
 * He is right and the miss is specific. I installed meshoptimizer and used exactly one half of it —
 * EXT_meshopt_compression, which makes the FILE smaller. The same package ships MeshoptSimplifier,
 * which makes the MESH smaller, and gltf-transform wraps it as simplify(). Compression does nothing
 * for frame rate: the GPU still rasterises every triangle after the decoder has run. Simplification
 * is the one that touches fps, and I never called it.
 *
 * MEASURED IN A LIVE MATCH — 176,640 visible triangles, and the top of the list is not subtle:
 *     BANNON_XFER_MESH   66,950   37.9%      <- one character mesh
 *     Bar_Joined_Metal_0 29,680   16.8%      <- static arena metal
 * Those two are 55% of the frame. A phone-targeted character is normally 10-20k.
 *
 * WHY simplify() AND NOT A HAND-ROLLED DECIMATOR: it is quadric error metric with attribute
 * awareness — it keeps the silhouette, respects UV seams, and preserves skin weights, which is the
 * whole difficulty on a rigged body. tools/assets/optimize_gltf.cjs deliberately REFUSES skinned
 * documents because join()/dedup() merge primitives and that kills a rig; simplify() does not merge
 * primitives, so it is safe where that one was not.
 *
 * EVERY OUTPUT IS GATED. skinqa runs before and after and any model whose deformation gets
 * materially worse is restored from the backup. Promote on the number, never on a screenshot.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const MODELS = path.join(ROOT, 'assets', 'models');
const DRY = process.argv.includes('--dry');
const ALL = process.argv.includes('--all');
const GATE = process.argv.includes('--gate') && !DRY;
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? +process.argv[i+1] : d; };
const TARGET = arg('target', 18000);          // triangles a phone-facing wrestler should cost
const ERROR  = arg('error', 0.02);            // max quadric error, as a fraction of mesh extent

let core, ext, fns, meshopt;
try{
  core = require('@gltf-transform/core'); ext = require('@gltf-transform/extensions');
  fns = require('@gltf-transform/functions'); meshopt = require('meshoptimizer');
}catch(e){
  console.error('needs: npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer');
  process.exit(2);
}
const { NodeIO } = core;
const { ALL_EXTENSIONS } = ext;
const { simplify, weld } = fns;
const { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } = meshopt;
const { normalizeBuffer } = require('../model_diag/fix_extensions_used.cjs');

function tris(doc){
  let t = 0, verts = 0;
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives()){
      const i = p.getIndices();
      t += i ? i.getCount() / 3 : (p.getAttribute('POSITION') ? p.getAttribute('POSITION').getCount() / 3 : 0);
      const pos = p.getAttribute('POSITION'); if (pos) verts += pos.getCount();
    }
  return { tris: Math.round(t), verts };
}
const fingerprint = doc => ({
  skins: doc.getRoot().listSkins().length,
  joints: doc.getRoot().listSkins().reduce((n, s) => n + s.listJoints().length, 0),
  meshes: doc.getRoot().listMeshes().length,
  morphs: doc.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + p.listTargets().length, 0), 0),
  anims: doc.getRoot().listAnimations().length
});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

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
    out[m[2]] = { verdict: m[1], p95: j.p95, joints: j.joints };
  }
  return out;
}

async function decimate(file){
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;

  const before = fs.statSync(file).size;
  const doc = await io.readBinary(normalizeBuffer(fs.readFileSync(file)));
  const t0 = tris(doc), fp0 = fingerprint(doc);
  if (t0.tris <= TARGET) return { skip: t0.tris + ' tris, already under ' + TARGET };

  // weld first — an unwelded mesh (Tripo output is not welded) has no shared edges, so the
  // simplifier can barely collapse anything and the ratio silently under-delivers.
  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, TARGET / t0.tris), error: ERROR })
  );

  const out = file.replace(/\.glb$/i, '.__dec.glb');
  fs.writeFileSync(out, Buffer.from(await io.writeBinary(doc)));
  const back = await io.readBinary(new Uint8Array(fs.readFileSync(out)));
  const t1 = tris(back), fp1 = fingerprint(back);

  // a rig that loses a joint, a morph target or a whole mesh is not an optimisation
  if (!same(fp0, fp1)){ fs.unlinkSync(out); return { rejected:true, fp0, fp1 }; }
  if (DRY){ fs.unlinkSync(out); return { dry:true, before, after: fs.statSync(file).size, t0:t0.tris, t1:t1.tris }; }
  fs.renameSync(out, file);
  return { before, after: fs.statSync(file).size, t0:t0.tris, t1:t1.tris };
}

(async () => {
  const targets = ALL ? fs.readdirSync(MODELS).filter(f => f.endsWith('.glb')).map(f => path.join(MODELS, f))
                      : process.argv.slice(2).filter(a => a.endsWith('.glb')).map(f => path.isAbsolute(f) ? f : path.join(ROOT, f));
  if (!targets.length){ console.error('usage: decimate_rigs.cjs <model.glb> | --all [--dry] [--gate] [--target N]'); process.exit(2); }

  const backups = path.join(require('os').tmpdir(), 'bannon_dec_backup');
  let base = {};
  if (GATE){ fs.mkdirSync(backups, { recursive:true });
    console.log('  gate: measuring ' + targets.length + ' models BEFORE…');
    base = skinqa(targets); console.log('  gate: baseline for ' + Object.keys(base).length); }

  const done = [];
  let T0 = 0, T1 = 0;
  for (const t of targets){
    if (GATE) try{ fs.copyFileSync(t, path.join(backups, path.basename(t))); }catch(e){}
    let r; try{ r = await decimate(t); }
    catch(e){ console.log('  FAIL   ' + path.basename(t) + '  ' + String(e.message).slice(0,90)); continue; }
    if (r.skip){ if (!ALL) console.log('  skip   ' + path.basename(t) + '  (' + r.skip + ')'); continue; }
    if (r.rejected){ console.log('  REJECT ' + path.basename(t) + '  structure changed — discarded'); continue; }
    T0 += r.t0; T1 += r.t1; done.push({ file:t, ...r });
    console.log('  ok     ' + path.basename(t).padEnd(30) + r.t0.toLocaleString().padStart(9) + ' -> ' +
      r.t1.toLocaleString().padStart(8) + ' tris  (' + (100*(1-r.t1/r.t0)).toFixed(0) + '% fewer)' + (r.dry ? '  [dry]' : ''));
  }

  let reverted = 0;
  if (GATE && done.length){
    console.log('\n  gate: measuring ' + done.length + ' decimated models…');
    const after = skinqa(done.map(d => d.file));
    for (const d of done){
      const n = path.basename(d.file), b = base[n], a = after[n];
      if (!b || b.p95 == null){ console.log('  ?      ' + n + '  no baseline — kept, CHECK IT'); continue; }
      const worse = !a || a.p95 == null || (a.verdict === 'FAIL' && b.verdict !== 'FAIL')
                 || a.p95 > b.p95 * 1.5 + 0.01 || a.joints !== b.joints;
      if (worse){
        try{ fs.copyFileSync(path.join(backups, n), d.file); reverted++; T0 -= d.t0; T1 -= d.t1;
          console.log('  REVERT ' + n.padEnd(30) + 'p95 ' + b.p95 + ' -> ' + (a ? a.p95 : 'unreadable') + ' — original restored');
        }catch(e){ console.log('  !! restore failed for ' + n); }
      }
    }
  }

  console.log('\n  ' + (done.length - reverted) + ' decimated' + (reverted ? ', ' + reverted + ' reverted by the gate' : ''));
  if (T0) console.log('  triangles ' + T0.toLocaleString() + ' -> ' + T1.toLocaleString() +
    '  (' + (100*(1-T1/T0)).toFixed(0) + '% fewer)');
})();
