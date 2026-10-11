#!/usr/bin/env node
/* qa_pose.cjs — node-only deformation QA (no browser).
 * For each GLB: LBS-deforms a canonical action pose in pure JS and measures:
 *  - p95 residual: |posed - rigidDominantBoneFollow| / height  (skinqa-like)
 *  - spikes: triangles whose edge length grows >2.5x under pose (spikes-like)
 *  - weight hygiene: dead verts (sum w == 0), unnormalized rows, invalid joint idx
 *  - crossbody: influences geometrically far from the vertex vs nearest influence
 * Usage: node qa_pose.cjs <model.glb> [...]  -> one JSON line per model on stdout
 */
'use strict';
const fs = require('fs');
const path = require('path');

async function main() {
  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const { MeshoptDecoder } = require('meshoptimizer');
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

  for (const file of process.argv.slice(2)) {
    try {
      const doc = await io.readBinary(fs.readFileSync(file));
      console.log(JSON.stringify(qaModel(doc, path.basename(file))));
    } catch (e) {
      console.log(JSON.stringify({ file: path.basename(file), error: String(e).slice(0, 160) }));
    }
  }
}

// ---- math ----
function q2m(q) { // quat [x,y,z,w] -> mat4 col-major
  const [x, y, z, w] = q, m = new Float64Array(16);
  const xx = x*x, yy = y*y, zz = z*z, xy = x*y, xz = x*z, yz = y*z, wx = w*x, wy = w*y, wz = w*z;
  m[0]=1-2*(yy+zz); m[1]=2*(xy+wz);   m[2]=2*(xz-wy);   m[3]=0;
  m[4]=2*(xy-wz);   m[5]=1-2*(xx+zz); m[6]=2*(yz+wx);   m[7]=0;
  m[8]=2*(xz+wy);   m[9]=2*(yz-wx);   m[10]=1-2*(xx+yy);m[11]=0;
  m[12]=0; m[13]=0; m[14]=0; m[15]=1; return m;
}
function compose(t, q, s) {
  const r = q2m(q || [0,0,0,1]); s = s || [1,1,1];
  const m = new Float64Array(16);
  for (let c = 0; c < 4; c++) for (let r2 = 0; r2 < 4; r2++)
    m[c*4+r2] = r[c*4+r2] * (r2 < 3 ? s[r2] : 1);
  m[12] = t ? t[0] : 0; m[13] = t ? t[1] : 0; m[14] = t ? t[2] : 0;
  return m;
}
function mul(a, b) { // col-major a*b
  const m = new Float64Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k*4+r] * b[c*4+k];
    m[c*4+r] = s;
  } return m;
}
function xform(m, v) {
  const w = m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15];
  return [(m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12])/w,
          (m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13])/w,
          (m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14])/w];
}
function dist(a, b) { const dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2]; return Math.hypot(dx,dy,dz); }
function axisAngle(axis, deg) {
  const r = deg*Math.PI/180/2, s = Math.sin(r);
  return [axis[0]*s, axis[1]*s, axis[2]*s, Math.cos(r)];
}
function qmul(a, b) { // apply b then a (a*b)
  const [ax,ay,az,aw]=a,[bx,by,bz,bw]=b;
  return [aw*bx+ax*bw+ay*bz-az*by, aw*by-ax*bz+ay*bw+az*bx,
          aw*bz+ax*by-ay*bx+az*bw, aw*bw-ax*bx-ay*by-az*bz];
}

// Canonical action pose: [nameToken, axis, degrees]
const POSE = [
  ['LeftArm',     [1,0,0], -70], ['RightArm',    [1,0,0], -70],
  ['LeftForeArm', [1,0,0], -55], ['RightForeArm',[1,0,0], -55],
  ['Spine1',      [0,1,0],  28],
  ['LeftUpLeg',   [1,0,0],  45], ['RightUpLeg',  [1,0,0],  20],
  ['Head',        [0,1,0], -20],
];
const STRETCH = 2.5, FACTOR = 2.5;

