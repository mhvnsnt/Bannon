#!/usr/bin/env node
/* BANNON skinned auto-rigger v4 — GEODESIC (surface-aware) weights, Pinocchio/bone-heat lineage.
 * Instead of splitting into rigid chunks (visible seams at every bend), this outputs a proper
 * SKINNED GLB: the original mesh stays ONE continuous surface, a 16-bone Mixamo-named skeleton is
 * built inside it, and every vertex gets smooth blended weights (top-4 bones, inverse-distance^4 to
 * bone capsules) — elbows/knees/waist DEFORM smoothly like Mixamo/UniRig output, gaps are impossible.
 * Joint positions are estimated PER-MODEL: each joint = centroid of the mesh band where two adjacent
 * body-part boxes meet (auto-sensed), falling back to template anchors. The engine's existing skinned
 * path binds Mixamo names (BONE_MAP: leftarm/leftforearm/leftupleg/spine/neck...) — zero engine edits.
 * Usage: node skin.cjs <in.glb> <out.glb>                                                            */
'use strict';
const fs = require('fs');

// template part boxes (BANNON_v1_rigready, normalized x/±0.21 y/±0.94 z/±0.44) — for banding + fallbacks
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
const TPL={}; for(const k in RAW){const [mn,mx]=RAW[k];TPL[k]={mn:[mn[0]/0.21,mn[1]/0.94,mn[2]/0.44],mx:[mx[0]/0.21,mx[1]/0.94,mx[2]/0.44]};}
function boxDist(t,x,y,z){const dx=Math.max(t.mn[0]-x,0,x-t.mx[0]),dy=Math.max(t.mn[1]-y,0,y-t.mx[1]),dz=Math.max(t.mn[2]-z,0,z-t.mx[2]);return Math.sqrt(dx*dx+dy*dy+dz*dz);}

// joints auto-sensed from part-boundary bands: joint key -> [partA, partB, templateFallback(normalized)]
const JOINT_DEF = {
  hips:   ['pelvis','pelvis', [0,0.03,0]],       // pelvis centroid (special-cased below)
  spine:  ['pelvis','chest',  [0,0.31,0]],
  neck:   ['chest','head',    [0,0.79,0]],
  headTop:[null,null,         [0,1.0,0]],
  shJtL:  ['chest','shL',     [0,0.62,0.28]],  shJtR:['chest','shR',[0,0.62,-0.28]],
  elJtL:  ['shL','elL',       [0,0.38,0.75]],  elJtR:['shR','elR',[0,0.35,-0.75]],
  wrJtL:  ['elL','haL',       [0.5,-0.08,0.42]], wrJtR:['elR','haR',[0.5,-0.08,-0.42]],
  haEndL: [null,null,         [0.6,-0.31,0.39]], haEndR:[null,null,[0.6,-0.31,-0.39]],
  hipJtL: ['pelvis','hipL',   [0,-0.03,0.30]], hipJtR:['pelvis','hipR',[0,-0.03,-0.30]],
  knJtL:  ['hipL','knL',      [0.1,-0.47,0.45]], knJtR:['hipR','knR',[0.1,-0.47,-0.45]],
  ankJtL: ['knL','ftL',       [0.1,-0.83,0.60]], ankJtR:['knR','ftR',[0.1,-0.83,-0.60]],
  toeL:   [null,null,         [0.7,-0.97,0.72]], toeR:[null,null,[0.7,-0.97,-0.72]]
};
const BAND = 0.06;   // boundary band half-width (normalized) for joint auto-sensing

