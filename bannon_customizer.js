/* ============================================================================
 * bannon_customizer.js — the 7-item character customization suite for BANNON.
 * Phase 2 port of the AshLanev2 Phase 1 suite (PRs #24/#26/#29 + pendant fix
 * a6162b58), adapted to Bannon's engine: plain global script, three.js r128,
 * additive — loads AFTER the engine, touches nothing that exists.
 *
 * The 7 items:
 *  1. Chain pendant orientation fix — ships the 4 FIXED chain GLBs
 *     (assets/customizer/chains/, pendant baked vertical per a6162b58) +
 *     per-rig rotation knob (attach.rotation / rotFix).
 *  2. Masks — 7 mask GLBs (assets/customizer/masks/ + manifest).
 *  3. Gloves / wrist pads / shoes / hoods — limb-lane GLBs + manifests
 *     (assets/customizer/{gloves,wristbands,footwear,hoods}/).
 *  4. Face paint system — raycast-conformed decal mesh overlay (base skin
 *     NEVER written: skin-tone likeness lock is structural), 12 patterns,
 *     3 canon-locked presets, per-fighter verified profiles.
 *  5. Hairstyles — 5 hair GLBs (assets/customizer/hair/ + manifest) with
 *     per-character head fit. (Bannon's procedural applyHair sphere system
 *     is untouched — this is the GLB-attachment lane for banked models.)
 *  6. Eye color customization — dedicated iris-material clone + procedural
 *     iris texture. Models without a dedicated iris material report
 *     unsupported honestly; skin is never tinted.
 *  7. Full in-menu customizer — "Customize a fighter" hub tile in the main
 *     menu's CREATION SUITE, live zoomable 3D preview on the REAL roster
 *     GLBs, per-fighter saved builds, one-click apply into fights.
 *
 * MERGE MAP (what existed vs what this adds — see docs/CUSTOMIZER.md):
 *  - CharacterForge.ts Attire: EXTENDED with optional suite fields (no dupe).
 *  - window.BANNON_DNA capture/apply: carries the customizer build in the
 *    recipe (2 surgical lines in index.html, additive).
 *  - window.ATTIRE / bannon_attire_defaults.js: untouched (non-canon GLB
 *    defaults; the suite stores per-fighter builds separately).
 *  - window.applyAttire / window.applyHair (procedural body): untouched.
 *  - window.__boneOf / __buildBoneNorm (rig-hardening lane): REUSED for
 *    accessory bone resolution (this module does not reimplement it).
 *  - _bindFighterGltf: wrapped (repo-conventional monkeypatch) to apply
 *    saved builds to fight models after bind. Original behavior preserved.
 * ========================================================================== */
(function () {
'use strict';
if (window.BANNON_CUSTOMIZER && window.BANNON_CUSTOMIZER._v1) return;
if (typeof THREE === 'undefined') { console.warn('[customizer] THREE missing — suite inactive'); return; }

/* ---------------- utils ---------------- */
function clone(o){ try{ return (typeof structuredClone==='function') ? structuredClone(o) : JSON.parse(JSON.stringify(o)); }catch(e){ return JSON.parse(JSON.stringify(o)); } }
function hex(n){ var s=(n>>>0).toString(16); while(s.length<6) s='0'+s; return '#'+s; }
function intH(s){ return parseInt(String(s).replace('#',''),16); }
function assetBase(){
  // Same CDN-fallback discipline as loadFighterModel: relative asset URLs work
  // next to the repo AND in a downloaded single-file context.
  return '';
}
function cdnBase(){ return window.MODEL_CDN_BASE || 'https://raw.githubusercontent.com/mhvnsnt/Bannon/main/'; }
function withCdn(url){
  if(/^(https?:|idb:|embedded:|blob:|data:)/.test(url)) return url;
  return cdnBase()+url;
}

/* ---------------- 7. schema ---------------- */
var ACCESSORY_SLOTS = ['hair','facialHair','mask','hood','chain','gloves','wristbands','shoes'];
var SLOT_LABELS = { hair:'Hair', facialHair:'Facial hair', mask:'Mask', hood:'Hood', chain:'Chain', gloves:'Gloves', wristbands:'Wristbands', shoes:'Shoes' };
var MORPH_KEYS = ['muscle','height','build','jaw'];
var DEFAULT_MORPHS = { muscle:0.5, height:0.5, build:0.5, jaw:0.5 };

function defaultBuild(fighterId, attireId){
  var acc = {};
  ACCESSORY_SLOTS.forEach(function(s){ acc[s]=null; });
  return { fighterId:fighterId, attireId:attireId||'', eyeColor:'natural',
    morphs:{ muscle:0.5, height:0.5, build:0.5, jaw:0.5 }, accessories:acc, facePaint:null };
}
function sanitizeBuild(raw, fighterId){
  var base = defaultBuild(fighterId||'', '');
  if(!raw || typeof raw!=='object') return base;
  var b = clone(base);
  for(var k in raw){ if(k==='morphs'||k==='accessories'||k==='fighterId') continue; b[k]=raw[k]; }
  b.fighterId = fighterId || raw.fighterId || '';
  if(raw.morphs) MORPH_KEYS.forEach(function(mk){ var v=+raw.morphs[mk]; if(isFinite(v)) b.morphs[mk]=Math.max(0,Math.min(1,v)); });
  if(raw.accessories) ACCESSORY_SLOTS.forEach(function(s){ b.accessories[s] = (typeof raw.accessories[s]==='string') ? raw.accessories[s] : null; });
  return b;
}

/* ---------------- persistence (localStorage; Bannon convention) ---------------- */
var SCHEMA_VERSION = 1;
var STORE_KEY = 'bannon:customizer:builds';
var BACKUP_KEY = 'bannon:customizer:builds:backup';
function _read(key){ try{ var r=localStorage.getItem(key); return r?JSON.parse(r):null; }catch(e){ return null; } }
function _write(key,v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){} }
function loadAllBuilds(){
  try{
    var env=_read(STORE_KEY);
    if(!env || typeof env.schemaVersion!=='number') return {};
    if(env.schemaVersion>SCHEMA_VERSION) return {}; // newer — don't corrupt
    var out={};
    for(var id in (env.data||{})) out[id]=sanitizeBuild(env.data[id], id);
    return out;
  }catch(e){ return {}; }
}
/** Sync read — used by the DNA capture path and the fight-side hook. Never throws. */
function loadBuildSync(fighterId){
  if(!fighterId) return null;
  var all=loadAllBuilds();
  return all[String(fighterId).toLowerCase()]||null;
}
function saveBuild(build){
  var all=loadAllBuilds();
  var prev=_read(STORE_KEY);
  if(prev) _write(BACKUP_KEY, prev);
  all[String(build.fighterId).toLowerCase()]=clone(build);
  _write(STORE_KEY, { schemaVersion:SCHEMA_VERSION, updatedAt:Date.now(), data:all });
}
function deleteBuild(fighterId){
  var all=loadAllBuilds();
  var k=String(fighterId).toLowerCase();
  if(!(k in all)) return;
  var prev=_read(STORE_KEY);
  if(prev) _write(BACKUP_KEY, prev);
  delete all[k];
  _write(STORE_KEY, { schemaVersion:SCHEMA_VERSION, updatedAt:Date.now(), data:all });
}
function exportBuildsFile(){
  var all=loadAllBuilds();
  var blob=new Blob([JSON.stringify({exportedAt:Date.now(), builds:all},null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='bannon-customizer-builds.json';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },500);
}

/* ---------------- 6. eye colors ----------------
 * Material-based iris recolor. findIrisMaterials() locates materials whose
 * name matches /iris/ (falling back to meshes or nodes named like iris,
 * pupil or eyeball); each is CLONED once (authored original kept pristine)
 * is CLONED once (authored original kept pristine) and given a procedurally
 * generated 256px iris texture (limbal ring + radial striations + pupil).
 * Models without a dedicated iris material -> supported=false, palette
 * disabled with an honest note. SKIN IS NEVER TOUCHED.
 * (Ported from AshLanev2 customizer/eye-colors.ts; r128: .encoding not .colorSpace.)
 */
var EYE_COLOR_PALETTE = [
  { id:'natural',   label:'Natural',    hex:'#000000' }, // sentinel: keep authored
  { id:'brown',     label:'Brown',      hex:'#4a2c14' },
  { id:'darkbrown', label:'Dark Brown', hex:'#241408' },
  { id:'black',     label:'Black',      hex:'#0a0a0a' },
  { id:'hazel',     label:'Hazel',      hex:'#7a5a1e' },
  { id:'amber',     label:'Amber',      hex:'#c07f1a' },
  { id:'green',     label:'Green',      hex:'#3d7a3a' },
  { id:'blue',      label:'Blue',       hex:'#3a6ea5' },
  { id:'iceblue',   label:'Ice Blue',   hex:'#9fd4e8' },
  { id:'gray',      label:'Gray',       hex:'#8a8f94' },
  { id:'violet',    label:'Violet',     hex:'#6a4a9e' },
  { id:'red',       label:'Blood Red',  hex:'#a02020' }
];
var IRIS_MATERIAL_RE = /iris/i;
var IRIS_NODE_RE = /iris|pupil|eyeball/i;
var IRIS_APPLIED_KEY = '__bczIrisApplied';

function _isStdMat(m){ return !!m && m.isMeshStandardMaterial===true; }
function findIrisMaterials(root){
  var found=[], seen=[];
  root.traverse(function(o){
    if(!o.isMesh) return;
    var mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(function(mat){
      if(!mat || seen.indexOf(mat)>=0) return;
      var byMat = IRIS_MATERIAL_RE.test(mat.name||'');
      var byNode = IRIS_NODE_RE.test(o.name||'');
      if((byMat||byNode) && _isStdMat(mat)){ seen.push(mat); found.push(mat); }
    });
  });
  return found;
}
function supportsEyeColor(root){ return findIrisMaterials(root).length>0; }

var _irisTexCache = {};
function makeIrisTexture(hexStr){
  var size=256, canvas=document.createElement('canvas');
  canvas.width=size; canvas.height=size;
  var ctx=canvas.getContext('2d');
  var c=new THREE.Color(hexStr);
  var g=ctx.createRadialGradient(size/2,size/2,size*0.08,size/2,size/2,size/2);
  var light=c.clone().offsetHSL(0,-0.05,0.22), dark=c.clone().offsetHSL(0,0.05,-0.18);
  g.addColorStop(0,'#'+light.getHexString());
  g.addColorStop(0.55,'#'+c.getHexString());
  g.addColorStop(0.82,'#'+dark.getHexString());
  g.addColorStop(1,'#050505');
  ctx.fillStyle=g; ctx.fillRect(0,0,size,size);
  var cx=size/2, cy=size/2, i, a, r0, r1, shade;
  for(i=0;i<220;i++){
    a=(i/220)*Math.PI*2+Math.sin(i*12.9898)*0.05;
    r0=size*(0.1+0.04*Math.abs(Math.sin(i*78.233)));
    r1=size*(0.4+0.06*Math.abs(Math.sin(i*39.425)));
    shade=Math.sin(i*37.719)>0?0:1;
    ctx.strokeStyle=shade?'rgba(0,0,0,0.35)':'rgba(255,255,255,0.16)';
    ctx.lineWidth=1+(i%3===0?1:0);
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*r0, cy+Math.sin(a)*r0);
    ctx.lineTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1);
    ctx.stroke();
  }
  ctx.fillStyle='#000';
  ctx.beginPath(); ctx.arc(cx,cy,size*0.085,0,Math.PI*2); ctx.fill();
  var tex=new THREE.CanvasTexture(canvas);
  tex.encoding=THREE.sRGBEncoding; // r128 (newer three: .colorSpace)
  tex.anisotropy=4;
  return tex;
}
function applyEyeColor(root, eyeColorId){
  if(eyeColorId==='natural'){ resetEyeColor(root); return true; }
  var pal=null;
  EYE_COLOR_PALETTE.forEach(function(e){ if(e.id===eyeColorId) pal=e; });
  if(!pal) return false;
  var mats=findIrisMaterials(root);
  if(mats.length===0) return false;
  var tex=_irisTexCache[pal.hex] || (_irisTexCache[pal.hex]=makeIrisTexture(pal.hex));
  mats.forEach(function(mat){
    var rec=mat[IRIS_APPLIED_KEY], target;
    if(rec && rec.clone){ target=rec.clone; }
    else{
      target=mat.clone();
      target.name=(mat.name||'iris')+'__bcz';
      target[IRIS_APPLIED_KEY]={ original:mat };
      mat[IRIS_APPLIED_KEY]={ clone:target };
      root.traverse(function(o){
        if(!o.isMesh) return;
        if(o.material===mat) o.material=target;
        else if(Array.isArray(o.material)) o.material=o.material.map(function(m){ return m===mat?target:m; });
      });
    }
    target.map=tex;
    target.color.set('#ffffff');
    target.roughness=0.25;
    target.needsUpdate=true;
  });
  return true;
}
function resetEyeColor(root){
  root.traverse(function(o){
    if(!o.isMesh) return;
    var mats=Array.isArray(o.material)?o.material:[o.material];
    var restored=mats.map(function(m){ var r=m&&m[IRIS_APPLIED_KEY]; return (r&&r.original)?r.original:m; });
    o.material=Array.isArray(o.material)?restored:restored[0];
  });
  root.traverse(function(o){
    if(!o.isMesh) return;
    (Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){ if(m) delete m[IRIS_APPLIED_KEY]; });
  });
}

