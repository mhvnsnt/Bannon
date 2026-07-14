#!/usr/bin/env node
// BANNON model decimator — the critical path for hosted play + phones. Takes the ~80MB / ~1M-vert
// skinned owner GLBs down to a few MB while PRESERVING skinning (JOINTS/WEIGHTS), UVs, and textures.
// Two levers, both huge: (1) geometry simplify via meshoptimizer to a triangle target; (2) texture
// resize + WebP compression (4K PBR maps are most of the 80MB). Skinning-aware — safe on fight models.
//   node tools/decimate/decimate.mjs <in.glb> <out.glb> [--tris=60000] [--tex=1024]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld, dedup, textureCompress, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [,, inP, outP, ...rest] = process.argv;
if (!inP || !outP) { console.error('usage: decimate.mjs <in.glb> <out.glb> [--tris=60000] [--tex=1024]'); process.exit(1); }
const arg = (k, d) => { const a = rest.find(x => x.startsWith(`--${k}=`)); return a ? +a.split('=')[1] : d; };
const TEX = arg('tex', 1024);

async function main() {
  await MeshoptSimplifier.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(inP);

  // count triangles to derive a ratio for the target
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      tris += idx ? idx.getCount() / 3 : (prim.getAttribute('POSITION')?.getCount() || 0) / 3;
    }
  const targetTris = arg('tris', 60000);
  const ratio = tris > 0 ? Math.min(1, targetTris / tris) : 1;

  await doc.transform(
    weld({ tolerance: 0.0001 }),                     // merge coincident verts (helps the simplifier)
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01, lockBorder: false }),  // skin-aware decimate
    dedup(),
    // textures: 4K PBR maps dominate the file size — resize + WebP (skinning untouched).
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEX, TEX], quality: 85 }),
    prune(),                                          // drop anything now-unused
  );

  await io.write(outP, doc);

  // report
  const fs = await import('fs');
  let outTris = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) { const i = prim.getIndices(); outTris += i ? i.getCount()/3 : 0; }
  const skins = doc.getRoot().listSkins().length;
  console.log(`  ${inP.split('/').pop()}: ${Math.round(tris)} -> ${Math.round(outTris)} tris, ${skins} skin(s) kept, ` +
              `${(fs.statSync(inP).size/1e6).toFixed(1)}MB -> ${(fs.statSync(outP).size/1e6).toFixed(1)}MB`);
}
main().catch(e => { console.error('FAIL', e.message); process.exit(1); });
