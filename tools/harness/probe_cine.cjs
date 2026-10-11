#!/usr/bin/env node
/* probe_cine.cjs — quick cinematic-lighting + fps probe. Boots, starts a fight directly,
 * enumerates the light rig, applies a dark-arena/spot look, disables shadows, measures fps.
 * Exits after reporting. No recording needed beyond fps numbers.
 */
const fs = require('fs');
const path = require('path');
const H = require('./harness_lib.cjs');
const { arg, has, sleep, bootGame, buildReport } = H;

(async () => {
  const port = parseInt(arg('port', '8913'), 10);
  const outDir = arg('out', '/tmp/cine_probe');
  const vw = parseInt(arg('vw', '854'), 10);
  const vh = parseInt(arg('vh', '480'), 10);
  fs.mkdirSync(outDir, { recursive: true });
  const g = await bootGame({ port, outDir, vw, vh });
  const { page, log } = g;

  await page.evaluate(() => {
    window.BANNON_ENTRANCE = false;
    window.MATCH_SETUP = { p1Name:'STICK_UP', p2Name:'BANNON', p1Control:'YOU', p2Control:'CPU' };
    try{ window.assignCharModel('STICK_UP', 'assets/models/STICKUP_repaired.glb', 'STICK_UP'); }catch(e){}
  });
  log('setup staged');
  await page.evaluate(() => { try{ new Function('return startFight')()(); }catch(e){} });
  const gameState = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } });
  const end = Date.now() + 60000;
  while (Date.now() < end){ if ((await gameState()) === 'fight') break; await sleep(500); }
  log('fight live: ' + (await gameState()));
  await sleep(12000); // let models parse

  // enumerate the light rig
  const lights = await page.evaluate(() => {
    const out = [];
    try{
      const S = new Function('return scene')();
      S.traverse(o => { if (o.isLight) out.push({ t: o.type, i: +o.intensity.toFixed(3),
        pos: o.position ? [ +o.position.x.toFixed(1), +o.position.y.toFixed(1), +o.position.z.toFixed(1) ] : null }); });
    }catch(e){ out.push({ err: String(e).slice(0,100) }); }
    return out;
  });
  console.error('LIGHTS: ' + JSON.stringify(lights));

  // baseline fps 8s
  await sleep(8000);
  let r = await buildReport(g, 'probe');
  console.error('BASELINE fps=' + r.fps + ' p50=' + r.frameMs.p50);

  // cinematic lighting: kill ambient to near-black, one spot on the ring
  const cine = await page.evaluate(() => {
    const out = {};
    try{
      const S = new Function('return scene')();
      out.saved = 0;
      S.traverse(o => {
        if (o.isLight){
          if (!o.userData._sv) o.userData._sv = o.intensity;
          out.saved++;
          if (o.isAmbientLight || o.isHemisphereLight) o.intensity = o.userData._sv * 0.06;
          else o.intensity = o.userData._sv * 0.10;
        }
      });
      // find or add a hero spot over the ring
      let spot = null;
      S.traverse(o => { if (!spot && o.isSpotLight) spot = o; });
      if (spot){
        spot.intensity = (spot.userData._sv || spot.intensity) * 3.0;
        try{ spot.position.set(0, 9, 2); spot.target.position.set(0, 0, 0); spot.target.updateMatrixWorld(); }catch(e){}
        out.spot = 'boosted';
      } else out.spot = 'none-found';
      // shadows off for capture speed
      try{ const R = new Function('return renderer')(); R.shadowMap.enabled = false; out.shadows = 'off'; }
      catch(e){ out.shadows = 'err:' + String(e).slice(0,60); }
    }catch(e){ out.err = String(e).slice(0,120); }
    return out;
  });
  console.error('CINE: ' + JSON.stringify(cine));
  await sleep(8000);
  r = await buildReport(g, 'probe');
  console.error('CINE fps=' + r.fps + ' p50=' + r.frameMs.p50);

  // walkout + pyro fps cost
  const w = await page.evaluate(() => {
    try{
      const F = new Function('return typeof fighters!=="undefined"?fighters:[]')();
      const f = F.find(x => x && x.opts && /STICK/.test(String(x.opts.name||'')));
      if (!f) return 'no-fighter';
      if (window.BANNON_ENTRANCE_SEQ && window.BANNON_ENTRANCE_SEQ.setKit)
        window.BANNON_ENTRANCE_SEQ.setKit('STICK_UP', { lighting:'SPOT', smoke:'HEAVY', pyro:'STAGE', titantron:'NAME' });
      return window.BANNON_ENTRANCE_SEQ.play([f]).then(x => 'walkout:' + x).catch(e => 'err:' + String(e).slice(0,60));
    }catch(e){ return 'err:' + String(e).slice(0,80); }
  });
  console.error('WALKOUT: ' + w);
  r = await buildReport(g, 'probe');
  console.error('WALKOUT fps=' + r.fps + ' p50=' + r.frameMs.p50 + ' pose=' + r.anim.poseCalls +
                ' pageErr=' + r.pageErrorCount + ' conErr=' + r.errorCount);

  await g.browser.close(); g.srv.close();
  console.error('PROBE DONE');
  process.exit(0);
})();
