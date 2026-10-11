#!/usr/bin/env node
/* model_test.cjs — verify the STICKUP model binds and loads via the direct path. */
const H = require('./harness_lib.cjs');
const { sleep, bootGame } = H;

(async () => {
  const g = await bootGame({ port: 8915, outDir: '/tmp/model_test', vw: 854, vh: 480 });
  const { page } = g;
  const r = await page.evaluate(() => {
    const out = {};
    try{
      window.BANNON_ENTRANCE = false;
      window.MATCH_SETUP = { p1Name:'STICK_UP', p2Name:'BANNON', p1Control:'YOU', p2Control:'CPU' };
      window.assignCharModel('STICK_UP', 'assets/models/STICKUP_repaired.glb', 'STICK_UP');
      out.bindOk = true;
      out.charModel = !!(window.CHAR_MODEL && window.CHAR_MODEL['STICK_UP']);
    }catch(e){ out.bindErr = String(e).slice(0,100); }
    try{ new Function('return startFight')()(); out.fightCalled = true; }catch(e){ out.fightErr = String(e).slice(0,100); }
    return out;
  });
  console.error('BIND: ' + JSON.stringify(r));
  const gameState = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } });
  const end = Date.now() + 60000;
  while (Date.now() < end){ if ((await gameState()) === 'fight') break; await sleep(1000); }
  console.error('STATE: ' + (await gameState()));
  // poll the fighter's model state
  for (let k = 0; k < 12; k++){
    const s = await page.evaluate(() => {
      try{
        const F = (typeof fighters !== 'undefined') ? fighters : [];
        const f = F[0];
        if (!f) return { noFighter: true };
        return { name: f.opts && f.opts.name, hasModel: !!f.model,
                 modelFailed: !!f._modelFailed, modelUrl: f.modelUrl || null };
      }catch(e){ return { err: String(e).slice(0,80) }; }
    });
    console.error('POLL ' + k + ': ' + JSON.stringify(s));
    if (s.hasModel) break;
    await sleep(5000);
  }
  await g.browser.close(); g.srv.close();
  console.error('TEST DONE');
  process.exit(0);
})();
