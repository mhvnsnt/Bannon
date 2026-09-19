#!/usr/bin/env node
/* fix_extensions_used.cjs — declare the extensions a GLB actually uses.
 *
 *   node tools/model_diag/fix_extensions_used.cjs --check            # report only, exit 1 if any bad
 *   node tools/model_diag/fix_extensions_used.cjs --all              # repair every glb under assets/
 *   node tools/model_diag/fix_extensions_used.cjs assets/models/VIPER.glb
 *
 * WHY. 54 of our 73 shipped character GLBs carry `extensions: { EXT_texture_webp: {...} }` on their
 * texture defs and declare NOTHING in `extensionsUsed`. That is a spec violation, and it is why
 * every gltf-transform run on a rigged model has died for months with
 *
 *     TypeError: Cannot read properties of null (reading 'setMagFilter')
 *
 * which reads like a broken sampler and is not. The reader only runs an extension's preread hook for
 * extensions listed in `extensionsUsed`:
 *
 *     document.getRoot().listExtensionsUsed()
 *       .filter(e => e.prereadTypes.includes('Texture')).forEach(e => e.preread(context, 'Texture'));
 *
 * EXT_texture_webp's preread is the thing that copies `extensions.EXT_texture_webp.source` down to
 * `textureDef.source`. Skip it and the very next line, `context.textures[textureDefs[i].source]`,
 * indexes with `undefined`, hands `undefined` to `material.setBaseColorTexture()`, and the matching
 * `getBaseColorTextureInfo()` then returns null — which is the null that cannot `.setMagFilter`.
 * Registering more extensions never helped because the file never asked for any.
 *
 * three.js survives it (r128 registers GLTFTextureWebPExtension unconditionally as a plugin rather
 * than off extensionsUsed), which is exactly why nobody noticed: the game renders, every other tool
 * refuses the file.
 *
 * EXT_texture_webp goes in extensionsRequired too. These textures have no fallback `source`, so a
 * loader without WebP cannot render them at all and the spec says say so.
 *
 * Container rules that matter here: the JSON chunk pads to 4 bytes with SPACES (0x20) and the BIN
 * chunk with ZEROS (0x00). Padding JSON with zeros produces a file every parser rejects.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const has = n => process.argv.includes('--' + n);
const GLB_MAGIC = 0x46546C67, JSON_CHUNK = 0x4E4F534A, BIN_CHUNK = 0x004E4942;

// EXT_texture_webp has no fallback source in our files, so a loader without it cannot render them.
const REQUIRED = new Set(['EXT_texture_webp', 'EXT_meshopt_compression', 'KHR_draco_mesh_compression']);

function readGLBBuffer(buf){
  if (!buf || buf.length < 12 || buf.readUInt32LE(0) !== GLB_MAGIC) return null;
  const chunks = [];
  let off = 12;
  while (off + 8 <= buf.length){
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    chunks.push({ type, data: buf.slice(off + 8, off + 8 + len) });
    off += 8 + len;
  }
  const j = chunks.find(c => c.type === JSON_CHUNK);
  if (!j) return null;
  let json; try { json = JSON.parse(j.data.toString('utf8')); } catch(e){ return null; }
  return { json, chunks, version: buf.readUInt32LE(4) };
}
const readGLB = file => readGLBBuffer(fs.readFileSync(file));

function packGLB(glb){
  const jsonBuf = Buffer.from(JSON.stringify(glb.json), 'utf8');
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  const parts = [];
  const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);   // SPACES
  const head = Buffer.alloc(8); head.writeUInt32LE(jsonChunk.length, 0); head.writeUInt32LE(JSON_CHUNK, 4);
  parts.push(head, jsonChunk);
  for (const c of glb.chunks){
    if (c.type === JSON_CHUNK) continue;
    const pad = (4 - (c.data.length % 4)) % 4;
    const filler = c.type === BIN_CHUNK ? 0x00 : 0x00;                        // ZEROS
    const body = pad ? Buffer.concat([c.data, Buffer.alloc(pad, filler)]) : c.data;
    const h = Buffer.alloc(8); h.writeUInt32LE(body.length, 0); h.writeUInt32LE(c.type, 4);
    parts.push(h, body);
  }
  const body = Buffer.concat(parts);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0); header.writeUInt32LE(glb.version || 2, 4);
  header.writeUInt32LE(12 + body.length, 8);
  return Buffer.concat([header, body]);
}
const writeGLB = (file, glb) => fs.writeFileSync(file, packGLB(glb));

/** Every extension name that appears anywhere in the document. */
function extensionsInUse(json){
  const found = new Set();
  const visit = o => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)){ o.forEach(visit); return; }
    if (o.extensions && typeof o.extensions === 'object') for (const k of Object.keys(o.extensions)) found.add(k);
    for (const k of Object.keys(o)) if (k !== 'extensions' && o[k] && typeof o[k] === 'object') visit(o[k]);
  };
  visit(json);
  return found;
}

