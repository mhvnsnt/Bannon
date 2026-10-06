#!/usr/bin/env node
/* playtest_lift.cjs — LIFT-MECHANIC playtest scenario on the harness_lib machinery.
 * Boots BANNON_v150.html, starts P1 vs P2 (via char-select cards, falling back to
 * startFight()+MATCH_SETUP), then drives a scripted grapple→LIFT→deliver sequence
 * while probing grappleStage, fighter state/hp, measured world heights, and crowd
 * objects. Records the whole session to video (harness recordVideo) and saves
 * timestamped screenshots + a JSON evidence log.
 *
 *   node tools/harness/playtest_lift.cjs --p1 STICK_UP --p2 GOLEM --out dist/playtest/lift1
 *
 * Every claim this script prints is read from the live page, not inferred.
 */
const { ROOT, arg, serve, sleep, press, hold, bootGame, selectAndFight, closeGame } = require('./harness_lib.cjs');
const fs = require('fs');
const path = require('path');

const P1 = arg('p1', 'STICK_UP');
const P2 = arg('p2', 'GOLEM');
const outDir = arg('out', path.join(ROOT, 'dist', 'playtest', 'lift_' + Date.now()));
const port = parseInt(arg('port', '8910'), 10);
fs.mkdirSync(outDir, { recursive: true });
const SHOTS = path.join(outDir, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const ev = [];
const note = (what, data) => { ev.push({ t: +((Date.now() - T0) / 1000).toFixed(1), what, data }); const line = '[playtest_lift] ' + what + (data ? ' ' + JSON.stringify(data).slice(0, 300) : ''); console.log(line); process.stderr.write(line + '\n'); };
let T0 = Date.now();
let CDP = null;

async function shot(page, name) {
  if (!CDP) CDP = await page.context().newCDPSession(page);
  const { data } = await CDP.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SHOTS, name), Buffer.from(data, 'base64'));
  note('shot', name);
}
/* NOTE: the game declares `let fighters` / `let scene` at top level of classic
 * scripts — lexical globals, NOT on window. Access via indirect Function eval. */
const G = (page, expr) => page.evaluate((e) => {
  try { return new Function('return (' + e + ')')(); }
  catch (err) { return { __err: String(err).slice(0, 120) }; }
}, expr).catch(e => ({ __err: String(e).slice(0, 120) }));
const fighters = (page) => G(page, `(typeof fighters!=="undefined"?fighters:[]).map(f=>({name:f.specName||f.name,state:f.state,hp:Math.round(f.hp||0),x:+((f.x||0)).toFixed(2),z:+((f.z||0)).toFixed(2),grappleStage:f.grappleStage,grappling:!!f.grappling,heightScale:f.heightScale,stateTime:+((f.stateTime||0)).toFixed(2)}))`);
const heights = (page) => page.evaluate(() => {
  try {
    const F = new Function('return (typeof fighters!=="undefined"?fighters:[])')();
    return F.map(f => {
      const obj = f.group || f.model || f.mesh || f.container || null;
      let h = null;
      if (obj && window.THREE) { const b = new THREE.Box3().setFromObject(obj); h = +b.getSize(new THREE.Vector3()).y.toFixed(3); }
      return { name: f.specName || f.name, heightScale: f.heightScale, measuredWorldHeight: h };
    });
  } catch (e) { return { __err: String(e).slice(0, 120) }; }
}).catch(e => ({ __err: String(e).slice(0, 120) }));
const crowd = (page) => page.evaluate(() => {
  try {
    const scene = new Function('return (typeof scene!=="undefined"?scene:null)')();
    if (!scene || !window.THREE) return { __err: 'no scene' };
    const hits = []; scene.traverse(o => { if (/crowd/i.test(o.name || '')) hits.push(o); });
    return {
      crowdNodes: hits.length,
      banks: hits.slice(0, 6).map(h => {
        let meshes = 0; const geo = {};
        h.traverse(o => { if (o.isMesh) { meshes++; const t = o.geometry ? o.geometry.type : '?'; geo[t] = (geo[t] || 0) + 1; } });
        return { name: h.name, meshes, geoTypes: geo, instanced: !!h.isInstancedMesh, count: h.count || null };
      })
    };
  } catch (e) { return { __err: String(e).slice(0, 120) }; }
}).catch(e => ({ __err: String(e).slice(0, 120) }));

(async () => {
  const g = await bootGame({ port, outDir, vw: 1280, vh: 720 });
  T0 = g.T0; const { page, log } = g;
  note('booted');
  await shot(page, 'p01_menu.png');

  const matchup = await selectAndFight(g, P1, P2);
  note('matchup', matchup);
  if (!matchup) {
    note('FATAL-no-match');
    const { buildReport } = require('./harness_lib.cjs');
    const report = await buildReport(g, 'lift_nomatch');
    await closeGame(g, outDir, 'lift_nomatch', report);
    process.exit(2);
  }
  await sleep(9000);
  await shot(page, 'p02_fight_wide.png');
  note('fighters@bell', await fighters(page));
  note('heights@bell', await heights(page));
  note('crowd@bell', await crowd(page));

  // walk into range
  await hold(page, 'd', 2200);
  note('after-walk', await fighters(page));

  // one strike to confirm striking
  await press(page, 'j', 60); await sleep(700);
  note('after-jab', await fighters(page));
  await shot(page, 'p04_jab.png');

  // close distance, then GRAB -> lockup (stage 1)
  await hold(page, 'd', 1200);
  await press(page, 'g', 60); await sleep(1500);
  const s1 = await fighters(page); note('after-grab1-lockup', s1);
  await shot(page, 'p05_lockup.png');

  // grab again -> LIFT (stage 2)
  await press(page, 'g', 60); await sleep(1300);
  const s2 = await fighters(page); note('after-grab2-LIFT', s2);
  await shot(page, 'p06_LIFT.png');
  await sleep(700);
  await shot(page, 'p07_lift_hold.png');
  note('lift-heights', await heights(page));

  // deliver with jab -> toss/slam
  await press(page, 'j', 60); await sleep(1400);
  note('after-deliver', await fighters(page));
  await shot(page, 'p08_deliver.png');

  note('pageErrors', g.pageErrors.slice(0, 20));

  fs.writeFileSync(path.join(outDir, 'evidence.json'), JSON.stringify({ matchup, p1: P1, p2: P2, events: ev, beats: g.beats }, null, 1));
  const { buildReport } = require('./harness_lib.cjs');
  const report = await buildReport(g, 'lift_' + P1 + '_vs_' + P2);
  const { vpath } = await closeGame(g, outDir, 'lift_' + P1 + '_vs_' + P2, report);
  console.log('[playtest_lift] DONE out=' + outDir);
  console.log('[playtest_lift] video=' + vpath);
})().catch(e => { console.error('[playtest_lift] FATAL:', e.message); process.exit(1); });
