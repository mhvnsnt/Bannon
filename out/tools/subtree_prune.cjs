#!/usr/bin/env node
/* subtree_prune.cjs — drop skin influences that are incoherent with the skeleton tree.
 *
 * For each vertex, find the dominant joint d. Drop any other influence j when:
 *   treeDistance(j, d) > MAX_EDGES (default 3) AND weight(j) < WMAX (default 0.5)
 * then renormalize. Rationale: legit multi-bone verts (elbow, shoulder, wrist, hip)
 * always involve joints within 2-3 tree edges; a finger bone influencing a buttock
 * vertex (~7 edges away) is never legitimate.
 *
 * Usage: node subtree_prune.cjs <in.glb> <out.glb> [--edges=3] [--wmax=0.5]
 */
'use strict';
const fs = require('fs');
const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const IN = pos[0], OUT = pos[1];
const opt = n => { const a = args.find(x => x.startsWith(n+'=')); return a ? parseFloat(a.split('=')[1]) : null; };
const MAX_EDGES = opt('--edges') ?? 3, WMAX = opt('--wmax') ?? 0.5;
if (!IN || !OUT) { console.error('usage: node subtree_prune.cjs <in.glb> <out.glb> [--edges=3] [--wmax=0.5]'); process.exit(1); }
(async () => {
  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const { MeshoptDecoder } = require('meshoptimizer');
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
  const doc = await io.readBinary(fs.readFileSync(IN));
  const root = doc.getRoot();
  // parent map over ALL nodes for tree distance
  const parent = new Map();
  for (const n of root.listNodes()) for (const c of n.listChildren()) parent.set(c, n);
  const dist = (a, b) => { // BFS
    if (a === b) return 0;
    const seen = new Map([[a,0]]); const q=[a];
    while (q.length) { const n=q.shift(), d=seen.get(n);
      const nb=[...n.listChildren()]; const p=parent.get(n); if(p) nb.push(p);
      for (const m of nb) if(!seen.has(m)){ if(m===b) return d+1; seen.set(m,d+1); q.push(m);} }
    return 99;
  };
  let dropped=0, vertsTouched=0;
  for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
    const sk = prim.getAttribute('JOINTS_0') && mesh.listParents?.()[0];
    const J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0');
    if (!J || !W) continue;
    const skin = root.listSkins().find(s => s.listJoints().length > 0);
    if (!skin) continue;
    const sj = skin.listJoints();
    const ja = J.getArray(), wa = W.getArray(), n = J.getCount();
    for (let v=0; v<n; v++) {
      let dom=-1, dw=-1;
      for(let k=0;k<4;k++){ const wgt=wa[v*4+k]; if(wgt>dw){dw=wgt;dom=ja[v*4+k];} }
      if (dom<0||dom>=sj.length) continue;
      let changed=false;
      for(let k=0;k<4;k++){
        const j=ja[v*4+k], wgt=wa[v*4+k];
        if (j===dom||wgt<=0) continue;
        if (j>=sj.length){ wa[v*4+k]=0; changed=true; dropped++; continue; }
        if (wgt < WMAX && dist(sj[j], sj[dom]) > MAX_EDGES) { wa[v*4+k]=0; changed=true; dropped++; }
      }
      if (changed) {
        vertsTouched++;
        let s=0; for(let k=0;k<4;k++) s+=wa[v*4+k];
        if (s>1e-6) for(let k=0;k<4;k++) wa[v*4+k]/=s;
        else { wa[v*4]=1; for(let k=1;k<4;k++) wa[v*4+k]=0; ja[v*4]=dom; }
      }
    }
    W.setArray(wa); J.setArray(ja);
  }
  const out = await io.writeBinary(doc);
  fs.writeFileSync(OUT, Buffer.from(out));
  console.log(`subtree-prune edges>${MAX_EDGES} w<${WMAX}: dropped ${dropped} influences on ${vertsTouched} verts -> ${OUT}`);
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