function audit(file){
  const glb = readGLB(file);
  if (!glb) return { file, skip: 'not a readable GLB' };
  const used = new Set(glb.json.extensionsUsed || []);
  const req = new Set(glb.json.extensionsRequired || []);
  const inUse = extensionsInUse(glb.json);
  const missingUsed = [...inUse].filter(e => !used.has(e));
  const missingReq = [...inUse].filter(e => REQUIRED.has(e) && !req.has(e));
  // a declaration with nothing behind it is also wrong, but harmless — report, never strip
  const stale = [...used].filter(e => !inUse.has(e));
  return { file, glb, inUse: [...inUse], missingUsed, missingReq, stale };
}

function repair(file){
  const a = audit(file);
  if (a.skip || (!a.missingUsed.length && !a.missingReq.length)) return a;
  const j = a.glb.json;
  j.extensionsUsed = [...new Set([...(j.extensionsUsed || []), ...a.missingUsed])].sort();
  if (a.missingReq.length) j.extensionsRequired = [...new Set([...(j.extensionsRequired || []), ...a.missingReq])].sort();
  writeGLB(file, a.glb);
  // re-read the bytes we actually wrote — never trust the in-memory object
  const back = audit(file);
  a.verified = !back.skip && !back.missingUsed.length && !back.missingReq.length;
  a.repaired = true;
  return a;
}

/**
 * In-memory repair, for tools that are going to rewrite the file anyway (the compressor) and just
 * need the reader not to choke. Returns the same buffer when nothing is wrong.
 */
function normalizeBuffer(buf){
  const glb = readGLBBuffer(buf);
  if (!glb) return buf;
  const used = new Set(glb.json.extensionsUsed || []);
  const req = new Set(glb.json.extensionsRequired || []);
  const inUse = extensionsInUse(glb.json);
  const addUsed = [...inUse].filter(e => !used.has(e));
  const addReq = [...inUse].filter(e => REQUIRED.has(e) && !req.has(e));
  if (!addUsed.length && !addReq.length) return buf;
  glb.json.extensionsUsed = [...new Set([...(glb.json.extensionsUsed || []), ...addUsed])].sort();
  if (addReq.length) glb.json.extensionsRequired = [...new Set([...(glb.json.extensionsRequired || []), ...addReq])].sort();
  return packGLB(glb);
}

function walk(dir, out){
  for (const e of fs.readdirSync(dir, { withFileTypes:true })){
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.toLowerCase().endsWith('.glb')) out.push(p);
  }
  return out;
}

module.exports = { readGLB, readGLBBuffer, writeGLB, packGLB, extensionsInUse, normalizeBuffer, audit, repair };
if (require.main !== module) return;

const explicit = process.argv.slice(2).filter(a => !a.startsWith('--'));
const files = explicit.length ? explicit.map(f => path.isAbsolute(f) ? f : path.join(ROOT, f))
                              : walk(path.join(ROOT, 'assets'), []);
const check = has('check');
let bad = 0, fixed = 0, failed = 0;
const rows = [];
for (const f of files){
  const r = check ? audit(f) : repair(f);
  if (r.skip) continue;
  if (r.missingUsed.length || r.missingReq.length){
    bad++;
    if (r.repaired){ if (r.verified) fixed++; else { failed++; rows.push('  !! ' + path.relative(ROOT, f) + ' — rewrite did NOT verify'); } }
    rows.push('  ' + (r.repaired ? (r.verified ? 'fixed ' : 'FAILED') : 'BAD   ') + ' ' +
      path.relative(ROOT, f) + '  +used[' + r.missingUsed.join(',') + ']' +
      (r.missingReq.length ? ' +required[' + r.missingReq.join(',') + ']' : ''));
  }
}
console.log('\n===== glTF extensionsUsed =====');
console.log('  scanned ' + files.length + ' GLB' + (check ? ' (check only)' : '') +
  '   undeclared: ' + bad + (check ? '' : '   repaired+verified: ' + fixed + (failed ? '   FAILED: ' + failed : '')));
rows.forEach(r => console.log(r));
if (!bad) console.log('  every GLB declares what it uses.');
process.exit((check && bad) || failed ? 1 : 0);