/* ---------------- 7b. morphs ----------------
 * Procedural bone-scale morphs (the cast GLBs ship zero morph targets).
 * Dials map to case-insensitive bone-name PATTERNS (bone names vary per rig).
 * Base scales snapshotted per model root; every apply resets to base first
 * (idempotent, never stacks). supportedMorphs() gates the UI honestly.
 * (Ported from AshLanev2 customizer/morphs.ts.)
 */
var MORPH_BASE_KEY='__bczMorphBase';
var MORPH_DEFS=[
  { key:'muscle', label:'Muscle', hint:'Arm, chest and thigh girth.',
    bones:[ {pattern:/upperarm/i,axes:['x','z']}, {pattern:/forearm/i,axes:['x','z']},
            {pattern:/upleg|thigh/i,axes:['x','z']}, {pattern:/spine2|chest/i,axes:['x','z']},
            {pattern:/shoulder/i,axes:['x','z']} ], at0:0.88, at1:1.14 },
  { key:'height', label:'Height', hint:'Leg length. The preview re-grounds the feet after scaling.',
    bones:[ {pattern:/upleg|thigh/i,axes:['y']}, {pattern:/([^p]|^)leg|shin|calf/i,axes:['y']} ], at0:0.92, at1:1.10 },
  { key:'build', label:'Build', hint:'Hip and shoulder width.',
    bones:[ {pattern:/hips|pelvis/i,axes:['x','z']}, {pattern:/spine1/i,axes:['x','z']},
            {pattern:/spine(?!1|2)|waist/i,axes:['x','z']} ], at0:0.90, at1:1.12 },
  { key:'jaw', label:'Jaw', hint:'Jaw width / face fullness.',
    bones:[ {pattern:/jaw/i,axes:['x','z']} ], at0:0.85, at1:1.18 }
];
function _morphBase(root){
  var base=root.userData[MORPH_BASE_KEY];
  if(!base){
    base=[];
    root.traverse(function(o){ if(o.isBone) base.push([o, o.scale.clone()]); });
    root.userData[MORPH_BASE_KEY]=base;
  }
  return base;
}
function resetMorphs(root){
  var base=root.userData[MORPH_BASE_KEY];
  if(!base) return;
  base.forEach(function(pair){ pair[0].scale.copy(pair[1]); });
}
function _lerp(a,b,t){ return a+(b-a)*t; }
function applyMorphs(root, values, skipReground){
  var base=_morphBase(root);
  resetMorphs(root);
  MORPH_DEFS.forEach(function(def){
    var v=values[def.key];
    if(v===0.5 || v==null) return;
    var s=_lerp(def.at0, def.at1, v), matched=[];
    def.bones.forEach(function(bd){
      base.forEach(function(pair){
        var bone=pair[0];
        if(matched.indexOf(bone)>=0) return;
        if(!bd.pattern.test(bone.name)) return;
        matched.push(bone);
        var bs=pair[1];
        if(bd.axes.indexOf('x')>=0) bone.scale.x=bs.x*s;
        if(bd.axes.indexOf('y')>=0) bone.scale.y=bs.y*s;
        if(bd.axes.indexOf('z')>=0) bone.scale.z=bs.z*s;
      });
    });
  });
  if(!skipReground) reground(root);
}
/** Shift the root so the lowest point sits at y=0 (preview only — the fight
 *  engine owns fighter placement, so fight-side apply skips this). */
function reground(root){
  root.updateMatrixWorld(true);
  var box=new THREE.Box3().setFromObject(root);
  if(!isFinite(box.min.y)) return;
  root.position.y-=box.min.y;
}
function supportedMorphs(root){
  var names=[];
  root.traverse(function(o){ if(o.isBone) names.push(o.name); });
  return MORPH_DEFS.filter(function(def){
    return def.bones.some(function(bd){ return names.some(function(n){ return bd.pattern.test(n); }); });
  }).map(function(d){ return d.key; });
}

/* ---------------- accessories (items 1,2,3,5) ----------------
 * Slots driven by lane manifests (one manifest.json per assets/customizer/ category),
 * fetched+merged at runtime — no code change when a lane ships new assets.
 * Two manifest shapes normalized (chains = shape A, merged lanes = shape B);
 * L/R pairs (gloves/wristbands/footwear) group into one selection.
 * Rigged accessories REBIND onto the fighter's bones by name; non-skinned
 * ones hang from the manifest's attach bone. Per-character head fit
 * (HEAD_FIT) scales ASTRID-authored head assets onto Tripo-rigged heads.
 * Bone resolution REUSES the rig-hardening lane's window.__boneOf when the
 * root carries userData.boneByName (fight-bound models); the preview builds
 * that index too, with a local fallback.
 * (Ported from AshLanev2 customizer/accessories.ts.)
 */
var MANIFEST_SOURCES=[
  { url:'assets/customizer/chains/manifest.json',     slot:'chain' },
  { url:'assets/customizer/hair/manifest.json',       slot:'hair' },
  { url:'assets/customizer/masks/manifest.json',      slot:'mask' },
  { url:'assets/customizer/hoods/manifest.json',      slot:'hood' },
  { url:'assets/customizer/gloves/manifest.json',     slot:'gloves' },
  { url:'assets/customizer/wristbands/manifest.json', slot:'wristbands' },
  { url:'assets/customizer/footwear/manifest.json',   slot:'shoes' }
];
var SLOT_BONE_FALLBACK={
  hair:[/head/i], facialHair:[/head/i,/jaw/i], mask:[/head/i], hood:[/head/i,/neck/i],
  chain:[/neck/i,/spine2/i,/chest/i], gloves:[/hand/i],
  wristbands:[/forearm/i,/wrist/i,/hand/i], shoes:[/foot/i,/toe/i]
};
var REGISTRY_KEY='__bczAccessories';
var HEAD_SLOTS={ hair:1, facialHair:1, mask:1, hood:1 };
/* Per-character head fit — MEASURED on Bannon's banked GLBs 2026-10-09
 * (head-bone world height vs the ASTRID authoring ref 1.5232m):
 *   hollow/echo/static/onyx/bannon/cain_elias/stick_up: 0.6793m -> 0.4460
 *   cipher: 0.8164m -> 0.5360
 * The ECHO nudge is carried from the AshLanev2 measurement (nose rel. head
 * bone outlier); Bannon's ECHO.glb is a different build — VERIFY VISUALLY,
 * tune rotFix/offset here if the fringe/mask sits off. rotFix (deg XYZ) is
 * the per-character rest-pose orientation knob (Tripo heads share a rotated
 * head-bone rest orientation vs ASTRID's axis-aligned one). */
var HEAD_FIT={
  hollow:    { scale:0.4460 },
  echo:      { scale:0.4460, offset:[0,-0.1288,-0.0602] },
  static:    { scale:0.4460 },
  onyx:      { scale:0.4460 },
  bannon:    { scale:0.4460 },
  cain_elias:{ scale:0.4460 },
  stick_up:  { scale:0.4460 },
  cipher:    { scale:0.5360 }
};
/* Per-(fighter,slot) rotation corrections (degrees, XYZ) ADDED to the manifest
 * attach.rotation. Needed when an accessory was authored for a different
 * bone-facing convention than the fighter's rig. Verified case: Bannon's
 * banked GLBs have meshes facing +X while their bones' +Z is world +Z
 * (AshLanev2's ASTRID has bone-+Z = mesh facing, which is what the chain and
 * mask GLBs were authored for) — so forward-jutting accessories (chain
 * pendant, mask front) need +90° about Y to land on the mesh's facing.
 * Values here are RENDER-VERIFIED per fighter; do not guess new ones. */
var SLOT_ROTFIX={
};
function headFit(fighterId, slot){
  var none={ scale:1, offset:[0,0,0], rotFix:[0,0,0] };
  if(!fighterId) return none;
  var f=HEAD_FIT[String(fighterId).toLowerCase()]||{};
  var sr=(SLOT_ROTFIX[String(fighterId).toLowerCase()]||{})[slot]||[0,0,0];
  var rf=f.rotFix||[0,0,0];
  if(!HEAD_SLOTS[slot]) return { scale:1, offset:[0,0,0], rotFix:sr };
  return { scale:f.scale||1, offset:f.offset||[0,0,0],
           rotFix:[rf[0]+sr[0], rf[1]+sr[1], rf[2]+sr[2]] };
}
function fighterOf(root){ return root.userData && root.userData.fighterId; }
function registry(root){
  var reg=root.userData[REGISTRY_KEY];
  if(!reg){ reg={}; root.userData[REGISTRY_KEY]=reg; }
  return reg;
}
var manifestCache=null;
function humanizeAsset(asset){
  return String(asset).replace(/^((mask|hair|hood|chain|glove|shoe|boot|sneaker|wrap|sweatband|pad)[-_])/,'')
    .split(/[-_]/).map(function(w){ return w?w[0].toUpperCase()+w.slice(1):w; }).join(' ');
}
function normalizeEntry(entry, fallbackSlot){
  var file=String(entry.file||'');
  if(!file) return null;
  var notes=entry.canonNotes||'';
  var canon=/\bcanon\b/i.test(notes) && !/no canon/i.test(notes);
  if(entry.id && entry.attach){
    var a=entry.attach;
    return { id:entry.id, label:entry.label||entry.id, slot:entry.slot||fallbackSlot, file:file,
      canon:canon||undefined, canonNotes:entry.canonNotes,
      attach:{ bone:a.bone||'Neck', position:a.position||[0,0,0], rotation:a.rotation||[0,0,0], scale:a.scale } };
  }
  if(entry.asset){
    return { id:entry.asset, label:humanizeAsset(entry.asset), slot:fallbackSlot, file:file,
      canon:canon||undefined, canonNotes:entry.canonNotes,
      attach:{ bone:entry.attachBone||'mixamorig:Head', position:entry.offset||[0,0,0], rotation:[0,0,0], scale:(entry.scale==null?1:entry.scale) } };
  }
  return null;
}
function loadAccessoryManifests(){
  if(manifestCache) return Promise.resolve(manifestCache);
  var jobs=MANIFEST_SOURCES.map(function(src){
    return fetch(assetBase()+src.url).then(function(res){
      if(!res.ok) return [];
      return res.json().then(function(json){
        var out=[];
        if(Array.isArray(json)){
          var groups={};
          json.forEach(function(e){ var k=e.asset||e.id||''; (groups[k]=groups[k]||[]).push(e); });
          Object.keys(groups).forEach(function(k){
            var m=normalizeEntry(groups[k][0], src.slot);
            if(!m) return;
            var extras=groups[k].slice(1).map(function(e){ return String(e.file||''); }).filter(Boolean);
            if(extras.length) m.pairFiles=extras;
            out.push(m);
          });
        }else{
          (json.accessories||[]).forEach(function(e){ var m=normalizeEntry(e, src.slot); if(m) out.push(m); });
        }
        return out;
      });
    }).catch(function(){ return []; });
  });
  return Promise.all(jobs).then(function(lists){
    var out=[];
    lists.forEach(function(l){ out=out.concat(l); });
    manifestCache=out;
    return out;
  });
}
function manifestsForSlot(manifests, slot){ return manifests.filter(function(m){ return m.slot===slot; }); }

