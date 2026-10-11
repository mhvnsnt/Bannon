#!/usr/bin/env node
/* setup_test.cjs — minimal: boot, startFight via MATCH_SETUP, run the cine setup
 * evaluate with a timeout to see if/where it hangs.
 */
const H = require('./harness_lib.cjs');
const { sleep, bootGame } = H;

(async () => {
  const g = await bootGame({ port: 8914, outDir: '/tmp/setup_test', vw: 854, vh: 480 });
  const { page } = g;
  await page.evaluate(() => {
    window.BANNON_ENTRANCE = false;
    window.MATCH_SETUP = { p1Name:'STICK_UP', p2Name:'BANNON', p1Control:'YOU', p2Control:'CPU' };
    try{ window.assignCharModel('STICK_UP', 'assets/models/STICKUP_repaired.glb', 'STICK_UP'); }catch(e){}
    try{ new Function('return startFight')()(); }catch(e){}
  });
  const gameState = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } });
  const end = Date.now() + 90000;
  while (Date.now() < end){ const s = await gameState(); if (s === 'fight') break; await sleep(1000); }
  console.error('STATE: ' + (await gameState()));
  await sleep(5000);

  // the exact setup evaluate from capture_entrance.cjs, with a race timeout
  const CINE_CSS = `body.cine > *:not(#gameCanvas):not(#fxCanvas):not(script):not(style){ display:none !important; }`;
  console.error('SETUP: starting evaluate...');
  const t0 = Date.now();
  try{
    const setup = await Promise.race([
      page.evaluate(([name, css]) => {
        const out = {};
        try{
          if (window.BANNON_ENTRANCE_SEQ && window.BANNON_ENTRANCE_SEQ.setKit){
            window.BANNON_ENTRANCE_SEQ.setKit(name, {
              lighting:'SPOT', smoke:'HEAVY', pyro:'STAGE', titantron:'NAME', gait:'SWAGGER'
            });
            out.kit = window.BANNON_ENTRANCE_SEQ.kitFor(name);
          }
        }catch(e){ out.kitErr = String(e).slice(0,120); }
        try{
          const S = new Function('return scene')();
          const R = new Function('return renderer')();
          S.traverse(o => {
            if (o.isLight){
              if (o.userData._sv == null) o.userData._sv = o.intensity;
              if (o.isAmbientLight || o.isHemisphereLight) o.intensity = o.userData._sv * 0.05;
              else o.intensity = o.userData._sv * 0.08;
            }
          });
          let spot = null;
          S.traverse(o => { if (!spot && o.isSpotLight) spot = o; });
          if (spot){
            if (spot.userData._sv == null) spot.userData._sv = spot.intensity;
            spot.intensity = spot.userData._sv * 4.0;
            try{ spot.position.set(0, 10, 1); spot.target.position.set(0, 0, -6); spot.target.updateMatrixWorld(); }catch(e){}
            out.heroSpot = true;
          }
          try{ R.shadowMap.enabled = false; R.shadowMap.autoUpdate = false; out.shadows = 'off'; }
          catch(e){ out.shadows = 'err:' + String(e).slice(0,50); }
          try{ if (window.BANNON_TRON) window.BANNON_TRON.set('STICK UP'); out.tron = 'STICK UP'; }catch(e){}
        }catch(e){ out.cineLightErr = String(e).slice(0,120); }
        try{
          const st = document.createElement('style'); st.textContent = css;
          document.head.appendChild(st); document.body.classList.add('cine');
          ['hud','topRightBtns','kb-hints','mobileControls','announcer','vignette','scanlines',
           'bloodLayer','hitstop-flash','bannonSeqSkipAll','freecamHint'].forEach(function(id){
            var el = document.getElementById(id); if (el) el.style.display = 'none';
          });
          out.cine = true;
          out.hudHidden = !(function(){ var h = document.getElementById('hud'); return h && h.offsetParent; })();
        }catch(e){ out.cineErr = String(e).slice(0,120); }
        return out;
      }, ['STICK_UP', CINE_CSS]),
      sleep(45000).then(() => { throw new Error('SETUP_TIMEOUT_45s'); })
    ]);
    console.error('SETUP_DONE in ' + (Date.now()-t0) + 'ms: ' + JSON.stringify(setup).slice(0,400));
  }catch(e){
    console.error('SETUP_FAILED: ' + e.message);
  }
  await g.browser.close(); g.srv.close();
  console.error('TEST DONE');
  process.exit(0);
})();
