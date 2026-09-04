#!/usr/bin/env node
/* quantised_attrs.cjs — FIND EVERY MODEL WHOSE VERTEX ATTRIBUTES ARE QUANTISED WITHOUT `normalized`.
 *
 *   node tools/model_diag/quantised_attrs.cjs [--all] [--gate]
 *
 * WHY THIS EXISTS. render_truth.cjs measured a shipped fighter rendering as a flat dark silhouette
 * while his material was a MeshStandardMaterial with a DECODED 1024x1024 map, a normalMap, and 16
 * lights totalling 15.63 intensity on him. Not a missing texture, not a missing light, not the
 * quality tier. The vertex buffers said why:
 *
 *     BANNON_SEWN        uv u 0.003..0.999   normals 0 of 4684 zero-length
 *     BANNON_XFER_MESH   uv u 80..65487      normals 4013 of 4013 ZERO-LENGTH
 *
 * 65535 is 2^16-1: those are raw UNSIGNED_SHORT values being read as floats. A quantised attribute
 * is only meaningful with `normalized: true` on its accessor, which tells the reader to divide by
 * the type's max. Without it the shader gets texture coordinates in the tens of thousands and
 * normals of length zero — a textured, lit body draws as one flat colour.
 *
 * IT IS READ FROM THE FILE, NOT FROM THE PIPELINE'S CLAIM. This parses the GLB's JSON chunk only —
 * no buffers, no decoding — so it works on EXT_meshopt_compression files, which still declare their
 * accessors in JSON. Metadata is a hint; the accessor is the fact.
 *
 * WIRING IS THE TEST, NOT THE DIRECTORY LISTING. assets/models holds gigabytes of intermediates and
 * re-rig attempts; what matters is the files the shipped HTML actually names. Default scans those.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const MODELS = path.join(ROOT, 'assets', 'models');
const HTML = path.join(ROOT, 'BANNON_v150.html');
const argv = process.argv.slice(2);
const has = f => argv.indexOf('--' + f) >= 0;

// componentType -> [name, maxValue for the normalized mapping]
const CT = { 5120:['BYTE',127], 5121:['UNSIGNED_BYTE',255], 5122:['SHORT',32767],
             5123:['UNSIGNED_SHORT',65535], 5125:['UNSIGNED_INT',null], 5126:['FLOAT',null] };

function readGLBJson(file){
  const fd = fs.openSync(file, 'r');
  try{
    const head = Buffer.alloc(12); fs.readSync(fd, head, 0, 12, 0);
    if (head.toString('utf8', 0, 4) !== 'glTF') return { err:'not a GLB' };
    const chunkHead = Buffer.alloc(8); fs.readSync(fd, chunkHead, 0, 8, 12);
    const len = chunkHead.readUInt32LE(0), type = chunkHead.readUInt32LE(4);
    if (type !== 0x4E4F534A) return { err:'first chunk is not JSON' };
    const body = Buffer.alloc(len); fs.readSync(fd, body, 0, len, 20);
    return JSON.parse(body.toString('utf8'));
  } catch(e){ return { err:String(e.message).slice(0,90) }; }
  finally { fs.closeSync(fd); }
}

function scan(file){
  const j = readGLBJson(file);
  if (j.err) return { err:j.err };
  const acc = j.accessors || [], meshes = j.meshes || [];
  const exts = j.extensionsUsed || [];
  const bad = [], seen = {};
  for (const m of meshes) for (const p of (m.primitives || [])){
    for (const sem of ['POSITION','NORMAL','TEXCOORD_0','TANGENT','JOINTS_0','WEIGHTS_0']){
      const i = p.attributes && p.attributes[sem];
      if (i == null || seen[sem + ':' + i]) continue;
      seen[sem + ':' + i] = 1;
      const a = acc[i]; if (!a) continue;
      const ct = CT[a.componentType] || ['?', null];
      // JOINTS_0 is integer BY SPEC and must NOT be normalized — it is a bone index, not a ratio.
      // Flagging it would be a false positive, and this file's history is full of those.
      if (sem === 'JOINTS_0') continue;
      if (a.componentType === 5126) continue;              // FLOAT needs nothing
      if (a.normalized === true) continue;                 // quantised AND declared: correct
      bad.push({ sem, accessor:i, type:ct[0], count:a.count,
                 min: a.min ? a.min.map(v => +v.toFixed(1)) : null,
                 max: a.max ? a.max.map(v => +v.toFixed(1)) : null });
    }
  }
  return { bad, exts, nMesh:meshes.length, nAcc:acc.length,
           quantExt: exts.indexOf('KHR_mesh_quantization') >= 0,
           meshopt: exts.indexOf('EXT_meshopt_compression') >= 0 };
}

const html = fs.existsSync(HTML) ? fs.readFileSync(HTML, 'utf8') : '';
const all = fs.existsSync(MODELS) ? fs.readdirSync(MODELS).filter(f => f.endsWith('.glb')) : [];
const wired = all.filter(f => html.indexOf(f) >= 0);
const list = has('all') ? all : wired;

console.log('\n===== QUANTISED ATTRIBUTES WITHOUT `normalized` =====');
console.log('  ' + list.length + (has('all') ? ' model(s) in assets/models' : ' WIRED model(s) (named in the shipped HTML)') +
            (has('all') ? '' : '   of ' + all.length + ' present'));

const broken = [], clean = [], errs = [];
for (const f of list.sort()){
  const r = scan(path.join(MODELS, f));
  if (r.err){ errs.push([f, r.err]); continue; }
  (r.bad.length ? broken : clean).push([f, r]);
}
if (broken.length){
  console.log('\n  BROKEN — the reader gets raw integers where it expects a ratio:');
  for (const [f, r] of broken){
    console.log('   ' + f);
    for (const b of r.bad)
      console.log('       ' + b.sem.padEnd(11) + b.type.padEnd(15) + 'normalized MISSING   ' +
                  b.count + ' verts' + (b.max ? '   max ' + JSON.stringify(b.max) : ''));
    console.log('       extensionsUsed: [' + r.exts.join(', ') + ']' +
                (r.quantExt ? '' : '   <- KHR_mesh_quantization NOT declared'));
  }
}
if (errs.length){ console.log('\n  UNREADABLE (not a pass — a file that cannot be checked is UNKNOWN):');
  for (const [f, e] of errs) console.log('   ' + f + '   ' + e); }
console.log('\n  ' + clean.length + ' clean   ' + broken.length + ' BROKEN   ' + errs.length + ' unreadable');
if (broken.length) console.log('  A model here renders as a FLAT SILHOUETTE with a perfectly good texture attached.');
if (has('gate')) process.exitCode = (broken.length || errs.length) ? 1 : 0;