/** Normalize a bone name for fuzzy matching (safe ordering: the mixamorig
 *  strip runs BEFORE the single-letter strip, so "rightarm" never loses its r). */
function normBone(name){
  return String(name||'').replace(/^mixamorig:/,'').replace(/^mixamorig/,'')
    .replace(/^[jhnf]_/,'').toLowerCase().replace(/[^a-z0-9]/g,'');
}
/** Build the engine's boneByName index on a preview root so window.__boneOf works. */
function indexBones(root){
  if(root.userData.boneByName) return;
  var bones={};
  root.traverse(function(o){ if(o.isBone) bones[String(o.name).toLowerCase()]=o; });
  root.userData.boneByName=bones;
}
/** Best bone for an accessory: engine resolver -> exact -> fuzzy -> slot heuristic. */
function findBone(root, want, slot){
  if(typeof window.__boneOf==='function'){
    try{ indexBones(root); var hb=window.__boneOf(root, want); if(hb) return hb; }catch(e){}
  }
  var bones=[];
  root.traverse(function(o){ if(o.isBone) bones.push(o); });
  var i, b;
  for(i=0;i<bones.length;i++) if(bones[i].name===want) return bones[i];
  var w=String(want).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  var wre=new RegExp(w,'i');
  for(i=0;i<bones.length;i++) if(wre.test(bones[i].name)) return bones[i];
  var nwant=normBone(want);
  for(i=0;i<bones.length;i++) if(normBone(bones[i].name)===nwant) return bones[i];
  var fallbacks=SLOT_BONE_FALLBACK[slot]||[];
  for(var f=0;f<fallbacks.length;f++) for(i=0;i<bones.length;i++) if(fallbacks[f].test(bones[i].name)) return bones[i];
  return bones[0]||null;
}
/** Rebind an accessory's skinned meshes onto the fighter's bones by name
 *  (exact, then normalized-fuzzy). Returns rebound meshes; [] = hang fallback. */
function rebindAccessoryBones(root, node){
  var bodyBones={}, fuzzy={};
  root.traverse(function(o){
    if(!o.isBone) return;
    bodyBones[o.name]=o;
    var n=normBone(o.name);
    if(!fuzzy[n]) fuzzy[n]=o;
  });
  var have=false; for(var k in bodyBones){ have=true; break; }
  if(!have) return [];
  var rebound=[];
  node.traverse(function(o){
    if(!o.isSkinnedMesh || !o.skeleton) return;
    var src=o.skeleton, remapped=[], inverses=[], i, target;
    for(i=0;i<src.bones.length;i++){
      var nm=src.bones[i].name;
      target=bodyBones[nm]||fuzzy[normBone(nm)];
      if(!target) return; // incomplete bind — fall back to bone-hang
    }
    for(i=0;i<src.bones.length;i++){
      nm=src.bones[i].name;
      target=bodyBones[nm]||fuzzy[normBone(nm)];
      remapped.push(target);
      inverses.push(src.boneInverses[i].clone());
    }
    o.skeleton=new THREE.Skeleton(remapped, inverses);
    rebound.push(o);
  });
  return rebound;
}
var _accLoader=null;
function accLoader(){ if(!_accLoader) _accLoader=_withDecoder(new THREE.GLTFLoader()); return _accLoader; }
function loadAccGLB(file){
  var url=file;
  return new Promise(function(resolve){
    accLoader().load(url, function(gltf){ resolve(gltf); }, undefined, function(){
      // CDN fallback mirrors loadFighterModel's discipline
      if(url.indexOf(cdnBase())!==0 && !/^(https?:|blob:|data:)/.test(url)){
        accLoader().load(withCdn(url), function(gltf){ resolve(gltf); }, undefined, function(){ resolve(null); });
      }else resolve(null);
    });
  });
}
function attachSingle(root, manifest, file, fit){
  return loadAccGLB(file).then(function(gltf){
    if(!gltf) return null;
    var node=gltf.scene;
    node.traverse(function(o){ o.frustumCulled=true; });
    var frx=fit.rotFix[0], fry=fit.rotFix[1], frz=fit.rotFix[2];
    var rebound=rebindAccessoryBones(root, node);
    if(rebound.length>0){
      // Skinned to the fighter now. Exact rebind math (see AshLanev2
      // customizer/accessories.ts): verts land at S(s)·I·B^-1 with the holder's
      // rigid rotation (pendant tuning knob + Tripo rest-pose fix) and position
      // (ECHO nudge) riding inside B = mesh.matrixWorld at bind time.
      var s=(manifest.attach.scale==null?1:manifest.attach.scale)*fit.scale;
      var holder=new THREE.Group();
      holder.name='accessory:'+manifest.id;
      var r=manifest.attach.rotation;
      holder.rotation.set((r[0]+frx)*Math.PI/180,(r[1]+fry)*Math.PI/180,(r[2]+frz)*Math.PI/180);
      holder.position.set(fit.offset[0],fit.offset[1],fit.offset[2]);
      rebound.forEach(function(mesh){ holder.add(mesh); });
      root.add(holder);
      root.updateMatrixWorld(true);
      var S=new THREE.Matrix4().makeScale(s,s,s);
      // The holder's rigid rotation must ALSO ride into the bind inverses.
      // three.js renders rebound verts at W·I'·B·v with I'=S·I·B^-1, so the
      // holder transform (B) cancels out of the final placement — without
      // this R the manifest attach.rotation knob would be dead for skinned
      // accessories. R rotates the accessory in the fighter-bone's frame,
      // which is what corrects authoring-facing mismatches (e.g. a chain
      // authored for bone-+Z-forward on a rig whose mesh faces bone-+X).
      var R=new THREE.Matrix4().makeRotationFromEuler(holder.rotation);
      rebound.forEach(function(mesh){
        // Skinned verts are posed by the fighter's bones, but the geometry
        // bounding sphere still sits at the accessory's authored location —
        // frustum culling would wrongly cull the mesh. Standard fix: disable.
        mesh.frustumCulled=false;
        var Binv=mesh.matrixWorld.clone().invert();
        var inv=mesh.skeleton.boneInverses;
        for(var i=0;i<inv.length;i++) inv[i]=R.clone().multiply(S).multiply(inv[i]).multiply(Binv);
      });
      rebound.forEach(function(mesh){ mesh.bind(mesh.skeleton, mesh.matrixWorld); });
      return holder;
    }
    var bone=findBone(root, manifest.attach.bone, manifest.slot);
    if(!bone) return null;
    var p=manifest.attach.position, rt=manifest.attach.rotation;
    node.position.set(p[0]+fit.offset[0], p[1]+fit.offset[1], p[2]+fit.offset[2]);
    node.rotation.set((rt[0]+frx)*Math.PI/180,(rt[1]+fry)*Math.PI/180,(rt[2]+frz)*Math.PI/180);
    node.scale.setScalar((manifest.attach.scale==null?1:manifest.attach.scale)*fit.scale);
    bone.add(node);
    return node;
  });
}
/** Attach a manifest to the model root (replaces the slot). pairFiles attach as one selection. */
function attachAccessory(root, manifest){
  detachAccessory(root, manifest.slot);
  var fit=headFit(fighterOf(root), manifest.slot);
  var files=[manifest.file].concat(manifest.pairFiles||[]);
  var jobs=files.map(function(f){ return attachSingle(root, manifest, f, fit).catch(function(){ return null; }); });
  return Promise.all(jobs).then(function(nodes){
    nodes=nodes.filter(Boolean);
    if(!nodes.length) return null;
    registry(root)[manifest.slot]={ id:manifest.id, nodes:nodes };
    return nodes[0];
  });
}
function detachAccessory(root, slot){
  var reg=registry(root), e=reg[slot];
  if(!e) return;
  e.nodes.forEach(function(n){ if(n.parent) n.parent.remove(n); });
  delete reg[slot];
}
function detachAllAccessories(root){
  var reg=registry(root);
  Object.keys(reg).forEach(function(s){ detachAccessory(root, s); });
}
function accessoryInSlot(root, slot){
  var e=registry(root)[slot];
  return e?e.id:null;
}

/* ---------------- 4. face paint ----------------
 * Paint lives on a DECAL mesh: a raycast-conformed grid (28x30) projected
 * onto the face surface (+2mm offset), rigidly weighted to the head bone,
 * carrying its own CanvasTexture. The character's base mesh / material /
 * texture are NEVER written — the skin-tone likeness lock is structural.
 * 6 regions (data below), 12 patterns, canon colors, 3 canon-locked presets,
 * per-fighter verified profiles (availability is honest: unverified fighters
 * get a note, never fake paint).
 * (Ported from AshLanev2 game3d/customization/facepaint/*; r128: .encoding.)
 */
var FACE_REGIONS=[
  { id:'forehead', label:'Forehead', hint:'Band across the forehead',
    shapes:[{kind:'ellipse',cx:0.5,cy:0.15,rx:0.33,ry:0.12,feather:0.25}] },
  { id:'eyes', label:'Eyes', hint:'Both eye areas',
    shapes:[{kind:'ellipse',cx:0.31,cy:0.37,rx:0.13,ry:0.085,feather:0.3},
            {kind:'ellipse',cx:0.69,cy:0.37,rx:0.13,ry:0.085,feather:0.3}] },
  { id:'cheeks', label:'Cheeks', hint:'Both cheek areas',
    shapes:[{kind:'ellipse',cx:0.25,cy:0.6,rx:0.14,ry:0.12,feather:0.35},
            {kind:'ellipse',cx:0.75,cy:0.6,rx:0.14,ry:0.12,feather:0.35}] },
  { id:'nose', label:'Nose', hint:'Nose bridge and tip',
    shapes:[{kind:'ellipse',cx:0.5,cy:0.52,rx:0.085,ry:0.12,feather:0.3}] },
  { id:'mouthChin', label:'Mouth / Chin', hint:'Mouth, smile lines and chin',
    shapes:[{kind:'ellipse',cx:0.5,cy:0.76,rx:0.2,ry:0.13,feather:0.3}] },
  { id:'fullFace', label:'Full face', hint:'Entire face plate',
    shapes:[{kind:'ellipse',cx:0.5,cy:0.5,rx:0.42,ry:0.46,feather:0.3}] }
];
function getRegion(id){ for(var i=0;i<FACE_REGIONS.length;i++) if(FACE_REGIONS[i].id===id) return FACE_REGIONS[i]; throw new Error('Unknown face region: '+id); }
var FACE_PATTERNS=[
  { id:'base-soft',   label:'Full base',    file:'assets/customizer/facepaint/base-soft.png',   hint:'Solid paint base with a hand-painted mottle' },
  { id:'grin',        label:'Grin',         file:'assets/customizer/facepaint/grin.png',        hint:'Wide clown grin with hooked ends' },
  { id:'eye-sockets', label:'Eye sockets',  file:'assets/customizer/facepaint/eye-sockets.png', hint:'Hollow dark eye sockets' },
  { id:'eye-band',    label:'Eye band',     file:'assets/customizer/facepaint/eye-band.png',    hint:'Straight band across the eyes (chola style)' },
  { id:'stitches',    label:'Stitches',     file:'assets/customizer/facepaint/stitches.png',    hint:'Sutured X stitches' },
  { id:'skull-nose',  label:'Skull nose',   file:'assets/customizer/facepaint/skull-nose.png',  hint:'Inverted-triangle skull nose' },
  { id:'cracks',      label:'Paint cracks', file:'assets/customizer/facepaint/cracks.png',      hint:'Cracked-paint lines — pair with erase blend to chip down to skin' },
  { id:'teardrop',    label:'Teardrop',     file:'assets/customizer/facepaint/teardrop.png',    hint:'Single teardrop under the left eye' },
  { id:'stripes',     label:'War stripes',  file:'assets/customizer/facepaint/stripes.png',     hint:'Three vertical war-paint stripes' },
  { id:'brow-slash',  label:'Brow slash',   file:'assets/customizer/facepaint/brow-slash.png',  hint:'Diagonal slash across the forehead' },
  { id:'jaw-shade',   label:'Jaw shade',    file:'assets/customizer/facepaint/jaw-shade.png',   hint:'Soft shading over jaw and chin' },
  { id:'dots',        label:'Dot row',      file:'assets/customizer/facepaint/dots.png',        hint:'Row of dots across the forehead' }
];
var PAINT_COLORS=[
  { hex:'#f2ede2', label:'Clown white', canon:true }, { hex:'#161513', label:'Paint black', canon:true },
  { hex:'#e7ddc8', label:'Bone', canon:true },        { hex:'#a31621', label:'Blood red', canon:true },
  { hex:'#ffffff', label:'Pure white' }, { hex:'#c8c2b4', label:'Ash grey' }, { hex:'#5a5f6a', label:'Slate' },
  { hex:'#0b0b0c', label:'Void black' }, { hex:'#7a1f1f', label:'Dried blood' }, { hex:'#d94848', label:'Bright red' },
  { hex:'#e08a3c', label:'Ember orange' }, { hex:'#e8c33c', label:'Gold' }, { hex:'#3c6e3c', label:'Moss green' },
  { hex:'#39d353', label:'Toxic green' }, { hex:'#2c4a7a', label:'Deep blue' }, { hex:'#4cc3e8', label:'Ice blue' },
  { hex:'#6a3c8a', label:'Purple' }, { hex:'#c33c8a', label:'Magenta' }
];
/* Canon presets — owner-locked looks. Do not restyle; custom paint is built
 * from the same layers via the picker, never by editing these. */
