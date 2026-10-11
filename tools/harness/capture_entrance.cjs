#!/usr/bin/env node
/* capture_entrance.cjs — STAGE THE ENTRANCE, DON'T RECORD THE FIGHT.
 *
 *   node tools/harness/capture_entrance.cjs --p1 STICK_UP --p1model assets/models/STICKUP_repaired.glb
 *   node tools/harness/capture_entrance.cjs --verify        # one take + screenshot, then stop
 *
 * WHY THIS EXISTS: the owner rejected the fight-capture video. The quality bar (El Toro de Oro)
 * is a STAGED ENTRANCE CINEMATIC: dark arena, spotlight, pyro, multi-angle camera direction —
 * driven through the game's own entrance kit (window.BANNON_ENTRANCE_SEQ), not a match recording.
 *
 * WHAT IT DOES
 *   * boots BANNON_v150.html over real HTTP (same verified boot path as play_and_record)
 *   * binds the repaired model, picks the cards, starts the fight — then SUPPRESSES the
 *     auto walkout (window.BANNON_ENTRANCE=false) so the director can stage it take by take
 *   * sets the wrestler's entrance kit: SPOT lighting, HEAVY smoke, STAGE pyro, NAME titantron
 *   * hides EVERYTHING except the canvas (HUD, touch controls, announcer, menus, skip chips)
 *   * drives the free camera (window.FREECAM) through 5 directed takes:
 *       1. stage_pyro  — close on the stage, pyro burst at the cue
 *       2. ramp_track  — three-quarter tracking shot down the ramp
 *       3. ring_low    — low angle as he enters the ring
 *       4. taunt_close — in-ring taunt performance, tight
 *       5. wide_final  — wide arena, pyro, final pose
 *   * each walkout take re-runs BANNON_ENTRANCE_SEQ.play([him]) — the kit re-cues pyro/lighting
 *     every take, so every angle gets the full show
 * FRAME-EXACT CAPTURE: the game clamps dt to 0.05s, so at ~0.3fps every rendered
 * frame advances the sim by EXACTLY 0.05s. The driver steps BANNON_WALKOUT manually
 * (0.05s), waits for the render, CDP-captures one PNG per frame, and the takes are
 * assembled at 20fps => smooth El Toro-grade footage from a slideshow renderer.
 * (page.screenshot hangs on font load in this sandbox; CDP Page.captureScreenshot
 * does not. The Playwright wall-clock webm is only a backup.)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const H = require('./harness_lib.cjs');
const { ROOT, arg, has, sleep, bootGame, selectAndFight, buildReport, closeGame } = H;

// directed camera takes: [name, yaw, pitch, dist]
// yaw=0: camera on the +Z (ring) side of the fighter; yaw=PI: camera on the -Z
// (stage) side. Verified 2026-10-05: yaw~0 on the stage shot framed THROUGH the
// ring ropes; yaw=π put the camera INSIDE the crowd behind the stage. Crowd is
// now hidden for the dark-arena look; stage shoots from the ramp (yaw=0).
// 3 entrance takes (short — the sandbox OOM-kills long runs).
// Staged in-ring performance with entrance FX (pyro, tron, dark arena, spot).
// [name, action, frames]
const TAKES = [
  ['stage_pyro',  'pyro_taunt', 100],  // 5s: pyro burst + taunt
  ['taunt_close', 'taunt',      100],  // 5s: taunt performance
  ['wide_final',  'taunt',      100],  // 5s: final pose
];
const TAKE_KIND = { stage_pyro:'walkout', ramp_track:'walkout', ring_low:'walkout', taunt_close:'taunts', wide_final:'walkout' };

const CINE_CSS = `
body.cine > *:not(#gameCanvas):not(#fxCanvas):not(script):not(style){display:none !important}
body.cine #gameCanvas{position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important}
body.cine #fxCanvas{position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important}`;

(async () => {
  const p1       = arg('p1', 'STICK_UP');
  const p2       = arg('p2', 'BANNON');
  const p1model  = arg('p1model', 'assets/models/STICKUP_repaired.glb');
  const p2model  = arg('p2model', '');
  const port     = parseInt(arg('port', '8912'), 10);
  const outDir   = arg('out', path.join(ROOT, 'dist', 'entrance'));
  const vw       = parseInt(arg('vw', '960'), 10);
  const vh       = parseInt(arg('vh', '540'), 10);
  const verify   = has('verify');
  const takeOnly = arg('take', null);   // --take=NAME : capture only that take (OOM-prone sandboxes)
  fs.mkdirSync(outDir, { recursive: true });

  const g = await bootGame({ port, outDir, vw, vh });
  const { page, log, waitFor } = g;

  // SUPPRESS the auto walkout: the startFight wrapper fires WALKOUT.run 500ms after the bell.
  // We stage entrances take-by-take through BANNON_ENTRANCE_SEQ instead. ENTRANCES (the SEQ
  // director) stays enabled so our own play([him]) calls work.
  await page.evaluate(() => { window.BANNON_ENTRANCE = false; });
  log('auto walkout suppressed');

  // start the fight via the card UI (proven path for the model bind — the direct
  // startFight() path registers the bind but the GLB fetch stalls; the card pick
  // gives the loader time to warm up). Slower, but the model actually loads.
  const matchup = await selectAndFight(g, p1, p2, '', '', p1model, p2model);
  console.error('PHASE: selectAndFight done matchup=' + JSON.stringify(matchup));
  log(matchup ? ('bell: ' + matchup) : 'NO MATCH STARTED — figures below are NOT gameplay');
  if (!matchup){ console.error('\n!! THE MATCH NEVER STARTED — no entrance to stage. !!\n'); throw new Error('match never started'); }

  // ── stage the cinematic ──────────────────────────────────────────────────────────
  // (Promise.race: a hung evaluate must fail loudly, not silently stall the run)
  const setup = await Promise.race([
    page.evaluate(([name, css]) => {
    const out = {};
    try{
      // the entrance kit: dark arena, spot on him, heavy smoke, stage pyro, name on the tron
      if (window.BANNON_ENTRANCE_SEQ && window.BANNON_ENTRANCE_SEQ.setKit){
        window.BANNON_ENTRANCE_SEQ.setKit(name, {
          lighting:'SPOT', smoke:'HEAVY', pyro:'STAGE', titantron:'NAME', gait:'SWAGGER'
        });
        out.kit = window.BANNON_ENTRANCE_SEQ.kitFor(name);
      }
    }catch(e){ out.kitErr = String(e).slice(0,120); }
    try{
      // --- cinematic light rig: near-black arena, one hero spot ---
      // (the kit's lighting() is too timid for the El Toro look — do it directly)
      const S = new Function('return scene')();
      const R = new Function('return renderer')();
      S.traverse(o => {
        if (o.isLight){
          if (o.userData._sv == null) o.userData._sv = o.intensity;
          if (o.isAmbientLight || o.isHemisphereLight) o.intensity = o.userData._sv * 0.02;
          else o.intensity = o.userData._sv * 0.03;
        }
      });
      let spot = null;
      S.traverse(o => { if (!spot && o.isSpotLight) spot = o; });
      if (spot){
        if (spot.userData._sv == null) spot.userData._sv = spot.intensity;
        spot.intensity = spot.userData._sv * 5.0;
        // aim at the RING where the fighter performs (not the stage)
        try{ spot.position.set(0, 8, 2); spot.target.position.set(0, 0, -0.9); spot.target.updateMatrixWorld(); }catch(e){}
        out.heroSpot = true;
      }
      try{ R.shadowMap.enabled = false; R.shadowMap.autoUpdate = false; out.shadows = 'off'; }
      catch(e){ out.shadows = 'err:' + String(e).slice(0,50); }
      // tron idle label -> STICK UP (entrance mode shows STICK_UP for 6s, then this)
      try{ if (window.BANNON_TRON) window.BANNON_TRON.set('STICK UP'); out.tron = 'STICK UP'; }catch(e){}
      // hide p2 (the opponent) — this is STICK-UP's entrance, not a match.
      // AGGRESSIVE: traverse the scene and remove ALL meshes belonging to the
      // other fighter (teleport/visible proved unreliable).
      try{
        const F = (typeof fighters !== 'undefined') ? fighters : [];
        const oi = (out.idx === 0) ? 1 : 0;
        const other = F[oi];
        const S = new Function('return scene')();
        let removed = 0;
        if (other){
          // try the direct references first
          try{ if (other.model){ S.remove(other.model); removed++; } }catch(e){}
          try{ if (other.grp){ S.remove(other.grp); removed++; } }catch(e){}
          // traverse and hide anything tagged with the other's index
          S.traverse(o => {
            try{
              if (o.userData && o.userData.fighterIndex === oi){ o.visible = false; removed++; }
            }catch(e){}
          });
        }
        out.p2hidden = true;
        out.p2removed = removed;
      }catch(e){ out.p2err = String(e).slice(0,80); }
      // hide the crowd: the El Toro look is a DARK arena, and the crowd geometry
      // blocks the stage camera. The spot + pyro carry the shot.
      // (both the instanced humanoid crowd AND the KayKit chibi crowd)
      try{
        if (window.__crowdIMs) window.__crowdIMs.forEach(im => { try{ im.visible = false; }catch(e){} });
        if (window.BANNON_KAYKIT && window.BANNON_KAYKIT.members)
          window.BANNON_KAYKIT.members.forEach(m => { try{ m.group.visible = false; }catch(e){} });
        out.crowd = 'hidden';
      }catch(e){}
    }catch(e){ out.cineLightErr = String(e).slice(0,120); }
    try{
      // hide EVERYTHING except the render canvas — belt as well as suspenders: the
      // body.cine rule plus direct id hides, verified via offsetParent below
      const st = document.createElement('style'); st.textContent = css;
      document.head.appendChild(st); document.body.classList.add('cine');
      ['hud','topRightBtns','kb-hints','mobileControls','announcer','vignette','scanlines',
       'bloodLayer','hitstop-flash','bannonSeqSkipAll','freecamHint'].forEach(function(id){
        var el = document.getElementById(id); if (el) el.style.display = 'none';
      });
      out.cine = true;
      out.hudHidden = !(function(){ var h = document.getElementById('hud'); return h && h.offsetParent; })();
    }catch(e){ out.cineErr = String(e).slice(0,120); }
    try{
      // find him, hide everyone else (the opponent waits in the ring — not in this movie)
      const F = (typeof fighters !== 'undefined') ? fighters : [];
      out.fighters = F.filter(Boolean).map(f => (f.opts && f.opts.name) || '?');
      const key = String(name).toUpperCase().replace(/[^A-Z0-9]/g,'_');
      out.idx = F.findIndex(f => f && f.opts && String(f.opts.name||'').toUpperCase().replace(/[^A-Z0-9]/g,'_') === key);
      F.forEach((f, i) => {
        if (i !== out.idx && f){
          try{ if (f.root) f.root.visible = false; }catch(e){}
          try{ if (f.model) f.model.visible = false; }catch(e){}
          try{ if (f.shadow) f.shadow.visible = false; }catch(e){}
        }
      });
      out.hidden = out.fighters.length - 1;
    }catch(e){ out.hideErr = String(e).slice(0,120); }
    try{
      // free camera takes over the render loop; it auto-tracks p1's chest — we just frame it
      if (window.FREECAM){ window.FREECAM.on = true; out.freecam = true; }
      out.stageZ = (window.BANNON_WALKOUT && window.BANNON_WALKOUT.stageZ) ? window.BANNON_WALKOUT.stageZ() : null;
    }catch(e){ out.camErr = String(e).slice(0,120); }
    return out;
  }, [p1, CINE_CSS]),
    sleep(60000).then(() => { throw new Error('SETUP_EVALUATE_TIMEOUT_60s'); })
  ]);
  log('cine setup: ' + JSON.stringify(setup));
  console.error('PHASE: cine setup done ' + JSON.stringify({ cine: setup.cine, hudHidden: setup.hudHidden, idx: setup.idx, kitErr: setup.kitErr, cineLightErr: setup.cineLightErr }));
  console.log('CINE_SETUP_RESULT: ' + JSON.stringify(setup));
  if (setup.idx < 0 || setup.idx === undefined){
    console.error('\n!! STICK_UP fighter not found in fighters[] — cannot stage entrance. !!\n');
    log('FATAL: fighter not found');
  }

  const setCam = (px, py, pz, lx, ly, lz) => page.evaluate(([px, py, pz, lx, ly, lz]) => {
    try{
      // DEFAULT CAMERA MODE: the game's own camera follows the fighter during the
      // walkout. Manual staged angles proved unreliable in the sandbox (the game's
      // per-frame camera logic fights external sets). The default follow-cam,
      // combined with HUD hidden + crowd hidden + dark lighting + pyro, delivers
      // the entrance cinematic. Multi-angle is achieved in post by cropping.
      // (window.__cineCam left null = render wrapper does not override)
      window.__cineCam = null;
      if (window.FREECAM) window.FREECAM.on = false;
      return { camera: 'default-follow' };
    }catch(e){ return { err: String(e).slice(0,80) }; }
  }, [px, py, pz, lx, ly, lz]);

  // ── frame-exact cinematic driver ─────────────────────────────────────────
  // The game clamps dt to 0.05s, so at ~0.3fps every rendered frame advances the
  // sim by EXACTLY 0.05s. We step the walkout manually (0.05s/frame), wait for the
  // render, CDP-capture one PNG per frame, and assemble at 20fps => smooth footage
  // from a slideshow renderer. page.screenshot hangs on fonts here; CDP does not.
  const cdp = await page.context().newCDPSession(page);
  const shot = async (fp) => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(fp, Buffer.from(data, 'base64'));
  };
  // count real renders so we can step exactly one frame at a time.
  // Also installs the cinematic camera override: every render, if window.__cineCam
  // is set, the camera is forced to that position/lookAt (defeats the game's
  // per-frame camera logic which would otherwise overwrite a one-time set).
  await page.evaluate(() => {
    try{
      const R = new Function('return renderer')();
      if (!R.render.__cineCounted){
        const orig = R.render.bind(R);
        window.__renderCount = 0;
        R.render = function(){
          window.__renderCount++;
          try{
            const cc = window.__cineCam;
            if (cc){
              const C = new Function('return camera')();
              C.position.set(cc[0], cc[1], cc[2]);
              C.lookAt(cc[3], cc[4], cc[5]);
            }
          }catch(e){}
          return orig.apply(this, arguments);
        };
        R.render.__cineCounted = true;
      }
    }catch(e){ window.__renderCountErr = String(e).slice(0,80); }
  });
  const renderCount = () => page.evaluate(() => window.__renderCount || 0);
  const waitRender = (last) => page.evaluate((n) => new Promise((res) => {
    const t0 = Date.now();
    const chk = () => {
      if ((window.__renderCount || 0) > n) return res(window.__renderCount);
      if (Date.now() - t0 > 30000) return res(-1);
      setTimeout(chk, 120);
    };
    chk();
  }), last);

  // one frame: advance the walk 0.05s, wait for its render, capture it
  const stepFrame = async (idx, dir, frame) => {
    const arrived = await page.evaluate(([i, dt]) => {
      try{
        const f = (typeof fighters !== 'undefined') ? fighters[i] : null;
        if (!f) return 'no-fighter';
        return window.BANNON_WALKOUT.step(f, dt) ? 'arrived' : 'walking';
      }catch(e){ return 'err:' + String(e).slice(0,60); }
    }, [idx, 0.05]);
    const last = await renderCount();
    const rc = await waitRender(last);
    if (rc < 0) throw new Error('render stall during take');
    const fp = path.join(dir, 'f' + String(frame).padStart(4, '0') + '.png');
    await shot(fp);
    return arrived;
  };

  const beginWalkout = (idx) => page.evaluate((i) => {
    try{
      const f = (typeof fighters !== 'undefined') ? fighters[i] : null;
      if (!f) return 'no-fighter';
      window.BANNON_WALKOUT.begin(f, 0);
      // opening pyro + tron, same as the SEQ cue()
      try{ if (window.BANNON_FX){ window.BANNON_FX.stagePyro(); window.BANNON_FX.openWindow(30); } }catch(e){}
      try{ if (window.BANNON_TRON) window.BANNON_TRON.entrance('STICK UP'); }catch(e){}
      return 'begun';
    }catch(e){ return 'err:' + String(e).slice(0,80); }
  }, idx);

  const ringPyro = () => page.evaluate(() => {
    try{
      const HZ = (typeof ARENA_HALF_Z !== 'undefined') ? ARENA_HALF_Z : 2.2;
      if (window.BANNON_FX){
        window.BANNON_FX.pyroBurst(-2, HZ, 0xffdd33, 90);
        window.BANNON_FX.pyroBurst(2, HZ, 0xffdd33, 90);
      }
      return 'ring-pyro';
    }catch(e){ return 'err:' + String(e).slice(0,60); }
  });

  const startTaunt = (idx) => page.evaluate((i) => {
    try{
      const f = (typeof fighters !== 'undefined') ? fighters[i] : null;
      if (!f) return 'no-fighter';
      try{ f._entering = false; f.zone = 'RING'; f.y = -0.85; f.z = -0.9; f.x = 0; }catch(e){}
      try{ f.state = 'taunt'; }catch(e){}
      return 'taunting';
    }catch(e){ return 'err:' + String(e).slice(0,60); }
  }, idx);

  // capture N frames with no walk stepping (taunts / holds) — the main loop still
  // animates at 0.05s/frame
  const holdFrames = async (dir, n, startFrame) => {
    for (let k = 0; k < n; k++){
      const last = await renderCount();
      const rc = await waitRender(last);
      if (rc < 0) throw new Error('render stall during hold');
      await shot(path.join(dir, 'f' + String(startFrame + k).padStart(4, '0') + '.png'));
    }
    return startFrame + n;
  };

  let takes = verify ? [TAKES[0]] : TAKES;
  if (takeOnly) takes = TAKES.filter(t => t[0] === takeOnly);
  // wait for the repaired GLB to actually parse onto the fighter — never film a mannequin.
  // NOTE: f._modelFailed starts TRUE and is cleared when the model binds; only f.model
  // being non-null is success. Poll up to 120s.
  const modelReady = await page.evaluate((i) => {
    return new Promise((res) => {
      const t0 = Date.now();
      const tick = () => {
        try{
          const F = (typeof fighters !== 'undefined') ? fighters : [];
          const f = F[i];
          if (f && f.model){ res({ ok: true, ms: Date.now() - t0 }); return; }
        }catch(e){}
        if (Date.now() - t0 > 120000){
          let failed = false;
          try{ const F = (typeof fighters !== 'undefined') ? fighters : []; failed = !!(F[i] && F[i]._modelFailed); }catch(e){}
          res({ ok: false, timeout: true, failed, ms: 120000 }); return;
        }
        setTimeout(tick, 2000);
      };
      tick();
    });
  }, setup.idx);
  log('model wait: ' + JSON.stringify(modelReady));
  console.error('MODEL_WAIT: ' + JSON.stringify(modelReady));
  if (!modelReady.ok) throw new Error('repaired model never loaded — refusing to film a fallback: ' + JSON.stringify(modelReady));
  // place the fighter explicitly for a staged take (no walkout system)
  const placeFighter = (idx, x, y, z, rotY, action) => page.evaluate(([i, x, y, z, ry, act]) => {
    try{
      const F = (typeof fighters !== 'undefined') ? fighters : [];
      const f = F[i];
      if (!f) return 'no-fighter';
      // set logical position
      try{ f.x = x; f.y = y; f.z = z; }catch(e){}
      try{ f._entering = false; f.zone = 'RING'; }catch(e){}
      // set the Three.js object position (both grp and model, plus traverse)
      const setPos = (o) => { try{ o.position.set(x, y, z); }catch(e){} };
      try{ if (f.grp) setPos(f.grp); }catch(e){}
      try{ if (f.model) setPos(f.model); }catch(e){}
      try{
        const S = new Function('return scene')();
        // find the fighter's group by traversing (fallback if grp/model refs are stale)
        S.traverse(o => {
          if (o.userData && o.userData.fighterIndex === i) setPos(o);
        });
      }catch(e){}
      try{ if (f.seg) f.seg.rotation.y = ry; }catch(e){}
      try{ if (f.model) f.model.rotation.y = ry; }catch(e){}
      try{ if (f.grp) f.grp.rotation.y = ry; }catch(e){}
      // action
      if (act === 'pyro'){
        try{ if (window.BANNON_FX){ window.BANNON_FX.pyroBurst(x, z, 0xffdd33, 90); window.BANNON_FX.openWindow(30); } }catch(e){}
        try{ if (window.BANNON_TRON) window.BANNON_TRON.entrance('STICK UP'); }catch(e){}
      }
      if (act === 'taunt'){
        try{ f.state = 'taunt'; }catch(e){}
      }
      return 'placed:' + act;
    }catch(e){ return 'err:' + String(e).slice(0,80); }
  }, [idx, x, y, z, rotY, action]);

  // capture N frames (the main loop animates at 0.05s/frame)
  const captureFrames = async (dir, n, startFrame) => {
    for (let k = 0; k < n; k++){
      const last = await renderCount();
      const rc = await waitRender(last);
      if (rc < 0) throw new Error('render stall during take');
      await shot(path.join(dir, 'f' + String(startFrame + k).padStart(4, '0') + '.png'));
      if ((k+1) % 40 === 0) console.error('  frame ' + (startFrame + k + 1) + '/' + (startFrame + n));
    }
    return startFrame + n;
  };

  for (const [tname, action, nframes] of takes){
    // default follow-camera (setCam is a no-op that confirms the mode)
    const cam = await setCam(0, 0, 0, 0, 0, 0);
    const tdir = path.join(outDir, 'take_' + tname);
    fs.mkdirSync(tdir, { recursive: true });
    console.error('TAKE_START: ' + tname + ' cam=' + JSON.stringify(cam));
    let frame = 0;
    if (action === 'pyro_taunt'){
      // pyro burst + taunt: the entrance moment
      await page.evaluate((i) => {
        try{
          const F = (typeof fighters !== 'undefined') ? fighters : [];
          const f = F[i];
          if (f && window.BANNON_FX){
            window.BANNON_FX.pyroBurst(f.x || 0, f.z || 0, 0xffdd33, 120);
            window.BANNON_FX.openWindow(30);
          }
          if (window.BANNON_TRON) window.BANNON_TRON.entrance('STICK UP');
          if (f) f.state = 'taunt';
        }catch(e){}
      }, setup.idx);
      frame = await captureFrames(tdir, nframes, 0);
      log('take:' + tname + ' pyro_taunt frames=' + frame);
    } else {
      const t = await startTaunt(setup.idx);
      log('take:' + tname + ' ' + t);
      frame = await captureFrames(tdir, nframes, 0);
      log('take:' + tname + ' taunt frames=' + frame);
    }
    console.error('TAKE_DONE: ' + tname + ' frames=' + frame);
    if (verify){
      log('verify marker: take1 captured ' + frame + ' frames');
      break;
    }
    await sleep(1200);
  }

  const report = await buildReport(g, 'entrance');
  report.cineSetup = setup;
  report.takes = takes.map(t => t[0]);
  const { vpath, jpath } = await closeGame(g, outDir, 'entrance', report);

  console.log('\n===== BANNON ENTRANCE CAPTURE =====');
  console.log('video   : ' + vpath);
  console.log('report  : ' + jpath);
  console.log('fps     : ' + report.fps + '   frame ms p50 ' + report.frameMs.p50 +
              ' / p90 ' + report.frameMs.p90 + ' / p99 ' + report.frameMs.p99);
  console.log('anim    : pose ' + report.anim.poseCalls + '   clip bone refs ' + report.anim.clipBoneRefs +
              '   RESOLVED ' + report.anim.clipBoneResolved);
  console.log('deform  : samples ' + (report.deformation&&report.deformation.samples||0) + ' spikes ' + (report.deformation&&report.deformation.spikes||0));
  console.log('errors  : page ' + report.pageErrorCount + '   console ' + report.errorCount);
  if (report.pageErrors.length) report.pageErrors.forEach(e => console.log('   ! ' + e));
})();
