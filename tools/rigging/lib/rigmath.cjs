#!/usr/bin/env node
/* rigmath.cjs — shared game-agnostic rig math for tools/rigging/.
 *
 * Pure-JS linear-blend skinning, quaternion/matrix ops, glTF skin loading
 * (@gltf-transform, MIT) and the deformation metrics from the Bannon repair
 * program's qa_pose.cjs: p95 residual vs rigid bone-follow, spike triangles
 * (>2.5x edge stretch), weight hygiene. No game-specific code: input is any
 * skinned GLB, output is numbers.
 */
'use strict';

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
function qmul(a, b) { // apply b then a
  const [ax,ay,az,aw]=a,[bx,by,bz,bw]=b;
  return [aw*bx+ax*bw+ay*bz-az*by, aw*by-ax*bz+ay*bw+az*bx,
          aw*bz+ax*by-ay*bx+az*bw, aw*bw-ax*bx-ay*by-az*bz];
}
function qconj(q){ return [-q[0],-q[1],-q[2],q[3]]; }
function qnorm(q){ const l=Math.hypot(q[0],q[1],q[2],q[3])||1; return [q[0]/l,q[1]/l,q[2]/l,q[3]/l]; }
function slerp(a, b, t) {
  let d = a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
  let b2 = b;
  if (d < 0) { d = -d; b2 = [-b[0],-b[1],-b[2],-b[3]]; }
  if (d > 0.9995) {
    const r = [a[0]+t*(b2[0]-a[0]), a[1]+t*(b2[1]-a[1]), a[2]+t*(b2[2]-a[2]), a[3]+t*(b2[3]-a[3])];
    return qnorm(r);
  }
  const th = Math.acos(Math.min(1, d)), s = Math.sin(th);
  const wa = Math.sin((1-t)*th)/s, wb = Math.sin(t*th)/s;
  return [wa*a[0]+wb*b2[0], wa*a[1]+wb*b2[1], wa*a[2]+wb*b2[2], wa*a[3]+wb*b2[3]];
}
function axisAngle(axis, deg) {
  const r = deg*Math.PI/180/2, s = Math.sin(r);
  return [axis[0]*s, axis[1]*s, axis[2]*s, Math.cos(r)];
}
function dist(a, b) { const dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2]; return Math.hypot(dx,dy,dz); }

/* Load the first skin from a gltf-transform Document.
 * Returns { joints:[Node], jointIndex:Map(name->idx), ibm:Float32Array|null,
 *           meshes:[{pos:Float32Array, idx:Uint32Array, joints:Uint16Array, weights:Float32Array, nVerts, nTris}],
 *           height } — height = skeleton bounding-box height in bind pose. */
function loadSkin(doc) {
  const root = doc.getRoot();
  const skins = root.listSkins();
  if (!skins.length) return null;
  const skin = skins[0];
  const joints = skin.listJoints();
  const jointIndex = new Map(joints.map((j, i) => [j.getName(), i]));
  const ibmAcc = skin.getInverseBindMatrices();
  const ibm = ibmAcc ? Float32Array.from(ibmAcc.getArray()) : null;

  // bind-pose world matrices + skeleton height
  const parent = new Map();
  for (const n of root.listNodes()) for (const c of n.listChildren()) parent.set(c, n);
  const wmat = new Map();
  function W(n) {
    if (wmat.has(n)) return wmat.get(n);
    const local = n.getMatrix() ? Float64Array.from(n.getMatrix())
      : compose(n.getTranslation(), n.getRotation(), n.getScale());
    const p = parent.get(n);
    const w = p ? mul(W(p), local) : local;
    wmat.set(n, w); return w;
  }
  const bb = { mn: [1e9,1e9,1e9], mx: [-1e9,-1e9,-1e9] };
  for (const j of joints) {
    const p = xform(W(j), [0,0,0]);
    for (let k = 0; k < 3; k++) { bb.mn[k] = Math.min(bb.mn[k], p[k]); bb.mx[k] = Math.max(bb.mx[k], p[k]); }
  }
  const height = bb.mx[1] - bb.mn[1];

  const meshes = [];
  for (const m of root.listMeshes()) for (const prim of m.listPrimitives()) {
    const posA = prim.getAttribute('POSITION'), jA = prim.getAttribute('JOINTS_0'), wA = prim.getAttribute('WEIGHTS_0');
    if (!posA || !jA || !wA) continue;
    const idxA = prim.getIndices();
    meshes.push({
      pos: Float32Array.from(posA.getArray()),
      idx: idxA ? Uint32Array.from(idxA.getArray()) : null,
      joints: Uint16Array.from(jA.getArray()),
      weights: Float32Array.from(wA.getArray()),
      nVerts: posA.getCount(),
      nTris: idxA ? idxA.getCount()/3 : posA.getCount()/3,
    });
  }
  return { joints, jointIndex, ibm, meshes, height, doc,
           jointWorld: (i) => W(joints[i]) };
}

/* Deform all meshes with per-joint world matrices (Float64Array[16] each).
 * Returns { p95, spikes, worst, spikeJoints:Map(jointIdx->count), residuals }.
 * p95 = 95th pct vertex residual vs rigid dominant-bone follow, normalized by height. */