var _CW='#f2ede2', _PB='#161513', _BO='#e7ddc8', _BL='#a31621';
var CANON_PRESETS=[
  { id:'cipher-grin', label:'Cipher — Grinning paint', characterId:'cipher', canonLocked:true,
    description:'Canon Cipher: white base, hollow black eye sockets, black skull nose, wide black grin. Lio Rush 2026 Blackheart reference.',
    layers:[
      { region:'fullFace', pattern:'base-soft', color:_CW, opacity:0.96 },
      { region:'eyes', pattern:'eye-sockets', color:_PB, opacity:0.92 },
      { region:'nose', pattern:'skull-nose', color:_PB, opacity:0.88 },
      { region:'mouthChin', pattern:'grin', color:_PB, opacity:0.95 } ] },
  { id:'onyx-clown', label:'Onyx — Street clown paint', characterId:'onyx', canonLocked:true,
    description:'Canon Onyx street look: FULL white clown base, black chola eye band, black grin, cracked to show dark skin beneath. Skin-tone lock: base texture untouched.',
    layers:[
      { region:'fullFace', pattern:'base-soft', color:_CW, opacity:0.97 },
      { region:'eyes', pattern:'eye-band', color:_PB, opacity:0.9 },
      { region:'eyes', pattern:'eye-sockets', color:_PB, opacity:0.85 },
      { region:'nose', pattern:'skull-nose', color:_PB, opacity:0.8 },
      { region:'mouthChin', pattern:'grin', color:_PB, opacity:0.92 },
      { region:'cheeks', pattern:'cracks', color:'#000000', opacity:0.55, blend:'erase' },
      { region:'forehead', pattern:'cracks', color:'#000000', opacity:0.35, blend:'erase' } ] },
  { id:'echo-stitched', label:'Echo — Stitched skull paint', characterId:'echo', canonLocked:true,
    description:'Canon Echo: bone-white base, hollow black sockets, skull nose, sutured stitched mouth + cheek stitches. Shotzi Blackheart reference.',
    layers:[
      { region:'fullFace', pattern:'base-soft', color:_BO, opacity:0.92 },
      { region:'eyes', pattern:'eye-sockets', color:_PB, opacity:0.95 },
      { region:'nose', pattern:'skull-nose', color:_PB, opacity:0.9 },
      { region:'mouthChin', pattern:'stitches', color:_PB, opacity:0.95 },
      { region:'cheeks', pattern:'stitches', color:_BL, opacity:0.65 } ] }
];
function getPreset(id){ for(var i=0;i<CANON_PRESETS.length;i++) if(CANON_PRESETS[i].id===id) return CANON_PRESETS[i]; throw new Error('Unknown face-paint preset: '+id); }
function clonePresetLayers(p){ return clone(p.layers); }
/* Per-character paint profiles. faceDir = facing direction in the character
 * mesh's LOCAL space (bind pose). Bannon's GLBs are DIFFERENT BUILDS from
 * AshLanev2's (verified by hash 2026-10-09), so the AshLanev2-verified
 * faceDirs are carried as STARTING VALUES with verified:false — paint stays
 * honestly gated until the Blender face-direction QC confirms each one. */
var FACE_PAINT_PROFILES=[
  { characterId:'cipher', label:'Cipher', faceDir:[1,0,0], verified:true,
    notes:'VERIFIED 2026-10-09 on Bannon assets/models/CIPHER_rigged.glb: +X render shows the face front-on, -X the back of the head (three.js headless renders, relief probe agreed: 210.7mm).' },
  { characterId:'onyx', label:'Onyx', faceDir:[1,0,0], verified:true,
    notes:'VERIFIED 2026-10-09 on Bannon assets/models/ONYX_skinned.glb: +X render shows the full clown-painted face; -X the hooded back of the head. NOTE: the base texture already bakes the canon clown paint — the onyx-clown preset reproduces it as a decal (harmless overpaint); custom layers still need the decal. AshLanev2 value was -X on THEIR different ONYX_street.glb build — corrected here.' },
  { characterId:'echo', label:'Echo', faceDir:[1,0,0], verified:true,
    notes:'VERIFIED 2026-10-09 on Bannon assets/models/ECHO.glb: +X render shows the full stitched face; -X the back of the green hair. NOTE: base texture already bakes the canon stitched paint (same overpaint note as Onyx). AshLanev2 value [0.954,0,0.299] was pending confirmation on their build — corrected to +X here.' }
];
function getProfile(fighterId){
  fighterId=String(fighterId||'').toLowerCase();
  for(var i=0;i<FACE_PAINT_PROFILES.length;i++) if(FACE_PAINT_PROFILES[i].characterId===fighterId) return FACE_PAINT_PROFILES[i];
  return null;
}
function facePaintAvailable(fighterId){ var p=getProfile(fighterId); return !!(p && p.verified); }
function getPickerData(){
  return {
    regions: FACE_REGIONS.map(function(r){ return {id:r.id,label:r.label,hint:r.hint}; }),
    patterns: FACE_PATTERNS.map(function(p){ return {id:p.id,label:p.label,hint:p.hint,file:p.file}; }),
    colors: PAINT_COLORS,
    presets: CANON_PRESETS.map(function(p){ return {id:p.id,label:p.label,characterId:p.characterId,description:p.description,canonLocked:p.canonLocked}; })
  };
}
var _HEX_RE=/^#[0-9a-fA-F]{6}$/;
function validateLayers(layers){
  var errors=[], known={};
  FACE_PATTERNS.forEach(function(p){ known[p.id]=1; });
  var regions={}; FACE_REGIONS.forEach(function(r){ regions[r.id]=1; });
  layers.forEach(function(l,i){
    var tag='layer '+i;
    if(!regions[l.region]) errors.push(tag+': unknown region "'+l.region+'"');
    if(!known[l.pattern]) errors.push(tag+': unknown pattern "'+l.pattern+'"');
    if(!_HEX_RE.test(l.color||'')) errors.push(tag+': color must be #rrggbb, got "'+l.color+'"');
    if(!(l.opacity>=0&&l.opacity<=1)) errors.push(tag+': opacity must be 0..1');
    if(l.blend && l.blend!=='paint' && l.blend!=='erase') errors.push(tag+': bad blend "'+l.blend+'"');
  });
  return errors;
}
function serializeLayers(layers){ return JSON.stringify(layers); }
function parseLayers(s){
  var layers=JSON.parse(s);
  if(!Array.isArray(layers)) throw new Error('Face-paint data is not a layer array');
  var errors=validateLayers(layers);
  if(errors.length) throw new Error('Invalid face-paint layers: '+errors.join('; '));
  return layers;
}

/* FacePaintPainter — renders a layer stack onto a 2D canvas in decal-UV space. */
function FacePaintPainter(size){
  this.size=size||1024;
  var S=this.size;
  this.canvas=document.createElement('canvas'); this.canvas.width=S; this.canvas.height=S;
  this._mask=document.createElement('canvas'); this._mask.width=S; this._mask.height=S;
  this._tint=document.createElement('canvas'); this._tint.width=S; this._tint.height=S;
  this._cache={};
  this.clear();
}
FacePaintPainter.prototype.clear=function(){
  this.canvas.getContext('2d').clearRect(0,0,this.size,this.size);
};
FacePaintPainter.prototype._loadPattern=function(file){
  var self=this, key=file;
  if(self._cache[key]) return Promise.resolve(self._cache[key]);
  return new Promise(function(resolve,reject){
    var img=new Image();
    img.onload=function(){ self._cache[key]=img; resolve(img); };
    img.onerror=function(){ reject(new Error('Failed to load face-paint pattern: '+key)); };
    img.src=assetBase()+file;
  });
};
FacePaintPainter.prototype.paint=function(layers, patternDefs){
  var self=this;
  self.clear();
  var chain=Promise.resolve();
  layers.forEach(function(layer){
    chain=chain.then(function(){
      var def=null;
      patternDefs.forEach(function(p){ if(p.id===layer.pattern) def=p; });
      if(!def) throw new Error('Unknown face-paint pattern: '+layer.pattern);
      return self._loadPattern(def.file).then(function(img){ self._drawLayer(layer,img); });
    });
  });
  return chain.then(function(){ return self.canvas; });
};
FacePaintPainter.prototype._drawLayer=function(layer, patternImg){
  var S=this.size, region=getRegion(layer.region);
  var fx=function(x){ return x*S; }, fy=function(y){ return y*S; };
  var mctx=this._mask.getContext('2d');
  mctx.clearRect(0,0,S,S); mctx.fillStyle='#fff';
  region.shapes.forEach(function(s){
    var cx=fx(s.cx), cy=fy(s.cy), rx=s.rx*S, ry=s.ry*S;
    var featherPx=Math.max(1,(s.feather==null?0.25:s.feather)*Math.min(rx,ry));
    mctx.save();
    try{ mctx.filter='blur('+featherPx.toFixed(1)+'px)'; }catch(e){}
    mctx.beginPath();
    if(s.kind==='ellipse') mctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
    else mctx.rect(cx-rx,cy-ry,rx*2,ry*2);
    mctx.fill(); mctx.restore();
  });
  var tctx=this._tint.getContext('2d');
  tctx.clearRect(0,0,S,S);
  var scale=layer.scale==null?1:layer.scale;
  var dw=S*scale, dh=S*scale;
  var sprite=document.createElement('canvas');
  sprite.width=Math.max(1,Math.round(dw)); sprite.height=Math.max(1,Math.round(dh));
  var sctx=sprite.getContext('2d');
  sctx.fillStyle=layer.color; sctx.fillRect(0,0,sprite.width,sprite.height);
  sctx.globalCompositeOperation='destination-in';
  sctx.drawImage(patternImg,0,0,sprite.width,sprite.height);
  tctx.save();
  tctx.translate(S/2+(layer.dx||0)*S, S/2+(layer.dy||0)*S);
  if(layer.rotation) tctx.rotate(layer.rotation);
  tctx.globalAlpha=Math.max(0,Math.min(1,layer.opacity));
  tctx.drawImage(sprite,-dw/2,-dh/2,dw,dh);
  tctx.restore();
  tctx.save();
  tctx.globalCompositeOperation='destination-in';
  tctx.drawImage(this._mask,0,0);
  tctx.restore();
  var pctx=this.canvas.getContext('2d');
  pctx.save();
  pctx.globalCompositeOperation=(layer.blend==='erase')?'destination-out':'source-over';
  pctx.drawImage(this._tint,0,0);
  pctx.restore();
};

