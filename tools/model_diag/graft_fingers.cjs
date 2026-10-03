#!/usr/bin/env node
/* graft_fingers.cjs — ADD the finger chains to a rig instead of replacing the rig.
 *
 *   node tools/model_diag/graft_fingers.cjs assets/models/VIPER.glb            # in place
 *   node tools/model_diag/graft_fingers.cjs assets/models/VIPER.glb out.glb
 *   node tools/model_diag/graft_fingers.cjs --all                              # whole roster
 *   node tools/model_diag/graft_fingers.cjs --audit                            # who has fingers
 *
 * WHY — owner: "our rigs physically can have all those give them to them."
 *
 * MEASURED across all 61 shipped rigs: ONE has finger bones (xbot.glb, the Mixamo reference —
 * 129 nodes, 65 skin joints, 40 of them fingers). ZERO have face bones. Every character is a
 * 28-joint UniRig body. Meanwhile our captures carry 500-888 bone tracks, so only 7.6% of the
 * animation data we own can drive anything. The clips are not the problem; the rigs are.
 *
 * WHAT I TRIED FIRST AND THE GATE REFUSED, which is the whole reason this file exists:
 * transferring xbot's 65-joint fingered skeleton wholesale onto a character, the same technique that
 * rescued the Heavyweight body. It does not work here and the number said so immediately —
 *      VIPER  p95 0.0241 PASS  ->  0.0677 WEAK,  max 0.0778 -> 0.4074
 * because xbot is a GENERIC body: mean nearest-source distance came out at 7.9 cm against the 2.1 cm
 * of the case that worked. Weights get pulled from the wrong body part. Replacing a rig that already
 * scores 0.0241 to gain fingers is a bad trade, and MODEL_QA.md's rule ("promote on the number,
 * never on a screenshot") is what caught it.
 *
 * SO: GRAFT, DON'T REPLACE.
 *   * the existing 28-joint body skeleton is untouched — every body vertex keeps the weights that
 *     already pass, so body deformation cannot regress. That is the point.
 *   * five finger chains per hand are appended as CHILDREN of the existing hand bone, with the
 *     donor's local translations scaled by the ratio of this rig's forearm length to the donor's, so
 *     they land at the right size for this character's hand.
 *   * only vertices ALREADY weighted to the hand are redistributed, and only among that hand's new
 *     finger bones, by proximity to each finger's rest position. Nothing outside the hand moves.
 *   * inverse bind matrices for the new joints are computed from their world rest transforms.
 *
 * Always gate after: node tools/model_diag/skinqa.cjs <file>  — promote only if p95 holds.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const MODELS = path.join(ROOT, 'assets', 'models');
const DONOR = path.join(MODELS, 'xbot.glb');

const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const norm = n => String(n == null ? '' : n).toLowerCase().replace(/[^a-z0-9]/g, '');

// ── minimal GLB read/write ─────────────────────────────────────────────────────────────────
function readGLB(p){
  const buf = fs.readFileSync(p);
  if (buf.slice(0,4).toString() !== 'glTF') throw new Error('not a glb: ' + p);
  const total = buf.readUInt32LE(8);
  let off = 12, json = null, bin = null;
  while (off < total){
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(data.toString('utf8'));
    else if (type === 0x004E4942) bin = Buffer.from(data);
    off += 8 + len + ((4 - (len % 4)) % 4);
  }
  return { json, bin };
}
// GLB chunk padding is NOT one rule: the JSON chunk pads with SPACES (0x20) and the BIN chunk pads
// with ZEROS (0x00). Padding JSON with zeros produces trailing NULs inside the chunk and every
// parser dies on "Unexpected non-whitespace character after JSON" — which is exactly what the
// skinqa gate reported the first time this ran.
function pad4(b, fill){ const r = (4 - (b.length % 4)) % 4; return r ? Buffer.concat([b, Buffer.alloc(r, fill == null ? 0 : fill)]) : b; }
function writeGLB(p, json, bin){
  const j = pad4(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const b = pad4(bin, 0);
  const total = 12 + 8 + j.length + 8 + b.length;
  const out = Buffer.alloc(total);
  out.write('glTF', 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
  let o = 12;
  out.writeUInt32LE(j.length, o); out.writeUInt32LE(0x4E4F534A, o + 4); j.copy(out, o + 8); o += 8 + j.length;
  out.writeUInt32LE(b.length, o); out.writeUInt32LE(0x004E4942, o + 4); b.copy(out, o + 8);
  fs.writeFileSync(p, out);
  return total;
}
const CSIZE = { 5120:1, 5121:1, 5122:2, 5123:2, 5125:4, 5126:4 };
const NCOMP = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4, MAT4:16 };
function readAccessor(g, bin, i){
  const a = g.accessors[i], bv = g.bufferViews[a.bufferView];
  const n = NCOMP[a.type], cs = CSIZE[a.componentType];
  const stride = bv.byteStride || n * cs;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = [];
  for (let e = 0; e < a.count; e++){
    const row = [];
    for (let c = 0; c < n; c++){
      const off = base + e * stride + c * cs;
      let v;
      switch(a.componentType){
        case 5126: v = bin.readFloatLE(off); break;
        case 5125: v = bin.readUInt32LE(off); break;
        case 5123: v = bin.readUInt16LE(off); break;
        case 5121: v = bin.readUInt8(off); break;
        case 5122: v = bin.readInt16LE(off); break;
        default:   v = bin.readInt8(off);
      }
      row.push(v);
    }
    out.push(row);
  }
  return out;
}
function addAccessor(g, binParts, binLen, data, compType, type, count){
  const n = NCOMP[type], cs = CSIZE[compType];
  const buf = Buffer.alloc(count * n * cs);
  for (let e = 0; e < count; e++) for (let c = 0; c < n; c++){
    const v = data[e][c], off = (e * n + c) * cs;
    if (compType === 5126) buf.writeFloatLE(v, off);
    else if (compType === 5123) buf.writeUInt16LE(v, off);
    else if (compType === 5121) buf.writeUInt8(v, off);
    else buf.writeUInt32LE(v, off);
  }
  const padded = pad4(buf);
  const bvIndex = g.bufferViews.length;
  g.bufferViews.push({ buffer:0, byteOffset:binLen.v, byteLength:buf.length });
  binParts.push(padded); binLen.v += padded.length;
  g.accessors.push({ bufferView:bvIndex, componentType:compType, count:count, type:type });
  return g.accessors.length - 1;
}

// ── maths ──────────────────────────────────────────────────────────────────────────────────
function trs(node){
  const t = node.translation || [0,0,0];
  const r = node.rotation || [0,0,0,1];
  const s = node.scale || [1,1,1];
  const [x,y,z,w] = r;
  const x2=x+x, y2=y+y, z2=z+z;
  const xx=x*x2, xy=x*y2, xz=x*z2, yy=y*y2, yz=y*z2, zz=z*z2, wx=w*x2, wy=w*y2, wz=w*z2;
  return [
    (1-(yy+zz))*s[0], (xy+wz)*s[0], (xz-wy)*s[0], 0,
    (xy-wz)*s[1], (1-(xx+zz))*s[1], (yz+wx)*s[1], 0,
    (xz+wy)*s[2], (yz-wx)*s[2], (1-(xx+yy))*s[2], 0,
    t[0], t[1], t[2], 1
  ];
}
function mul(a,b){ const o=new Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
  return o; }
function invert(m){
  const inv = new Array(16);
  inv[0]=m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
  inv[4]=-m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
  inv[8]=m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
  inv[12]=-m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
  inv[1]=-m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
  inv[5]=m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
  inv[9]=-m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
  inv[13]=m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
  inv[2]=m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
  inv[6]=-m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
  inv[10]=m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
  inv[14]=-m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
  inv[3]=-m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
  inv[7]=m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
  inv[11]=-m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
  inv[15]=m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
  let det = m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];
  if (!det) return null;
  det = 1/det;
  return inv.map(v => v * det);
}
const xform = (m, p) => [ m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
                          m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
                          m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14] ];

function worldOf(nodes, parentOf, i){
  let m = trs(nodes[i]), p = parentOf[i];
  while (p != null && p >= 0){ m = mul(trs(nodes[p]), m); p = parentOf[p]; }
  return m;
}
function parents(nodes){
  const p = new Array(nodes.length).fill(-1);
  nodes.forEach((n, i) => (n.children || []).forEach(c => { p[c] = i; }));
  return p;
}

// ── the graft ──────────────────────────────────────────────────────────────────────────────
function graft(file, outFile){
  const { json: g, bin } = readGLB(file);
  if (!g.skins || !g.skins.length) return { skip: 'no skin' };
  const nodes = g.nodes, skin = g.skins[0];
  const jointIdx = skin.joints.slice();
  const nameOf = i => (nodes[i] && nodes[i].name) || '';
  if (jointIdx.some(i => /thumb|index|middle|ring|pinky/i.test(nameOf(i)))) return { skip: 'already has fingers' };

  const D = readGLB(DONOR);
  const dn = D.json.nodes, dpar = parents(dn);
  const dByName = {}; dn.forEach((n, i) => { if (n.name) dByName[norm(n.name)] = i; });
  const par = parents(nodes);
  const byName = {}; nodes.forEach((n, i) => { if (n.name) byName[norm(n.name)] = i; });

  // scale the donor's hand to this rig: forearm length is the most reliable shared measure
  function chainLen(nds, pr, a, b){
    if (a == null || b == null) return null;
    const wa = worldOf(nds, pr, a), wb = worldOf(nds, pr, b);
    return Math.hypot(wa[12]-wb[12], wa[13]-wb[13], wa[14]-wb[14]);
  }
  const find = (map, base) => map[norm('mixamorig' + base)] != null ? map[norm('mixamorig' + base)] : map[norm(base)];
  const dFore = chainLen(dn, dpar, find(dByName,'LeftForeArm'), find(dByName,'LeftHand'));
  const tFore = chainLen(nodes, par, find(byName,'LeftForeArm'), find(byName,'LeftHand'));
  const scale = (dFore && tFore) ? (tFore / dFore) : 1;

  const geomVerts = [];              // gather POSITION + JOINTS/WEIGHTS per skinned primitive
  const prims = [];
  for (const mesh of g.meshes) for (const pm of mesh.primitives){
    if (pm.attributes.JOINTS_0 == null || pm.attributes.WEIGHTS_0 == null) continue;
    prims.push(pm);
  }
  if (!prims.length) return { skip: 'no skinned primitive' };

  const binParts = [bin]; const binLen = { v: bin.length };
  let added = 0, reweighted = 0;

  for (const side of ['Left', 'Right']){
    const handT = find(byName, side + 'Hand');
    const handD = find(dByName, side + 'Hand');
    if (handT == null || handD == null) continue;
    const handJointSlot = jointIdx.indexOf(handT);
    if (handJointSlot < 0) continue;

    const handWorldT = worldOf(nodes, par, handT);
    const newJointSlots = [];        // [{slot, restWorld}]

    for (const fname of FINGERS){
      let prevT = handT;
      for (let seg = 1; seg <= 3; seg++){
        const dIdx = find(dByName, side + 'Hand' + fname + seg);
        if (dIdx == null) break;
        const t = (dn[dIdx].translation || [0,0,0]).map(v => v * scale);
        const nd = { name: 'mixamorig:' + side + 'Hand' + fname + seg, translation: t };
        nodes.push(nd);
        const nIdx = nodes.length - 1;
        (nodes[prevT].children || (nodes[prevT].children = [])).push(nIdx);
        par[nIdx] = prevT;
        skin.joints.push(nIdx);
        newJointSlots.push({ slot: skin.joints.length - 1, node: nIdx });
        prevT = nIdx; added++;
      }
    }
    if (!newJointSlots.length) continue;

    // rest world position of each new joint, for proximity weighting
    for (const nj of newJointSlots){
      const w = worldOf(nodes, par, nj.node);
      nj.p = [w[12], w[13], w[14]];
    }

    // redistribute ONLY the vertices already bound to this hand
    for (const pm of prims){
      const pos = readAccessor(g, bin, pm.attributes.POSITION);
      const jts = pm.__j || (pm.__j = readAccessor(g, bin, pm.attributes.JOINTS_0));
      const wts = pm.__w || (pm.__w = readAccessor(g, bin, pm.attributes.WEIGHTS_0));
      for (let v = 0; v < jts.length; v++){
        let handW = 0;
        for (let k = 0; k < 4; k++) if (jts[v][k] === handJointSlot) handW += wts[v][k];
        if (handW < 0.5) continue;               // not really a hand vertex — leave it alone
        // nearest new joint by rest distance
        let best = null, bd = 1e9;
        for (const nj of newJointSlots){
          const d = Math.hypot(pos[v][0]-nj.p[0], pos[v][1]-nj.p[1], pos[v][2]-nj.p[2]);
          if (d < bd){ bd = d; best = nj; }
        }
        // only the outer hand (near a finger) is handed over; the palm stays on the hand bone
        if (!best || bd > 0.055 * (scale || 1) * 2.2) continue;
        const give = handW * 0.6;                // keep 40% on the palm so the hand still drives
        for (let k = 0; k < 4; k++) if (jts[v][k] === handJointSlot) wts[v][k] -= wts[v][k] * 0.6;
        // put the freed weight on the finger joint, replacing the smallest influence
        let mi = 0; for (let k = 1; k < 4; k++) if (wts[v][k] < wts[v][mi]) mi = k;
        jts[v][mi] = best.slot; wts[v][mi] = give;
        const s = wts[v].reduce((a,b) => a+b, 0) || 1;
        for (let k = 0; k < 4; k++) wts[v][k] /= s;
        reweighted++;
      }
    }
  }
  if (!added) return { skip: 'no hand bones to graft onto' };

  // rewrite JOINTS/WEIGHTS, and extend the inverse bind matrices
  for (const pm of prims){
    if (!pm.__j) continue;
    pm.attributes.JOINTS_0 = addAccessor(g, binParts, binLen, pm.__j, 5123, 'VEC4', pm.__j.length);
    pm.attributes.WEIGHTS_0 = addAccessor(g, binParts, binLen, pm.__w, 5126, 'VEC4', pm.__w.length);
    delete pm.__j; delete pm.__w;
  }
  const ibmOld = readAccessor(g, bin, skin.inverseBindMatrices);
  const ibm = ibmOld.slice();
  for (let s = ibmOld.length; s < skin.joints.length; s++){
    const w = worldOf(nodes, par, skin.joints[s]);
    const inv = invert(w) || [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    ibm.push(inv);
  }
  skin.inverseBindMatrices = addAccessor(g, binParts, binLen, ibm, 5126, 'MAT4', ibm.length);
  g.buffers[0].byteLength = binLen.v;

  const out = outFile || file;
  const bytes = writeGLB(out, g, Buffer.concat(binParts));
  return { added, reweighted, joints: skin.joints.length, scale: +scale.toFixed(3), bytes, out };
}

// ── cli ────────────────────────────────────────────────────────────────────────────────────
if (process.argv.includes('--audit')){
  let withF = 0, tot = 0;
  for (const f of fs.readdirSync(MODELS).filter(x => x.endsWith('.glb'))){
    let r; try { r = readGLB(path.join(MODELS, f)); } catch(e){ continue; }
    const g = r.json; if (!g.skins || !g.skins.length) continue;
    tot++;
    const names = g.skins[0].joints.map(i => (g.nodes[i] && g.nodes[i].name) || '');
    const fing = names.filter(n => /thumb|index|middle|ring|pinky/i.test(n)).length;
    if (fing) { withF++; console.log('  ' + f + '  ' + g.skins[0].joints.length + ' joints, ' + fing + ' finger'); }
  }
  console.log(withF + ' of ' + tot + ' skinned rigs have finger bones');
  process.exit(0);
}

const all = process.argv.includes('--all');
const targets = all
  ? fs.readdirSync(MODELS).filter(f => f.endsWith('.glb') && f !== 'xbot.glb').map(f => path.join(MODELS, f))
  : [process.argv[2]].filter(Boolean);
if (!targets.length){ console.error('usage: graft_fingers.cjs <model.glb> [out.glb] | --all | --audit'); process.exit(2); }

let ok = 0, skipped = 0;
for (const t of targets){
  let r;
  try { r = graft(t, all ? null : process.argv[3]); }
  catch(e){ console.log('  FAIL  ' + path.basename(t) + '  ' + String(e.message).slice(0,70)); continue; }
  if (r.skip){ skipped++; if (!all) console.log('  skip  ' + path.basename(t) + '  (' + r.skip + ')'); continue; }
  ok++;
  console.log('  ok    ' + path.basename(t) + '  +' + r.added + ' finger joints (' + r.joints +
              ' total), ' + r.reweighted + ' verts reweighted, hand scale ' + r.scale);
}
console.log(ok + ' grafted, ' + skipped + ' skipped.  GATE EVERY ONE: node tools/model_diag/skinqa.cjs <file>');
