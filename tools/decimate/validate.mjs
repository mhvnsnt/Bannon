import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const p of process.argv.slice(2)) {
  try {
    const doc = await io.read(p);
    const root = doc.getRoot();
    const skins = root.listSkins();
    let tris=0, verts=0, hasJW=false, wOK=true, finite=true, min=[1e9,1e9,1e9], max=[-1e9,-1e9,-1e9];
    for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
      const idx=prim.getIndices(); tris += idx?idx.getCount()/3:0;
      const pos=prim.getAttribute('POSITION'); if(pos){ verts+=pos.getCount();
        for(let i=0;i<pos.getCount();i++){ const v=[pos.getElement(i,[])]; const e=v[0];
          for(let k=0;k<3;k++){ if(!Number.isFinite(e[k])) finite=false; if(e[k]<min[k])min[k]=e[k]; if(e[k]>max[k])max[k]=e[k]; } } }
      const J=prim.getAttribute('JOINTS_0'), W=prim.getAttribute('WEIGHTS_0');
      if(J&&W){ hasJW=true; const n=Math.min(W.getCount(),2000);
        for(let i=0;i<n;i++){ const w=W.getElement(i,[]); const s=w[0]+w[1]+w[2]+w[3]; if(Math.abs(s-1)>0.05 && s>0.01) wOK=false; } }
    }
    const dim=[max[0]-min[0],max[1]-min[1],max[2]-min[2]].map(x=>x.toFixed(2));
    const sz=(await import('fs')).statSync(p).size/1e6;
    console.log(`${p.split('/').pop().padEnd(30)} ${sz.toFixed(1).padStart(5)}MB  tris=${Math.round(tris).toString().padStart(7)} verts=${verts.toString().padStart(7)} skins=${skins.length} joints=${skins[0]?skins[0].listJoints().length:0} JW=${hasJW?'Y':'N'} wNorm=${wOK?'ok':'BAD'} finite=${finite?'Y':'NAN!'} dim=[${dim}]`);
  } catch(e){ console.log(`${p.split('/').pop()}  READ FAIL: ${e.message}`); }
}