/* FacePaintDecal — raycast-conformed grid decal bound to the head bone. */
var _DECAL_GRID_NX=28, _DECAL_GRID_NY=30, _FACE_W=0.19, _FACE_H=0.20, _SURFACE_OFFSET=0.002;
function buildFacePaintDecal(skinned, profile, painterSize){
  var src=skinned.geometry;
  if(!skinned.skeleton) throw new Error('FacePaintDecal needs a SkinnedMesh with a skeleton');
  if(!src.attributes.normal) throw new Error('FacePaintDecal needs normal attribute');
  skinned.updateMatrixWorld(true);
  var bones=skinned.skeleton.bones, headIdx=-1, i;
  for(i=0;i<bones.length;i++){ var bn=bones[i].name||''; if(/head/i.test(bn)&&!/end|tip|top/i.test(bn)){ headIdx=i; break; } }
  if(headIdx<0) throw new Error('FacePaintDecal: no head bone found');
  var fLocal=new THREE.Vector3(profile.faceDir[0],profile.faceDir[1],profile.faceDir[2]).normalize();
  var fWorld=fLocal.clone().transformDirection(skinned.matrixWorld).normalize();
  var upHint=new THREE.Vector3(0,1,0);
  var upW=upHint.clone().sub(fWorld.clone().multiplyScalar(upHint.dot(fWorld))).normalize();
  var rightW=new THREE.Vector3().crossVectors(upW,fWorld).normalize();
  var headBone=bones[headIdx];
  var headWorld=new THREE.Vector3(); headBone.getWorldPosition(headWorld);
  var faceCenter=headWorld.clone().addScaledVector(fWorld,0.085).addScaledVector(upW,-0.06);
  // head-region subset for raycast perf
  var headBox=new THREE.Box3().setFromObject(skinned);
  var hb=new THREE.Vector3(); headBone.getWorldPosition(hb);
  headBox.min.set(hb.x-0.16,hb.y-0.20,hb.z-0.16); headBox.max.set(hb.x+0.16,hb.y+0.16,hb.z+0.16);
  var inv=skinned.matrixWorld.clone().invert();
  headBox.min.applyMatrix4(inv); headBox.max.applyMatrix4(inv);
  var idx=src.getIndex(), p=src.attributes.position, n=src.attributes.normal;
  var keepTris=[], tA=new THREE.Vector3(), tB=new THREE.Vector3(), tC=new THREE.Vector3();
  function triN(t,k){ return idx?idx.getX(t*3+k):t*3+k; }
  var nTris=(((idx?idx.count:p.count)/3)|0), t, k, v;
  for(t=0;t<nTris;t++){
    tA.set(p.getX(triN(t,0)),p.getY(triN(t,0)),p.getZ(triN(t,0)));
    tB.set(p.getX(triN(t,1)),p.getY(triN(t,1)),p.getZ(triN(t,1)));
    tC.set(p.getX(triN(t,2)),p.getY(triN(t,2)),p.getZ(triN(t,2)));
    if(headBox.containsPoint(tA)||headBox.containsPoint(tB)||headBox.containsPoint(tC)) keepTris.push(t);
  }
  var sp=new Float32Array(keepTris.length*9), sn=new Float32Array(keepTris.length*9);
  keepTris.forEach(function(tt,ii){ for(k=0;k<3;k++){ v=triN(tt,k); sp[(ii*3+k)*3]=p.getX(v); sp[(ii*3+k)*3+1]=p.getY(v); sp[(ii*3+k)*3+2]=p.getZ(v); sn[(ii*3+k)*3]=n.getX(v); sn[(ii*3+k)*3+1]=n.getY(v); sn[(ii*3+k)*3+2]=n.getZ(v); } });
  var subGeo=new THREE.BufferGeometry();
  subGeo.setAttribute('position', new THREE.BufferAttribute(sp,3));
  subGeo.setAttribute('normal', new THREE.BufferAttribute(sn,3));
  var proxy=new THREE.Mesh(subGeo, new THREE.MeshBasicMaterial());
  proxy.applyMatrix4(skinned.matrixWorld); proxy.updateMatrixWorld(true);
  var raycaster=new THREE.Raycaster(); raycaster.far=0.5;
  var rayDir=fWorld.clone().negate(), origin=new THREE.Vector3();
  var dPos=[], dUV=[], dIdx=[], valid=[], iy, ix;
  for(iy=0;iy<_DECAL_GRID_NY;iy++){ valid[iy]=[];
    for(ix=0;ix<_DECAL_GRID_NX;ix++){
      var ox=(ix/(_DECAL_GRID_NX-1)-0.5)*_FACE_W, oy=(0.5-iy/(_DECAL_GRID_NY-1))*_FACE_H;
      origin.copy(faceCenter).addScaledVector(rightW,ox).addScaledVector(upW,oy).addScaledVector(fWorld,0.25);
      raycaster.set(origin, rayDir);
      var hits=raycaster.intersectObject(proxy,false);
      if(hits.length>0&&hits[0].face){
        var hp=skinned.worldToLocal(hits[0].point.clone());
        var ln=hits[0].face.normal.clone().transformDirection(proxy.matrixWorld.clone().invert());
        dPos.push(hp.x+ln.x*_SURFACE_OFFSET, hp.y+ln.y*_SURFACE_OFFSET, hp.z+ln.z*_SURFACE_OFFSET);
        dUV.push(ox,oy); valid[iy][ix]=true;
      }else{ dPos.push(0,0,0); dUV.push(0,0); valid[iy][ix]=false; }
    }
  }
  var ux0=Infinity,ux1=-Infinity,uy0=Infinity,uy1=-Infinity;
  for(iy=0;iy<_DECAL_GRID_NY;iy++) for(ix=0;ix<_DECAL_GRID_NX;ix++){
    if(!valid[iy][ix]) continue;
    var u=dUV[(iy*_DECAL_GRID_NX+ix)*2], vv=dUV[(iy*_DECAL_GRID_NX+ix)*2+1];
    if(u<ux0)ux0=u; if(u>ux1)ux1=u; if(vv<uy0)uy0=vv; if(vv>uy1)uy1=vv;
  }
  for(iy=0;iy<_DECAL_GRID_NY;iy++) for(ix=0;ix<_DECAL_GRID_NX;ix++){
    var o=(iy*_DECAL_GRID_NX+ix)*2;
    dUV[o]=(dUV[o]-ux0)/Math.max(1e-6,ux1-ux0);
    dUV[o+1]=1-(dUV[o+1]-uy0)/Math.max(1e-6,uy1-uy0);
  }
  for(iy=0;iy<_DECAL_GRID_NY-1;iy++) for(ix=0;ix<_DECAL_GRID_NX-1;ix++){
    var a=iy*_DECAL_GRID_NX+ix, b=a+1, c=a+_DECAL_GRID_NX, d=c+1;
    if(valid[iy][ix]&&valid[iy][ix+1]&&valid[iy+1][ix]) dIdx.push(a,b,c);
    if(valid[iy][ix+1]&&valid[iy+1][ix+1]&&valid[iy+1][ix]) dIdx.push(b,d,c);
  }
  subGeo.dispose();
  if(!dIdx.length) throw new Error('FacePaintDecal: no valid face grid for '+profile.characterId);
  var geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(dPos,3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(dUV,2));
  var nVerts=dPos.length/3, si=new Float32Array(nVerts*4), sw=new Float32Array(nVerts*4);
  for(i=0;i<nVerts;i++){ si[i*4]=headIdx; sw[i*4]=1; }
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si,4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw,4));
  geo.setIndex(dIdx); geo.computeVertexNormals();
  var painter=new FacePaintPainter(painterSize||1024);
  var texture=new THREE.CanvasTexture(painter.canvas);
  texture.encoding=THREE.sRGBEncoding; texture.anisotropy=4;
  var material=new THREE.MeshStandardMaterial({ map:texture, transparent:true, roughness:0.62,
    metalness:0.0, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 });
  var mesh=new THREE.SkinnedMesh(geo, material);
  mesh.name='facepaint-decal-'+profile.characterId;
  mesh.renderOrder=2; mesh.frustumCulled=false;
  skinned.add(mesh);
  mesh.bind(skinned.skeleton, skinned.bindMatrix);
  // SwiftShader/real-GPU compositing: the paint lane ships depthWrite:false;
  // verified invisible under some compositors — force true (AshLanev2 lane-ui note).
  material.depthWrite=true;
  return {
    mesh:mesh, material:material, texture:texture, painter:painter,
    setVisible:function(vis){ mesh.visible=vis; },
    clearPaint:function(){ painter.clear(); texture.needsUpdate=true; },
    dispose:function(){ skinned.remove(mesh); geo.dispose(); material.dispose(); texture.dispose(); }
  };
}
/* adapter (build-string <-> layers, per-root decal lifecycle) */
var DECAL_KEY='__bczFacePaintDecal';
function _decalEntry(root){ return root.userData[DECAL_KEY]||null; }
function resolveFacePaintLayers(spec){
  try{ return { layers:clonePresetLayers(getPreset(spec)), errors:[] }; }catch(e){}
  try{ return { layers:parseLayers(spec), errors:[] }; }
  catch(e2){ return { layers:[], errors:[String((e2&&e2.message)||e2)] }; }
}
function _findBodyMesh(root){
  var found=null;
  root.traverse(function(o){ if(!found&&o.isSkinnedMesh) found=o; });
  return found;
}
function ensureFacePaintDecal(root, fighterId){
  var profile=getProfile(fighterId);
  if(!profile||!profile.verified) return Promise.resolve(null);
  var ex=_decalEntry(root);
  if(ex&&ex.fighterId===String(fighterId).toLowerCase()) return Promise.resolve(ex.decal);
  if(ex) ex.decal.dispose();
  var mesh=_findBodyMesh(root);
  if(!mesh) return Promise.resolve(null);
  var decal;
  try{ decal=buildFacePaintDecal(mesh, profile); }
  catch(e){ return Promise.resolve(null); }
  root.userData[DECAL_KEY]={ decal:decal, fighterId:String(fighterId).toLowerCase() };
  return Promise.resolve(decal);
}
function applyFacePaintSpec(root, fighterId, spec){
  var rl=resolveFacePaintLayers(spec);
  if(rl.errors.length) return Promise.resolve(rl.errors);
  var verrs=validateLayers(rl.layers);
  if(verrs.length) return Promise.resolve(verrs);
  return ensureFacePaintDecal(root, fighterId).then(function(decal){
    if(!decal) return ["Face paint isn't available for this fighter yet."];
    return decal.painter.paint(rl.layers, FACE_PATTERNS).then(function(){
      decal.texture.needsUpdate=true;
      decal.setVisible(true);
      return [];
    });
  }).catch(function(e){ return [String((e&&e.message)||e)]; });
}
function clearFacePaint(root){ var e=_decalEntry(root); if(e) e.decal.setVisible(false); }
function disposeFacePaint(root){ var e=_decalEntry(root); if(e){ e.decal.dispose(); delete root.userData[DECAL_KEY]; } }

/* ---------------- 7. live preview ----------------
 * Standalone renderer (separate from the game mount): loads the ACTUAL
 * roster fighter GLB (charModelFor -> assets/models/*.glb, CDN fallback),
 * stages it under studio lighting, drag-orbit / wheel-pinch zoom,
 * double-click reset, idle turntable, first authored clip or breathing sway.
 * (Ported from AshLanev2 customizer/preview.ts; r128 APIs.)
 */
var _previewLoader=null, _glbCache={};
/** Banked character GLBs use EXT_meshopt_compression — the r128 GLTFLoader
 *  needs the (vendored, MIT) decoder or it throws and the model never loads. */
