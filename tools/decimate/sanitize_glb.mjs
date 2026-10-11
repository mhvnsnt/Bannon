// Strip dangling texture references from a GLB's JSON chunk so conformant readers (gltf-transform)
// can load it. Some skinner/exporter output leaves a material textureInfo.index pointing past the
// texture array — a spec violation that crashes the reader. We remove those references (the material
// simply loses that one map slot); geometry, skin, and valid textures are untouched.
import fs from 'fs';
const inP = process.argv[2], outP = process.argv[3] || inP;
const buf = fs.readFileSync(inP);
if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('not a GLB');
const jsonLen = buf.readUInt32LE(12);
const jsonStart = 20;
const json = JSON.parse(buf.slice(jsonStart, jsonStart + jsonLen).toString('utf8'));
const binStart = jsonStart + jsonLen;               // includes 8-byte BIN chunk header
const nTex = (json.textures || []).length;
let fixed = 0;
const TISLOTS = ['baseColorTexture','metallicRoughnessTexture','normalTexture','occlusionTexture','emissiveTexture'];
function scrub(obj){ if(!obj||typeof obj!=='object') return;
  for(const k of Object.keys(obj)){
    const v=obj[k];
    if(v && typeof v==='object' && typeof v.index==='number' && (k.endsWith('Texture')||k==='texture')){
      if(v.index<0 || v.index>=nTex){ delete obj[k]; fixed++; continue; }
    }
    if(v && typeof v==='object') scrub(v);
  }
}
for(const m of (json.materials||[])) scrub(m);
// also guard textures[].source pointing past images
const nImg=(json.images||[]).length;
for(const t of (json.textures||[])){ if(typeof t.source==='number' && t.source>=nImg){ delete t.source; fixed++; } }
console.log(`sanitized ${inP.split('/').pop()}: removed ${fixed} dangling texture ref(s); textures=${nTex}`);
if(fixed===0 && outP===inP){ console.log('  (no change)'); process.exit(0); }
// re-serialize JSON chunk, pad to 4 bytes with spaces
let js = JSON.stringify(json);
while(js.length % 4 !== 0) js += ' ';
const jsBuf = Buffer.from(js, 'utf8');
const binChunk = buf.slice(binStart);               // BIN chunk header + data, unchanged
const total = 12 + 8 + jsBuf.length + binChunk.length;
const out = Buffer.alloc(total);
out.writeUInt32LE(0x46546C67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
out.writeUInt32LE(jsBuf.length, 12); out.writeUInt32LE(0x4E4F534A, 16); // 'JSON'
jsBuf.copy(out, 20);
binChunk.copy(out, 20 + jsBuf.length);
fs.writeFileSync(outP, out);
console.log(`  wrote ${outP} (${(out.length/1e6).toFixed(1)}MB)`);
