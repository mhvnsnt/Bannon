#!/usr/bin/env node
/* Rename a UniRig-rigged GLB's generic bone_0..bone_N joints to Mixamo-standard names by SKELETON
 * TOPOLOGY, so it binds to the BANNON engine's BONE_MAP (leftarm/leftforearm/leftupleg/spine/neck/…).
 * UniRig outputs a valid humanoid skeleton but names bones bone_N; our retarget needs Mixamo names.
 * Mapping is structural (not index-based): root=Hips; spine chain up to the 3-way branch = Spine chain
 * + Chest; from the branch, the +Y child = Neck->Head, the two side children (by Z sign) = arms
 * (Shoulder->Arm->ForeArm->Hand); the two low children off Hips (by Z sign) = legs (UpLeg->Leg->Foot->Toe).
 * Convention: +Z = LEFT, -Z = RIGHT (matches the engine REST layout).
 * Usage: node rename_bones.cjs <in_unirig.glb> <out.glb>
 */
'use strict';
const fs = require('fs');
const IN = process.argv[2], OUT = process.argv[3];
if (!IN || !OUT) { console.error('usage: rename_bones.cjs <in.glb> <out.glb>'); process.exit(2); }

// ---- read GLB (json chunk + bin chunk) ----
const buf = fs.readFileSync(IN);
if (buf.readUInt32LE(0) !== 0x46546C67) { console.error('not a GLB'); process.exit(2); }
let off = 12, jsonChunk=null, jsonStart=0, jsonLen=0, binChunk=null;
while (off < buf.length) {
  const clen = buf.readUInt32LE(off), ctype = buf.readUInt32LE(off+4);
  if (ctype === 0x4E4F534A) { jsonStart=off+8; jsonLen=clen; jsonChunk = JSON.parse(buf.slice(off+8, off+8+clen).toString('utf8')); }
  else if (ctype === 0x004E4942) { binChunk = buf.slice(off+8, off+8+clen); }
  off += 8 + clen;
}
const j = jsonChunk;
if (!j.skins || !j.skins[0]) { console.error('no skin in GLB'); process.exit(2); }
const joints = j.skins[0].joints;                       // node indices
const jset = new Set(joints);
const parent = {}; (j.nodes||[]).forEach((n,i)=>{ (n.children||[]).forEach(c=>parent[c]=i); });
const childrenJoints = (idx)=> (j.nodes[idx].children||[]).filter(c=>jset.has(c));
const ty = (idx)=> (j.nodes[idx].translation||[0,0,0])[1];
const tz = (idx)=> (j.nodes[idx].translation||[0,0,0])[2];

// root = joint whose parent is not a joint (child of Armature/scene)
let root = joints.find(idx => !jset.has(parent[idx]));
if (root==null) root = joints[0];
const name = {};
name[root] = 'Hips';

// legs = the two children of root with the most-negative Y (down); spine = the remaining up child.
const rootKids = childrenJoints(root).slice().sort((a,b)=>ty(a)-ty(b));
const legKids = rootKids.filter(k=>ty(k) < 0.02);
const spineStart = rootKids.filter(k=>ty(k) >= 0.02).sort((a,b)=>ty(b)-ty(a))[0] || rootKids[rootKids.length-1];

// assign a limb chain of Mixamo names down a single-child spine until it runs out
function chain(startIdx, names){ let idx=startIdx, i=0; while(idx!=null && i<names.length){ name[idx]=names[i++]; const kids=childrenJoints(idx); idx = kids.length===1?kids[0]:null; if(kids.length!==1 && i<names.length){ return {last:idx, kids, stoppedAt:i}; } } return {last:idx, kids:childrenJoints(startIdx), stoppedAt:i}; }

// spine: walk up until a joint with >1 joint-children = the CHEST branch
let s = spineStart, spineNames=['Spine','Spine1','Spine2'], si=0, chest=null;
while (s!=null) {
  const kids = childrenJoints(s);
  if (kids.length >= 3) { chest = s; name[s]='Spine2'; break; }        // 3-way branch (neck + 2 arms)
  name[s] = spineNames[Math.min(si,spineNames.length-1)]; si++;
  if (kids.length === 1) s = kids[0];
  else if (kids.length === 2) { chest = s; break; }                    // fallback: 2-way (arms only)
  else break;
}
if (chest==null) chest = s;

// from chest: +Y child = neck->head; the two |Z|-largest = arms (by Z sign)
const chestKids = childrenJoints(chest);
const neck = chestKids.filter(k=>Math.abs(tz(k))<0.04).sort((a,b)=>ty(b)-ty(a))[0]
          || chestKids.slice().sort((a,b)=>ty(b)-ty(a))[0];
if (neck!=null){ name[neck]='Neck'; const nk=childrenJoints(neck); if(nk[0]!=null) name[nk[0]]='Head'; }
const arms = chestKids.filter(k=>k!==neck).sort((a,b)=>Math.abs(tz(b))-Math.abs(tz(a))).slice(0,2);
arms.forEach(a=>{ const side = tz(a) >= 0 ? 'Left':'Right';
  chain(a, [side+'Shoulder', side+'Arm', side+'ForeArm', side+'Hand']); });

// legs by Z sign
legKids.forEach(l=>{ const side = tz(l) >= 0 ? 'Left':'Right';
  chain(l, [side+'UpLeg', side+'Leg', side+'Foot', side+'ToeBase']); });

// apply names (keep any unnamed bone_N as-is)
let renamed=0;
joints.forEach(idx=>{ if(name[idx]){ j.nodes[idx].name = 'mixamorig:'+name[idx]; renamed++; } });
if (j.nodes[root]) j.nodes[root].name = 'mixamorig:Hips';

// ---- rewrite GLB with corrected chunk lengths + 4-byte alignment ----
let newJson = Buffer.from(JSON.stringify(j), 'utf8');
while (newJson.length % 4 !== 0) newJson = Buffer.concat([newJson, Buffer.from(' ')]);   // pad with spaces
let bin = binChunk || Buffer.alloc(0);
while (bin.length % 4 !== 0) bin = Buffer.concat([bin, Buffer.alloc(1)]);                 // pad with zeros
const total = 12 + 8 + newJson.length + (binChunk!=null ? 8 + bin.length : 0);
const outBuf = Buffer.alloc(total);
let p = 0;
outBuf.writeUInt32LE(0x46546C67, p); p+=4;   // magic glTF
outBuf.writeUInt32LE(2, p); p+=4;            // version 2
outBuf.writeUInt32LE(total, p); p+=4;        // total length
outBuf.writeUInt32LE(newJson.length, p); p+=4; outBuf.writeUInt32LE(0x4E4F534A, p); p+=4; // JSON chunk
newJson.copy(outBuf, p); p += newJson.length;
if (binChunk!=null){ outBuf.writeUInt32LE(bin.length, p); p+=4; outBuf.writeUInt32LE(0x004E4942, p); p+=4; bin.copy(outBuf, p); p+=bin.length; }
fs.writeFileSync(OUT, outBuf);
const mapped = joints.filter(idx=>name[idx]).map(idx=>'mixamorig:'+name[idx]);
console.log('renamed', renamed, 'of', joints.length, 'joints ->', OUT);
console.log('names:', mapped.join(' '));