function _withDecoder(loader){
  try{ if(typeof MeshoptDecoder!=='undefined'&&loader.setMeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder); }catch(e){}
  return loader;
}
function previewLoader(){ if(!_previewLoader) _previewLoader=_withDecoder(new THREE.GLTFLoader()); return _previewLoader; }
function loadGLB(url){
  return new Promise(function(resolve,reject){
    previewLoader().load(url, function(gltf){ resolve(gltf); }, undefined, function(e1){
      if(url.indexOf(cdnBase())!==0 && !/^(https?:|idb:|embedded:|blob:|data:)/.test(url)){
        previewLoader().load(withCdn(url), function(gltf){ resolve(gltf); }, undefined, function(e2){ reject(e2||new Error('load failed')); });
      }else reject(e1||new Error('load failed'));
    });
  });
}
function CustomizerPreview(canvas){
  this.canvas=canvas;
  this.renderer=new THREE.WebGLRenderer({ canvas:canvas, antialias:true, preserveDrawingBuffer:true });
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  this.renderer.outputEncoding=THREE.sRGBEncoding;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.1;
  this.scene=new THREE.Scene();
  this.scene.background=new THREE.Color(0x0a0910);
  this.scene.fog=new THREE.Fog(0x0a0910,6,14);
  this.camera=new THREE.PerspectiveCamera(38,1,0.1,60);
  var key=new THREE.DirectionalLight(0xfff1dd,1.15);
  key.position.set(2.2,3.4,2.6);
  var rim=new THREE.DirectionalLight(0x7aa2ff,0.75);
  rim.position.set(-2.6,2.2,-2.4);
  var fill=new THREE.HemisphereLight(0x8a7f9e,0x0b0a12,0.55);
  this.scene.add(key); this.scene.add(rim); this.scene.add(fill);
  var ground=new THREE.Mesh(new THREE.CircleGeometry(3.2,48), new THREE.ShadowMaterial({opacity:0.45}));
  ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; this.scene.add(ground);
  key.castShadow=true; key.shadow.mapSize.set(1024,1024);
  this.modelRoot=null; this.mixer=null; this.modelFile=null;
  this.build=defaultBuild('','');
  this.yaw=0.35; this.pitch=0.08; this.distance=3.2; this.targetDistance=3.2;
  this.focusHeight=null; this.lastInteract=performance.now();
  this.disposed=false; this.applyToken=0;
  this.manifests=null;
  this.status={ loading:false, error:null, modelName:null };
  this.onStatus=function(){};
  this.clock=new THREE.Clock();
  this._wireInput(canvas);
  this._resize();
  var self=this;
  if(typeof ResizeObserver!=='undefined'){
    this._resizeObs=new ResizeObserver(function(){ self._resize(); });
    this._resizeObs.observe(canvas);
  }
  var loop=function(){
    if(self.disposed) return;
    requestAnimationFrame(loop);
    var dt=Math.min(self.clock.getDelta(),0.05);
    if(performance.now()-self.lastInteract>4000) self.yaw+=dt*0.25;
    self.distance+=(self.targetDistance-self.distance)*Math.min(dt*8,1);
    if(self.mixer) self.mixer.update(dt);
    var targetY=self.modelRoot?self._modelHeight()*(self.focusHeight==null?0.52:self.focusHeight):0.9;
    var cx=Math.sin(self.yaw)*Math.cos(self.pitch)*self.distance;
    var cz=Math.cos(self.yaw)*Math.cos(self.pitch)*self.distance;
    var cy=targetY+Math.sin(self.pitch)*self.distance;
    self.camera.position.set(cx,cy,cz);
    self.camera.lookAt(0,targetY,0);
    self.renderer.render(self.scene,self.camera);
  };
  loop();
}
CustomizerPreview.prototype._setStatus=function(patch){
  for(var k in patch) this.status[k]=patch[k];
  this.onStatus(this.status);
};
CustomizerPreview.prototype._resize=function(){
  var w=this.canvas.clientWidth||1, h=this.canvas.clientHeight||1;
  this.renderer.setSize(w,h,false);
  this.camera.aspect=w/h; this.camera.updateProjectionMatrix();
};
CustomizerPreview.prototype._modelHeight=function(){
  if(!this.modelRoot) return 1.7;
  var box=new THREE.Box3().setFromObject(this.modelRoot);
  return isFinite(box.max.y)?(box.max.y-box.min.y):1.7;
};
CustomizerPreview.prototype._wireInput=function(canvas){
  var self=this, pointers={}, pinchStart=0, pinchDist=0;
  canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',function(e){
    pointers[e.pointerId]={x:e.clientX,y:e.clientY};
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    var ks=Object.keys(pointers);
    if(ks.length===2){
      var a=pointers[ks[0]], b=pointers[ks[1]];
      pinchStart=self.targetDistance;
      pinchDist=Math.hypot(a.x-b.x,a.y-b.y);
    }
    self.lastInteract=performance.now();
  });
  canvas.addEventListener('pointermove',function(e){
    var p=pointers[e.pointerId]; if(!p) return;
    var dx=e.clientX-p.x, dy=e.clientY-p.y;
    p.x=e.clientX; p.y=e.clientY;
    var ks=Object.keys(pointers);
    if(ks.length===1){
      self.yaw-=dx*0.008;
      self.pitch=Math.max(-0.15,Math.min(0.9,self.pitch+dy*0.006));
    }else if(ks.length===2){
      var a=pointers[ks[0]], b=pointers[ks[1]];
      var d=Math.hypot(a.x-b.x,a.y-b.y);
      if(pinchDist>0) self.targetDistance=Math.max(1.4,Math.min(7,pinchStart*(pinchDist/Math.max(d,1))));
    }
    self.lastInteract=performance.now();
  });
  function up(e){ delete pointers[e.pointerId]; self.lastInteract=performance.now(); }
  canvas.addEventListener('pointerup',up);
  canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',function(e){
    e.preventDefault();
    self.targetDistance=Math.max(1.4,Math.min(7,self.targetDistance*(1+(e.deltaY>0?1:-1)*0.12)));
    self.lastInteract=performance.now();
  },{passive:false});
  canvas.addEventListener('dblclick',function(){
    self.yaw=0.35; self.pitch=0.08; self._centerModel(); self.lastInteract=performance.now();
  });
};
CustomizerPreview.prototype._centerModel=function(){
  var root=this.modelRoot; if(!root) return;
  root.position.set(0,0,0); root.rotation.set(0,0,0);
  root.updateMatrixWorld(true);
  var box=new THREE.Box3().setFromObject(root);
  if(!isFinite(box.min.y)) return;
  root.position.y-=box.min.y;
  var height=box.max.y-box.min.y;
  this.targetDistance=Math.max(2.2,Math.min(5.2,height*1.9));
  this.distance=this.targetDistance;
};
CustomizerPreview.prototype.setZoom=function(d){
  this.targetDistance=Math.max(1.4,Math.min(7,d)); this.lastInteract=performance.now();
};
CustomizerPreview.prototype.setFocusHeight=function(f){ this.focusHeight=f; this.lastInteract=performance.now(); };
CustomizerPreview.prototype.loadFighter=function(fighterId, modelUrl){
  var self=this, token=++self.applyToken;
  self._setStatus({loading:true,error:null,modelName:modelUrl});
  function cached(url){ return _glbCache[url]; }
  var p=cached(modelUrl)?Promise.resolve(cached(modelUrl)):loadGLB(modelUrl).then(function(gltf){
    _glbCache[modelUrl]={ scene:gltf.scene, clips:gltf.animations||[] };
    return _glbCache[modelUrl];
  });
  return p.then(function(entry){
    if(token!==self.applyToken||self.disposed) return;
    if(self.modelRoot){
      disposeFacePaint(self.modelRoot);
      self.scene.remove(self.modelRoot);
      if(self.mixer){ self.mixer.stopAllAction(); self.mixer=null; }
    }
    var root=entry.scene.clone(true);
    root.userData.fighterId=String(fighterId).toLowerCase();
    indexBones(root);
    root.traverse(function(o){ if(o.isMesh){ o.castShadow=true; o.frustumCulled=true; } });
    self.modelRoot=root; self.modelFile=modelUrl;
    self.scene.add(root);
    var clips=entry.clips||[], idleClip=null;
    if(clips.length){
      self.mixer=new THREE.AnimationMixer(root);
      for(var i=0;i<clips.length;i++){ if(/idle|breath|stand/i.test(clips[i].name)){ idleClip=clips[i]; break; } }
      if(!idleClip) idleClip=clips[0];
    }
    self._centerModel();
    return self.applyBuild(self.build.fighterId===String(fighterId).toLowerCase()?self.build:defaultBuild(String(fighterId).toLowerCase(),'')).then(function(){
      if(token!==self.applyToken||self.disposed) return;
      // decal binds in bind pose (paint contract) — start the idle clip AFTER applyBuild
      if(self.mixer&&idleClip) self.mixer.clipAction(idleClip).play();
      self._setStatus({loading:false,error:null,modelName:modelUrl});
    });
  }).catch(function(e){
    if(token!==self.applyToken||self.disposed) return;
    self._setStatus({loading:false,error:'Could not load model',modelName:null});
  });
};
/** Apply a full build to the live preview root. Order: morphs -> eyes ->
 *  accessories -> face paint. Idempotent per section. */
CustomizerPreview.prototype.applyBuild=function(build){
  var self=this, token=++self.applyToken;
  self.build=clone(build);
  var root=self.modelRoot;
  if(!root) return Promise.resolve();
  resetMorphs(root);
  applyMorphs(root, self.build.morphs);
  applyEyeColor(root, self.build.eyeColor);
  detachAllAccessories(root);
  function withManifests(m){
    if(token!==self.applyToken||self.disposed) return Promise.resolve();
    var jobs=[];
    ACCESSORY_SLOTS.forEach(function(slot){
      var id=self.build.accessories[slot];
      if(!id) return;
      var mf=null;
      m.forEach(function(x){ if(x.id===id) mf=x; });
      if(mf) jobs.push(attachAccessory(root, mf).catch(function(){ return null; }));
    });
    return Promise.all(jobs).then(function(){
      if(token!==self.applyToken||self.disposed) return;
      clearFacePaint(root);
      var paint=self.build.facePaint;
      if(paint&&facePaintAvailable(self.build.fighterId)){
        return applyFacePaintSpec(root, self.build.fighterId, paint).then(function(errs){
          if(errs&&errs.length) console.warn('[customizer] face paint:', errs.join('; '));
        }).catch(function(e){ console.warn('[customizer] face paint:', String((e&&e.message)||e)); });
      }
    });
  }
  if(self.manifests) return withManifests(self.manifests);
  return loadAccessoryManifests().then(function(m){ self.manifests=m; return withManifests(m); });
};
CustomizerPreview.prototype.setEyeColor=function(id){ this.build.eyeColor=id; if(this.modelRoot) applyEyeColor(this.modelRoot,id); };
CustomizerPreview.prototype.setMorphs=function(v){ this.build.morphs=clone(v); if(this.modelRoot){ resetMorphs(this.modelRoot); applyMorphs(this.modelRoot,v); } };
CustomizerPreview.prototype.setFacePaint=function(spec){
  var self=this; self.build.facePaint=spec;
  var root=self.modelRoot; if(!root) return Promise.resolve();
  if(!spec||!facePaintAvailable(self.build.fighterId)){ clearFacePaint(root); return Promise.resolve(); }
  return applyFacePaintSpec(root, self.build.fighterId, spec).catch(function(e){ console.warn('[customizer] face paint:', String((e&&e.message)||e)); });
};
CustomizerPreview.prototype.setAccessory=function(slot, manifestId){
  var self=this, root=self.modelRoot;
  self.build.accessories[slot]=manifestId;
  if(!root) return Promise.resolve();
  function go(m){
    detachAccessory(root, slot);
    if(!manifestId) return Promise.resolve();
    var mf=null; m.forEach(function(x){ if(x.id===manifestId) mf=x; });
    if(!mf) return Promise.resolve();
    return attachAccessory(root, mf).catch(function(){ return null; });
  }
  if(self.manifests) return go(self.manifests);
  return loadAccessoryManifests().then(function(m){ self.manifests=m; return go(m); });
};
CustomizerPreview.prototype.capturePNG=function(){
  this.renderer.render(this.scene,this.camera);
  return this.canvas.toDataURL('image/png');
};
CustomizerPreview.prototype.dispose=function(){
  this.disposed=true;
  if(this._resizeObs) this._resizeObs.disconnect();
  if(this.modelRoot){ disposeFacePaint(this.modelRoot); this.scene.remove(this.modelRoot); }
  this.renderer.dispose();
};