function qaModel(doc, file) {
  const root = doc.getRoot();
  const skins = root.listSkins();
  const out = { file, joints: 0, verts: 0 };
  if (!skins.length) { out.noSkin = true; return out; }
  const skin = skins[0];
  const joints = skin.listJoints();
  out.joints = joints.length;
  const ibmAcc = skin.getInverseBindMatrices();
  const ibm = ibmAcc ? ibmAcc.getArray() : null;

  // node hierarchy
  const parent = new Map();
  for (const n of root.listNodes()) for (const c of n.listChildren()) parent.set(c, n);
  const world = new Map();
  function wmat(n) {
    if (world.has(n)) return world.get(n);
    const m = n.getMatrix() ? Float64Array.from(n.getMatrix())
      : compose(n.getTranslation(), n.getRotation(), n.getScale());
    const p = parent.get(n);
    const w = p ? mul(wmat(p), m) : m;
    world.set(n, w); return w;
  }
  const bindW = joints.map(wmat);
  const jointPos = bindW.map(m => [m[12], m[13], m[14]]);
  const ibmMats = [];
  if (ibm) for (let j = 0; j < joints.length; j++)
    ibmMats.push(Float64Array.from(ibm.slice(j*16, j*16+16)));
  else joints.forEach((_, j) => ibmMats.push(bindW[j])); // fallback (wrong but keeps math alive)
  const skinM = joints.map((_, j) => mul(bindW[j], ibmMats[j]));

  // test pose: clone world map with extra local rotations
  const extra = new Map(); // node -> quat
  for (const [tok, ax, deg] of POSE) {
    const j = joints.findIndex(n => (n.getName()||'').split(':').pop() === tok);
    if (j >= 0) extra.set(joints[j], axisAngle(ax, deg));
  }
  out.poseJoints = extra.size;
  const world2 = new Map();
  function wmat2(n) {
    if (world2.has(n)) return world2.get(n);
    let m = n.getMatrix() ? Float64Array.from(n.getMatrix())
      : compose(n.getTranslation(), n.getRotation(), n.getScale());
    if (extra.has(n)) { // premultiply extra rotation in local space
      const t = n.getTranslation() || [0,0,0], s = n.getScale() || [1,1,1];
      const q = qmul(extra.get(n), n.getRotation() || [0,0,0,1]);
      m = compose(t, q, s);
    }
    const p = parent.get(n);
    const w = p ? mul(wmat2(p), m) : m;
    world2.set(n, w); return w;
  }
  const poseW = joints.map(wmat2);
  const skinM2 = joints.map((_, j) => mul(poseW[j], ibmMats[j]));

  // gather skinned primitives
  let res = [], spikes = 0, worstSpike = 0, worstSpikeJoints = '',
      dead = 0, unnorm = 0, badIdx = 0, cross = 0, crossEx = '',
      totalV = 0, minY = 1e9, maxY = -1e9;
  for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
    const posA = prim.getAttribute('POSITION'), jA = prim.getAttribute('JOINTS_0'), wA = prim.getAttribute('WEIGHTS_0');
    if (!posA || !jA || !wA) continue;
    const pos = posA.getArray(), ji = jA.getArray(), w = wA.getArray();
    const idx = prim.getIndices() ? prim.getIndices().getArray() : null;
    const nv = posA.getCount(); totalV += nv;
    const pv = new Float64Array(nv*3);
    for (let v = 0; v < nv; v++) {
      const vx = pos[v*3], vy = pos[v*3+1], vz = pos[v*3+2];
      if (vy < minY) minY = vy; if (vy > maxY) maxY = vy;
      let sw = 0, domJ = -1, domW = -1;
      for (let k = 0; k < 4; k++) {
        const jx = ji[v*4+k], ww = w[v*4+k]; sw += ww;
        if (ww > domW) { domW = ww; domJ = jx; }
        if (jx >= joints.length) badIdx++;
      }
      if (sw === 0) { dead++; continue; }
      if (Math.abs(sw - 1) > 0.02) unnorm++;
      // cross-body: geometric check
      let nearest = 1e9; const ds = [];
      for (let k = 0; k < 4; k++) {
        const ww = w[v*4+k]; if (ww <= 0) { ds.push(1e9); continue; }
        const d = dist([vx,vy,vz], jointPos[ji[v*4+k]] || [0,0,0]);
        ds.push(d); if (d < nearest) nearest = d;
      }
      for (let k = 0; k < 4; k++) {
        if (w[v*4+k] > 0 && ds[k] > FACTOR * Math.max(nearest, 1e-6)) {
          cross++;
          if (!crossEx && cross < 4) crossEx = `${joints[ji[v*4+k]].getName()}:${w[v*4+k].toFixed(2)}`;
          break;
        }
      }
      // posed position via LBS
      let px=0, py=0, pz=0, rx=0, ry=0, rz=0;
      for (let k = 0; k < 4; k++) {
        const ww = w[v*4+k]; if (ww <= 0) continue;
        const m = skinM2[ji[v*4+k]]; if (!m) continue;
        const q = xform(m, [vx,vy,vz]);
        px += ww*q[0]; py += ww*q[1]; pz += ww*q[2];
      }
      // rigid follow of dominant bone
      let r2 = [vx,vy,vz];
      if (domJ >= 0 && domJ < joints.length && skinM2[domJ]) r2 = xform(skinM2[domJ], [vx,vy,vz]);
      pv[v*3]=px; pv[v*3+1]=py; pv[v*3+2]=pz;
      res.push(Math.hypot(px-r2[0], py-r2[1], pz-r2[2]));
    }
    // spikes on posed mesh
    const tris = idx ? idx.length/3 : nv/3;
    for (let t = 0; t < tris; t++) {
      const a = idx ? idx[t*3] : t*3, b = idx ? idx[t*3+1] : t*3+1, c = idx ? idx[t*3+2] : t*3+2;
      if (a*3+2 >= pos.length || b*3+2 >= pos.length || c*3+2 >= pos.length) continue;
      let worst = 0;
      const P = [[pos[a*3],pos[a*3+1],pos[a*3+2]],[pos[b*3],pos[b*3+1],pos[b*3+2]],[pos[c*3],pos[c*3+1],pos[c*3+2]]];
      const Q = [[pv[a*3],pv[a*3+1],pv[a*3+2]],[pv[b*3],pv[b*3+1],pv[b*3+2]],[pv[c*3],pv[c*3+1],pv[c*3+2]]];
      for (const [i1,i2] of [[0,1],[1,2],[2,0]]) {
        const lb = dist(P[i1],P[i2]); if (lb < 1e-9) continue;
        const s = dist(Q[i1],Q[i2])/lb; if (s > worst) worst = s;
      }
      if (worst > STRETCH) { spikes++; if (worst > worstSpike) { worstSpike = worst;
        worstSpikeJoints = [0,1,2].map(q2 => { let dj=-1,dw=-1; const vv=[a,b,c][q2];
          for (let k=0;k<4;k++) if (w[vv*4+k]>dw){dw=w[vv*4+k];dj=ji[vv*4+k];}
          return (joints[dj]?joints[dj].getName():'?').split(':').pop(); }).join('/'); } }
    }
  }
  out.verts = totalV;
  const H = Math.max(0.5, maxY - minY); out.height = +H.toFixed(3);
  res.sort((a,b)=>a-b);
  const q = p => res.length ? res[Math.min(res.length-1, Math.floor(p*res.length))]/H : 0;
  out.p50 = +q(0.5).toFixed(4); out.p95 = +q(0.95).toFixed(4); out.p999 = +q(0.999).toFixed(4);
  out.spikes = spikes; out.worstSpike = +worstSpike.toFixed(2); out.worstSpikeJoints = worstSpikeJoints;
  out.deadVerts = dead; out.unnormRows = unnorm; out.badJointIdx = badIdx;
  out.crossBodyVerts = cross; out.crossExample = crossEx;
  return out;
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