// bones: name (engine BONE_MAP-matchable) -> [jointFrom, jointTo, parentBoneIndexName]
const BONES = [
  ['Hips',        'hips',  'spine',  null],
  ['Spine',       'spine', 'neck',   'Hips'],
  ['Neck',        'neck',  'headTop','Spine'],
  ['Head',        'headTop','headTop','Neck'],
  ['LeftArm',     'shJtL', 'elJtL',  'Spine'],
  ['LeftForeArm', 'elJtL', 'wrJtL',  'LeftArm'],
  ['LeftHand',    'wrJtL', 'haEndL', 'LeftForeArm'],
  ['RightArm',    'shJtR', 'elJtR',  'Spine'],
  ['RightForeArm','elJtR', 'wrJtR',  'RightArm'],
  ['RightHand',   'wrJtR', 'haEndR', 'RightForeArm'],
  ['LeftUpLeg',   'hipJtL','knJtL',  'Hips'],
  ['LeftLeg',     'knJtL', 'ankJtL', 'LeftUpLeg'],
  ['LeftFoot',    'ankJtL','toeL',   'LeftLeg'],
  ['RightUpLeg',  'hipJtR','knJtR',  'Hips'],
  ['RightLeg',    'knJtR', 'ankJtR', 'RightUpLeg'],
  ['RightFoot',   'ankJtR','toeR',   'RightLeg']
];
const K = 4;         // bone influences per vertex
const POW = 4;       // inverse-distance falloff exponent (higher = crisper, lower = mushier)

function readGlb(p){ const b=fs.readFileSync(p); let off=12,json=null,bin=null;
  while(off<b.length){const len=b.readUInt32LE(off),t=b.readUInt32LE(off+4);
    if(t===0x4E4F534A)json=JSON.parse(b.slice(off+8,off+8+len).toString('utf8'));
    else if(t===0x004E4942)bin=b.slice(off+8,off+8+len); off+=8+len;} return {json,bin}; }
function acc(json,bin,i){ const a=json.accessors[i],bv=json.bufferViews[a.bufferView];
  const start=(bv.byteOffset||0)+(a.byteOffset||0);
  const n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
  const CT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];
  return new CT(bin.buffer,bin.byteOffset+start,a.count*n); }
function segDist(px,py,pz, ax,ay,az, bx,by,bz){
  const abx=bx-ax,aby=by-ay,abz=bz-az, apx=px-ax,apy=py-ay,apz=pz-az;
  const len2=abx*abx+aby*aby+abz*abz;
  let t=len2>1e-12?(apx*abx+apy*aby+apz*abz)/len2:0; t=Math.max(0,Math.min(1,t));
  const dx=px-(ax+abx*t),dy=py-(ay+aby*t),dz=pz-(az+abz*t);
  return Math.sqrt(dx*dx+dy*dy+dz*dz);
}

