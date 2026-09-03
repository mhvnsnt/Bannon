#!/usr/bin/env node
/* fuzz_invariants.cjs — BREAK THE GAME ON PURPOSE, THEN HAND BACK THE SHORTEST WAY TO DO IT.
 *
 *   node tools/harness/fuzz_invariants.cjs                  # one seeded run
 *   node tools/harness/fuzz_invariants.cjs --seed 12345     # reproduce a run exactly
 *   node tools/harness/fuzz_invariants.cjs --runs 5         # five different seeds
 *   node tools/harness/fuzz_invariants.cjs --replay dist/fuzz/repro_12345.json
 *   node tools/harness/fuzz_invariants.cjs --actions 60 --no-shrink
 *
 * WHY THIS AND NOT MORE CONVENTIONAL TESTS. Every bug this project has actually shipped was found
 * by an ODD SEQUENCE, not by a wrong function: a match torn down before its prop GLBs arrived so a
 * casket landed in the NEXT match; a fighter renamed mid-match never rebinding because
 * `_charModelRequested` is a one-shot guard; an entrance firing during character select because
 * spawnPreview calls startFight. Nobody writes a test for those, because nobody thinks of them.
 * A generator does, because it does not know they are unusual.
 *
 * THE INVARIANTS ARE THINGS THAT MUST BE TRUE IN EVERY STATE, not assertions about one function:
 *   I1  no fighter's position, facing or hp is NaN
 *   I2  gameState is always one of the eleven the engine actually assigns
 *   I3  no asset is STUCK — a fighter who asked for a model reaches a model or a failure, never
 *       neither, forever. This is the exact shape of the procedural-body bug, generalised.
 *   I4  a fighter with a bound GLB never also shows the procedural body
 *   I5  the drawing buffer is finite and non-zero after any resize
 *   I6  the fighter roster never runs away (no leak through spawn/despawn cycles)
 *   I7  no page errors, ever
 *   I8  no frame over 4 s — the owner's complaint IS this invariant, so it is one
 *   I9  a quality-tier change never re-initialises the match (fighter count must not jump)
 *
 * SEEDED, SO A FAILURE IS A NUMBER. The action sequence comes from a seeded xorshift, so
 * `--seed N` reproduces a run byte for byte. A bug report here is one integer, not a paragraph.
 *
 * IT SHRINKS. A 40-action failure is not a bug report, it is a haystack. On a violation the runner
 * removes actions and re-runs, keeping any shorter sequence that still fails — delta debugging —
 * and writes the minimal one to dist/fuzz/repro_<seed>.json, replayable with --replay. THAT file
 * is the deliverable: a deterministic reproduction is what turns "it freezes sometimes" into
 * something fixable.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const OUT = path.join(ROOT, 'dist', 'fuzz');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg',
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json','.jgz':'application/octet-stream' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; };
const has = n => process.argv.indexOf('--' + n) > 0;

const LEGAL_STATES = ['menu','menu_select','menu_creator','menu_models','caw','fight','pause',
                      'pause_creator','pause_models','roundend','winner'];
const HARD_FRAME_MS = +arg('frame-ms', '4000');
const STUCK_MS      = +arg('stuck-ms', '25000');
const MAX_FIGHTERS  = 8;

// ── the action alphabet ──────────────────────────────────────────────────────────────────────
// Every one is something a player or the OS can really do. Nothing here pokes an internal that a
// user could not reach — a crash you can only cause from the console is not a bug he can hit.
const ACTIONS = [
  { id:'tier',    weight:3 }, { id:'resize',  weight:2 }, { id:'key',     weight:6 },
  { id:'hide',    weight:1 }, { id:'pause',   weight:2 }, { id:'zone',    weight:2 },
  { id:'runin',   weight:1 }, { id:'wait',    weight:3 }, { id:'taunt',   weight:1 },
  { id:'grapple', weight:2 }, { id:'strike',  weight:3 }
];
const KEYS = ['j','k','l','u','i','o','w','a','s','d','b','n','shift','q','e'];

function rng(seed){ let x = seed >>> 0 || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

function genSequence(seed, n){
  const r = rng(seed), total = ACTIONS.reduce((a,b) => a + b.weight, 0), seq = [];
  for (let i = 0; i < n; i++){
    let p = r() * total, pick = ACTIONS[0];
    for (const a of ACTIONS){ if ((p -= a.weight) <= 0){ pick = a; break; } }
    const act = { id: pick.id };
    if (pick.id === 'tier')   act.n = Math.floor(r() * 5);
    if (pick.id === 'resize'){ act.w = 320 + Math.floor(r() * 800); act.h = 480 + Math.floor(r() * 700); }
    if (pick.id === 'key')     act.k = KEYS[Math.floor(r() * KEYS.length)];
    if (pick.id === 'wait')    act.ms = 200 + Math.floor(r() * 1600);
    seq.push(act);
  }
  return seq;
}

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

// injected before any game code: the frame clock and the stuck-asset watch, because both are
// properties of TIME and cannot be sampled after the fact.
function WATCH(HARD, STUCK){
  window.__F = { worstFrame:0, worstAt:0, last:0, t0:performance.now(), errors:[], stuck:[], frames:0 };
  const F = window.__F;
  (function tick(){
    const n = performance.now();
    if (F.last){ const d = n - F.last;
      if (d > F.worstFrame){ F.worstFrame = Math.round(d); F.worstAt = Math.round(n - F.t0); } }
    F.last = n; F.frames++;
    requestAnimationFrame(tick);
  })();
  addEventListener('error', e => F.errors.push(String(e.message || e).slice(0,160)));
  addEventListener('unhandledrejection', e => { try{ F.errors.push('reject: ' + String(e.reason && e.reason.message || e.reason).slice(0,140)); }catch(_){} });
  // I3: an asset that asked for a model must resolve. Watch it continuously — the WINDOW where a
  // fighter is stuck is the bug, and sampling only at the end misses a stall that later resolves.
  setInterval(function(){
    try{
      const FS = new Function('return typeof fighters!=="undefined"?fighters:[]')();
      const now = performance.now();
      FS.forEach(function(f, i){
        if (!f) return;
        const owed = (f._charModelRequested || f.__lateAsked) && !f.model && !f._modelFailed && !f._forceProc;
        if (owed){ if (!f.__fuzzOwedAt) f.__fuzzOwedAt = now;
          else if (now - f.__fuzzOwedAt > STUCK && !f.__fuzzStuckLogged){
            f.__fuzzStuckLogged = true;
            F.stuck.push({ i, name:(f.opts&&f.opts.name)||('#'+i), ms: Math.round(now - f.__fuzzOwedAt) });
          }
        } else f.__fuzzOwedAt = 0;
      });
    }catch(e){}
  }, 500);
}

async function bootToMatch(page, port){
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:90000 });
  for (let i=0;i<400 && (await gs())!=='menu'; i++) await sleep(400);
  if ((await gs()) !== 'menu') return { ok:false, why:'never reached the menu' };
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i=0;i<80;i++){ if (await page.evaluate(()=>{ const s=document.getElementById('csStart'); return !!(s&&s.offsetParent!==null); })) break; await sleep(300); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i=0;i<150 && (await gs())!=='fight'; i++) await sleep(400);
  if ((await gs()) !== 'fight') return { ok:false, why:'never reached a match' };
  await sleep(2500);
  return { ok:true };
}

async function doAction(page, a){
  try{
    switch(a.id){
      case 'tier':   await page.evaluate(n => { try{ window.BANNON_PERF.setTier(n); }catch(e){} }, a.n); break;
      case 'resize': await page.setViewportSize({ width:a.w, height:a.h }); break;
      case 'key':    await page.evaluate(k => dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true})), a.k);
                     await sleep(70);
                     await page.evaluate(k => dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true})), a.k); break;
      case 'hide':   // backgrounding the app is a real thing a phone does mid-match
                     await page.evaluate(() => { Object.defineProperty(document,'hidden',{value:true,configurable:true});
                       document.dispatchEvent(new Event('visibilitychange')); });
                     await sleep(400);
                     await page.evaluate(() => { Object.defineProperty(document,'hidden',{value:false,configurable:true});
                       document.dispatchEvent(new Event('visibilitychange')); }); break;
      case 'pause':  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
                     await sleep(300);
                     await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))); break;
      case 'zone':   await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'z',bubbles:true}))); break;
      case 'runin':  await page.evaluate(() => { try{ if (window.BANNON_INTERFERENCE && window.BANNON_INTERFERENCE.run) window.BANNON_INTERFERENCE.run(); }catch(e){} }); break;
      case 'taunt':  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'t',bubbles:true}))); break;
      case 'grapple':await page.evaluate(() => { try{ const F=new Function('return fighters')(); if (F&&F[0]&&F[1]){ F[1].x=F[0].x+0.7; F[1].z=F[0].z; } }catch(e){} });
                     await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'l',bubbles:true}))); break;
      case 'strike': await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'j',bubbles:true}))); break;
      case 'wait':   await sleep(a.ms); break;
    }
  }catch(e){ /* a thrown action is itself reported by the invariant pass */ }
  await sleep(120);
}

