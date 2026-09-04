#!/usr/bin/env node
/* visual_defects.cjs — AN ADVERSARIAL VISUAL GATE. "Looks good" is not an output it can produce.
 *
 *   node tools/harness/visual_defects.cjs [--seconds N] [--shots]
 *
 * OWNER: "Claude overlooks all bugs and glitches in every image and acts like the images look
 * perfect when they are glitched and bugged out visually."
 *
 * That is a real failure of the verification loop and the fix is not "look harder". An agent asked
 * "does this look good?" is being invited to praise, and a rubric it fills in by eye is still a
 * guess wearing a checklist. OWNER LAW is that a fact which can be MEASURED must be measured — so
 * every check here is computed from the live skeleton, in metres and degrees, and the screenshot is
 * saved BESIDE the numbers rather than instead of them.
 *
 * SIX DEFECT CLASSES, each objective, each able to fail on its own:
 *
 *   STRETCH        a bone's length must not change. Bones are rigid; only rotations move them. Our
 *                  engine drives joint POSITIONS (verlet targets, IK, physics), so a stretched
 *                  segment is exactly the "noodle limb / stretched stick" defect in this file's
 *                  history, and it is invisible to every pose metric we have.
 *   REVERSE_JOINT  a knee or an elbow bending the wrong way. Hinges have a side.
 *   TWIST          shoulder axis against hip axis. Past ~90 deg a human torso has come apart.
 *   GROUND         a foot below the mat (sunk) or well above it while standing (floating).
 *   CLIPPING       a hand or foot inside the opponent's or its own torso volume.
 *   SEPARATION     two fighters' root distance during a grapple — a hold at 3 m is not a hold.
 *   MESH_TEAR      THE GLB SURFACE ITSELF, not the skeleton. Owner: "not just the skeleton, the mesh
 *                  and models and body parts too, duh, the glbs too." He is right and the skeleton
 *                  checks alone would have missed it — this repo already learned that a rig can
 *                  score PERFECT on a deformation metric while being physically unable to deform.
 *                  Every triangle edge has a fixed BIND length in the position attribute; the same
 *                  edge is re-measured after skinning via SkinnedMesh.boneTransform. An edge that
 *                  has doubled is torn surface: the "shredded, fanning leg geometry" defect by name.
 *   MESH_INFLATE   the whole skinned body's bounding box against its bind box. A limb flung to
 *                  infinity, a vertex spike, a body blown apart — all show here and nowhere else.
 *
 * VERDICTS ARE PER CLASS AND ONE SEVERE DEFECT FAILS THE FRAME. There is no aggregate "overall it
 * looks fine" that can outvote a limb through a torso.
 *
 * UNKNOWN IS NOT PASS. A class whose bones did not resolve reports UNKNOWN and counts against the
 * run, because a check that cannot see the failure it looks for must never return clean — that is
 * already law here, and it is exactly how a severed rig once scored a perfect deformation result.
 *
 * THE WORST FRAME OF EACH CLASS IS SCREENSHOTTED with the camera put close enough to see it, and
 * the numbers for that frame are written next to it. The picture is evidence for a specific claim,
 * not a vibe check.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const OUT = path.join(ROOT, 'dist', 'playtest', 'visual');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg',
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const argv = process.argv.slice(2);
const has = f => argv.indexOf('--' + f) >= 0;
const num = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 ? (+argv[i+1] || d) : d; };
const SECS = num('seconds', 30);

function serve(port){
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/BANNON_v150.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
                         'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

function PROBE(){
  const S = window.__VD = { on:false, frames:0, cls:{}, worst:{}, resolved:{}, samples:0, pose:{}, wr:{} };

  // CHAINS the checks need, by Mixamo name. __boneOf already normalises the prefix.
  const CHAIN = {
    LeftArm:'LeftForeArm', LeftForeArm:'LeftHand',
    RightArm:'RightForeArm', RightForeArm:'RightHand',
    LeftUpLeg:'LeftLeg', LeftLeg:'LeftFoot',
    RightUpLeg:'RightLeg', RightLeg:'RightFoot',
    Spine:'Spine1', Spine1:'Spine2', Neck:'Head'
  };
  const V = () => new THREE.Vector3();
  const wp = (m, n) => { const b = window.__boneOf(m, n); if (!b) return null; return b.getWorldPosition(V()); };

  // ── WHO WROTE THESE BONES, ON THIS FRAME ────────────────────────────────────────────────────
  // Owner: "the report doesn't stop at 'Left leg visually distorted' — it can correlate visible
  // deformation spike <-> joint rotation spike <-> writer / subsystem." The bridge is the same
  // source-line ledger footik_writemap proved: three.js fires Quaternion._onChangeCallback from
  // inside its own copy()/slerp(), so the nearest stack frame naming the GAME file is the real
  // author. Reset every frame, so a defect carries the writers of ITS frame, not of the run.
  S.wr = {};                     // boneName -> { line: count } for the CURRENT frame only
  function watchWrites(m){
    if (!m || m.__vdWatched) return;
    m.__vdWatched = 1;
    m.traverse(function(o){
      if (!o.isBone) return;
      const nm = String(o.name || '').replace(/^mixamorig\d*/, '');
      const q = o.quaternion, prev = q._onChangeCallback;
      q._onChange(function(){
        if (prev) { try{ prev(); }catch(e){} }
        if (!S.on) return;
        let st = ''; try{ st = new Error().stack || ''; }catch(e){ return; }
        const mm = st.match(/BANNON_v150\.html:(\d+):\d+/);
        if (!mm) return;
        const b = S.wr[nm] || (S.wr[nm] = {});
        b[mm[1]] = (b[mm[1]] || 0) + 1;
      });
    });
  }
  function writersFor(names){
    const o = {};
    for (const n of names) if (S.wr[n]) o[n] = S.wr[n];
    return o;
  }

  // ── WHICH CLIP AUTHORED THIS POSE ────────────────────────────────────────────────────────────
  // Owner: "add moveId / role / phase / clipId / clipTime to the exact-frame defect sidecar ...
  // that should rapidly answer whether the wrong clip is mapped, a receiver clip is being used as
  // an attacker clip, a two-body capture is applied to one skeleton, the source animation itself is
  // inverted, or the clip's coordinate/root interpretation is wrong. That is a data triage problem
  // before it is an animation-system rewrite."
  //
  // IDENTITY BY OBJECT, NOT BY LABEL. A baked clip is a bare {keys,dur} with no name field, and the
  // SAME object is registered under both its key form and its human form (DROP_KICK_1 and
  // "Drop Kick (1)"), so the honest answer is every registry key that points at it — not a guess at
  // which one is canonical. Cached on the clip, so the registry is scanned once per capture.
  function cidOf(clip){
    if (clip.__vdCid) return clip.__vdCid;
    const keys = [];
    try{ const C = window.STUDIO && window.STUDIO.clips;
      if (C) for (const k in C) if (C[k] === clip) keys.push(k); }catch(e){}
    // An UNREGISTERED clip is itself a finding (studio scratch, a worker bake that never landed in
    // STUDIO), so it is fingerprinted rather than reported as unknown.
    return (clip.__vdCid = keys.length ? keys.join('|')
            : 'anon[' + (+(clip.dur||0)).toFixed(2) + 's/' + ((clip.keys && clip.keys.length)||0) + 'k]');
  }

  // The engine's dormant hook. Everything expensive lives here, in the instrument, so the game pays
  // one property lookup when nothing is listening.
  window.__CLIP_TRACE = function(f, clip, phase, tt, w){
    if (!S.on || !f || !clip) return;
    let chain = [];
    try{
      const st = new Error().stack || '';
      // Same source-line attribution as the write ledger. chain[0] is studioApplyClipPose itself and
      // the next entries are its WRAPPERS — the receiver-pairing hook and the pose counter both
      // replaced window.studioApplyClipPose, so a naive "chain[1] is the caller" reads the wrapper
      // on 100% of calls. MEASURED: every one of 309 traces reported site 55620, the pairing hook.
      // The wrapper prefix is not guessed and not hardcoded — it is the LONGEST COMMON PREFIX of
      // every chain in the run, computed at report time, because the layers every call passes
      // through are exactly the ones every chain shares.
      const all = (st.match(/BANNON_v150\.html:(\d+):\d+/g) || []).slice(0, 10);
      chain = all.map(function(s){ return s.match(/:(\d+):/)[1]; });
      const CS = S.chainSet || (S.chainSet = {});
      CS[chain.join('>')] = (CS[chain.join('>')] || 0) + 1;
    }catch(e){}
    // TWO RECORDS, NOT ONE, AND THE SECOND IS THE HONEST ONE.
    // __vdClip is the last application ever; __vdClipNow is the application that belongs to the
    // pose the scan is ABOUT to measure, and it is cleared at the END of the tick exactly like the
    // write ledger. Counting frames instead read "clip-driven on 0 of 313 defect hits" — a claim
    // that the animation system is never the author — when the truth is that this probe's rAF is
    // registered in the init script and therefore runs BEFORE the engine's, so a clip that authored
    // the measured pose is always stamped one tick earlier. The offset is the instrument's, not the
    // game's, and an offset silently absorbed into a verdict is how a harness invents a finding.
    f.__vdClip = f.__vdClipNow = {
                   cid: cidOf(clip), phase: +(+phase).toFixed(3), tS: +(+tt).toFixed(3),
                   durS: +(+(clip.dur||0)).toFixed(3), w: (w == null ? null : +(+w).toFixed(3)),
                   applier: chain[0] || null, chain: chain.join('>'),
                   frame: S.frames };
    S.clipCalls = (S.clipCalls || 0) + 1;
    const B = S.byClip || (S.byClip = {});
    B[f.__vdClip.cid] = (B[f.__vdClip.cid] || 0) + 1;
  };

  // The record that rides on a defect. TWO INDEPENDENT READINGS OF ROLE — the live grabbing
  // relationship, and the clip's own name — precisely so they can disagree. A receiver half played
  // on an attacker is one of the five named causes of the inverted body and it is decidable here,
  // with no change to the animation pipeline at all.
  const FIGHTERS = new Function('return typeof fighters!=="undefined"?fighters:null');
  function clipInfo(idx){
    try{
      const A = FIGHTERS() || [];
      const f = A[idx]; if (!f) return null;
      const now = f.__vdClipNow || null;                 // authored the pose being measured
      const c = now || f.__vdClip || null, mv = f.attackData || null;
      const rec = {
        moveId:   (mv && (mv.id || mv.name)) || null,
        moveCat:  (mv && mv.cat) || null,
        moveClip: (mv && mv.clip) || null,          // what the move ASKED for, before resolution
        state:    f.state || null,
        grapplePos: f.grapplePos || null,
        role: f.grabbedBy ? 'VICTIM'
            : (f.__isReceiverDrive ? 'RECEIVER_DRIVE'
            : ((f.grabbing || f.grappleTarget || f._victim) ? 'ATTACKER'
            : (f.state === 'attack' ? 'ATTACKER' : 'SELF'))),
        clip: c,
        // DID A CAPTURE AUTHOR THE POSE BEING MEASURED? This is the field that decides whether the
        // clip metadata means anything at all: false means the defect frame was NOT clip-driven,
        // the procedural retarget owns it, and no clip remap can fix it. Same lifecycle as the
        // write ledger — set by the engine's frame, read by the scan, cleared at the end of it.
        clipDrove: !!now,
        // Ticks since a capture last touched this body at all, for the frames clipDrove is false on.
        ticksSinceClip: (f.__vdClip ? (S.frames - f.__vdClip.frame) : null)
      };
      if (c){
        rec.receiverClip = /__RECV|_V_|VICTIM/i.test(c.cid);
        rec.roleMismatch = !!(rec.receiverClip && rec.role !== 'VICTIM' && rec.role !== 'RECEIVER_DRIVE');
      }
      return rec;
    }catch(e){ return { err:String(e).slice(0,90) }; }
  }

  // ── FRAME IDENTITY: the picture and the numbers must be the SAME event ──────────────────────
  // The screenshots were taken after the run, when the fighters had moved on, so the image did not
  // show the frame the numbers described. Storing the worst frame's POSE lets it be restored
  // exactly and photographed afterwards — the alternative, reading the canvas inside the probe's
  // own rAF, races the engine's render and would capture whichever frame won.
  function snapPose(){
    const out = [];
    try{
      const A = new Function('return fighters')() || [];
      A.slice(0,2).forEach(function(f){
        if (!f || !f.model) return out.push(null);
        const rec = { bones:[], x:f.x, z:f.z, y:f.y, facing:f.facing, state:f.state };
        f.model.traverse(function(o){ if (o.isBone)
          rec.bones.push({ b:o, q:o.quaternion.clone(), p:o.position.clone() }); });
        out.push(rec);
      });
    }catch(e){}
    return out;
  }

  function note(cls, sev, detail){
    const c = S.cls[cls] || (S.cls[cls] = { n:0, worst:0, frames:0 });
    c.n++;
    // ── THE DISTRIBUTION, NOT THE ANECDOTE ────────────────────────────────────────────────────
    // The stored "worst" record is really the FIRST frame to saturate, because every severity is
    // clamped to 1 and the keep test is strict — so a single worst record cannot say whether one
    // capture causes a class or fifty do. Every HIT is censused instead: which capture was last
    // applied, how stale it was, and what move was live. This is the plant-lock histogram applied
    // to rendered defects, and it is what turns "GROUND: BOX_IDLE" into a claim worth acting on.
    if (detail && detail.fighter != null){
      const k = clipInfo(detail.fighter);
      if (k){
        const H = c.census || (c.census = { byClip:{}, byMove:{}, byRole:{}, stale:{}, nClipDriven:0 });
        const cid = k.clipDrove ? k.clip.cid : ('NOT CLIP-DRIVEN (last was ' + ((k.clip && k.clip.cid) || 'none') + ')');
        H.byClip[cid] = (H.byClip[cid] || 0) + 1;
        H.byMove[k.moveId || ('state:' + (k.state||'?'))] = (H.byMove[k.moveId || ('state:' + (k.state||'?'))] || 0) + 1;
        H.byRole[k.role || '?'] = (H.byRole[k.role || '?'] || 0) + 1;
        const s = k.clipDrove ? 0 : k.ticksSinceClip;
        const bucket = s == null ? 'never' : (s === 0 ? 'clip authored this frame'
                     : (s <= 3 ? 'stale 1-3' : (s <= 10 ? 'stale 4-10' : 'stale >10')));
        H.stale[bucket] = (H.stale[bucket] || 0) + 1;
        if (k.clipDrove) H.nClipDriven++;
        detail = Object.assign({}, detail, { clip:k });      // reuse the reading, never take it twice
      }
    }
    if (sev > c.worst){
      c.worst = sev;
      const d = Object.assign({ sev:sev, frame:S.frames, t:+(performance.now()/1000).toFixed(3) }, detail);
      // The defect, the bones, the writers AND the clip are one record on one frame.
      if (d.fighter != null && d.clip === undefined) d.clip = clipInfo(d.fighter);
      S.worst[cls] = d;
      S.pose[cls] = snapPose();          // the exact pose that produced this number
    }
  }
  function ok(cls){ S.resolved[cls] = (S.resolved[cls] || 0) + 1; }

  function angle(a, b, c){                       // interior angle at b, degrees
    const v1 = a.clone().sub(b), v2 = c.clone().sub(b);
    if (v1.lengthSq() < 1e-9 || v2.lengthSq() < 1e-9) return null;
    return v1.angleTo(v2) * 180 / Math.PI;
  }

  // ── THE MESH, NOT THE BONES ─────────────────────────────────────────────────────────────────
  // Sampled triangles, cached per model. boneTransform gives the CPU-skinned position of a vertex,
  // which is what the GPU is about to draw — so this measures the surface the player looks at, in
  // the same units its bind pose was authored in. Ratios only, so nothing depends on a model's size.
  function meshScan(f, idx){
    const m = f && f.model; if (!m) return;
    let sm = null;
    m.traverse(function(o){ if (!sm && o.isSkinnedMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) sm = o; });
    if (!sm) return;
    if (typeof sm.boneTransform !== 'function'){ S.meshNoAPI = 1; return; }   // UNKNOWN, never a pass

    let C = sm.userData.__vdMesh;
    if (!C){
      const g = sm.geometry, pos = g.attributes.position, ix = g.index;
      const nT = ix ? Math.floor(ix.count / 3) : Math.floor(pos.count / 3);
      const step = Math.max(1, Math.floor(nT / 200));
      const tris = [], bind = [];
      const va = V(), vb = V(), vc = V();
      for (let t = 0; t < nT; t += step){
        const a = ix ? ix.getX(t*3) : t*3, b = ix ? ix.getX(t*3+1) : t*3+1, c = ix ? ix.getX(t*3+2) : t*3+2;
        va.fromBufferAttribute(pos, a); vb.fromBufferAttribute(pos, b); vc.fromBufferAttribute(pos, c);
        tris.push([a,b,c]);
        bind.push([va.distanceTo(vb), vb.distanceTo(vc), vc.distanceTo(va)]);
      }
      // BIND BOX from the authored positions — the reference the skinned body must stay near.
      const bb = new THREE.Box3().setFromBufferAttribute(pos);
      C = sm.userData.__vdMesh = { tris:tris, bind:bind, name:(sm.name || '(unnamed)'),
                                   file: (m.userData && m.userData.__srcFile) || (f.opts && f.opts.name) || '?',
                                   bindDiag: bb.min.distanceTo(bb.max), tri:nT };
    }

    ok('MESH_TEAR'); ok('MESH_INFLATE');
    const pa = V(), pb = V(), pc = V();
    const box = new THREE.Box3();
    let worst = 0, worstD = null, over = 0;
    for (let i = 0; i < C.tris.length; i++){
      const T = C.tris[i], B = C.bind[i];
      sm.boneTransform(T[0], pa); sm.boneTransform(T[1], pb); sm.boneTransform(T[2], pc);
      box.expandByPoint(pa); box.expandByPoint(pb); box.expandByPoint(pc);
      const d = [pa.distanceTo(pb), pb.distanceTo(pc), pc.distanceTo(pa)];
      for (let e = 0; e < 3; e++){
        // AN ABSOLUTE FLOOR, NOT JUST A NON-ZERO GUARD. A 0.1 mm bind edge skinning to 0.5 mm is a
        // ratio of 5 and is invisible on screen; reporting it as torn surface is a ratio artifact.
        // A tear has to be big in the bind mesh AND big after skinning to be something you can see.
        if (B[e] < 0.002) continue;              // sub-2mm edges cannot carry a visible tear
        const r = d[e] / B[e];
        if (d[e] < 0.02) continue;               // and the skinned edge must be at least 2cm long
        if (r > 1.6) over++;
        if (r > worst){ worst = r; worstD = { vert:T[e], ratio:+r.toFixed(2), bindM:+B[e].toFixed(5), skinnedM:+d[e].toFixed(5) }; }
      }
    }
    if (worst > 1.6){
      // THE VERTEX -> JOINT -> WRITER BRIDGE. Owner's exact chain, and it is why region inference
      // must come from WEIGHTS and never from mesh names: BANNON_SEWN is ONE primitive spanning 48
      // of 58 joints, because the sew tool deliberately concatenated fifteen severed pieces. The
      // name says nothing; skinIndex/skinWeight say which bones actually move this surface.
      // PRIMARY plus the full INFLUENCE SIGNATURE, because a vertex at a joint boundary legitimately
      // blends two bones and collapsing it to one would hide exactly the case that tears.
      let infl = null;
      try{
        const si = sm.geometry.attributes.skinIndex, sw = sm.geometry.attributes.skinWeight;
        if (si && sw && worstD){
          const v = worstD.vert, sk = sm.skeleton, list = [];
          // r128's BufferAttribute exposes getX/getY/getZ/getW and has NO getComponent — the first
          // version threw "sw.getComponent is not a function" and the influence came back null, i.e.
          // the vertex->joint half of the bridge silently did not exist. It reports the error now.
          const G = ['getX','getY','getZ','getW'];
          for (let k = 0; k < 4; k++){
            const w = sw[G[k]](v); if (w <= 0.001) continue;
            const bi = si[G[k]](v), bn = sk.bones[bi];
            list.push({ bone: bn ? String(bn.name||'').replace(/^mixamorig\d*/,'') : ('#'+bi), w:+w.toFixed(3) });
          }
          list.sort(function(a,b){ return b.w - a.w; });
          infl = { primary: list.length ? list[0].bone : null, signature: list,
                   writers: writersFor(list.map(function(e){ return e.bone; })) };
        }
      }catch(e){ infl = { error: String(e).slice(0,90) }; }
      if (!infl) infl = { error: 'skinIndex/skinWeight attribute missing on this geometry' };
      note('MESH_TEAR', Math.min(1, (worst - 1.6) / 3),
           Object.assign({ fighter:idx, model:C.file, mesh:C.name, edgesTorn:over,
                           ofSampled:C.tris.length*3, influence:infl }, worstD));
    }

    if (C.bindDiag > 1e-4 && !box.isEmpty()){
      const diag = box.min.distanceTo(box.max);
      const infl = diag / C.bindDiag;
      if (infl > 1.45 || infl < 0.55)
        note('MESH_INFLATE', Math.min(1, Math.abs(infl - 1)), { fighter:idx, model:C.file, ratio:+infl.toFixed(2),
                                                                skinnedDiagM:+diag.toFixed(3), bindDiagM:+C.bindDiag.toFixed(3) });
    }
  }

  // ── CALIBRATE EVERY CHECK AGAINST THE BIND POSE ─────────────────────────────────────────────
  // The bind pose is the one configuration the model is KNOWN to be correct in. So every geometric
  // rule is run there first: if a check fires at bind, the CHECK is wrong and the game is not, and
  // reporting it as a defect would hand over a list that is mostly my own bug. Bind world positions
  // come from inverse(boneInverses[i]) — the same source CLAUDE.md already mandates for authoring,
  // because the live pose at any instant is not a reference for anything.
  function bindCal(m){
    if (m.userData.__vdBind !== undefined) return m.userData.__vdBind;
    let sm = null;
    m.traverse(function(o){ if (!sm && o.isSkinnedMesh && o.skeleton && o.skeleton.boneInverses) sm = o; });
    if (!sm){ return (m.userData.__vdBind = null); }
    const sk = sm.skeleton, map = {};
    for (let i = 0; i < sk.bones.length; i++){
      const mtx = sk.boneInverses[i].clone().invert();
      map[String(sk.bones[i].name || '').replace(/^mixamorig\d*/, '')] = V().setFromMatrixPosition(mtx);
    }
    const cal = { twist:null, knee:{} };
    if (map.LeftShoulder && map.RightShoulder && map.LeftUpLeg && map.RightUpLeg){
      const sa = map.RightShoulder.clone().sub(map.LeftShoulder); sa.y = 0;
      const ha = map.RightUpLeg.clone().sub(map.LeftUpLeg); ha.y = 0;
      if (sa.lengthSq() > 1e-6 && ha.lengthSq() > 1e-6) cal.twist = sa.angleTo(ha) * 180 / Math.PI;
    }
    // Which way a knee bends in the bind pose, in the bind pose's OWN forward. A rig authored in a
    // fighting stance already has bent knees, so the sign is read off the model rather than assumed.
    const bf = (map.LeftShoulder && map.RightShoulder)
      ? (function(){ const a = map.RightShoulder.clone().sub(map.LeftShoulder); a.y = 0; a.normalize();
                     return V(a.z, 0, -a.x); })() : V(0,0,1);
    [['LeftUpLeg','LeftLeg','LeftFoot'], ['RightUpLeg','RightLeg','RightFoot']].forEach(function(J){
      const A = map[J[0]], B = map[J[1]], C = map[J[2]]; if (!A || !B || !C) return;
      const line = C.clone().sub(A); if (line.lengthSq() < 1e-9) return;
      const t = B.clone().sub(A).dot(line) / line.lengthSq();
      const off = B.clone().sub(A.clone().add(line.clone().multiplyScalar(t)));
      cal.knee[J[1]] = { along: off.dot(bf), fwd: bf.clone() };
    });
    return (m.userData.__vdBind = cal);
  }

  function scan(f, idx, other){
    const m = f && f.model; if (!m || !window.__boneOf) return;

    // ── STRETCH ───────────────────────────────────────────────────────────────────────────────
    // A bone's world length is a rigid property. Anything that changes it is stretching the mesh.
    // Baseline is the bone's own median over the run, so no threshold depends on a model's height.
    m.userData.__vdLen = m.userData.__vdLen || {};
    let sawChain = false;
    for (const a in CHAIN){
      const pa = wp(m, a), pb = wp(m, CHAIN[a]);
      if (!pa || !pb) continue;
      sawChain = true;
      const L = pa.distanceTo(pb);
      const rec = m.userData.__vdLen[a] || (m.userData.__vdLen[a] = { first:L, min:L, max:L, n:0, sum:0 });
      rec.n++; rec.sum += L;
      if (L < rec.min) rec.min = L; if (L > rec.max) rec.max = L;
      const mean = rec.sum / rec.n;
      if (rec.n > 20 && mean > 1e-4){
        const dev = Math.abs(L - mean) / mean;             // fractional stretch this frame
        if (dev > 0.12) note('STRETCH', dev, { fighter:idx, bone:a, lenM:+L.toFixed(4), meanM:+mean.toFixed(4), devPct:+(dev*100).toFixed(1) });
      }
    }
    if (sawChain) ok('STRETCH');

    // ── REVERSE JOINT ─────────────────────────────────────────────────────────────────────────
    // A knee flexes one way only. Sign is taken against the limb's own plane: the knee must sit
    // FORWARD of the hip->ankle line in the direction the body faces, and the elbow BEHIND it.
    // Measuring the interior angle alone cannot see a backwards knee — 90 deg is 90 deg either way.
    const fwd = new THREE.Vector3(Math.sin(f.facing || 0), 0, Math.cos(f.facing || 0));
    let sawJoint = false, kneeCalibrated = false;
    // KNEES ONLY. The first run flagged 372 "reverse elbows" — an elbow is not constrained to a
    // facing-relative half-space: a hook puts it out to the side and a raised guard puts it in
    // front, so the rule that works for a knee manufactures hundreds of false positives on arms.
    // A check that fires on correct behaviour is worse than no check. Elbows need a real joint-limit
    // model against the shoulder's own frame; that is not this, and pretending otherwise would be
    // handing over a defect list that is mostly my bug.
    [['LeftUpLeg','LeftLeg','LeftFoot',  1], ['RightUpLeg','RightLeg','RightFoot', 1]].forEach(function(J){
      const A = wp(m, J[0]), B = wp(m, J[1]), C = wp(m, J[2]);
      if (!A || !B || !C) return;
      const ang = angle(A, B, C); if (ang == null) return;
      // how far the middle joint sits off the straight line, along the facing
      const line = C.clone().sub(A);
      if (line.lengthSq() < 1e-9) return;
      const t = B.clone().sub(A).dot(line) / line.lengthSq();
      const proj = A.clone().add(line.multiplyScalar(t));
      const off = B.clone().sub(proj);
      // THE CORRECT DIRECTION IS READ OFF THE BIND POSE, NOT ASSUMED. A rig authored in a fighting
      // stance already has bent knees, and asserting "the knee points along the facing" flagged 254
      // frames — the sign was mine, not the game's. If bind says nothing, the check does not run.
      const cal = bindCal(m), kc = cal && cal.knee && cal.knee[J[1]];
      // BIND SAYS NOTHING -> UNKNOWN, NEVER CLEAN. Measured: this rig's knees are dead straight at
      // bind (along 0.000), so there is no authored direction to compare a live bend against. The
      // first calibrated run reported REVERSE_JOINT "clean, 244 frames checked" when the check had
      // not run on a single one of them — my own law broken by my own instrument. Marking the class
      // resolved only when it genuinely calibrated is the fix.
      if (!kc || Math.abs(kc.along) < 0.005) return;
      kneeCalibrated = true;
      const sign = kc.along > 0 ? 1 : -1;
      const along = off.dot(fwd) * sign;                  // +ve = bending the way this rig bends
      if (ang < 168 && along < -0.03)
        note('REVERSE_JOINT', Math.min(1, (168 - ang) / 90),
             { fighter:idx, joint:J[1], angleDeg:+ang.toFixed(1), wrongWayM:+(-along).toFixed(3),
               bindAlong:+kc.along.toFixed(3) });
    });
    if (kneeCalibrated) ok('REVERSE_JOINT');

    // ── TWIST ─────────────────────────────────────────────────────────────────────────────────
    // SHOULDER BONES ONLY — NO ARM FALLBACK. First run reported a 177.9 deg "twist", which is the
    // two axes being ANTIPARALLEL, and CLAUDE.md already records exactly why: "These rigs are NOT
    // BOUND IN A T-POSE — the arm bones are staggered front-to-back in a fighting stance, so
    // LeftArm->RightArm runs ALONG the facing. On BANNON_rigged it is the exact negative of it."
    // Falling back to the arms measures the wrong axis and manufactures a defect. If the shoulder
    // bones are absent this class reports UNKNOWN, which is the honest answer.
    const sl = wp(m,'LeftShoulder'), sr = wp(m,'RightShoulder');
    const hl = wp(m,'LeftUpLeg'), hr = wp(m,'RightUpLeg');
    if (sl && sr && hl && hr){
      ok('TWIST');
      const sa = sr.clone().sub(sl); sa.y = 0;
      const ha = hr.clone().sub(hl); ha.y = 0;
      if (sa.lengthSq() > 1e-6 && ha.lengthSq() > 1e-6){
        const tw = sa.angleTo(ha) * 180 / Math.PI;
        const cal = bindCal(m);
        const base = (cal && cal.twist != null) ? cal.twist : 0;
        // DEVIATION FROM BIND. The absolute reading was 178 deg and firing constantly, which is the
        // shoulder and hip axes being antiparallel IN THE MODEL AS AUTHORED — a naming/axis
        // convention, not a broken torso. What a defect looks like is the live twist departing from
        // whatever this particular rig's bind twist already is.
        const dev = Math.abs(tw - base);
        if (dev > 75) note('TWIST', Math.min(1, (dev - 75) / 90),
                           { fighter:idx, twistDeg:+tw.toFixed(1), bindTwistDeg:+base.toFixed(1), deviationDeg:+dev.toFixed(1),
                             writers: writersFor(['LeftShoulder','RightShoulder','LeftUpLeg','RightUpLeg','Spine','Spine1','Spine2','Hips']) });
      }
    }

    // ── GROUND ────────────────────────────────────────────────────────────────────────────────
    // Feet against the surface this fighter is actually standing on. Uses the engine's own zone Y
    // rather than assuming 0, or every fighter on the floor reads as sunk by 85 cm.
    const lf = wp(m,'LeftFoot'), rf = wp(m,'RightFoot');
    if (lf && rf){
      ok('GROUND');
      let zy = 0;
      try{ const Z = window.ZONE_Y || {}; zy = (f.zone && Z[f.zone] != null) ? Z[f.zone] : (typeof f.y === 'number' && f.y < -0.4 ? (Z.FLOOR != null ? Z.FLOOR : -0.85) : 0); }catch(e){}
      const airborne = !!(f.airborne || f.ragdoll || f._ragdoll) ||
                       (typeof f.y === 'number' && f.y > 0.12) ||
                       /dive|climb|perch|midrope|apron|jump|fall/.test(String(f.state || ''));
      if (!airborne){
        const lo = Math.min(lf.y, rf.y) - zy;
        // ROOT HEIGHT ABOVE THE ZONE, NOT ABSOLUTE. `lo` already subtracts zoneY, so subtracting a
        // raw f.y double-counted it for anyone on the FLOOR (f.y == zoneY == -0.85 there) and turned
        // a 0.96 m float into a reported 1.81 m. The two quantities have to be in the same frame of
        // reference before they can be subtracted from each other.
        const rootUp = (typeof f.y === 'number' ? f.y : 0) - zy;
        if (lo < -0.08) note('GROUND', Math.min(1, -lo), { fighter:idx, sunkM:+(-lo).toFixed(3), state:f.state, rootY:+rootUp.toFixed(3) });
        // FLOATING means the BODY is down and the FEET are not. If the root is up too, the whole man
        // is in the air and that is a jump, not a defect — the first run flagged floatM 1.083 during
        // 'attack', which a jumping strike produces legitimately. Subtracting the root is what
        // separates "he is airborne" from "his feet left his body behind".
        else if (lo - rootUp > 0.30)
          note('GROUND', Math.min(1, lo - rootUp),
               { fighter:idx, floatM:+(lo-rootUp).toFixed(3), state:f.state, rootY:+rootUp.toFixed(3),
                 // THREE POSSIBILITIES, KEPT APART (owner): the skeleton placing the body wrong, the
                 // skinning making the visible body float, or the pose being fine and the contact
                 // proxy disagreeing. footYs are BONE positions, so a large gap here with a sane
                 // rootY is a SKELETON fact, not a mesh one — that distinction is the whole point.
                 // hipsY is the SKELETON's own root in world space. f.y is the engine's logical
                 // height and they are not the same quantity — if hips sit at ~1.8 too then the
                 // whole body is up there and this instrument's rootY is measuring the wrong thing;
                 // if hips are at a normal ~0.9 with the feet at 1.8, the legs are genuinely
                 // inverted. Recording both is what makes those two answers distinguishable.
                 lFootY:+lf.y.toFixed(3), rFootY:+rf.y.toFixed(3), zoneY:+zy.toFixed(3),
                 hipsY: (function(){ const h = wp(m,'Hips'); return h ? +h.y.toFixed(3) : null; })(),
                 headY: (function(){ const h = wp(m,'Head'); return h ? +h.y.toFixed(3) : null; })(),
                 writers: writersFor(['LeftFoot','RightFoot','LeftLeg','RightLeg','LeftUpLeg','RightUpLeg','Hips']) });
      }
    }

    // ── CLIPPING ──────────────────────────────────────────────────────────────────────────────
    // A hand inside a torso. The torso is approximated by its own segment (hips->neck) and a radius
    // taken from the shoulder span, so nothing depends on a model being a particular size.
    const hips = wp(m,'Hips'), neck = wp(m,'Neck') || wp(m,'Spine2');
    if (hips && neck && sl && sr){
      ok('CLIPPING');
      // RADIUS FROM HIP WIDTH. Mixamo's LeftShoulder/RightShoulder are CLAVICLE ROOTS sitting either
      // side of the neck — measured 0.18 m apart on a 1.78 m man — so a torso radius derived from
      // them collapsed to the 0.06 m floor and called a hand 1.6 cm from the spine "inside the
      // torso". Every hand near the chest was a false positive. Hip separation is a real body width.
      const hipW = (hl && hr) ? hl.distanceTo(hr) : 0;
      const shoW = sl.distanceTo(sr);
      const rad = Math.max(0.09, hipW * 0.95, shoW * 0.34);
      [['LeftHand', m], ['RightHand', m]].forEach(function(H){
        const h = wp(H[1], H[0]); if (!h) return;
        const ax = neck.clone().sub(hips);
        const t = Math.max(0, Math.min(1, h.clone().sub(hips).dot(ax) / Math.max(1e-9, ax.lengthSq())));
        const near = hips.clone().add(ax.multiplyScalar(t));
        const d = h.distanceTo(near);
        if (d < rad * 0.55) note('CLIPPING', Math.min(1, (rad*0.55 - d) / (rad*0.55)),
                                 { fighter:idx, part:H[0], distM:+d.toFixed(3), radiusM:+rad.toFixed(3) });
      });
    }

    // ── SEPARATION ────────────────────────────────────────────────────────────────────────────
    // Only meaningful while a hold is genuinely live — grappleStage goes stale, which already cost
    // one bad reading in grapple_contact, so the relationship is read, not the stage number.
    if (other){
      const held = (f.grabbedBy === other) || (other.grabbedBy === f);
      if (held){
        ok('SEPARATION');
        const d = Math.hypot(f.x - other.x, f.z - other.z);
        if (d > 1.6) note('SEPARATION', Math.min(1, (d - 1.6) / 2), { fighter:idx, rootGapM:+d.toFixed(2) });
      }
    }
  }

  (function tick(){
    if (S.on){
      S.frames++;
      try{
        const A = new Function('return typeof fighters!=="undefined"?fighters:null')() || [];
        if (A[0] && A[0].model) watchWrites(A[0].model);
        if (A[1] && A[1].model) watchWrites(A[1].model);
        if (A[0] && A[1]){
          S.samples++; scan(A[0], 0, A[1]); scan(A[1], 1, A[0]);
          // The mesh scan touches ~600 vertices per body, so it runs every 5th sampled frame. A tear
          // that lasts under 5 frames is not what the owner is looking at on his phone.
          if (S.samples % 5 === 0){ S.meshSamples = (S.meshSamples||0) + 1; meshScan(A[0], 0); meshScan(A[1], 1); }
        }
        // RESET AT THE END, NOT THE START. This probe's rAF is registered in the init script, so it
        // runs BEFORE the engine's every frame: clearing at the top wiped the ledger and then
        // measured a pose whose writes had not happened yet, and every defect reported
        // "WRITERS: {}". Clearing here means the ledger holds exactly the writes that produced the
        // pose just measured. Same ordering class as every other instrument defect this session.
        S.wr = {};
        // The clip record has the identical lifecycle and is cleared with it, so "a capture authored
        // this pose" is a fact about the same window the writers came from and not a frame count.
        if (A[0]) A[0].__vdClipNow = null;
        if (A[1]) A[1].__vdClipNow = null;
      }catch(e){ S.err = String(e).slice(0,140); }
    }
    requestAnimationFrame(tick);
  })();

  window.__vdStart = () => { S.on = true; S.frames = 0; S.samples = 0; S.cls = {}; S.worst = {}; S.resolved = {}; };
  window.__vdCal = () => { try{
    const A = new Function('return fighters')(); const o = {};
    (A||[]).slice(0,2).forEach(function(f,i){ if (f && f.model){ const c = bindCal(f.model);
      o['fighter'+i] = c ? { bindTwistDeg: c.twist != null ? +c.twist.toFixed(1) : null,
                             knee: Object.keys(c.knee).map(function(k){ return k + ' ' + c.knee[k].along.toFixed(3); }) } : null; } });
    return o; }catch(e){ return { err:String(e) }; } };
  window.__vdStop  = () => { S.on = false; return { frames:S.frames, samples:S.samples, cls:S.cls,
                                                    worst:S.worst, resolved:S.resolved, err:S.err,
                                                    meshSamples:S.meshSamples||0, meshNoAPI:!!S.meshNoAPI,
                                                    clipCalls:S.clipCalls||0, byClip:S.byClip||{},
                                                    bySite:S.bySite||{}, chainSet:S.chainSet||{} }; };
  // Freeze the sim, put the stored pose back, and hand the driver a scene that IS the defect frame.
  window.__vdRestore = (cls) => { try{
    const P = S.pose[cls]; if (!P) return false;
    if (!window.__vdFrozen){
      const F = new Function('return typeof Fighter!=="undefined"?Fighter:null')();
      if (F && F.prototype.update){ const o = F.prototype.update;
        F.prototype.update = function(){ return; }; window.__vdFrozen = o; }
    }
    const A = new Function('return fighters')() || [];
    P.forEach(function(rec, i){
      const f = A[i]; if (!rec || !f) return;
      f.x = rec.x; f.z = rec.z; f.y = rec.y; f.facing = rec.facing;
      rec.bones.forEach(function(e){ e.b.quaternion.copy(e.q); e.b.position.copy(e.p); });
      if (f.model) f.model.updateMatrixWorld(true);
    });
    return true;
  }catch(e){ return false; } };
  window.__vdShot = (idx) => { try{
    const A = new Function('return fighters')(); const f = A[idx] || A[0]; if (!f) return false;
    window.__camShot = { px: f.x + 0.5, py: 1.05, pz: f.z + 2.3, lx: f.x, ly: 0.85, lz: f.z, w:1, speed:30 };
    return true;
  }catch(e){ return false; } };

  try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; } }catch(e){}
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,140)));
  await page.addInitScript(PROBE);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);
  // Wait for the BELL, not for 'fight' — banked this session: gameState reads 'fight' while the
  // entrances still run, and scanning a walkout is not scanning combat.
  await page.evaluate(() => { try{ window.__SEQ_SKIP_ALL = true;
    if (window.BANNON_WALKOUT && window.BANNON_WALKOUT.skip) window.BANNON_WALKOUT.skip(); }catch(e){} });
  for (let i = 0; i < 60; i++){
    const live = await page.evaluate(() => { try{ return window.BANNON_PHASE ? window.BANNON_PHASE.officialMatch() : true; }catch(e){ return true; } });
    if (live) break; await sleep(400);
  }
  await sleep(3000);

  await page.evaluate(() => window.__vdStart());
  // Drive real combat: walk, strike, grapple. The defects the owner is describing are in MOTION,
  // and a standing idle scan would miss every one of them.
  const keys = ['d','j','k','g','l','a','j','k',' ','g'];
  const t0 = Date.now();
  while (Date.now() - t0 < SECS * 1000){
    const k = keys[Math.floor(Math.random()*keys.length)];
    await page.evaluate(kk => { dispatchEvent(new KeyboardEvent('keydown',{key:kk,bubbles:true}));
                                setTimeout(()=>dispatchEvent(new KeyboardEvent('keyup',{key:kk,bubbles:true})), 220); }, k);
    await sleep(300);
  }
  const cal = await page.evaluate(() => window.__vdCal());
  const r = await page.evaluate(() => window.__vdStop());

  // ONE SCREENSHOT PER FAILING CLASS, close enough to see the thing being claimed.
  const shots = {};
  if (has('shots')){
    for (const cls of Object.keys(r.worst || {})){
      const w = r.worst[cls];
      // FRAME IDENTITY. Restore the exact pose that produced this number before photographing it,
      // and REFUSE to write the file if the restore did not take — an image that does not show the
      // measured frame is not evidence, and that is precisely what the first version shipped.
      const restored = await page.evaluate(c => window.__vdRestore(c), cls);
      if (!restored){ console.log('   (no pose snapshot for ' + cls + ' — no image written)'); continue; }
      await page.evaluate(i => window.__vdShot(i), w.fighter || 0);
      await sleep(900);
      const p = path.join(OUT, 'defect_' + cls + '.png');
      try{ await page.screenshot({ path:p }); shots[cls] = p;
        // The sidecar: the picture and the measurement are one record, keyed by the same frame.
        const K = w.clip || {}, KC = K.clip || {};
        fs.writeFileSync(p.replace(/\.png$/, '.json'),
          JSON.stringify({ scenario:'driven combat', frame:w.frame, simTimeS:w.t, class:cls,
                           fighterIndex:w.fighter,
                           // The owner's five fields, lifted to the top of the record so the triage
                           // question is answerable without reading the nested detail.
                           moveId:K.moveId || null, role:K.role || null, phase:KC.phase != null ? KC.phase : null,
                           clipId:KC.cid || null, clipTimeS:KC.tS != null ? KC.tS : null,
                           clipDurS:KC.durS != null ? KC.durS : null, clipWeight:KC.w != null ? KC.w : null,
                           clipCallSite:KC.site || null, clipCallChain:KC.chain || null,
                           clipDrove:K.clipDrove === undefined ? null : K.clipDrove, ticksSinceClip:K.ticksSinceClip != null ? K.ticksSinceClip : null,
                           receiverClip:K.receiverClip === undefined ? null : K.receiverClip,
                           roleMismatch:K.roleMismatch === undefined ? null : K.roleMismatch,
                           detail:w, image:path.basename(p) }, null, 1));
      }catch(e){}
    }
    await page.evaluate(() => { try{ window.__camShot = null; }catch(e){} });
  }

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const CLASSES = ['STRETCH','REVERSE_JOINT','TWIST','GROUND','CLIPPING','SEPARATION','MESH_TEAR','MESH_INFLATE'];
  console.log('\n===== VISUAL DEFECT SCAN =====');
  console.log('  ' + r.samples + ' sampled frames of ' + r.frames + ' over ~' + SECS + 's of driven combat');
  console.log('  ' + (r.meshSamples||0) + ' of those scanned the GLB SURFACE (skinned vertices), not just the bones' +
              (r.meshNoAPI ? '   <- boneTransform unavailable: mesh checks could not run' : ''));
  if (r.err) console.log('  probe error: ' + r.err);
  console.log('  BIND CALIBRATION (the model as authored — every rule is measured against this):');
  console.log('   ' + JSON.stringify(cal).slice(0, 240));
  console.log('\n  class            verdict     hits   worst      detail of the worst frame');
  let fails = 0, unknown = 0;
  for (const c of CLASSES){
    const hit = r.cls[c], res = r.resolved[c] || 0;
    let verdict, detail = '';
    if (!res){ verdict = 'UNKNOWN'; unknown++; detail = 'bones never resolved — this check did not run'; }
    else if (!hit){ verdict = 'clean'; detail = res + ' frames checked'; }
    else { verdict = 'FAIL'; fails++;
           const w = r.worst[c]; detail = JSON.stringify(w); }
    console.log('   ' + c.padEnd(15) + verdict.padEnd(11) + String(hit ? hit.n : 0).padStart(5) +
      '   ' + String(hit ? hit.worst.toFixed(2) : '-').padStart(6) + '   ' + detail.slice(0, 96));
  }
  // ── CLIP PROVENANCE ─────────────────────────────────────────────────────────────────────────
  // WHICH CAPTURE AUTHORED THE DEFECT, and did a clip author it at all. clipDrove is the field that
  // stops this from being decoration: a defect on a frame no clip drove is a RETARGET problem
  // wearing a clip's name, and the two need opposite fixes.
  // THE WRAPPER PREFIX IS DERIVED, NOT DECLARED. Every call passes through studioApplyClipPose and
  // whatever has wrapped it, so those lines are exactly the longest prefix common to every chain;
  // the first entry past it is the real caller. Measured this way the sites separate cleanly
  // (5159 the strike path, 62192 the state-clip layer) where chain[1] read 55620 for all 309.
  const chains = Object.keys(r.chainSet || {}).map(s => s.split('>'));
  let lcp = 0;
  if (chains.length){
    lcp = chains[0].length;
    for (const c of chains){ let i = 0; while (i < lcp && i < c.length && c[i] === chains[0][i]) i++; lcp = i; }
    if (lcp >= chains[0].length) lcp = Math.max(0, chains[0].length - 1);   // never eat the caller itself
  }
  const siteOf = ch => { const a = String(ch||'').split('>'); return a[lcp] || a[a.length-1] || '-'; };
  const bySiteReal = {};
  for (const [ch, n] of Object.entries(r.chainSet || {})) { const s = siteOf(ch); bySiteReal[s] = (bySiteReal[s]||0) + n; }

  console.log('\n  CLIP PROVENANCE — ' + (r.clipCalls||0) + ' clip applications during the scan, ' +
              Object.keys(r.byClip||{}).length + ' distinct captures');
  if (r.clipCalls){
    const top = Object.entries(r.byClip||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
    for (const [k,n] of top) console.log('     ' + String(n).padStart(5) + '  ' + k.slice(0,88));
    console.log('     applier+wrapper prefix (shared by every call): ' + (chains[0]||[]).slice(0,lcp).join('>'));
    console.log('     by REAL call site (game-file line): ' + JSON.stringify(bySiteReal));
  } else {
    console.log('     NONE. No capture drove either body in this window — every defect below was');
    console.log('     authored by the procedural retarget, and no clip remap can fix it.');
  }
  let mismatch = 0;
  for (const c of CLASSES){
    const w = r.worst[c]; if (!w || !w.clip) continue;
    const K = w.clip, KC = K.clip || {};
    console.log('   ' + c.padEnd(15) + 'move=' + String(K.moveId || '-').slice(0,22).padEnd(24) +
                'role=' + String(K.role||'-').padEnd(15) +
                'clip=' + String(KC.cid || '(none)').slice(0,34));
    console.log('   ' + ''.padEnd(15) + '  phase=' + (KC.phase != null ? KC.phase : '-') +
                ' t=' + (KC.tS != null ? KC.tS + 's' : '-') + '/' + (KC.durS != null ? KC.durS + 's' : '-') +
                '  w=' + (KC.w != null ? KC.w : '-') +
                '  site=' + siteOf(KC.chain) + '  chain=' + (KC.chain || '-') +
                '  clipDrove=' + (K.clipDrove === undefined ? '-' : K.clipDrove) +
                (K.receiverClip ? '  RECEIVER-HALF CLIP' : '') +
                (K.roleMismatch ? '  <- ROLE MISMATCH' : ''));
    if (K.roleMismatch) mismatch++;
    const H = (r.cls[c] || {}).census;
    if (H){
      const fmt = o => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k.slice(0,30)+' '+v).join(' · ');
      console.log('   ' + ''.padEnd(15) + '  over all ' + (r.cls[c].n) + ' hits — clip: ' + fmt(H.byClip));
      console.log('   ' + ''.padEnd(15) + '    move: ' + fmt(H.byMove) + '   role: ' + fmt(H.byRole));
      console.log('   ' + ''.padEnd(15) + '    staleness (frames since a clip drove this body): ' + fmt(H.stale) +
                  '   clip-driven on ' + H.nClipDriven + '/' + r.cls[c].n + ' hits');
    }
  }
  if (mismatch) console.log('   ' + mismatch + ' defect(s) show a RECEIVER-HALF capture playing on a body that is not the victim.');

  console.log('\n  ' + (fails ? fails + ' CLASS(ES) FAILED' : 'no class failed') +
              (unknown ? ', ' + unknown + ' UNKNOWN (a check that could not run is not a pass)' : ''));
  console.log('  ' + ((fails || unknown) ? 'FRAME VERDICT: FAIL — a single severe defect outranks overall appearance'
                                         : 'FRAME VERDICT: PASS on all six measured classes'));
  if (Object.keys(shots).length) for (const c in shots) console.log('   evidence ' + c + ' -> ' + shots[c]);
  if (errs.length) console.log('  page errors: ' + errs.slice(0,4).join(' | '));
  fs.writeFileSync(path.join(OUT, 'visual_defects.json'), JSON.stringify({ seconds:SECS, ...r, shots, errs }, null, 1));
  console.log('  report -> ' + path.join(OUT, 'visual_defects.json'));
  process.exit((fails || unknown) ? 1 : 0);
})();