function deformQA(skin, jointWorlds, height) {
  const STRETCH = 2.5;
  const residuals = [];
  const spikeJoints = new Map();
  let spikes = 0, worst = 0;
  for (const m of skin.meshes) {
    const n = m.nVerts;
    const posed = new Float64Array(n*3);
    const dom = new Int32Array(n);
    for (let v = 0; v < n; v++) {
      let bd = -1, bw = -1;
      for (let k = 0; k < 4; k++) {
        const w = m.weights[v*4+k];
        if (w > bw) { bw = w; bd = m.joints[v*4+k]; }
      }
      dom[v] = bd;
      const px = m.pos[v*3], py = m.pos[v*3+1], pz = m.pos[v*3+2];
      let X=0, Y=0, Z=0;
      for (let k = 0; k < 4; k++) {
        const w = m.weights[v*4+k]; if (w === 0) continue;
        const j = m.joints[v*4+k];
        const JW = jointWorlds[j], off = j*16;
        // skinMat = jointWorld * IBM
        const ix = skin.ibm[off],   iy = skin.ibm[off+1], iz = skin.ibm[off+2];
        // (unrolled) p' = JW * IBM * p — do IBM*p first via temp
        const qx = ix*px + skin.ibm[off+4]*py + skin.ibm[off+8]*pz + skin.ibm[off+12];
        const qy = iy*px + skin.ibm[off+5]*py + skin.ibm[off+9]*pz + skin.ibm[off+13];
        const qz = iz*px + skin.ibm[off+6]*py + skin.ibm[off+10]*pz + skin.ibm[off+14];
        X += w*(JW[0]*qx+JW[4]*qy+JW[8]*qz+JW[12]);
        Y += w*(JW[1]*qx+JW[5]*qy+JW[9]*qz+JW[13]);
        Z += w*(JW[2]*qx+JW[6]*qy+JW[10]*qz+JW[14]);
      }
      posed[v*3]=X; posed[v*3+1]=Y; posed[v*3+2]=Z;
      // rigid follow of dominant joint
      const j = bd, JW = jointWorlds[j], off = j*16;
      const qx = skin.ibm[off]*px + skin.ibm[off+4]*py + skin.ibm[off+8]*pz + skin.ibm[off+12];
      const qy = skin.ibm[off+1]*px + skin.ibm[off+5]*py + skin.ibm[off+9]*pz + skin.ibm[off+13];
      const qz = skin.ibm[off+2]*px + skin.ibm[off+6]*py + skin.ibm[off+10]*pz + skin.ibm[off+14];
      const rx = JW[0]*qx+JW[4]*qy+JW[8]*qz+JW[12];
      const ry = JW[1]*qx+JW[5]*qy+JW[9]*qz+JW[13];
      const rz = JW[2]*qx+JW[6]*qy+JW[10]*qz+JW[14];
      residuals.push(Math.hypot(X-rx, Y-ry, Z-rz) / height);
    }
    // spikes per triangle
    const tri = (a, b, c) => {
      const rest = dist([m.pos[a*3],m.pos[a*3+1],m.pos[a*3+2]],[m.pos[b*3],m.pos[b*3+1],m.pos[b*3+2]])
                 + dist([m.pos[b*3],m.pos[b*3+1],m.pos[b*3+2]],[m.pos[c*3],m.pos[c*3+1],m.pos[c*3+2]])
                 + dist([m.pos[c*3],m.pos[c*3+1],m.pos[c*3+2]],[m.pos[a*3],m.pos[a*3+1],m.pos[a*3+2]]);
      if (rest < 1e-9) return;
      const now = dist([posed[a*3],posed[a*3+1],posed[a*3+2]],[posed[b*3],posed[b*3+1],posed[b*3+2]])
                + dist([posed[b*3],posed[b*3+1],posed[b*3+2]],[posed[c*3],posed[c*3+1],posed[c*3+2]])
                + dist([posed[c*3],posed[c*3+1],posed[c*3+2]],[posed[a*3],posed[a*3+1],posed[a*3+2]]);
      const r = now / rest;
      if (r > worst) worst = r;
      if (r > STRETCH) {
        spikes++;
        const j = dom[a]; // attribute to dominant joint of first vert
        spikeJoints.set(j, (spikeJoints.get(j)||0)+1);
      }
    };
    if (m.idx) { for (let t = 0; t < m.idx.length; t += 3) tri(m.idx[t], m.idx[t+1], m.idx[t+2]); }
    else { for (let t = 0; t < n; t += 3) tri(t, t+1, t+2); }
  }
  residuals.sort((a,b)=>a-b);
  const p95 = residuals.length ? residuals[Math.floor(residuals.length*0.95)] : 0;
  return { p95, spikes, worst, spikeJoints };
}

/* Weight hygiene: dead/unnormalized/invalid rows. */
function weightHygiene(skin) {
  let dead = 0, unnorm = 0, invalid = 0, total = 0;
  const nj = skin.joints.length;
  for (const m of skin.meshes) for (let v = 0; v < m.nVerts; v++, total++) {
    let s = 0;
    for (let k = 0; k < 4; k++) {
      const w = m.weights[v*4+k], j = m.joints[v*4+k];
      s += w;
      if (j >= nj) invalid++;
    }
    if (s === 0) dead++;
    else if (Math.abs(s - 1) > 0.02) unnorm++;
  }
  return { verts: total, dead, unnorm, invalid };
}

module.exports = { q2m, compose, mul, xform, qmul, qconj, qnorm, slerp, axisAngle, dist,
                   loadSkin, deformQA, weightHygiene };
