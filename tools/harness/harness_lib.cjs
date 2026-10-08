#!/usr/bin/env node
/* harness_lib.cjs — shared boot/serve/instrument/player primitives for the Bannon capture
 * harness. Extracted from play_and_record.cjs so entrance capture (and future scenarios)
 * reuse the exact same verified machinery instead of duplicating it.
 */
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
// VERBATIM from play_and_record.cjs (2026-10-05): frame clock, error hooks, pose/bone/deformation
// sentinels. Keep in sync if that tool's instrumentation changes.
function INSTRUMENT(){
  window.__T = {
    frames: 0, t0: 0, last: 0, dts: [], stalls: [],
    pose: 0, clipRefs: 0, clipResolved: 0, clipMissNames: {},
    boneMove: {}, boneExtrema: {}, deformation: {samples:0, spikes:0, worst:0, examples:[]}, states: {}, errors: [], warns: []
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
  // Public diagnostic hook: expose the live arm() attempt so the capture can prove the
  // instrumentation attached instead of silently producing zero deformation samples.
  window.__recorderArm = () => { try { arm(); return !!(window.studioApplyClipPose && window.studioApplyClipPose.__rec); } catch(e) { return false; } };
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
      const TRACK = ['LeftArm','LeftForeArm','LeftHand','LeftShoulder','RightArm','RightForeArm','RightShoulder',
                     'LeftUpLeg','LeftLeg','LeftFoot','Spine1','Spine2','Neck','Head'];
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
          const q = B[n].quaternion;
          const ang = 2 * Math.acos(Math.min(1, Math.abs(q.w)));
          const e = T.boneExtrema[n] || (T.boneExtrema[n] = {maxDeg:0});
          e.maxDeg = Math.max(e.maxDeg, +(ang * 180 / Math.PI));
        }
        // Lightweight CPU deformation sentinel. It samples a handful of triangles from the first
        // skinned mesh each update and uses the same bone matrices/weights that three.js skinning
        // sends to the GPU. A triangle growing >2.5x and >15cm is the exact signature of the sheets
        // that previously slipped through p95-only QA. This is diagnostic only: never fail a capture
        // on a number whose motion semantics have not been visually verified.
        try {
          if (f.model && f.model.traverse && (T.frames % 12 === 0)) {
            let sm = null; f.model.traverse(x => { if (!sm && x.isSkinnedMesh) sm = x; });
            if (sm && sm.geometry && sm.geometry.attributes && sm.geometry.attributes.position) {
              const geo=sm.geometry, pos=geo.attributes.position, idx=geo.index, si=geo.attributes.skinIndex, sw=geo.attributes.skinWeight;
              if (si && sw && sm.skeleton) {
                const comp=(a,i,k)=>k===0?a.getX(i):k===1?a.getY(i):k===2?a.getZ(i):a.getW(i);
                const v=(i,out)=>{ out.set(0,0,0); const p=new THREE.Vector3().fromBufferAttribute(pos,i); const m=new THREE.Matrix4(), q=new THREE.Vector3();
                  for(let k=0;k<4;k++){const w=comp(sw,i,k); if(!w) continue; const bi=comp(si,i,k); if(bi<0||bi>=sm.skeleton.bones.length) continue;
                    m.multiplyMatrices(sm.skeleton.bones[bi].matrixWorld, sm.skeleton.boneInverses[bi]); q.copy(p).applyMatrix4(m).multiplyScalar(w); out.add(q);}};
                const count=idx?Math.floor(idx.count/3):Math.floor(pos.count/3), step=Math.max(1,Math.floor(count/32));
                const a=new THREE.Vector3(),b=new THREE.Vector3(),d=new THREE.Vector3(),e=new THREE.Vector3();
                for(let t=0;t<count;t+=step){const ia=idx?idx.getX(t*3):t*3, ib=idx?idx.getX(t*3+1):t*3+1, ic=idx?idx.getX(t*3+2):t*3+2;
                  const ba=new THREE.Vector3().fromBufferAttribute(pos,ia), bb=new THREE.Vector3().fromBufferAttribute(pos,ib), bc=new THREE.Vector3().fromBufferAttribute(pos,ic);
                  const rest=Math.max(ba.distanceTo(bb),bb.distanceTo(bc),bc.distanceTo(ba)); if(rest<1e-5) continue;
                  v(ia,a);v(ib,b);v(ic,d); const now=Math.max(a.distanceTo(b),b.distanceTo(d),d.distanceTo(a));
                  const ratio=now/rest; T.deformation.samples++; if(ratio>2.5 && now>0.15){T.deformation.spikes++; if(ratio>T.deformation.worst){T.deformation.worst=ratio; if(T.deformation.examples.length<8) T.deformation.examples.push({fighter:f.name||f.id||'?',ratio:+ratio.toFixed(2),cm:+(now*100).toFixed(1),restCm:+(rest*100).toFixed(1)});}}
                }
              }
            }
          }
        } catch(e) { /* diagnostic must never break gameplay */ }
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

// boot the game and wait for the loader to finish. Returns { page, browser, ctx, srv, log, beats, pageErrors, T0 }
async function bootGame(opts){
  const { chromium } = require('playwright');
  const port = opts.port || 8910;
  const outDir = opts.outDir;
  const vw = opts.vw || 412, vh = opts.vh || 915;
  fs.mkdirSync(outDir, { recursive: true });
  const srv = await serve(port);
  const chromiumPath = process.env.BANNON_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);
  const browser = await chromium.launch({
    ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    args: ['--use-gl=swiftshader', '--no-sandbox', '--no-proxy-server', '--proxy-bypass-list=<-loopback>',
           '--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage',
           '--js-flags=--max-old-space-size=2048']
  });
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: parseInt(process.env.BANNON_DSF || '1', 10), hasTouch: true,
    recordVideo: { dir: outDir, size: { width: vw, height: vh } }
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).split('\n')[0].slice(0, 200)));
  await page.addInitScript(INSTRUMENT);
  const beats = [];
  const T0 = Date.now();
  const log = (m) => beats.push({ t: +((Date.now() - T0)/1000).toFixed(1), what: m });
  // NOTE (2026-10-05): domcontentloaded NEVER fires for this page in sandboxed Chromium —
  // all 15 subresources finish, zero pending, yet readyState stays "loading" (browser-level stall;
  // the page's own boot screen even has a 75 s last-resort hide for exactly this class of hang).
  // The game boots to menu regardless, so commit and use the loader poll below as the real gate.
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil: 'commit', timeout: 60000 });
  log('booted');
  await sleep(10000);
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
  }, 120000, 'the loader to finish');
  log('loader done');
  log((await page.evaluate(() => window.__recorderArm ? window.__recorderArm() : false)) ? 'recorder instrumentation attached' : 'RECORDER INSTRUMENTATION NOT ATTACHED');
  return { page, browser, ctx, srv, log, beats, pageErrors, T0, waitFor };
}

