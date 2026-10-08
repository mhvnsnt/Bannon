#!/usr/bin/env node
/* merge_parts.cjs — merge all mesh primitives of a GLB into ONE indexed primitive, in place.
 * Applies node world transforms. Computes smooth (area-weighted) normals when missing.
 * Material/textures preserved (in-place edit). Usage: node merge_parts.cjs <in.glb> <out.glb>
 */
'use strict';
const fs = require('fs');
const [IN, OUT] = process.argv.slice(2);
if (!IN || !OUT) { console.error('usage: node merge_parts.cjs <in.glb> <out.glb>'); process.exit(1); }
(async () => {
  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const { MeshoptDecoder } = require('meshoptimizer');
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
  const doc = await io.readBinary(fs.readFileSync(IN));
  const root = doc.getRoot();

  const M4 = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  const mul = (a,b) => { const o=new Array(16); for(let r=0;r<4;r++)for(let c=0;c<4;c++)o[r*4+c]=a[r*4]*b[c]+a[r*4+1]*b[4+c]+a[r*4+2]*b[8+c]+a[r*4+3]*b[12+c]; return o; };
  const fT = (t,q,s) => { const [x,y,z,w]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
    return [(1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,(xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,(xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,t[0],t[1],t[2],1]; };
  const wm = new Map();
  const walk = (n, pm) => { const m = mul(pm, fT(n.getTranslation(), n.getRotation(), n.getScale())); wm.set(n, m); n.listChildren().forEach(c => walk(c, m)); };
  root.listScenes().forEach(sc => sc.listChildren().forEach(c => walk(c, M4())));
  const xfp = (m, p) => { const [x,y,z]=p, w=m[3]*x+m[7]*y+m[11]*z+m[15];
    return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w, (m[1]*x+m[5]*y+m[9]*z+m[13])/w, (m[2]*x+m[6]*y+m[10]*z+m[14])/w]; };
  // normal matrix = inverse-transpose (for uniform/identity it's just the rotation part)
  const xfn = (m, p) => { const [x,y,z]=p;
    return [m[0]*x+m[4]*y+m[8]*z, m[1]*x+m[5]*y+m[9]*z, m[2]*x+m[6]*y+m[10]*z]; };

  const P = [], T = [], Nr = [], I = [];
  let vOff = 0, hasUV = false, hasNrm = false, primCount = 0, mat = null;
  const prims = [];
  for (const n of root.listNodes()) {
    const mesh = n.getMesh(); if (!mesh) continue;
    for (const prim of mesh.listPrimitives()) { prims.push({ prim, M: wm.get(n) || M4() }); }
  }
  for (const { prim, M } of prims) {
    const pa = prim.getAttribute('POSITION'); if (!pa) continue;
    primCount++;
    if (!mat) mat = prim.getMaterial();
    const pos = pa.getArray();
    const uv = prim.getAttribute('TEXCOORD_0'), uva = uv ? uv.getArray() : null;
    const nm = prim.getAttribute('NORMAL'), nma = nm ? nm.getArray() : null;
    if (uva) hasUV = true; if (nma) hasNrm = true;
    const idx = prim.getIndices() ? prim.getIndices().getArray() : null;
    const nv = pa.getCount();
    for (let i = 0; i < nv; i++) {
      const p = xfp(M, [pos[i*3], pos[i*3+1], pos[i*3+2]]);
      P.push(p[0], p[1], p[2]);
      T.push(uva ? uva[i*2] : 0, uva ? uva[i*2+1] : 0);
      if (nma) { const nn = xfn(M, [nma[i*3], nma[i*3+1], nma[i*3+2]]); Nr.push(nn[0], nn[1], nn[2]); }
    }
    if (idx) for (let i = 0; i < idx.length; i++) I.push(idx[i] + vOff);
    else for (let i = 0; i < nv; i++) I.push(i + vOff);
    vOff += nv;
  }
  if (!primCount) { console.error('no mesh primitives found'); process.exit(1); }
  console.log(`merged ${primCount} primitives -> ${vOff} verts, ${I.length/3} tris (uv:${hasUV} nrm:${hasNrm})`);

  const buf = root.listBuffers()[0] || doc.createBuffer();
  const posAcc = doc.createAccessor().setType('VEC3').setArray(new Float32Array(P)).setBuffer(buf);
  const idxAcc = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(I)).setBuffer(buf);
  const nPrim = doc.createPrimitive()
    .setAttribute('POSITION', posAcc).setIndices(idxAcc);
  if (hasUV) nPrim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(T)).setBuffer(buf));
  if (hasNrm) {
    nPrim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(Nr)).setBuffer(buf));
  } else {
    // smooth area-weighted normals
    const N = new Float32Array(P.length);
    for (let t = 0; t < I.length; t += 3) {
      const a=I[t]*3, b=I[t+1]*3, c=I[t+2]*3;
      const abx=P[b]-P[a], aby=P[b+1]-P[a+1], abz=P[b+2]-P[a+2];
      const acx=P[c]-P[a], acy=P[c+1]-P[a+1], acz=P[c+2]-P[a+2];
      const nx=aby*acz-abz*acy, ny=abz*acx-abx*acz, nz=abx*acy-aby*acx;
      N[a]+=nx; N[a+1]+=ny; N[a+2]+=nz; N[b]+=nx; N[b+1]+=ny; N[b+2]+=nz; N[c]+=nx; N[c+1]+=ny; N[c+2]+=nz;
    }
    for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i],N[i+1],N[i+2])||1; N[i]/=l; N[i+1]/=l; N[i+2]/=l; }
    nPrim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N).setBuffer(buf));
    console.log('computed smooth normals');
  }
  if (mat) nPrim.setMaterial(mat);
  const nMesh = doc.createMesh('merged').addPrimitive(nPrim);

  // replace scene content with single node
  for (const sc of root.listScenes()) for (const c of [...sc.listChildren()]) c.dispose();
  for (const m of [...root.listMeshes()]) { if (m !== nMesh) m.dispose(); }
  const nn = doc.createNode('merged').setMesh(nMesh);
  let sc = root.listScenes()[0]; if (!sc) sc = doc.createScene('scene');
  sc.addChild(nn);
  for (const e of root.listExtensionsUsed()) if (/meshopt/i.test(e.extensionName)) e.dispose();

  const outBuf = await io.writeBinary(doc);
  fs.writeFileSync(OUT, Buffer.from(outBuf));
  console.log('wrote', OUT);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