/* ---------------- build application (shared by preview + fight-side) ---------------- */
function applyBuildToRoot(root, build, fighterId, forFight){
  fighterId=String(fighterId||build.fighterId||'').toLowerCase();
  root.userData.fighterId=fighterId;
  indexBones(root);
  resetMorphs(root);
  applyMorphs(root, build.morphs||DEFAULT_MORPHS, !!forFight); // fight: skip reground (engine owns placement)
  applyEyeColor(root, build.eyeColor||'natural');
  detachAllAccessories(root);
  return loadAccessoryManifests().then(function(manifests){
    var jobs=[];
    ACCESSORY_SLOTS.forEach(function(slot){
      var id=build.accessories&&build.accessories[slot];
      if(!id) return;
      var mf=null; manifests.forEach(function(x){ if(x.id===id) mf=x; });
      if(mf) jobs.push(attachAccessory(root, mf).catch(function(){ return null; }));
    });
    return Promise.all(jobs);
  }).then(function(){
    clearFacePaint(root);
    var paint=build.facePaint;
    if(paint&&facePaintAvailable(fighterId)){
      return applyFacePaintSpec(root, fighterId, paint).catch(function(){ return null; });
    }
  }).catch(function(e){ console.warn('[customizer] applyBuildToRoot:', String((e&&e.message)||e)); });
}

/* ---------------- fight-side hook ----------------
 * Wraps _bindFighterGltf (repo-conventional monkeypatch): after the engine
 * binds a GLB, applies the fighter's saved customizer build (or the DNA
 * recipe's stashed build) to the bound model. Additive — original behavior
 * preserved; every step guarded. */
function hookFightBind(){
  if(typeof window._bindFighterGltf!=='function'||hookFightBind._done) return;
  var orig=window._bindFighterGltf;
  window._bindFighterGltf=function(side,url,name,gltf,reqFighter,reqId){
    var r=orig.apply(this,arguments);
    try{
      var f=reqFighter||(typeof fighterFor==='function'?fighterFor(side):null);
      if(f&&f.model){
        var key=null;
        try{ key=(typeof charModelKey==='function')?charModelKey(f):null; }
        catch(e){}
        if(!key&&f.opts&&f.opts.name) key=String(f.opts.name).toUpperCase().replace(/[^A-Z0-9]/g,'_');
        var build=key?loadBuildSync(key):null;
        if(!build&&f._customBuild) build=sanitizeBuild(f._customBuild, key||'');
        if(build) applyBuildToRoot(f.model, build, (key||'').toLowerCase(), true);
      }
    }catch(e){ console.warn('[customizer] fight-side apply:', String((e&&e.message)||e)); }
    return r;
  };
  hookFightBind._done=true;
}

/* ---------------- 7. in-menu UI ---------------- */
function customizableFighters(){
  var defs=window.CHAR_MODEL_DEFAULTS||{}, meta=window.CHAR_META||{};
  var out=[];
  Object.keys(defs).forEach(function(key){
    var m=meta[key]||{};
    out.push({ id:key.toLowerCase(), key:key, name:key.replace(/_/g,' '),
      label:m.label||key.replace(/_/g,' '), canon:!!m.canon,
      faction:m.faction||'', skin:m.skin, url:defs[key]&&defs[key].url });
  });
  out.sort(function(a,b){ return (b.canon-a.canon)||(a.name<b.name?-1:1); });
  return out;
}
function modelUrlFor(fighterId){
  var key=String(fighterId).toUpperCase(), m=null;
  try{ if(typeof charModelFor==='function') m=charModelFor(key); }catch(e){}
  if(m&&m.url) return m.url;
  if(window.CHAR_MODEL_DEFAULTS&&window.CHAR_MODEL_DEFAULTS[key]) return window.CHAR_MODEL_DEFAULTS[key].url;
  return null;
}

var _ui=null; // {panel, canvas, preview, fighterId, build, manifests, paintData, ...}
function _el(tag, css, text){
  var e=document.createElement(tag);
  if(css) e.style.cssText=css;
  if(text!=null) e.textContent=text;
  return e;
}
var _CSS='font-family:monospace;';
function _sec(title){
  var d=_el('div','margin:12px 0;padding:10px 12px;background:#10141c;border:1px solid #2a3340;border-radius:10px;');
  var h=_el('div','font:bold 12px '+_CSS+'color:#d4af37;letter-spacing:2px;margin-bottom:8px;',title);
  d.appendChild(h); return d;
}
function _note(t){
  return _el('div','font:11px '+_CSS+'color:#8a93a3;margin:6px 0;',t);
}
function _btn(t, css){
  var b=_el('button','padding:7px 12px;border-radius:7px;border:1px solid #3a4556;background:#1a2130;color:#dfe6f2;cursor:pointer;font:bold 11px '+_CSS+';'+(css||''),t);
  return b;
}

function buildPanel(){
  if(_ui&&_ui.panel) return _ui;
  var panel=_el('div','');
  panel.id='bczPanel'; panel.className='menu-overlay hidden';
  var inner=_el('div','max-width:1020px;width:96%;max-height:94vh;overflow-y:auto;background:#0b0e14;border:1px solid #3a4556;border-radius:14px;padding:16px;');
  inner.className='menu-inner';
  panel.appendChild(inner);

  var head=_el('div','display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;');
  head.appendChild(_el('div','font:bold 16px '+_CSS+'color:#d4af37;letter-spacing:2px;','🎨 CUSTOMIZE A FIGHTER'));
  var status=_el('div','font:11px '+_CSS+'color:#8a93a3;','');
  head.appendChild(status);
  var x=_btn('✕ BACK','border-color:#533;background:#1a1214;color:#e88;');
  x.onclick=function(){ api.close(); };
  head.appendChild(x);
  inner.appendChild(head);

  var canvas=document.createElement('canvas');
  canvas.id='bczCanvas';
  canvas.style.cssText='width:100%;height:44vh;min-height:300px;display:block;background:#0a0910;border-radius:10px;border:1px solid #2a3340;';
  inner.appendChild(canvas);

  var zoomRow=_el('div','display:flex;align-items:center;gap:10px;margin:8px 0;');
  zoomRow.appendChild(_el('span','font:11px '+_CSS+'color:#8a93a3;','ZOOM'));
  var zoom=_el('input','flex:1;accent-color:#d4af37;'); zoom.type='range'; zoom.min=1.4; zoom.max=7; zoom.step=0.1; zoom.value=3.2;
  zoomRow.appendChild(zoom);
  var bf=_btn('FULL'); bf.onclick=function(){ if(_ui.preview) _ui.preview.setFocusHeight(null); };
  var bh=_btn('FACE'); bh.onclick=function(){ if(_ui.preview) _ui.preview.setFocusHeight(0.86); };
  zoomRow.appendChild(bf); zoomRow.appendChild(bh);
  inner.appendChild(zoomRow);

  _ui={ panel:panel, canvas:canvas, preview:null, fighterId:'', build:defaultBuild('',''),
    manifests:[], paintData:null, status:status, zoom:zoom,
    paintLayers:[], paintRegion:'fullFace', paintPattern:'base-soft', paintColor:'#f2ede2', paintOpacity:1,
    sections:{} };

  zoom.oninput=function(){ if(_ui.preview) _ui.preview.setZoom(+zoom.value); };

  // sections (populated on open / fighter select)
  ['fighter','eyes','body','acc','paint','save'].forEach(function(k){
    var s=_sec({fighter:'FIGHTER',eyes:'EYES',body:'BODY',acc:'ACCESSORIES',paint:'FACE PAINT',save:'SAVE'}[k]);
    _ui.sections[k]=s; inner.appendChild(s);
  });

  document.body.appendChild(panel);
  try{ _ui.paintData=getPickerData(); }catch(e){ _ui.paintData=null; }
  return _ui;
}

function setStatus(t){ if(_ui) _ui.status.textContent=t||''; }

function refreshFighterSection(){
  var s=_ui.sections.fighter; s.innerHTML='';
  s.appendChild(_el('div','font:bold 12px '+_CSS+'color:#d4af37;letter-spacing:2px;margin-bottom:8px;','FIGHTER'));
  var grid=_el('div','display:flex;flex-wrap:wrap;gap:6px;');
  customizableFighters().forEach(function(f){
    var b=_btn((f.canon?'★ ':'')+f.name+(f.faction?' · '+f.faction:''));
    if(f.id===_ui.fighterId){ b.style.borderColor='#d4af37'; b.style.background='rgba(212,175,55,.18)'; }
    b.title=f.label;
    b.onclick=function(){ selectFighter(f.id); };
    grid.appendChild(b);
  });
  s.appendChild(grid);
  if(!customizableFighters().length) s.appendChild(_note('No banked GLBs found (CHAR_MODEL_DEFAULTS empty).'));
}

function refreshEyeSection(){
  var s=_ui.sections.eyes; s.innerHTML='';
  s.appendChild(_el('div','font:bold 12px '+_CSS+'color:#d4af37;letter-spacing:2px;margin-bottom:8px;','EYES'));
  var root=_ui.preview&&_ui.preview.modelRoot;
  if(!root||!supportsEyeColor(root)){
    s.appendChild(_note('This model bakes its eyes into the face texture — the palette is disabled. Skin-tone lock: never tinted.'));
    return;
  }
  var row=_el('div','display:flex;flex-wrap:wrap;gap:6px;');
  EYE_COLOR_PALETTE.forEach(function(e){
    var b=_el('button','width:34px;height:34px;border-radius:50%;border:2px solid '+( _ui.build.eyeColor===e.id?'#d4af37':'#333')+';background:'+(e.id==='natural'?'conic-gradient(#888,#333,#888)':e.hex)+';cursor:pointer;', '');
    b.title=e.label;
    b.onclick=function(){ _ui.build.eyeColor=e.id; if(_ui.preview) _ui.preview.setEyeColor(e.id); refreshEyeSection(); };
    row.appendChild(b);
  });
  s.appendChild(row);
  s.appendChild(_note('Iris material is cloned — the authored look is never overwritten.'));
}

function refreshBodySection(){
  var s=_ui.sections.body; s.innerHTML='';
  s.appendChild(_el('div','font:bold 12px '+_CSS+'color:#d4af37;letter-spacing:2px;margin-bottom:8px;','BODY'));
  var root=_ui.preview&&_ui.preview.modelRoot;
  var keys=root?supportedMorphs(root):[];
  if(!keys.length){ s.appendChild(_note('No morphable bones detected on this model.')); return; }
  keys.forEach(function(k){
    var def=null; MORPH_DEFS.forEach(function(d){ if(d.key===k) def=d; });
    var row=_el('div','display:flex;align-items:center;gap:10px;margin:6px 0;');
    row.appendChild(_el('span','font:11px '+_CSS+'color:#cdd6e0;width:70px;',def.label.toUpperCase()));
    var sl=_el('input','flex:1;accent-color:#d4af37;'); sl.type='range'; sl.min=0; sl.max=1; sl.step=0.01; sl.value=_ui.build.morphs[k];
    sl.title=def.hint;
    sl.oninput=(function(key){ return function(){ _ui.build.morphs[key]=+sl.value; if(_ui.preview) _ui.preview.setMorphs(_ui.build.morphs); }; })(k);
    sl.ondblclick=(function(key){ return function(){ _ui.build.morphs[key]=0.5; sl.value=0.5; if(_ui.preview) _ui.preview.setMorphs(_ui.build.morphs); }; })(k);
    row.appendChild(sl);
    row.appendChild(_el('span','font:10px '+_CSS+'color:#8a93a3;','dbl-click resets'));
    s.appendChild(row);
  });
}

function refreshAccSection(){
  var s=_ui.sections.acc; s.innerHTML='';
  s.appendChild(_el('div','font:bold 12px '+_CSS+'color:#d4af37;letter-spacing:2px;margin-bottom:8px;','ACCESSORIES'));
  var slots=['hair','mask','hood','chain','gloves','wristbands','shoes']; // facialHair: scaffolded, no lane assets yet
  slots.forEach(function(slot){
    var row=_el('div','display:flex;align-items:center;gap:10px;margin:6px 0;');
    row.appendChild(_el('span','font:11px '+_CSS+'color:#cdd6e0;width:96px;',SLOT_LABELS[slot].toUpperCase()));
    var sel=_el('select','flex:1;background:#1a2130;color:#dfe6f2;border:1px solid #3a4556;border-radius:6px;padding:6px;font:11px '+_CSS+';');
    var none=document.createElement('option'); none.value=''; none.textContent='— None —'; sel.appendChild(none);
    manifestsForSlot(_ui.manifests, slot).forEach(function(m){
      var o=document.createElement('option'); o.value=m.id;
      o.textContent=m.label+(m.canon?' ★ canon':'');
      if(m.canonNotes&&/likeness|flag/i.test(m.canonNotes)) o.textContent+=' ⚠';
      sel.appendChild(o);
    });
    sel.value=_ui.build.accessories[slot]||'';
    sel.onchange=function(){
      var id=sel.value||null;
      setStatus('Attaching…');
      _ui.preview.setAccessory(slot,id).then(function(){ setStatus(id?'Attached.':'Removed.'); });
    };
    row.appendChild(sel);
    s.appendChild(row);
  });
  s.appendChild(_note('Chains ship pendant-fixed (a6162b58). Rigged parts rebind to the fighter\'s bones; the rest hang from the manifest bone.'));
}

