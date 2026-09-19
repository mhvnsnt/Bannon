#!/usr/bin/env node
/* rescale_mesh.cjs — make a GLB's MESH agree with its own SKELETON.
 *
 *   node tools/model_diag/rescale_mesh.cjs IN.glb OUT.glb            (auto: fit mesh to bone span)
 *   node tools/model_diag/rescale_mesh.cjs IN.glb OUT.glb --scale 1.937
 *   node tools/model_diag/rescale_mesh.cjs IN.glb --check            (report, write nothing)
 *
 * WHY THIS EXISTS. A weight-transfer re-rig (tools/model_diag/transfer_weights.cjs) copies a PROVEN
 * skeleton onto a differently-authored mesh. If the two were modelled at different scales the result
 * is a GLB that is internally inconsistent: the mesh is one size and the skeleton is another.
 *
 * NOTHING UPSTREAM CATCHES IT. Bind-pose rendering is still correct, because the inverse bind
 * matrices cancel the joint transforms exactly, so the model looks perfect in a viewer and skinqa
 * measures a clean deformation residual. MEASURED on TARZANIAN_DEVIL_skinned.glb: mesh 0.980m,
 * skeleton spanning 1.898m, skinqa p95 0.0853 (same band as the shipped BANNON_rigged).
 *
 * IT IS FATAL IN THE GAME. The engine's fit-to-1.78m reads the BONE span, so it scaled the rig and
 * left the visible body at 0.92m — half a wrestler. And our engine drives joint POSITIONS (verlet
 * targets, IK, physics), not just rotations: a rotation is scale-free, but a position in metres is
 * not, so a skeleton at ~2x the body tears the mesh apart the moment physics touches it.
 *
 * THE MATH, and why scaling POSITIONS ALONE is correct:
 *   skinned(v) = SUM_i w_i * (jointWorld_i * IBM_i) * v
 *   In bind pose jointWorld_i == inverse(IBM_i), so the bracket is the identity and skinned(v) == v.
 *   Scaling every v by k therefore yields skinned(v) == v*k with the bind still exact -- the bones,
 *   the inverse bind matrices, the joint indices and the weights are all left untouched. The mesh
 *   simply grows into the skeleton it was given.
 *
 * Morph targets are scaled too (they are position deltas in the same space). Anything else is
 * copied through byte-for-byte.
 */
const fs = require('fs');

function readGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('not a GLB: ' + file);
  let off = 12, json = null, bin = null;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const chunk = buf.slice(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(chunk.toString('utf8'));
    else if (type === 0x004E4942) bin = Buffer.from(chunk);
    off += 8 + len;
    off += (4 - (off % 4)) % 4;
  }
  return { json, bin };
}

function writeGLB(file, json, bin) {
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  while (js.length % 4) js = Buffer.concat([js, Buffer.from(' ')]);
  let bn = bin;
  while (bn.length % 4) bn = Buffer.concat([bn, Buffer.from([0])]);
  const total = 12 + 8 + js.length + 8 + bn.length;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(0x46546C67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
  let o = 12;
  out.writeUInt32LE(js.length, o); out.writeUInt32LE(0x4E4F534A, o + 4); js.copy(out, o + 8); o += 8 + js.length;
  out.writeUInt32LE(bn.length, o); out.writeUInt32LE(0x004E4942, o + 4); bn.copy(out, o + 8);
  fs.writeFileSync(file, out);
}

const NUM = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4, MAT4:16 };

// every accessor that holds a POSITION (mesh vertices or morph deltas)
function positionAccessors(g) {
  const set = new Set();
  for (const m of (g.meshes || []))
    for (const p of (m.primitives || [])) {
      if (p.attributes && p.attributes.POSITION != null) set.add(p.attributes.POSITION);
      for (const t of (p.targets || [])) if (t.POSITION != null) set.add(t.POSITION);
    }
  return [...set];
}

function scalePositions(g, bin, k) {
  let touched = 0, verts = 0;
  for (const ai of positionAccessors(g)) {
    const a = g.accessors[ai];
    if (a.componentType !== 5126) throw new Error('POSITION accessor ' + ai + ' is not FLOAT');
    if (a.bufferView == null) continue;
    const bv = g.bufferViews[a.bufferView];
    const n = NUM[a.type];
    const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const stride = bv.byteStride || n * 4;
    for (let e = 0; e < a.count; e++)
      for (let c = 0; c < n; c++) {
        const o = base + e * stride + c * 4;
        bin.writeFloatLE(bin.readFloatLE(o) * k, o);
      }
    if (a.min) a.min = a.min.map(v => v * k);
    if (a.max) a.max = a.max.map(v => v * k);
    touched++; verts += a.count;
  }
  return { touched, verts };
}

