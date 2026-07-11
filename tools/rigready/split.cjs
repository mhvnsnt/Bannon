#!/usr/bin/env node
/* BANNON rigready splitter — makes ANY single-mesh humanoid GLB (Tripo "clean" export) engine-riggable.
 * Splits the mesh into the 15 named parts (pelvis/chest/head/shL/…) the auto-rig binds by name, so the
 * output loads in-game fully articulated — the same thing Tripo's own "rigready" export does, but OURS,
 * so we never wait on Tripo again. Usage: node split.cjs <in.glb> <out.glb>
 *
 * Method: every triangle is classified by its centroid against the 15 part boxes of the known-good
 * BANNON_v1_rigready template (all Tripo humanoids ship in the same canonical A-pose), in normalized
 * body space (x/|x|max, y/|y|max, z/|z|max). Inside multiple boxes -> smallest box wins (hands/feet/head
 * are specific); inside none -> nearest box. Geometry is rebuilt per part; material + baked texture copied. */
'use strict';
const fs = require('fs');

// template part boxes from BANNON_v1_rigready (model space: x±0.21, y±0.94, z±0.44), normalized below
const RAW = {
  pelvis:[[-0.16,-0.24,-0.13],[0.20,0.30,0.13]], chest:[[-0.21,0.27,-0.22],[0.20,0.75,0.21]],
  head:[[-0.13,0.72,-0.13],[0.19,0.94,0.13]],
  shL:[[-0.17,0.32,0.05],[0.16,0.77,0.37]],  shR:[[-0.17,0.29,-0.40],[0.17,0.78,-0.06]],
  elL:[[-0.11,0.03,-0.00],[0.20,0.40,0.44]], elR:[[-0.04,-0.09,-0.44],[0.20,0.35,-0.03]],
  haL:[[0.09,-0.29,0.08],[0.16,-0.10,0.26]], haR:[[0.09,-0.28,-0.26],[0.16,-0.09,-0.09]],
  hipL:[[-0.16,-0.24,0.08],[0.16,0.32,0.44]],hipR:[[-0.16,-0.24,-0.44],[0.16,0.33,-0.08]],
  knL:[[-0.10,-0.73,0.06],[0.17,-0.20,0.34]],knR:[[-0.10,-0.73,-0.34],[0.17,-0.21,-0.06]],
  ftL:[[-0.12,-0.94,0.22],[0.21,-0.69,0.43]],ftR:[[-0.12,-0.94,-0.43],[0.21,-0.69,-0.22]]
};
const TPL = {}; // normalized boxes + volume
for (const k in RAW) {
  const [mn,mx]=RAW[k];
  const nmn=[mn[0]/0.21, mn[1]/0.94, mn[2]/0.44], nmx=[mx[0]/0.21, mx[1]/0.94, mx[2]/0.44];
  TPL[k]={ mn:nmn, mx:nmx, vol:(nmx[0]-nmn[0])*(nmx[1]-nmn[1])*(nmx[2]-nmn[2]) };
}
const PARTS = Object.keys(TPL);

function readGlb(p){
  const b=fs.readFileSync(p); let off=12, json=null, bin=null;
  while(off<b.length){ const len=b.readUInt32LE(off), t=b.readUInt32LE(off+4);
    if(t===0x4E4F534A) json=JSON.parse(b.slice(off+8,off+8+len).toString('utf8'));
    else if(t===0x004E4942) bin=b.slice(off+8,off+8+len);
    off+=8+len; }
  return {json,bin};
}
function acc(json,bin,i){
  const a=json.accessors[i], bv=json.bufferViews[a.bufferView];
  const start=(bv.byteOffset||0)+(a.byteOffset||0);
  const nComp={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
  const CT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];
  return new CT(bin.buffer, bin.byteOffset+start, a.count*nComp);
}