async function checkInvariants(page, ctx){
  const s = await page.evaluate(() => {
    const lex = n => { try{ return new Function('return typeof '+n+'!=="undefined"?'+n+':null')(); }catch(e){ return null; } };
    const F = lex('fighters') || [];
    const r = lex('renderer');
    return {
      state: lex('gameState'),
      count: F.filter(Boolean).length,
      fighters: F.filter(Boolean).map((f,i) => ({
        i, name:(f.opts&&f.opts.name)||('#'+i),
        finite: isFinite(f.x)&&isFinite(f.z)&&isFinite(f.facing)&&isFinite(f.hp),
        hasModel: !!f.model, forceProc: !!f._forceProc,
        procVisible: !!(f.seg && f.seg.head && f.seg.head.visible) })),
      dbw: r ? r.domElement.width : -1, dbh: r ? r.domElement.height : -1,
      watch: window.__F ? { worstFrame: window.__F.worstFrame, worstAt: window.__F.worstAt,
                            errors: window.__F.errors.slice(0,5), stuck: window.__F.stuck.slice(0,5) } : null
    };
  }).catch(e => ({ err: String(e.message).slice(0,140) }));

  const v = [];
  if (s.err) { v.push({ id:'EVAL', detail: s.err }); return { v, s }; }
  if (!LEGAL_STATES.includes(s.state)) v.push({ id:'I2', detail:'illegal gameState "' + s.state + '"' });
  s.fighters.forEach(f => {
    if (!f.finite) v.push({ id:'I1', detail: f.name + ' has a non-finite position/facing/hp' });
    if (f.hasModel && f.procVisible) v.push({ id:'I4', detail: f.name + ' shows the procedural body UNDER a bound model' });
  });
  if (!(s.dbw > 0 && s.dbh > 0 && isFinite(s.dbw) && isFinite(s.dbh)))
    v.push({ id:'I5', detail:'drawing buffer ' + s.dbw + 'x' + s.dbh });
  if (s.count > MAX_FIGHTERS) v.push({ id:'I6', detail: s.count + ' fighters (cap ' + MAX_FIGHTERS + ')' });
  if (s.watch){
    if (s.watch.errors.length) v.push({ id:'I7', detail: s.watch.errors.join(' | ') });
    if (s.watch.stuck.length)  v.push({ id:'I3', detail:'stuck asset: ' + JSON.stringify(s.watch.stuck) });
    if (s.watch.worstFrame > HARD_FRAME_MS)
      v.push({ id:'I8', detail: s.watch.worstFrame + 'ms frame at t+' + s.watch.worstAt + 'ms' });
  }
  if (ctx.lastAction === 'tier' && ctx.prevCount != null && s.count > ctx.prevCount)
    v.push({ id:'I9', detail:'a tier change took fighters ' + ctx.prevCount + ' -> ' + s.count + ' (match re-initialised)' });
  return { v, s };
}