function refreshPaintSection(){
  var s=_ui.sections.paint; s.innerHTML='';
  s.appendChild(_el('div','font:bold 12px '+_CSS+'color:#d4af37;letter-spacing:2px;margin-bottom:8px;','FACE PAINT'));
  if(!facePaintAvailable(_ui.fighterId)){
    var p=getProfile(_ui.fighterId);
    s.appendChild(_note(p?'Face-paint profile exists but is UNVERIFIED for this build — paint stays disabled until the face-direction QC passes. No fake paint.':'No face-paint profile for this fighter yet — paint stays disabled. No fake paint.'));
    return;
  }
  var pd=_ui.paintData;
  var prows=_el('div','display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;');
  pd.presets.forEach(function(pr){
    var b=_btn((pr.canonLocked?'🔒 ':'')+pr.label);
    b.title=pr.description||'';
    b.onclick=function(){
      _ui.paintLayers=clonePresetLayers(getPreset(pr.id));
      setStatus('Preset "'+pr.label+'" staged — APPLY to paint.');
      refreshPaintLayers();
    };
    prows.appendChild(b);
  });
  var clr=_btn('CLEAR PAINT');
  clr.onclick=function(){ _ui.build.facePaint=null; _ui.paintLayers=[]; if(_ui.preview) _ui.preview.setFacePaint(null); refreshPaintLayers(); setStatus('Paint cleared — base skin untouched.'); };
  prows.appendChild(clr);
  s.appendChild(prows);
  // custom builder
  var b=_el('div','border-top:1px solid #2a3340;padding-top:8px;margin-top:4px;');
  b.appendChild(_el('div','font:11px '+_CSS+'color:#8a93a3;margin-bottom:6px;','CUSTOM LAYERS'));
  var r1=_el('div','display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;');
  var regSel=_el('select','background:#1a2130;color:#dfe6f2;border:1px solid #3a4556;border-radius:6px;padding:6px;font:11px '+_CSS+';');
  pd.regions.forEach(function(r){ var o=document.createElement('option'); o.value=r.id; o.textContent=r.label; regSel.appendChild(o); });
  regSel.value=_ui.paintRegion; regSel.onchange=function(){ _ui.paintRegion=regSel.value; };
  var patSel=_el('select','background:#1a2130;color:#dfe6f2;border:1px solid #3a4556;border-radius:6px;padding:6px;font:11px '+_CSS+';');
  pd.patterns.forEach(function(p){ var o=document.createElement('option'); o.value=p.id; o.textContent=p.label; patSel.appendChild(o); });
  patSel.value=_ui.paintPattern; patSel.onchange=function(){ _ui.paintPattern=patSel.value; };
  r1.appendChild(regSel); r1.appendChild(patSel); b.appendChild(r1);
  var r2=_el('div','display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;align-items:center;');
  pd.colors.forEach(function(c){
    var sw=_el('button','width:26px;height:26px;border-radius:6px;border:2px solid '+(_ui.paintColor===c.hex?'#d4af37':'#333')+';background:'+c.hex+';cursor:pointer;','');
    sw.title=c.label+(c.canon?' (canon)':'');
    sw.onclick=function(){ _ui.paintColor=c.hex; refreshPaintSection(); };
    r2.appendChild(sw);
  });
  var custom=_el('input','width:60px;height:26px;border:1px solid #3a4556;background:none;cursor:pointer;padding:0;');
  custom.type='color'; custom.value=_ui.paintColor;
  custom.oninput=function(){ _ui.paintColor=custom.value; };
  r2.appendChild(custom); b.appendChild(r2);
  var r3=_el('div','display:flex;gap:10px;align-items:center;margin-bottom:6px;');
  r3.appendChild(_el('span','font:11px '+_CSS+'color:#8a93a3;','OPACITY'));
  var op=_el('input','flex:1;accent-color:#d4af37;'); op.type='range'; op.min=0.05; op.max=1; op.step=0.05; op.value=_ui.paintOpacity;
  op.oninput=function(){ _ui.paintOpacity=+op.value; };
  r3.appendChild(op);
  var add=_btn('+ ADD LAYER');
  add.onclick=function(){
    _ui.paintLayers.push({ region:_ui.paintRegion, pattern:_ui.paintPattern, color:_ui.paintColor, opacity:_ui.paintOpacity });
    refreshPaintLayers();
  };
  r3.appendChild(add); b.appendChild(r3);
  var layerBox=_el('div',''); layerBox.id='bczPaintLayers'; b.appendChild(layerBox);
  var apply=_btn('🖌 APPLY PAINT','border-color:#d4af37;background:rgba(212,175,55,.15);');
  apply.onclick=function(){
    var errs=validateLayers(_ui.paintLayers);
    if(errs.length){ setStatus('Paint errors: '+errs.join('; ')); return; }
    var spec=serializeLayers(_ui.paintLayers);
    _ui.build.facePaint=spec;
    setStatus('Painting…');
    _ui.preview.setFacePaint(spec).then(function(){ setStatus('Paint applied — decal overlay only, base skin untouched.'); });
  };
  b.appendChild(apply);
  s.appendChild(b);
  refreshPaintLayers();
}
function refreshPaintLayers(){
  var box=document.getElementById('bczPaintLayers');
  if(!box) return;
  box.innerHTML='';
  _ui.paintLayers.forEach(function(l,i){
    var row=_el('div','display:flex;align-items:center;gap:8px;font:11px '+_CSS+'color:#cdd6e0;margin:3px 0;');
    var sw=_el('span','width:16px;height:16px;border-radius:4px;background:'+l.color+';display:inline-block;','');
    row.appendChild(sw);
    row.appendChild(_el('span','',l.region+' · '+l.pattern+' · '+Math.round(l.opacity*100)+'%'));
    var x=_btn('✕','padding:2px 8px;'); x.onclick=function(){ _ui.paintLayers.splice(i,1); refreshPaintLayers(); };
    row.appendChild(x);
    box.appendChild(row);
  });
  if(!_ui.paintLayers.length) box.appendChild(_note('No custom layers — pick a preset or add layers, then APPLY.'));
}

function refreshSaveSection(){
  var s=_ui.sections.save; s.innerHTML='';
  s.appendChild(_el('div','font:bold 12px '+_CSS+'color:#d4af37;letter-spacing:2px;margin-bottom:8px;','SAVE'));
  var row=_el('div','display:flex;gap:8px;flex-wrap:wrap;');
  var sv=_btn('💾 SAVE BUILD','border-color:#d4af37;background:rgba(212,175,55,.15);');
  sv.onclick=function(){ saveBuild(_ui.build); setStatus('Build saved for '+_ui.fighterId+'. It applies in fights automatically.'); };
  var rs=_btn('↺ RESET');
  rs.onclick=function(){
    _ui.build=defaultBuild(_ui.fighterId,'');
    if(_ui.preview){ _ui.preview.build=clone(_ui.build); _ui.preview.applyBuild(_ui.build); }
    _ui.paintLayers=[];
    refreshAll(); setStatus('Reset to the authored look.');
  };
  var ex=_btn('⬇ EXPORT JSON');
  ex.onclick=function(){ exportBuildsFile(); setStatus('Builds exported.'); };
  row.appendChild(sv); row.appendChild(rs); row.appendChild(ex);
  s.appendChild(row);
  var saved=loadBuildSync(_ui.fighterId);
  s.appendChild(_note(saved?'A saved build exists for this fighter — it loads automatically and applies in fights.':'No saved build yet — the authored look is showing.'));
}
function refreshAll(){
  refreshFighterSection(); refreshEyeSection(); refreshBodySection();
  refreshAccSection(); refreshPaintSection(); refreshSaveSection();
}

function selectFighter(fighterId){
  buildPanel();
  _ui.fighterId=String(fighterId).toLowerCase();
  var saved=loadBuildSync(_ui.fighterId);
  _ui.build=saved||defaultBuild(_ui.fighterId,'');
  _ui.paintLayers=[];
  if(!_ui.preview){
    _ui.preview=new CustomizerPreview(_ui.canvas);
    _ui.preview.onStatus=function(st){
      setStatus(st.loading?'Loading model…':(st.error||''));
      if(st.modelName&&!st.loading){ refreshEyeSection(); refreshBodySection(); }
      try{ _ui.zoom.value=_ui.preview.targetDistance; }catch(e){}
    };
  }
  _ui.preview.build=clone(_ui.build);
  var url=modelUrlFor(_ui.fighterId);
  if(!url){ setStatus('No banked GLB for '+fighterId+'.'); refreshAll(); return; }
  setStatus('Loading model…');
  _ui.preview.loadFighter(_ui.fighterId, url).then(function(){ refreshAll(); });
  loadAccessoryManifests().then(function(m){ _ui.manifests=m; refreshAccSection(); });
  refreshFighterSection();
}

var api={
  _v1:true, version:'1.0-phase2',
  open:function(){
    buildPanel();
    if(typeof hideAll==='function') hideAll();
    var p=document.getElementById('bczPanel');
    if(p) p.classList.remove('hidden');
    var fighters=customizableFighters();
    selectFighter(_ui.fighterId||(fighters[0]&&fighters[0].id)||'bannon');
  },
  close:function(){
    if(_ui&&_ui.preview){ _ui.preview.dispose(); _ui.preview=null; }
    var p=document.getElementById('bczPanel');
    if(p) p.classList.add('hidden');
    if(typeof show==='function') show('mainMenu');
  },
  /* data + engine API (also used by the DNA capture path) */
  loadBuildSync:loadBuildSync, loadAllBuilds:loadAllBuilds, saveBuild:saveBuild, deleteBuild:deleteBuild,
  applyBuildToRoot:applyBuildToRoot,
  applyEyeColor:applyEyeColor, supportsEyeColor:supportsEyeColor, findIrisMaterials:findIrisMaterials,
  applyMorphs:applyMorphs, resetMorphs:resetMorphs, supportedMorphs:supportedMorphs,
  attachAccessory:attachAccessory, detachAccessory:detachAccessory, detachAllAccessories:detachAllAccessories,
  accessoryInSlot:accessoryInSlot, loadAccessoryManifests:loadAccessoryManifests, manifestsForSlot:manifestsForSlot,
  facePaintAvailable:facePaintAvailable, applyFacePaintSpec:applyFacePaintSpec, clearFacePaint:clearFacePaint,
  FacePaintDecal:{ build:buildFacePaintDecal }, FacePaintPainter:FacePaintPainter,
  getPickerData:getPickerData, getPreset:getPreset, clonePresetLayers:clonePresetLayers,
  validateLayers:validateLayers, serializeLayers:serializeLayers, parseLayers:parseLayers,
  EYE_COLOR_PALETTE:EYE_COLOR_PALETTE, ACCESSORY_SLOTS:ACCESSORY_SLOTS, SLOT_LABELS:SLOT_LABELS,
  customizableFighters:customizableFighters, modelUrlFor:modelUrlFor,
  CustomizerPreview:CustomizerPreview, defaultBuild:defaultBuild
};

/* ---------------- boot ---------------- */
function injectHubTile(){
  try{
    var grid=document.querySelector('#mainMenu .hub-grid');
    if(!grid||document.getElementById('btnHubCustomize')) return;
    var b=document.createElement('button');
    b.className='hub-tile'; b.id='btnHubCustomize';
    b.innerHTML='<span class="hub-ico">🎨</span><span class="hub-lbl">CUSTOMIZE</span>';
    b.onclick=function(){ api.open(); };
    grid.appendChild(b);
  }catch(e){}
}
function boot(){
  injectHubTile();
  hookFightBind();
}
window.BANNON_CUSTOMIZER=api;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
else setTimeout(boot, 400);
})();