function classify(cx,cy,cz){
  let best=null, bestD=Infinity, bestVol=Infinity;
  for(const k of PARTS){
    const t=TPL[k];
    const dx=Math.max(t.mn[0]-cx,0,cx-t.mx[0]), dy=Math.max(t.mn[1]-cy,0,cy-t.mx[1]), dz=Math.max(t.mn[2]-cz,0,cz-t.mx[2]);
    const d=dx*dx+dy*dy+dz*dz;
    if(d<bestD-1e-12 || (Math.abs(d-bestD)<1e-12 && t.vol<bestVol)){ bestD=d; best=k; bestVol=t.vol; }
  }
  return best;
}

function main(){
  const [,,inP,outP]=process.argv;
  if(!inP||!outP){ console.error('usage: node split.cjs <in.glb> <out.glb>'); process.exit(1); }
  const {json,bin}=readGlb(inP);
  // find the primary mesh primitive
  const mi=json.meshes.findIndex(m=>m.primitives&&m.primitives.length);
  const prim=json.meshes[mi].primitives[0];
  const pos=acc(json,bin,prim.attributes.POSITION);
  const nrm=prim.attributes.NORMAL!=null?acc(json,bin,prim.attributes.NORMAL):null;
  const uv =prim.attributes.TEXCOORD_0!=null?acc(json,bin,prim.attributes.TEXCOORD_0):null;
  const idx=acc(json,bin,prim.indices);
  // model bbox -> normalization
  let mxX=0,mxY=0,mxZ=0,mnY=Infinity,mxYr=-Infinity;
  for(let i=0;i<pos.length;i+=3){ mxX=Math.max(mxX,Math.abs(pos[i])); mnY=Math.min(mnY,pos[i+1]); mxYr=Math.max(mxYr,pos[i+1]); mxZ=Math.max(mxZ,Math.abs(pos[i+2])); }
  const cy0=(mnY+mxYr)/2, hy=(mxYr-mnY)/2;
  mxY=hy;
  console.log(`in: ${pos.length/3} verts, ${idx.length/3} tris  half-extents x ${mxX.toFixed(2)} y ${hy.toFixed(2)} z ${mxZ.toFixed(2)}`);

  // per-part triangle buckets
  const buckets={}; PARTS.forEach(k=>buckets[k]=[]);
  for(let t=0;t<idx.length;t+=3){
    const a=idx[t]*3,b=idx[t+1]*3,c=idx[t+2]*3;
    const cx=((pos[a]+pos[b]+pos[c])/3)/mxX;
    const cyv=(((pos[a+1]+pos[b+1]+pos[c+1])/3)-cy0)/mxY;
    const cz=((pos[a+2]+pos[b+2]+pos[c+2])/3)/mxZ;
    buckets[classify(cx,cyv,cz)].push(t);
  }

  // rebuild per-part geometry (remap verts)
  const outMeshes=[], outAccessors=[], outViews=[], bufParts=[];
  let bufOff=0;
  function pushBuf(f){ const buf=Buffer.from(f.buffer,f.byteOffset,f.byteLength); const pad=(4-(buf.length%4))%4;
    outViews.push({buffer:0,byteOffset:bufOff,byteLength:buf.length}); bufParts.push(buf); if(pad){bufParts.push(Buffer.alloc(pad));} bufOff+=buf.length+pad; return outViews.length-1; }
  const partNames=[];
  for(const k of PARTS){
    const tris=buckets[k]; if(!tris.length){ console.log(`  ${k}: EMPTY (skipped)`); continue; }
    const map=new Map(); const P=[],N=[],U=[],I=[];
    for(const t of tris){ for(let j=0;j<3;j++){ const v=idx[t+j];
      let nv=map.get(v);
      if(nv===undefined){ nv=map.size; map.set(v,nv);
        P.push(pos[v*3],pos[v*3+1],pos[v*3+2]);
        if(nrm)N.push(nrm[v*3],nrm[v*3+1],nrm[v*3+2]);
        if(uv)U.push(uv[v*2],uv[v*2+1]); }
      I.push(nv); } }
    const pf=new Float32Array(P);
    let pmn=[Infinity,Infinity,Infinity], pmx=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<pf.length;i+=3){ for(let j=0;j<3;j++){ pmn[j]=Math.min(pmn[j],pf[i+j]); pmx[j]=Math.max(pmx[j],pf[i+j]); } }
    const attrs={};
    outAccessors.push({bufferView:pushBuf(pf),componentType:5126,count:pf.length/3,type:'VEC3',min:pmn,max:pmx}); attrs.POSITION=outAccessors.length-1;
    if(nrm){ outAccessors.push({bufferView:pushBuf(new Float32Array(N)),componentType:5126,count:N.length/3,type:'VEC3'}); attrs.NORMAL=outAccessors.length-1; }
    if(uv){ outAccessors.push({bufferView:pushBuf(new Float32Array(U)),componentType:5126,count:U.length/2,type:'VEC2'}); attrs.TEXCOORD_0=outAccessors.length-1; }
    const If=(map.size<65536)?new Uint16Array(I):new Uint32Array(I);
    outAccessors.push({bufferView:pushBuf(If),componentType:(map.size<65536)?5123:5125,count:If.length,type:'SCALAR'}); const iAcc=outAccessors.length-1;
    outMeshes.push({name:k,primitives:[{attributes:attrs,indices:iAcc,material:0}]});
    partNames.push(k);
    console.log(`  ${k}: ${tris.length} tris, ${map.size} verts`);
  }

  // copy material + texture chain (single material assumed, as Tripo ships)
  const srcMat=json.materials[0], outImages=[], outTextures=[], outSamplers=json.samplers?json.samplers.slice(0,1):[];
  if(json.images&&json.images.length){
    const img=json.images[0], bv=json.bufferViews[img.bufferView];
    const data=bin.slice(bv.byteOffset||0,(bv.byteOffset||0)+bv.byteLength);
    outViews.push({buffer:0,byteOffset:bufOff,byteLength:data.length}); bufParts.push(data); const pad=(4-(data.length%4))%4; if(pad)bufParts.push(Buffer.alloc(pad)); bufOff+=data.length+pad;
    outImages.push({mimeType:img.mimeType,bufferView:outViews.length-1});
    outTextures.push({source:0,sampler:outSamplers.length?0:undefined});
  }
  const outJson={
    asset:{version:'2.0',generator:'BANNON rigready splitter'},
    scene:0, scenes:[{nodes:[0]}],
    nodes:[{name:'world',children:partNames.map((_,i)=>i+1)}].concat(partNames.map((n,i)=>({name:n,mesh:i}))),
    meshes:outMeshes, accessors:outAccessors, bufferViews:outViews,
    buffers:[{byteLength:bufOff}],
    materials:[srcMat], images:outImages, textures:outTextures
  };
  if(outSamplers.length) outJson.samplers=outSamplers;

  let js=JSON.stringify(outJson); while(js.length%4)js+=' ';
  const jsonBuf=Buffer.from(js,'utf8'), binBuf=Buffer.concat(bufParts);
  const total=12+8+jsonBuf.length+8+binBuf.length;
  const out=Buffer.alloc(total);
  out.writeUInt32LE(0x46546C67,0); out.writeUInt32LE(2,4); out.writeUInt32LE(total,8);
  let o=12;
  out.writeUInt32LE(jsonBuf.length,o); out.writeUInt32LE(0x4E4F534A,o+4); jsonBuf.copy(out,o+8); o+=8+jsonBuf.length;
  out.writeUInt32LE(binBuf.length,o); out.writeUInt32LE(0x004E4942,o+4); binBuf.copy(out,o+8);
  fs.writeFileSync(outP,out);
  console.log(`out: ${outP} (${out.length} bytes, ${partNames.length} parts)`);
}
main();