async function runSequence(browser, port, seq, label){
  const page = await browser.newPage({ viewport:{ width:412, height:915 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).split('\n')[0].slice(0,150)));
  await page.addInitScript(new Function('H','S','(' + WATCH.toString() + ')(H,S)'), HARD_FRAME_MS, STUCK_MS);
  const boot = await bootToMatch(page, port);
  if (!boot.ok){ await page.close(); return { violations:[{ id:'BOOT', detail: boot.why }], at:-1 }; }

  let prevCount = null, out = { violations:[], at:-1, log:[] };
  for (let i = 0; i < seq.length; i++){
    const a = seq[i];
    await doAction(page, a);
    const { v, s } = await checkInvariants(page, { lastAction: a.id, prevCount });
    prevCount = s && s.count != null ? s.count : prevCount;
    if (pageErrors.length) v.push({ id:'I7', detail: pageErrors.slice(0,3).join(' | ') });
    if (v.length){ out.violations = v; out.at = i; break; }
  }
  await page.close();
  return out;
}

(async () => {
  fs.mkdirSync(OUT, { recursive:true });
  const port = 9600 + Math.floor(Math.random()*300);
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });

  const replay = arg('replay', null);
  const runs = replay ? 1 : +arg('runs', '1');
  const nActions = +arg('actions', '26');
  let anyFail = false;

  for (let run = 0; run < runs; run++){
    const seed = replay ? 0 : (+arg('seed', '0') || (Date.now() % 100000) + run * 7919);
    const seq = replay ? JSON.parse(fs.readFileSync(replay,'utf8')).sequence : genSequence(seed, nActions);
    console.log('\n===== FUZZ ' + (replay ? 'REPLAY ' + path.basename(replay) : 'seed ' + seed) +
                '  (' + seq.length + ' actions) =====');
    const res = await runSequence(browser, port, seq, 'seed' + seed);
    if (!res.violations.length){ console.log('  PASS — no invariant broken in ' + seq.length + ' actions'); continue; }

    anyFail = true;
    console.log('  BROKEN at action ' + res.at + ' (' + (seq[res.at] ? seq[res.at].id : '?') + '):');
    res.violations.forEach(v => console.log('    ' + v.id + '  ' + v.detail));

    let minimal = seq.slice(0, res.at + 1);
    if (!has('no-shrink') && minimal.length > 1){
      // DELTA DEBUGGING. Drop one action at a time, from the end backwards, and keep any shorter
      // sequence that still breaks the SAME invariant. Bounded, because each attempt is a full boot.
      const wantIds = new Set(res.violations.map(v => v.id));
      const budget = +arg('shrink-budget', '10');
      console.log('  shrinking (budget ' + budget + ' re-runs)…');
      let spent = 0;
      for (let i = minimal.length - 2; i >= 0 && spent < budget; i--){
        const cand = minimal.slice(0, i).concat(minimal.slice(i + 1));
        if (!cand.length) continue;
        spent++;
        const r2 = await runSequence(browser, port, cand, 'shrink');
        if (r2.violations.some(v => wantIds.has(v.id))){
          minimal = cand; i = Math.min(i, minimal.length - 1);
          console.log('    -> ' + minimal.length + ' actions still break it');
        }
      }
    }
    const file = path.join(OUT, 'repro_' + seed + '.json');
    fs.writeFileSync(file, JSON.stringify({ seed, generatedActions: seq.length,
      violations: res.violations, sequence: minimal,
      replay: 'node tools/harness/fuzz_invariants.cjs --replay ' + path.relative(ROOT, file) }, null, 1));
    console.log('  MINIMAL REPRODUCTION (' + minimal.length + ' actions) -> ' + path.relative(ROOT, file));
    minimal.forEach((a,i) => console.log('     ' + i + '. ' + JSON.stringify(a)));
  }

  await browser.close(); srv.close();
  console.log('');
  process.exit(anyFail ? 1 : 0);
})();
