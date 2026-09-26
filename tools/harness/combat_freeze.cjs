#!/usr/bin/env node
/* combat_freeze.cjs — THE CLOCK KEEPS RUNNING BUT THE WRESTLERS STOP.
 *
 *   node tools/harness/combat_freeze.cjs
 *
 * Owner, and this is the sentence that reframed the whole thing: "the game is still freezing a few
 * seconds into combat but THE CLOCK AND COMBOS ARE STILL SHOWING AND MOVING but the combat is
 * frozen and match is frozen."
 *
 * That is NOT a main-thread stall. If the round clock ticks and the combo counter animates, the
 * page is alive — requestAnimationFrame is firing, timers are firing, the DOM is repainting. What
 * has stopped is the FIGHTER SIMULATION specifically. Every probe I have written so far measured
 * frame gaps, so a freeze of this shape is invisible to all of them: the frame loop looks perfect
 * while the wrestlers stand still.
 *
 * The overwhelmingly likely cause is an exception thrown inside the per-fighter update and
 * swallowed. `Fighter.prototype.update` has roughly 28 monkey-patch wrappers stacked on it and many
 * of them are `try{ ... }catch(e){}`; one throw per frame inside the right one stops the fighters
 * dead and never reaches window.onerror, so the console stays clean and the clock keeps counting.
 *
 * So this harness:
 *   * tracks the CLOCK (round timer text) and the FIGHTERS (x/z/state/attackPhase) separately, and
 *     reports the exact second they diverge — clock advancing, bodies not;
 *   * wraps Fighter.prototype.update in a reporting try/catch OUTSIDE every existing wrapper, so a
 *     swallowed throw is captured with its message and stack instead of vanishing;
 *   * does the same for updateFighterModel, updateProcedural and the pose functions;
 *   * dumps the fighters' state at the moment of divergence.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const OUT = path.join(ROOT, 'dist', 'playtest');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg',
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  const S = window.__CF = { throws:[], calls:{}, frames:0, t0:0 };
  const rec = (where, e) => {
    const msg = String((e && e.message) || e).slice(0, 200);
    const key = where + ' :: ' + msg;
    let hit = S.throws.find(t => t.key === key);
    if (!hit){ hit = { key, where, msg, n:0, stack:String((e && e.stack) || '').split('\n').slice(1,5).map(s=>s.trim()).join(' | ') };
      S.throws.push(hit); }
    hit.n++;
  };
  const count = k => { S.calls[k] = (S.calls[k] || 0) + 1; };

  // A REPORTING WRAPPER, INSTALLED OUTSIDE EVERY EXISTING ONE. The point is not to change behaviour
  // — it rethrows nothing and swallows nothing that was not already swallowed — it is to SEE the
  // throw that the stack of try/catch wrappers below is hiding.
  function guard(obj, name, label){
    if (!obj || typeof obj[name] !== 'function' || obj[name].__cf) return false;
    const o = obj[name];
    const w = function(){
      count(label);
      try { return o.apply(this, arguments); }
      catch(e){ rec(label, e); throw e; }      // preserve behaviour exactly; just observe on the way past
    };
    w.__cf = 1; for (const k in o){ try{ w[k] = o[k]; }catch(_){} }
    try { obj[name] = w; return true; } catch(_){ return false; }
  }

  (function tick(){ S.frames++; if (!S.t0) S.t0 = performance.now(); requestAnimationFrame(tick); })();
  addEventListener('error', e => rec('window.onerror', e.error || e.message));
  addEventListener('unhandledrejection', e => rec('unhandledrejection', e.reason));

  const arm = () => {
    try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.__cfTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; window.__cfTier = 1; } }catch(e){}
    try{
      const F = new Function('return typeof Fighter!=="undefined"?Fighter:null')();
      if (F){
        guard(F.prototype, 'update', 'Fighter.update');
        guard(F.prototype, 'updateProcedural', 'Fighter.updateProcedural');
        guard(F.prototype, 'poseAttack', 'Fighter.poseAttack');
        guard(F.prototype, 'poseGuard', 'Fighter.poseGuard');
        guard(F.prototype, 'applyMesh', 'Fighter.applyMesh');
        guard(F.prototype, 'updateRagdoll', 'Fighter.updateRagdoll');
        guard(F.prototype, 'think', 'Fighter.think');
        guard(F.prototype, 'move2D', 'Fighter.move2D');
      }
    }catch(e){}
    guard(window, 'updateFighterModel', 'updateFighterModel');
    guard(window, 'studioApplyClipPose', 'studioApplyClipPose');
    guard(window, 'registerHit', 'registerHit');
  };
  arm(); setInterval(arm, 250);

  // ---- the divergence watch: clock vs bodies -------------------------------------------------
  S.samples = [];
  setInterval(function(){
    try{
      const F = new Function('return typeof fighters!=="undefined"?fighters:null')();
      const clockEl = document.getElementById('roundTimer') || document.getElementById('timer') ||
                      document.querySelector('[id*="imer" i]');
      const comboEl = document.getElementById('comboCount') || document.querySelector('[id*="ombo" i]');
      const row = {
        t: +(((performance.now()) - S.t0)/1000).toFixed(1),
        frames: S.frames,
        clock: clockEl ? String(clockEl.textContent||'').trim().slice(0,12) : null,
        combo: comboEl ? String(comboEl.textContent||'').trim().slice(0,12) : null,
        gs: (function(){ try{ return new Function('return gameState')(); }catch(e){ return null; } })(),
        f: (F||[]).filter(Boolean).slice(0,3).map(function(f){
          return { n:(f.opts&&f.opts.name)||'?', s:f.state,
                   x:+(f.x||0).toFixed(3), z:+(f.z||0).toFixed(3),
                   ph:+(f.attackPhase||0).toFixed(2), hp:Math.round(f.hp||0),
                   st:+(f.stateTime||0).toFixed(2),
                   fin: isFinite(f.x)&&isFinite(f.z)&&isFinite(f.facing) }; }),
        calls: Object.assign({}, S.calls)
      };
      S.samples.push(row);
      if (S.samples.length > 600) S.samples.shift();
    }catch(e){}
  }, 500);
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,160)));
  await page.addInitScript(PROBE);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);

  // FIGHT for a good while, driving input the whole time — the report is "a few seconds into combat"
  const keys = ['j','k','u','i','g','d','a'];
  const end = Date.now() + 75000;
  let k = 0;
  while (Date.now() < end){
    const key = keys[(k++) % keys.length];
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown',{key:x,bubbles:true})), key);
    await sleep(90);
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup',{key:x,bubbles:true})), key);
    await sleep(260);
  }

  const R = await page.evaluate(() => ({ throws: window.__CF.throws, samples: window.__CF.samples,
                                         frames: window.__CF.frames, calls: window.__CF.calls }));
  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  // ---- find the divergence: frames advancing while every fighter is bit-identical --------------
  const S = R.samples.filter(s => s.gs === 'fight');
  const sig = s => JSON.stringify(s.f.map(f => [f.s, f.x, f.z, f.ph, f.st]));
  let frozenFrom = null, frozenSpan = 0, best = null;
  for (let i = 1; i < S.length; i++){
    const same = sig(S[i]) === sig(S[i-1]);
    const framesMoved = S[i].frames > S[i-1].frames;
    if (same && framesMoved){
      if (frozenFrom == null) frozenFrom = S[i-1];
      frozenSpan++;
      if (!best || frozenSpan > best.span) best = { from: frozenFrom, to: S[i], span: frozenSpan };
    } else { frozenFrom = null; frozenSpan = 0; }
  }

  console.log('\n===== COMBAT FREEZE =====');
  console.log('  rAF frames total: ' + R.frames + '   samples in fight: ' + S.length);
  console.log('  update calls: ' + JSON.stringify(R.calls));
  if (best && best.span >= 3){
    const secs = (best.to.t - best.from.t).toFixed(1);
    console.log('\n  *** BODIES FROZEN WHILE THE PAGE KEPT RUNNING ***');
    console.log('   from t=' + best.from.t + 's to t=' + best.to.t + 's  (' + secs + 's, ' +
                (best.to.frames - best.from.frames) + ' rAF frames elapsed)');
    console.log('   clock  ' + JSON.stringify(best.from.clock) + ' -> ' + JSON.stringify(best.to.clock) +
                (best.from.clock !== best.to.clock ? '   <-- THE CLOCK KEPT MOVING' : ''));
    console.log('   combo  ' + JSON.stringify(best.from.combo) + ' -> ' + JSON.stringify(best.to.combo));
    console.log('   Fighter.update calls ' + (best.from.calls['Fighter.update']||0) + ' -> ' + (best.to.calls['Fighter.update']||0) +
                ((best.to.calls['Fighter.update']||0) === (best.from.calls['Fighter.update']||0)
                  ? '   <-- update STOPPED BEING CALLED' : '   <-- update still called; it is running and doing nothing'));
    console.log('   fighters at freeze: ' + JSON.stringify(best.from.f));
  } else {
    console.log('\n  no body-freeze detected in this run (bodies changed between every sample)');
  }
  if (R.throws.length){
    console.log('\n  EXCEPTIONS CAUGHT INSIDE THE FIGHTER LOOP (these never reach the console):');
    R.throws.sort((a,b)=>b.n-a.n).slice(0,10).forEach(t =>
      console.log('   x' + String(t.n).padStart(5) + '  ' + t.where + '  ' + t.msg + '\n            ' + t.stack));
  } else console.log('\n  no exceptions thrown inside the fighter loop');
  if (errs.length) console.log('\n  page errors: ' + errs.slice(0,5).join(' | '));

  fs.writeFileSync(path.join(OUT, 'combat_freeze.json'), JSON.stringify(R, null, 1));
  console.log('\n  report -> ' + path.join(OUT, 'combat_freeze.json'));
})();