// ---- measurement (same approach as pose_measure.cjs) ------------------------------------------
function ident(){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
function mul(a,b){ const o=new Array(16).fill(0);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; } return o; }
function trs(node){
  if (node.matrix) return node.matrix.slice();
  const t=node.translation||[0,0,0], r=node.rotation||[0,0,0,1], s=node.scale||[1,1,1];
  const [x,y,z,w]=r, x2=x+x,y2=y+y,z2=z+z;
  const xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return [ (1-(yy+zz))*s[0],(xy+wz)*s[0],(xz-wy)*s[0],0,
           (xy-wz)*s[1],(1-(xx+zz))*s[1],(yz+wx)*s[1],0,
           (xz+wy)*s[2],(yz-wx)*s[2],(1-(xx+yy))*s[2],0,
           t[0],t[1],t[2],1 ];
}
function measure(g, bin) {
  const world = new Array(g.nodes.length).fill(null);
  for (const r of (g.scenes[g.scene||0].nodes)) (function w(i,par){
    world[i] = mul(par, trs(g.nodes[i]));
    for (const c of (g.nodes[i].children||[])) w(c, world[i]);
  })(r, ident());

  // mesh extents in world space, from accessor min/max (exact, no vertex walk needed)
  let mMin=Infinity, mMax=-Infinity;
  for (let i=0;i<g.nodes.length;i++){
    const nd=g.nodes[i]; if (nd.mesh==null || !world[i]) continue;
    for (const p of g.meshes[nd.mesh].primitives){
      const a = g.accessors[p.attributes.POSITION]; if (!a || !a.min) continue;
      for (const cx of [a.min[0],a.max[0]]) for (const cy of [a.min[1],a.max[1]]) for (const cz of [a.min[2],a.max[2]]){
        const y = world[i][1]*cx + world[i][5]*cy + world[i][9]*cz + world[i][13];
        if (y<mMin) mMin=y; if (y>mMax) mMax=y;
      }
    }
  }
  // bone extents
  let bMin=Infinity, bMax=-Infinity, nJ=0;
  for (const sk of (g.skins||[])) for (const j of (sk.joints||[])){
    if (!world[j]) continue; nJ++;
    const y = world[j][13];
    if (y<bMin) bMin=y; if (y>bMax) bMax=y;
  }
  return { meshH: mMax-mMin, boneSpan: bMax-bMin, bonePadded:(bMax-bMin)*1.18, joints:nJ,
           meshMinY:mMin, meshMaxY:mMax };
}

// ---- main --------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const inFile = args[0];
if (!inFile) { console.error('usage: rescale_mesh.cjs IN.glb [OUT.glb] [--scale k] [--check]'); process.exit(2); }
const check = args.includes('--check');
const si = args.indexOf('--scale');
const forced = si >= 0 ? parseFloat(args[si+1]) : null;
const outFile = (!check && args[1] && !args[1].startsWith('--')) ? args[1] : null;

const { json: g, bin } = readGLB(inFile);
const before = measure(g, bin);
console.log('BEFORE  mesh ' + before.meshH.toFixed(3) + 'm   bones ' + before.boneSpan.toFixed(3) +
            'm (padded ' + before.bonePadded.toFixed(3) + 'm)   joints ' + before.joints);

const ratio = before.bonePadded / Math.max(1e-6, before.meshH);
console.log('        bone/mesh ratio ' + ratio.toFixed(3) +
            (Math.abs(Math.log(ratio)) > Math.log(1.35) ? '   <-- MISMATCHED' : '   (consistent)'));

if (check) process.exit(0);
if (!outFile) { console.error('no output path given (and --check not set)'); process.exit(2); }

const k = forced != null ? forced : ratio;
if (!isFinite(k) || k <= 0) { console.error('bad scale ' + k); process.exit(1); }
console.log('\nscaling mesh positions by ' + k.toFixed(5) + ' (skeleton, IBMs, weights, joints untouched)');

const r = scalePositions(g, bin, k);
writeGLB(outFile, g, bin);

const re = readGLB(outFile);
const after = measure(re.json, re.bin);
console.log('AFTER   mesh ' + after.meshH.toFixed(3) + 'm   bones ' + after.boneSpan.toFixed(3) +
            'm (padded ' + after.bonePadded.toFixed(3) + 'm)');
const rr = after.bonePadded / Math.max(1e-6, after.meshH);
console.log('        bone/mesh ratio ' + rr.toFixed(3));
console.log('        ' + r.touched + ' position accessor(s), ' + r.verts + ' vertices scaled');

// invariants: nothing but geometry may move
const inv = [];
if ((re.json.skins||[]).length !== (g.skins||[]).length) inv.push('skin count changed');
const j0 = (g.skins||[]).reduce((s,x)=>s+(x.joints||[]).length,0);
const j1 = (re.json.skins||[]).reduce((s,x)=>s+(x.joints||[]).length,0);
if (j0 !== j1) inv.push('joint count ' + j0 + ' -> ' + j1);
if (Math.abs(after.boneSpan - before.boneSpan) > 1e-4) inv.push('bone span moved');
if (Math.abs(rr - 1) > 0.35) inv.push('still mismatched after scaling');
if (inv.length) { console.error('\nFAILED: ' + inv.join('; ')); process.exit(1); }
console.log('\nOK — mesh now fills its own skeleton; skeleton unchanged.');
