#!/usr/bin/env node
/* play_and_record.cjs — PLAY THE GAME AND RECORD IT. Stop judging animation from still frames.
 *
 *   node tools/harness/play_and_record.cjs                       # 40s exhibition, video + report
 *   node tools/harness/play_and_record.cjs --seconds 90 --p1 TARZANIAN_DEVIL --p2 VIPER
 *   node tools/harness/play_and_record.cjs --scenario freeze     # sit in it and hunt the stall
 *   node tools/harness/play_and_record.cjs --scenario menu       # menus / editors, no match
 *
 * WHY THIS EXISTS, in the owner's words: "the running playwright is for you to see the game play and
 * see the bugs and glitches and stop guessing and overlooking game breaking stuff ... u would know if
 * you really watched and tested and played the game." He is right. Every animation miss in this
 * project traces to me reading code or sampling stills instead of watching the thing run.
 *
 * WHAT IT DOES
 *   * boots BANNON_v150.html over real HTTP (file:// blocks the clip fetches — banked lesson: on
 *     file:// every clip system looks broken because 0 clips are resident)
 *   * records the whole session to WebM at wall-clock rate, so the output is something a human can
 *     WATCH, not a contact sheet
 *   * DRIVES IT like a player: walk, strike, grapple, taunt, run the ropes, climb, pin
 *   * instruments the frame loop and reports FRAME TIME PERCENTILES and every STALL over 250ms, with
 *     the game state and fighter states at the moment it stalled. A freeze you cannot see in a still
 *     is obvious in p99 frame time.
 *   * counts what actually reached the skeleton: pose calls, clip-bone references, how many RESOLVED,
 *     and per-bone rotation movement — so "the arms don't swing" is a number, not an opinion.
 *   * logs every page error and every console error with the frame it happened on.
 *
 * The render is NOT stubbed here. Stubbing it is right for measuring logic (rAF starvation in
 * headless fakes broken state machines) and WRONG for measuring what the owner sees, which is the
 * render. This tool measures the real thing; anim_probe stubs. Use the right one for the question.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
  '.glb':'model/gltf-binary','.gltf':'model/gltf+json','.fbx':'application/octet-stream','.bin':'application/octet-stream',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ktx2':'image/ktx2',
  '.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.css':'text/css','.svg':'image/svg+xml','.txt':'text/plain' };

function arg(n, d){ const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; }
function has(n){ return process.argv.indexOf('--' + n) > 0; }

function serve(port){
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/BANNON_v150.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
                         'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── the instrumentation, injected before any game code runs ──────────────────────────────────
function INSTRUMENT(){
  window.__T = {
    frames: 0, t0: 0, last: 0, dts: [], stalls: [],
    pose: 0, clipRefs: 0, clipResolved: 0, clipMissNames: {},
    boneMove: {}, states: {}, errors: [], warns: []
  };
  const T = window.__T;

  // frame clock, measured on the browser's own rAF so it is the rate a human would see
  (function tick(){
    const now = performance.now();
    if (T.last){
      const dt = now - T.last;
      T.dts.push(dt);
      if (dt > 250){
        let st = null;
        try{
          const F = new Function('return typeof fighters!=="undefined"?fighters:null')();
          st = { gs: (function(){ try{ return new Function('return gameState')(); }catch(e){ return null; } })(),
                 f: F ? F.filter(Boolean).map(x => x.state) : null };
        }catch(e){}
        T.stalls.push({ atSec: +((now - T.t0)/1000).toFixed(2), ms: Math.round(dt), frame: T.frames, state: st });
      }
    } else { T.t0 = now; }
    T.last = now; T.frames++;
    requestAnimationFrame(tick);
  })();

  const oe = console.error, ow = console.warn;
  console.error = function(){ try{ T.errors.push(String([].slice.call(arguments).join(' ')).slice(0,180)); }catch(e){} return oe.apply(console, arguments); };
  console.warn  = function(){ try{ T.warns.push(String([].slice.call(arguments).join(' ')).slice(0,180)); }catch(e){} return ow.apply(console, arguments); };

  // hook the animation path once the game has defined it
  const arm = () => {
    if (window.studioApplyClipPose && !window.studioApplyClipPose.__rec){
      const o = window.studioApplyClipPose;
      const w = function(f, clip, ph, wt){
        T.pose++;
        const r = o.apply(this, arguments);
        try{
          const cb = f.model && f.model.userData && f.model.userData.clipBones;
          if (cb) for (const k in cb){
            T.clipRefs++;
            if (window.__boneOf && window.__boneOf(f.model, k)) T.clipResolved++;
            else T.clipMissNames[k] = (T.clipMissNames[k]||0)+1;
          }
        }catch(e){}
        return r;
      };
      w.__rec = 1; w.__owner = o.__owner; w.__bridge = o.__bridge; w.__probe = o.__probe;
      window.studioApplyClipPose = w;
    }
    if (typeof window.updateFighterModel === 'function' && !window.updateFighterModel.__rec){
      const o = window.updateFighterModel;
      const TRACK = ['LeftArm','LeftForeArm','LeftHand','LeftShoulder','RightArm','RightForeArm',
                     'LeftUpLeg','LeftLeg','LeftFoot','Spine1','Neck','Head'];
      const w = function(f){
        try{ T.states[f.state] = (T.states[f.state]||0)+1; }catch(e){}
        let before = null;
        const B = {};
        if (f.model && window.__boneOf){
          before = {};
          for (const n of TRACK){ const b = window.__boneOf(f.model, 'mixamorig' + n); if (b){ B[n]=b; before[n]=b.quaternion.clone(); } }
        }
        const r = o.apply(this, arguments);
        if (before) for (const n in before){
          const d = 1 - Math.abs(before[n].dot(B[n].quaternion));
          const s = T.boneMove[n] || (T.boneMove[n] = { max:0, sum:0, n:0 });
          if (d > s.max) s.max = d; s.sum += d; s.n++;
        }
        return r;
      };
      w.__rec = 1; window.updateFighterModel = w;
    }
  };
  arm(); const iv = setInterval(arm, 500); setTimeout(()=>clearInterval(iv), 30000);
}

// ── the player: real keys through the real handler ────────────────────────────────────────────
async function press(page, key, holdMs){
  await page.evaluate(k => window.dispatchEvent(new KeyboardEvent('keydown', { key:k, bubbles:true })), key);
  if (holdMs) await sleep(holdMs);
  await page.evaluate(k => window.dispatchEvent(new KeyboardEvent('keyup', { key:k, bubbles:true })), key);
}
async function hold(page, key, ms){
  await page.evaluate(k => window.dispatchEvent(new KeyboardEvent('keydown', { key:k, bubbles:true })), key);
  await sleep(ms);
  await page.evaluate(k => window.dispatchEvent(new KeyboardEvent('keyup', { key:k, bubbles:true })), key);
}

// J light · K heavy · L kick · U uppercut · G grab · SPACE special · T taunt · TAB zone · F block
async function playMatch(page, seconds, log){
  const end = Date.now() + seconds * 1000;
  const strikes = ['j','k','l','u'];
  let i = 0;
  while (Date.now() < end){
    const beat = i % 8;
    if (beat === 0){ log('walk in'); await hold(page, 'd', 900); }
    else if (beat === 1){ log('strike flurry'); for (let s=0;s<3;s++){ await press(page, strikes[(i+s)%4], 40); await sleep(320); } }
    else if (beat === 2){ log('grapple'); await press(page, 'g', 60); await sleep(1400); }
    else if (beat === 3){ log('walk out + block'); await hold(page, 'a', 700); await press(page, 'f', 400); }
    else if (beat === 4){ log('run the ropes'); await hold(page, 'w', 1100); await press(page, 'k', 40); }
    else if (beat === 5){ log('taunt'); await press(page, 't', 60); await sleep(1600); }
    else if (beat === 6){ log('zone / context'); await press(page, 'Tab', 60); await sleep(900); }
    else { log('special'); await press(page, ' ', 60); await sleep(1500); }
    i++;
    await sleep(250);
  }
}

(async () => {
  const seconds  = parseInt(arg('seconds', '40'), 10);
  const p1       = arg('p1', 'BANNON');
  const p2       = arg('p2', 'VIPER');
  const scenario = arg('scenario', 'match');
  const port     = parseInt(arg('port', '8910'), 10);
  const outDir   = arg('out', path.join(ROOT, 'dist', 'playtest'));
  fs.mkdirSync(outDir, { recursive: true });

  const srv = await serve(port);
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=swiftshader', '--no-sandbox', '--no-proxy-server', '--proxy-bypass-list=<-loopback>',
           '--autoplay-policy=no-user-gesture-required']
  });
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },        // the phone he actually plays on
    deviceScaleFactor: 2, hasTouch: true,
    recordVideo: { dir: outDir, size: { width: 412, height: 915 } }
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).split('\n')[0].slice(0, 200)));

  await page.addInitScript(INSTRUMENT);

  const beats = [];
  const log = (m) => beats.push({ t: +((Date.now() - T0)/1000).toFixed(1), what: m });
  const T0 = Date.now();

  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  log('booted');
  await sleep(10000);                                  // let three.js, models and the module stack land

  // WAIT FOR THE LOADER. This tool's first version called startFight() ten seconds after
  // domcontentloaded and reported a full set of "match" numbers. Watching the recording showed the
  // game was still on the boot screen at 36% "loading move clips" at 18s and STILL ON THE MAIN MENU
  // at 42s — the match never started and every figure was the menu's idle background. Nothing in the
  // numbers said so; only the picture did. So: wait for gameState to actually be 'fight', and if it
  // is not, say so loudly instead of reporting menu figures as gameplay.
  const gameState = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } });
  const waitFor = async (pred, ms, what) => {
    const end = Date.now() + ms;
    while (Date.now() < end){ if (await pred()) return true; await sleep(500); }
    log('TIMEOUT waiting for ' + what); return false;
  };
  await waitFor(async () => {
    const done = await page.evaluate(() => {
      const el = document.getElementById('bootScreen') || document.getElementById('loadScreen') ||
                 document.querySelector('.boot, #boot, #splash');
      const vis = el && el.offsetParent !== null;
      const txt = document.body ? document.body.innerText : '';
      return !vis && !/loading move clips|loading\s+\d+%/i.test(txt);
    });
    return done;
  }, 90000, 'the loader to finish');
  log('loader done');

  if (scenario !== 'menu'){
    await page.evaluate(([a,b]) => {
      window.MATCH_SETUP = { p1Name:a, p2Name:b, p1Control:'YOU', p2Control:'CPU' };
    }, [p1, p2]);
    // PRESS THE REAL BUTTONS (owner law: drive the on-screen controls, not the functions behind
    // them). The route is TWO screens, which is what caught me out the first time: QUICK FIGHT
    // (#btnFight) does not start a match, it opens the CHARACTER SELECT — correctly — and the match
    // starts from #csStart on that screen. Fall back to startFight() only if the button route fails.
    await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
    await waitFor(async () => page.evaluate(() => {
      const s = document.getElementById('csStart'); return !!(s && s.offsetParent !== null);
    }), 15000, 'the character select screen');
    await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
    let live = await waitFor(async () => (await gameState()) === 'fight', 25000, 'FIGHT ▶ to start the match');
    if (!live){
      log('button route did not start it — falling back to startFight()');
      await page.evaluate(() => { try{ new Function('return startFight')()(); }catch(e){} });
      live = await waitFor(async () => (await gameState()) === 'fight', 20000, 'startFight() to take');
    }
    log(live ? ('bell: ' + p1 + ' vs ' + p2) : 'NO MATCH STARTED — figures below are NOT gameplay');
    if (!live) console.error('\n!! THE MATCH NEVER STARTED. Do not read the numbers below as gameplay. !!\n');
    await sleep(9000);                                 // entrances
  }

  if (scenario === 'menu'){
    log('creation suite');
    await page.evaluate(()=>{ try{ window.openCawFront && window.openCawFront(); }catch(e){} });
    await sleep(3000);
    await page.evaluate(()=>{ const b=[...document.querySelectorAll('[data-cf="edit"]')].find(x=>/VIPER/.test(x.dataset.name||'')); if(b) b.click(); });
    await sleep(5000);
    log('moveset studio');
    await page.evaluate(()=>{ try{ window.BANNON_MOVESET_STUDIO && window.BANNON_MOVESET_STUDIO.open(); }catch(e){} });
    await sleep(Math.max(4000, seconds*1000 - 12000));
  } else if (scenario === 'freeze'){
    // the freeze is reported mid-match and while idling. Do both: long idle, then heavy action.
    log('idle soak');       await sleep(Math.floor(seconds*1000*0.4));
    log('action soak');     await playMatch(page, Math.floor(seconds*0.6), log);
  } else {
    await playMatch(page, seconds, log);
  }

  const report = await page.evaluate(() => {
    const T = window.__T, d = T.dts.slice().sort((a,b)=>a-b);
    const pct = q => d.length ? +d[Math.min(d.length-1, Math.floor(d.length*q))].toFixed(1) : 0;
    const bm = {};
    for (const k in T.boneMove){ const s = T.boneMove[k]; bm[k] = { max:+s.max.toFixed(5), mean:+(s.sum/Math.max(1,s.n)).toFixed(5) }; }
    return {
      frames: T.frames, seconds: +((performance.now()-T.t0)/1000).toFixed(1),
      fps: +(T.frames / Math.max(0.001,(performance.now()-T.t0)/1000)).toFixed(1),
      frameMs: { p50: pct(0.5), p90: pct(0.9), p99: pct(0.99), worst: d.length?+d[d.length-1].toFixed(1):0 },
      stalls: T.stalls.slice(0, 40), stallCount: T.stalls.length,
      anim: { poseCalls: T.pose, clipBoneRefs: T.clipRefs, clipBoneResolved: T.clipResolved,
              resolvedPct: T.clipRefs ? +(100*T.clipResolved/T.clipRefs).toFixed(1) : null,
              topUnresolved: Object.keys(T.clipMissNames).slice(0, 10) },
      boneMovement: bm, states: T.states,
      consoleErrors: T.errors.slice(0, 12), errorCount: T.errors.length
    };
  });
  report.pageErrors = pageErrors.slice(0, 12);
  report.pageErrorCount = pageErrors.length;
  report.beats = beats;
  report.scenario = scenario;

  const vid = await page.video();
  await ctx.close();                                   // flushes the video file
  await browser.close(); srv.close();

  let vpath = null;
  try{
    vpath = await vid.path();
    const nice = path.join(outDir, 'bannon_' + scenario + '_' + Date.now() + '.webm');
    fs.renameSync(vpath, nice); vpath = nice;
  }catch(e){}
  report.video = vpath;

  const jpath = path.join(outDir, 'playtest_report.json');
  fs.writeFileSync(jpath, JSON.stringify(report, null, 1));

  console.log('\n===== BANNON PLAYTEST · ' + scenario + ' =====');
  console.log('video   : ' + vpath);
  console.log('report  : ' + jpath);
  console.log('fps     : ' + report.fps + '   frame ms p50 ' + report.frameMs.p50 +
              ' / p90 ' + report.frameMs.p90 + ' / p99 ' + report.frameMs.p99 + ' / worst ' + report.frameMs.worst);
  console.log('stalls  : ' + report.stallCount + ' over 250ms');
  if (report.stalls.length) console.log('          ' + report.stalls.slice(0,8).map(s=>s.atSec+'s='+s.ms+'ms['+(s.state&&s.state.f?s.state.f.join(','):'?')+']').join('  '));
  console.log('anim    : pose ' + report.anim.poseCalls + '   clip bone refs ' + report.anim.clipBoneRefs +
              '   RESOLVED ' + report.anim.clipBoneResolved + ' (' + report.anim.resolvedPct + '%)');
  console.log('bones   : ' + Object.keys(report.boneMovement).map(k => k+' '+report.boneMovement[k].max).join('  '));
  console.log('errors  : page ' + report.pageErrorCount + '   console ' + report.errorCount);
  if (report.pageErrors.length) report.pageErrors.forEach(e => console.log('   ! ' + e));
})();
