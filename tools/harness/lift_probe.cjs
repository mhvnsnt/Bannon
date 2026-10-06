#!/usr/bin/env node
/* lift_probe.cjs — Minimal LIFT verification. Boots, starts STICK_UP vs GOLEM via
 * MATCH_SETUP+startFight() directly (no select UI), drives walk->grab->LIFT->deliver
 * with grappleStage probes and screenshots. Lean: no CDP, timeout-guarded shots.
 *   node tools/harness/lift_probe.cjs --out /tmp/liftprobe --port 8915
 */
const H = require('./harness_lib.cjs');
const fs = require('fs');
const path = require('path');
const outDir = H.arg('out', '/tmp/liftprobe');
const port = parseInt(H.arg('port', '8915'), 10);
fs.mkdirSync(outDir, { recursive: true });
const log = (m, d) => { const l = '[lift_probe] ' + m + (d ? ' ' + JSON.stringify(d).slice(0, 400) : ''); console.log(l); };
const G = (page, expr) => page.evaluate((e) => {
  try { return new Function('return (' + e + ')')(); } catch (err) { return { __err: String(err).slice(0, 120) }; }
}, expr).catch(e => ({ __err: String(e).slice(0, 120) }));
const fighters = (page) => G(page, `(typeof fighters!=="undefined"?fighters:[]).map(f=>({name:f.specName||f.name,state:f.state,hp:Math.round(f.hp||0),x:+((f.x||0)).toFixed(2),gs:f.grappleStage,grip:!!f.grappling,hs:f.heightScale}))`);
async function shot(page, name) {
  try {
    await page.screenshot({ path: path.join(outDir, name), timeout: 45000 });
    log('shot', name);
  } catch (e) { log('shot-FAILED', name + ': ' + String(e).slice(0, 100)); }
}
(async () => {
  const g = await H.bootGame({ port, outDir, vw: 1280, vh: 720 });
  const { page, waitFor } = g;
  log('booted');
  // start the match directly — no select UI
  await page.evaluate(() => { window.MATCH_SETUP = { p1Name: 'STICK_UP', p2Name: 'GOLEM', p1Control: 'YOU', p2Control: 'CPU' }; });
  await page.evaluate(() => { try { new Function('return startFight')()(); } catch (e) { return String(e).slice(0, 100); } });
  const live = await waitFor(async () => await G(page, `(typeof gameState!=="undefined"?gameState:null)`) === 'fight', 90000, 'fight state');
  log('fight-live', live);
  if (!live) { log('NO MATCH'); await H.closeGame(g, outDir, 'liftprobe_nomatch', await H.buildReport(g, 'liftprobe_nomatch')); process.exit(2); }
  await H.sleep(8000);
  log('fighters@bell', await fighters(page));
  // close to grapple range: step toward opponent until |dx| < 0.9
  for (let i = 0; i < 12; i++) {
    const f = await fighters(page);
    if (f.__err || !f.length || f.length < 2) break;
    const dx = Math.abs(f[0].x - f[1].x);
    log('range-check', { i, dx: +dx.toFixed(2), p1x: f[0].x, p2x: f[1].x });
    if (dx < 0.9) break;
    await H.hold(page, f[0].x < f[1].x ? 'd' : 'a', 700);
    await H.sleep(300);
  }
  log('in-range', await fighters(page));
  // GRAB -> lockup (stage 1)
  await H.press(page, 'g', 60); await H.sleep(1500);
  const s1 = await fighters(page); log('after-grab1', s1);
  // GRAB again -> LIFT (stage 2)
  await H.press(page, 'g', 60); await H.sleep(1500);
  const s2 = await fighters(page); log('after-grab2-LIFT', s2);
  // hold the lift so it's visible, then deliver
  await H.sleep(1000);
  const s3 = await fighters(page); log('lift-hold', s3);
  await H.press(page, 'j', 60); await H.sleep(1500);
  log('after-deliver', await fighters(page));
  log('pageErrors', g.pageErrors.slice(0, 10));
  const report = await H.buildReport(g, 'liftprobe');
  await H.closeGame(g, outDir, 'liftprobe', report);
  log('DONE out=' + outDir);
})().catch(e => { console.error('[lift_probe] FATAL:', e.message); process.exit(1); });
