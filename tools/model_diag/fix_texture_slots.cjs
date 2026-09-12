#!/usr/bin/env node
/*
 * fix_texture_slots.cjs — find models whose colour texture is plugged into the wrong socket.
 *
 *   node tools/model_diag/fix_texture_slots.cjs            # report only
 *   node tools/model_diag/fix_texture_slots.cjs --fix      # rewire and rewrite
 *
 * THE BUG THIS EXISTS FOR: the owner reported one model rendering untextured and guessed it was
 * Cody. He was right. CODY_gear_skinned.glb has a texture — one WebP image, embedded, intact — but
 * its material reads:
 *
 *     "pbrMetallicRoughness": {},                 <- EMPTY. No baseColorTexture.
 *     "normalTexture": { "index": 0 }             <- the COLOUR bake wired as a NORMAL MAP
 *
 * So the body renders flat and untextured while the colour image is being interpreted as surface
 * bumpiness. Nothing is missing; it is in the wrong socket. This is a known Tripo export quirk and
 * an asset-side fault, which is why no amount of loader or renderer work would ever have fixed it.
 *
 * MY EARLIER PROBE MISSED IT because it asked "does this material reference ANY texture" and
 * counted normalTexture as a yes. The right question is "does it have a BASE COLOUR", and that is
 * what this checks.
 *
 * THE FIX: move the image to pbrMetallicRoughness.baseColorTexture and drop the bogus normalTexture
 * — a colour bake used as a normal map produces garbage lighting, so leaving it attached is worse
 * than having none. The GLB's binary chunk is untouched; only the JSON chunk is rewritten, so the
 * mesh, skin, skeleton and image bytes are bit-identical afterwards.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const DIR = path.join(REPO, 'assets', 'models');
const FIX = process.argv.includes('--fix');

function readGLB(file){
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546C67) return null;          // 'glTF'
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.slice(20, 20 + jsonLen).toString('utf8'));
  return { buf: b, json, jsonLen, jsonStart: 20 };
}

// Rewrite ONLY the JSON chunk, re-padding it to a 4-byte boundary with spaces the way the spec
// requires. Everything after the JSON chunk — the whole binary blob — is copied through untouched.
function writeGLB(file, g, newJson){
  const txt = Buffer.from(JSON.stringify(newJson), 'utf8');
  const pad = (4 - (txt.length % 4)) % 4;
  const chunk = Buffer.concat([txt, Buffer.alloc(pad, 0x20)]);
  const rest = g.buf.slice(g.jsonStart + g.jsonLen);          // BIN chunk header + payload
  const head = Buffer.alloc(20);
  head.writeUInt32LE(0x46546C67, 0);                          // magic
  head.writeUInt32LE(2, 4);                                   // version
  head.writeUInt32LE(20 + chunk.length + rest.length, 8);     // total length
  head.writeUInt32LE(chunk.length, 12);                       // JSON chunk length
  head.writeUInt32LE(0x4E4F534A, 16);                         // 'JSON'
  fs.writeFileSync(file, Buffer.concat([head, chunk, rest]));
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.glb')).sort();
let broken = 0, fixed = 0, ok = 0;
const rows = [];

for (const f of files){
  const p = path.join(DIR, f);
  let g; try{ g = readGLB(p); }catch(e){ continue; }
  if (!g) continue;
  const j = g.json;
  if (!j.materials || !j.materials.length) continue;
  const nImages = (j.images || []).length;
  let changed = false;
  const issues = [];

  j.materials.forEach((m, mi) => {
    const pbr = m.pbrMetallicRoughness || {};
    const hasBase = !!pbr.baseColorTexture;
    if (hasBase) return;
    // no base colour. Is a texture attached to some OTHER socket that is almost certainly the
    // colour bake? With a single-image model there is no ambiguity at all.
    const candidate = (m.normalTexture && m.normalTexture.index) != null ? m.normalTexture.index
                    : (m.emissiveTexture && m.emissiveTexture.index) != null ? m.emissiveTexture.index
                    : (m.occlusionTexture && m.occlusionTexture.index) != null ? m.occlusionTexture.index
                    : null;
    if (candidate == null) return;
    issues.push('mat' + mi + ' colour bake in ' +
      (m.normalTexture ? 'normalTexture' : m.emissiveTexture ? 'emissiveTexture' : 'occlusionTexture'));
    if (FIX){
      m.pbrMetallicRoughness = m.pbrMetallicRoughness || {};
      m.pbrMetallicRoughness.baseColorTexture = { index: candidate };
      // a colour image used as a normal map lights the surface with nonsense — remove it rather
      // than leave it attached
      if (m.normalTexture && m.normalTexture.index === candidate) delete m.normalTexture;
      if (m.occlusionTexture && m.occlusionTexture.index === candidate) delete m.occlusionTexture;
      changed = true;
    }
  });

  if (issues.length){
    broken++;
    rows.push([f, nImages + ' img', issues.join('; ')]);
    if (FIX && changed){ writeGLB(p, g, j); fixed++; }
  } else ok++;
}

console.log('TEXTURE SLOT AUDIT — ' + files.length + ' models');
console.log('='.repeat(88));
if (!rows.length) console.log('  every material with a texture has it in baseColorTexture. Nothing to fix.');
rows.forEach(r => console.log('  ' + (FIX ? 'FIXED ' : 'BROKEN') + '  ' + r[0].padEnd(34) + r[1].padEnd(8) + r[2]));
console.log('');
console.log('  correct : ' + ok);
console.log('  broken  : ' + broken + (FIX ? ('  (' + fixed + ' rewritten)') : '  — run with --fix to rewire'));
if (FIX && fixed) console.log('\n  Only the JSON chunk was rewritten. Mesh, skin, skeleton and image bytes are unchanged.');