function main(){
  const [,,inP,outP]=process.argv;
  if(!inP||!outP){ console.error('usage: node skin.cjs <in.glb> <out.glb>'); process.exit(1); }
  const {json,bin}=readGlb(inP);
  const prim=json.meshes[json.meshes.findIndex(m=>m.primitives&&m.primitives.length)].primitives[0];
  const pos=acc(json,bin,prim.attributes.POSITION);
  const nrm=prim.attributes.NORMAL!=null?acc(json,bin,prim.attributes.NORMAL):null;
  const uv =prim.attributes.TEXCOORD_0!=null?acc(json,bin,prim.attributes.TEXCOORD_0):null;
  const idx=acc(json,bin,prim.indices);
  const nV=pos.length/3;

  // normalize space
  let mxX=0,mxZ=0,mnY=Infinity,mxY=-Infinity;
  for(let i=0;i<pos.length;i+=3){ mxX=Math.max(mxX,Math.abs(pos[i])); mnY=Math.min(mnY,pos[i+1]); mxY=Math.max(mxY,pos[i+1]); mxZ=Math.max(mxZ,Math.abs(pos[i+2])); }
  let cy0=(mnY+mxY)/2, hy=(mxY-mnY)/2;
  const NX=(x)=>x/mxX, NY=(y)=>(y-cy0)/hy, NZ=(z)=>z/mxZ;
  const DX=(nx)=>nx*mxX, DY=(ny)=>ny*hy+cy0, DZ=(nz)=>nz*mxZ;
  console.log(`in: ${nV} verts  half-extents x ${mxX.toFixed(2)} y ${hy.toFixed(2)} z ${mxZ.toFixed(2)}`);
  // AUTO GAME-SCALE: Tripo ships ~1-unit bodies; bake to the standard 1.85m fight height so models
  // drop into the engine at real scale with no manual resizing (per-character height/proportions
  // still refine via CAW/DNA heightScale + bone scale). Override: --height=1.7
  { const hArg=process.argv.find(a=>a.startsWith('--height=')); const target=hArg?parseFloat(hArg.split('=')[1]):1.85;
    const cur=(mxY-mnY)||1; const k=target/cur;
    if(Math.abs(k-1)>0.01){ for(let i=0;i<pos.length;i++) pos[i]*=k;
      mxX*=k; mxZ*=k; mnY*=k; mxY*=k;
      console.log(`  auto-scale: ${cur.toFixed(2)} -> ${target}m (×${k.toFixed(2)})`); } }
  cy0=(mnY+mxY)/2; hy=(mxY-mnY)/2;

  // ---- AUTO-SENSE joints: centroid of verts in the band where the two parts meet ----
  const joints={};
  const sums={}; for(const j in JOINT_DEF) sums[j]=[0,0,0,0];
  for(let v=0;v<nV;v++){
    const x=NX(pos[v*3]), y=NY(pos[v*3+1]), z=NZ(pos[v*3+2]);
    for(const j in JOINT_DEF){
      const [pa,pb]=JOINT_DEF[j]; if(!pa||!pb||pa===pb) continue;
      if(boxDist(TPL[pa],x,y,z)<BAND && boxDist(TPL[pb],x,y,z)<BAND){
        const s=sums[j]; s[0]+=x; s[1]+=y; s[2]+=z; s[3]++;
      }
    }
  }
  for(const j in JOINT_DEF){
    const [pa,pb,fb]=JOINT_DEF[j], s=sums[j];
    if(s[3]>25){ joints[j]=[s[0]/s[3], s[1]/s[3], s[2]/s[3]]; }
    else joints[j]=fb.slice();
  }
  // hips: pelvis-region centroid
  {
    const s=[0,0,0,0];
    for(let v=0;v<nV;v++){ const x=NX(pos[v*3]),y=NY(pos[v*3+1]),z=NZ(pos[v*3+2]);
      if(boxDist(TPL.pelvis,x,y,z)===0){ s[0]+=x;s[1]+=y;s[2]+=z;s[3]++; } }
    if(s[3]>25) joints.hips=[s[0]/s[3],s[1]/s[3],s[2]/s[3]];
  }
  for(const j in joints) console.log(`  joint ${j}: [${joints[j].map(v=>v.toFixed(2)).join(', ')}]${sums[j]&&sums[j][3]>25?'':' (template)'}`);

  // world-space joint positions
  const JW={}; for(const j in joints) JW[j]=[DX(joints[j][0]), DY(joints[j][1]), DZ(joints[j][2])];

  // ---- GEODESIC skin weights (v4) — influence travels along the SURFACE, never through the body
  // interior, so the inner thigh can NEVER grab the other leg (the euclidean "twisted legs /
  // ballooned thighs" bug). Method = the practical bone-heat recipe: weld verts by position (UV
  // seams split Tripo meshes), build the surface graph, seed each bone where the mesh hugs its
  // capsule, multi-source K-label Dijkstra for per-vertex geodesic bone distances, weights from
  // those distances, then Laplacian smoothing for soft creases. Disconnected shells (hair cards
  // etc.) fall back to euclidean capsule weights.
  const boneIdx={}; BONES.forEach((b,i)=>boneIdx[b[0]]=i);
  const segs=BONES.map(b=>{ const A=JW[b[1]], B=JW[b[2]];
    if(b[1]===b[2]) return [A[0],A[1],A[2], A[0],A[1]+hy*0.2,A[2]];
    return [A[0],A[1],A[2], B[0],B[1],B[2]]; });
  const capDist=(v,i)=>{ const s=segs[i]; return segDist(pos[v*3],pos[v*3+1],pos[v*3+2], s[0],s[1],s[2], s[3],s[4],s[5]); };

  // 1. weld by quantized position -> canonical vertex ids
  const weld=new Int32Array(nV); { const seen=new Map();
    for(let v=0;v<nV;v++){ const kx=Math.round(pos[v*3]*1e4),ky=Math.round(pos[v*3+1]*1e4),kz=Math.round(pos[v*3+2]*1e4);
      const key=kx+':'+ky+':'+kz; const got=seen.get(key);
      if(got===undefined){ seen.set(key,v); weld[v]=v; } else weld[v]=got; } }
  // 2. adjacency over welded ids
  const adj=new Map(); const link=(a,b)=>{ if(a===b)return; let l=adj.get(a); if(!l){l=[];adj.set(a,l);} if(l.indexOf(b)<0)l.push(b); };
  for(let t=0;t<idx.length;t+=3){ const a=weld[idx[t]],b=weld[idx[t+1]],c=weld[idx[t+2]];
    link(a,b);link(b,a);link(b,c);link(c,b);link(a,c);link(c,a); }
  // 3. seeds: adaptive radius per bone until enough seeds
  const SRC=new Map();   // welded vid -> [{bone,d0}]
  BONES.forEach((b,i)=>{ let r=hy*0.03, seeds=[], tries=0;
    while(seeds.length<30 && tries<6){ seeds=[];
      for(const v of adj.keys()){ const d=capDist(v,i); if(d<r) seeds.push([v,d]); }
      r*=1.7; tries++; }
    for(const [v,d] of seeds){ let l=SRC.get(v); if(!l){l=[];SRC.set(v,l);} l.push({bone:i,d0:d}); }
  });
  // 4. K-label multi-source Dijkstra (binary heap on [dist, vid, bone])
  const labels=new Map();   // vid -> Map(bone -> dist)
  const heap=[]; const hpush=(d,v,b)=>{ heap.push([d,v,b]); let i=heap.length-1;
    while(i>0){ const p=(i-1)>>1; if(heap[p][0]<=heap[i][0])break; [heap[p],heap[i]]=[heap[i],heap[p]]; i=p; } };
  const hpop=()=>{ const top=heap[0], last=heap.pop(); if(heap.length){ heap[0]=last; let i=0;
      for(;;){ const l=2*i+1,r=l+1; let m=i; if(l<heap.length&&heap[l][0]<heap[m][0])m=l; if(r<heap.length&&heap[r][0]<heap[m][0])m=r; if(m===i)break; [heap[m],heap[i]]=[heap[i],heap[m]]; i=m; } }
    return top; };
  for(const [v,list] of SRC){ for(const {bone,d0} of list) hpush(d0,v,bone); }
  const KL=K;
  while(heap.length){
    const [d,v,b]=hpop();
    let lm=labels.get(v); if(!lm){ lm=new Map(); labels.set(v,lm); }
    const cur=lm.get(b);
    if(cur!==undefined && cur<=d) continue;
    if(cur===undefined && lm.size>=KL){ let worstB=null,worstD=-1; for(const [bb,dd] of lm){ if(dd>worstD){worstD=dd;worstB=bb;} }
      if(d>=worstD) continue; lm.delete(worstB); }
    lm.set(b,d);
    const nbrs=adj.get(v); if(!nbrs) continue;
    for(const n of nbrs){ const ex=pos[n*3]-pos[v*3],ey=pos[n*3+1]-pos[v*3+1],ez=pos[n*3+2]-pos[v*3+2];
      hpush(d+Math.sqrt(ex*ex+ey*ey+ez*ez), n, b); }
  }
  // 5. weights from geodesic distances (fallback: euclidean for unreached shells)
  let wl=new Array(nV);   // per ORIGINAL vertex: [{bone,w}]
  let fallbackN=0;
  for(let v=0;v<nV;v++){
    const lm=labels.get(weld[v]);
    let entries;
    if(lm && lm.size){ entries=[...lm.entries()].map(([b,d])=>({b, w:1/Math.pow(d+hy*0.01,3)})); }
    else { fallbackN++;
      const ds=segs.map((s,i)=>({b:i, d:capDist(v,i)})).sort((a,c)=>a.d-c.d).slice(0,KL);
      entries=ds.map(e=>({b:e.b, w:1/Math.pow(e.d+hy*0.01,2)})); }
    let tot=0; for(const e of entries) tot+=e.w; for(const e of entries) e.w/=tot;
    wl[v]=entries;
  }
  console.log(`  geodesic labels: ${labels.size} welded verts, ${fallbackN} fallback (disconnected shells)`);
  // 6. Laplacian smoothing over the surface graph (3 passes — enough to soften joint creases;
  // more passes over-blur and let influence creep far from joints = the "mushy hips" look)
  for(let pass=0;pass<3;pass++){
    const nw=new Array(nV);
    for(let v=0;v<nV;v++){
      const wv=weld[v]; const nbrs=adj.get(wv);
      if(!nbrs||!nbrs.length){ nw[v]=wl[v]; continue; }
      const accum=new Map();
      for(const e of wl[v]) accum.set(e.b,(accum.get(e.b)||0)+e.w*0.5);
      const share=0.5/nbrs.length;
      for(const n of nbrs){ for(const e of wl[n]) accum.set(e.b,(accum.get(e.b)||0)+e.w*share); }
      const top=[...accum.entries()].sort((a,c)=>c[1]-a[1]).slice(0,KL);
      let tot=0; for(const [,w] of top) tot+=w;
      nw[v]=top.map(([b,w])=>({b, w:w/tot}));
    }
    wl=nw;
  }
  // 7. prune weak influences (<0.06) + renormalize — inside a limb the dominant bone should own the
  // vert almost fully; blends belong ONLY in the narrow joint bands (production-rigger behavior)
  for(let v=0;v<nV;v++){ let es=wl[v].filter(e=>e.w>=0.06);
    if(!es.length) es=[wl[v].reduce((a,c)=>c.w>a.w?c:a)];
    let tot=0; for(const e of es) tot+=e.w; for(const e of es) e.w/=tot; wl[v]=es; }
  // pack
  const J0=new Uint8Array(nV*4), W0=new Float32Array(nV*4);
  for(let v=0;v<nV;v++){ const es=wl[v];
    for(let k=0;k<4;k++){ if(k<es.length){ J0[v*4+k]=es[k].b; W0[v*4+k]=es[k].w; } } }

  // ---- write skinned GLB ----
  const outViews=[],outAcc=[],bufParts=[]; let bufOff=0;
  function push(f,target){ const buf=Buffer.from(f.buffer,f.byteOffset,f.byteLength); const pad=(4-(buf.length%4))%4;
    outViews.push(Object.assign({buffer:0,byteOffset:bufOff,byteLength:buf.length},target?{target}:{}));
    bufParts.push(buf); if(pad)bufParts.push(Buffer.alloc(pad)); bufOff+=buf.length+pad; return outViews.length-1; }
  // geometry (untouched — ONE continuous mesh)
  let pmn=[Infinity,Infinity,Infinity],pmx=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<pos.length;i+=3){for(let j2=0;j2<3;j2++){pmn[j2]=Math.min(pmn[j2],pos[i+j2]);pmx[j2]=Math.max(pmx[j2],pos[i+j2]);}}
  const attrs={};
  outAcc.push({bufferView:push(pos,34962),componentType:5126,count:nV,type:'VEC3',min:pmn,max:pmx}); attrs.POSITION=outAcc.length-1;
  if(nrm){ outAcc.push({bufferView:push(nrm,34962),componentType:5126,count:nV,type:'VEC3'}); attrs.NORMAL=outAcc.length-1; }
  if(uv){ outAcc.push({bufferView:push(uv,34962),componentType:5126,count:nV,type:'VEC2'}); attrs.TEXCOORD_0=outAcc.length-1; }
  outAcc.push({bufferView:push(J0,34962),componentType:5121,count:nV,type:'VEC4'}); attrs.JOINTS_0=outAcc.length-1;
  outAcc.push({bufferView:push(W0,34962),componentType:5126,count:nV,type:'VEC4'}); attrs.WEIGHTS_0=outAcc.length-1;
  const idxOut=(idx instanceof Uint32Array)?idx:new Uint32Array(idx);
  outAcc.push({bufferView:push(idxOut,34963),componentType:5125,count:idxOut.length,type:'SCALAR'}); const iAcc=outAcc.length-1;
  // inverse bind matrices (translation-only)
  const ibm=new Float32Array(BONES.length*16);
  BONES.forEach((b,i)=>{ const p=JW[b[1]]; const m=[1,0,0,0, 0,1,0,0, 0,0,1,0, -p[0],-p[1],-p[2],1]; ibm.set(m,i*16); });
  outAcc.push({bufferView:push(ibm),componentType:5126,count:BONES.length,type:'MAT4'}); const ibmAcc=outAcc.length-1;
  // nodes: 0=root scene node w/ mesh+skin, 1..16 bones (local translations)
  const nodes=[{name:'body',mesh:0,skin:0}];
  BONES.forEach((b,i)=>{ const p=JW[b[1]]; const parent=b[3]?JW[BONES[boneIdx[b[3]]][1]]:[0,0,0];
    nodes.push({name:b[0], translation:[p[0]-parent[0], p[1]-parent[1], p[2]-parent[2]]}); });
  BONES.forEach((b,i)=>{ if(b[3]!=null){ const pn=nodes[boneIdx[b[3]]+1]; pn.children=pn.children||[]; pn.children.push(i+1); } });
  // texture
  const outImages=[],outTextures=[];
  if(json.images&&json.images.length){ const img=json.images[0],bv=json.bufferViews[img.bufferView];
    const data=bin.slice(bv.byteOffset||0,(bv.byteOffset||0)+bv.byteLength);
    outViews.push({buffer:0,byteOffset:bufOff,byteLength:data.length}); bufParts.push(data);
    const pad=(4-(data.length%4))%4; if(pad)bufParts.push(Buffer.alloc(pad)); bufOff+=data.length+pad;
    outImages.push({mimeType:img.mimeType,bufferView:outViews.length-1}); outTextures.push({source:0}); }
  const outJson={ asset:{version:'2.0',generator:'BANNON skinned auto-rigger v3'},
    scene:0, scenes:[{nodes:[0, 1]}], nodes,
    meshes:[{name:'body',primitives:[{attributes:attrs,indices:iAcc,material:0}]}],
    skins:[{inverseBindMatrices:ibmAcc, joints:BONES.map((_,i)=>i+1), skeleton:1}],
    accessors:outAcc, bufferViews:outViews, buffers:[{byteLength:bufOff}],
    materials:[json.materials[0]], images:outImages, textures:outTextures };
  if(json.samplers&&json.samplers.length) outJson.samplers=json.samplers.slice(0,1);
  let js=JSON.stringify(outJson); while(js.length%4)js+=' ';
  const jb=Buffer.from(js,'utf8'), bb=Buffer.concat(bufParts);
  const total=12+8+jb.length+8+bb.length, out=Buffer.alloc(total);
  out.writeUInt32LE(0x46546C67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(total,8);
  let o=12; out.writeUInt32LE(jb.length,o);out.writeUInt32LE(0x4E4F534A,o+4);jb.copy(out,o+8);o+=8+jb.length;
  out.writeUInt32LE(bb.length,o);out.writeUInt32LE(0x004E4942,o+4);bb.copy(out,o+8);
  fs.writeFileSync(outP,out);
  console.log(`out: ${outP} (${out.length} bytes, ${BONES.length} bones, skinned)`);
}
main();
