#!/usr/bin/env node
/* decimate_mesh.cjs — REAL binary-GLB poly-count QA readout (was a lying stub that read a nonexistent
 * .vertices JSON field and printed a fake "65% reduction in 0.35ms" every time).
 *
 * This actually parses the GLB JSON chunk, sums real POSITION vertex counts + real triangle counts
 * from the accessors, flags models over a phone budget, and reports which banked GLBs need the real
 * decimation pass (gltf-transform `weld`+`simplify` / meshoptimizer, run outside Node when available).
 * No fake numbers — every count comes from the actual file.
 *
 *   node tools/unirig/decimate_mesh.cjs <file.glb> [file2.glb ...]
 *   node tools/unirig/decimate_mesh.cjs assets/models         (scans a dir for .glb)
 */
const fs = require('fs');
const path = require('path');
const BUDGET = +(process.env.DECIMATE_BUDGET || 40000);   // per-model triangle budget for phones

function glbStats(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546C67) return { err: 'not a GLB' };
  let off = 12, json = null;
  while (off < b.length) {
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    if (type === 0x4E4F534A) { json = JSON.parse(b.slice(off + 8, off + 8 + len).toString('utf8')); break; }
    off += 8 + len;
  }
  if (!json) return { err: 'no JSON chunk' };
  const acc = json.accessors || [];
  let verts = 0, tris = 0, skinned = false;
  for (const m of (json.meshes || [])) for (const p of (m.primitives || [])) {
    const pa = acc[p.attributes && p.attributes.POSITION]; if (pa) verts += pa.count || 0;
    if (p.attributes && (p.attributes.JOINTS_0 != null)) skinned = true;
    if (p.indices != null && acc[p.indices]) tris += (acc[p.indices].count || 0) / 3;
    else if (pa) tris += (pa.count || 0) / 3;
  }
  return { verts, tris: Math.round(tris), skinned, sizeKB: Math.round(b.length / 1024),
           skins: (json.skins || []).length };
}

function walk(p, out) {
  const st = fs.statSync(p);
  if (st.isDirectory()) { for (const e of fs.readdirSync(p)) walk(path.join(p, e), out); }
  else if (/\.glb$/i.test(p)) out.push(p);
}

const args = process.argv.slice(2);
if (!args.length) { console.log('usage: node decimate_mesh.cjs <file.glb|dir> ...'); process.exit(2); }
const files = []; for (const a of args) { try { walk(a, files); } catch (e) { console.error('skip', a, e.message); } }
let over = 0, total = 0;
console.log(`\nGLB poly-count QA (phone budget ${BUDGET} tris):\n`);
for (const f of files.sort()) {
  const s = glbStats(f);
  if (s.err) { console.log(`  ?  ${f}  (${s.err})`); continue; }
  total++;
  const flag = s.tris > BUDGET ? '⚠ OVER' : '  ok  ';
  if (s.tris > BUDGET) over++;
  console.log(`  ${flag} ${String(s.tris).padStart(7)} tris  ${String(s.sizeKB).padStart(6)}KB  ${s.skinned ? 'skinned' : 'static '}  ${path.relative('.', f)}`);
}
console.log(`\n${total} GLBs, ${over} over the ${BUDGET}-tri budget${over ? ' — run gltf-transform weld+simplify on those (real decimation needs the lib/GPU pass, not Node).' : '.'}\n`);
process.exit(0);