// pick the P1/P2 character cards on the real select screen and press FIGHT. Returns matchup string or null.
async function selectAndFight(g, p1, p2, p1alt, p2alt, p1model, p2model){
  const { page, log, waitFor } = g;
  const gameState = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } });
  await page.evaluate(([a,b,pa,pb]) => {
    window.MATCH_SETUP = { p1Name:a, p2Name:b, p1Alt:pa||null, p2Alt:pb||null,
                           p1Control:'YOU', p2Control:'CPU' };
  }, [p1, p2, p1alt, p2alt]);
  for (const [nm, url] of [[p1, p1model], [p2, p2model]]){
    if (!url) continue;
    const ck = await page.evaluate(([n, u]) => {
      const k = String(n).toUpperCase().replace(/[^A-Z0-9]/g,'_');
      try{ if (window.assignCharModel) window.assignCharModel(k, u, k); }catch(e){}
      return k;
    }, [nm, url]);
    log('model bind: ' + ck + ' -> ' + url);
  }
  const pickCard = async (plateId, name) => {
    const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const want = norm(name);
    for (let attempt = 0; attempt < 3; attempt++){
      await page.evaluate((pid) => {
        const pl = document.getElementById(pid); if (pl) pl.click();
      }, plateId);
      await sleep(1500);
      const clicked = await page.evaluate((nm) => {
        const n2 = String(nm || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const cards = [...document.querySelectorAll('.csCard')];
        let c = cards.find(d => (d.dataset.porname || '').toUpperCase() === String(nm).toUpperCase());
        if (!c) c = cards.find(d => String(d.dataset.porname || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === n2);
        if (!c) return 'not-found';
        try{ c.scrollIntoView({ block: 'center' }); }catch(e){}
        c.click();
        return 'clicked';
      }, name);
      if (clicked === 'not-found') continue;
      await sleep(800);
      // verify the plate actually shows our character (not a stale default)
      const shown = await page.evaluate((pid) => {
        const pl = document.getElementById(pid);
        const nm = pl ? pl.querySelector('.pnm') : null;
        return nm ? nm.textContent : '';
      }, plateId);
      if (norm(shown) === want) return true;
      log('card pick attempt ' + (attempt+1) + ' for ' + name + ': plate shows "' + shown + '", retrying');
    }
    return false;
  };
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  // BANNON_SKIP_SELECT=1: bypass the fragile card UI entirely — set MATCH_SETUP
  // directly and start the fight. The card picker races the roster render and
  // silently films defaults (BANNON vs VIPER) when it loses.
  const skipSelect = process.env.BANNON_SKIP_SELECT === '1';
  const selectOpen = skipSelect ? false : await waitFor(async () => page.evaluate(() => {
    const s = document.getElementById('csStart'); return !!(s && s.offsetParent !== null);
  }), 60000, 'the character select screen');
  let live = false;
  if (selectOpen){
    log('selecting P1=' + p1 + ' P2=' + p2 + ' via cards');
    const ok1 = await pickCard('csPlateP1', p1);
    log(ok1 ? 'P1 card picked: ' + p1 : 'P1 CARD NOT FOUND: ' + p1);
    const ok2 = await pickCard('csPlateP2', p2);
    log(ok2 ? 'P2 card picked: ' + p2 : 'P2 CARD NOT FOUND: ' + p2);
    // fail-closed: never start a match with the wrong characters — a default
    // BANNON vs VIPER filming as "STICK_UP" is worse than no footage at all.
    if (!ok1 || !ok2) throw new Error('character card pick failed (p1=' + ok1 + ' p2=' + ok2 + ') — refusing to film wrong matchup');
    await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
    live = await waitFor(async () => (await gameState()) === 'fight', 60000, 'FIGHT ▶ to start the match');
  }
  if (!live){
    log('button route did not start it — falling back to startFight()');
    await page.evaluate(([a,b,pa,pb]) => {
      window.MATCH_SETUP = { p1Name:a, p2Name:b, p1Alt:pa||null, p2Alt:pb||null,
                             p1Control:'YOU', p2Control:'CPU' };
    }, [p1, p2, p1alt, p2alt]);
    await page.evaluate(() => { try{ new Function('return startFight')()(); }catch(e){} });
    live = await waitFor(async () => (await gameState()) === 'fight', 30000, 'startFight() to take');
  }
  if (live){
    await page.evaluate(() => {
      try{ const s = document.getElementById('csStart'); if (s && s.offsetParent !== null) s.click(); }catch(e){}
    });
    await sleep(2000);
  }
  const actualMatchup = live ? await page.evaluate(() => {
    const s = window.MATCH_SETUP; return s ? (s.p1Name + ' vs ' + s.p2Name) : 'unknown';
  }) : null;
  log(live ? ('bell: ' + actualMatchup) : 'NO MATCH STARTED — figures below are NOT gameplay');
  // fail-fast: verify the SPAWNED fighters match the requested ones, not just MATCH_SETUP.
  // (The select UI can silently start defaults; catching it here saves a 10-min doomed capture.)
  if (live){
    const spawned = await page.evaluate(() => {
      try{
        const F = (typeof fighters !== 'undefined') ? fighters : [];
        return F.slice(0, 2).map(f => {
          try{ return (f.opts && f.opts.name) || f.name || f.specName || '?'; }catch(e){ return '?'; }
        });
      }catch(e){ return []; }
    });
    log('spawned fighters: ' + JSON.stringify(spawned));
    const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (norm(spawned[0]) !== norm(p1)) {
      throw new Error('spawned P1 is "' + spawned[0] + '", expected "' + p1 + '" — refusing to film wrong matchup');
    }
  }
  return live ? actualMatchup : null;
}

// build the standard report object from the page instrumentation
async function buildReport(g, scenario){
  const { page, beats, pageErrors } = g;
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
      boneMovement: bm, boneExtrema: T.boneExtrema, deformation: T.deformation, states: T.states,
      consoleErrors: T.errors.slice(0, 12), errorCount: T.errors.length,
      models: (() => { try { return (window.fighters||[]).filter(Boolean).map(f => ({
        name: (f.opts && f.opts.name) || null, url: f.modelUrl || null,
        altUrl: f._altModelUrl || null })); } catch(e){ return []; } })()
    };
  });
  report.pageErrors = pageErrors.slice(0, 12);
  report.pageErrorCount = pageErrors.length;
  report.beats = beats;
  report.scenario = scenario;
  return report;
}

async function closeGame(g, outDir, scenario, report){
  const { page, ctx, browser, srv } = g;
  const vid = await page.video();
  await ctx.close();
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
  return { vpath, jpath };
}

module.exports = { ROOT, arg, has, serve, sleep, INSTRUMENT, press, hold, playMatch, bootGame, selectAndFight, buildReport, closeGame };
