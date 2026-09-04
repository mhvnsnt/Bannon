#!/usr/bin/env node
/* footik_writemap.cjs — WHAT DOES FOOTIK ACTUALLY WRITE, AND HOW MUCH?
 *
 *   node tools/harness/footik_writemap.cjs [--nofootik]
 *
 * Owner, setting the question before any candidate exists: "The next question is not: How do we make
 * FOOTIK stop fighting? It's: What does FOOTIK actually write, and what authority does it currently
 * exercise?" ... "A chain that is technically touched every frame but receives microscopic
 * corrections is a different problem from a chain being substantially reposed every frame."
 *
 * So this tool answers three separate questions and refuses to collapse them into one verdict:
 *
 *   1. WHICH BONES        — from the engine's own write ledger (quaternion._onChange + the stack),
 *                           NOT from the module's self-report. A module claiming it only touches
 *                           feet is metadata; the assignment site is the fact. (OWNER LAW.)
 *   2. HOW MUCH           — radians of world-space rotation applied per write, mean / sd / max,
 *                           split by planted leg vs the leg easing out. A constraint correction and
 *                           a second pose author look identical in a write COUNT and nothing alike
 *                           in a magnitude.
 *   3. AGAINST WHAT       — the plant error being corrected (metres of XZ drift off the lock) and
 *                           the residual after the solve. A large rotation spent removing a large
 *                           error is a working constraint; a large rotation with no error to remove
 *                           is authority.
 *
 * AND THE SHARE. Every leg-bone write in the window is attributed to its source line, so FOOTIK's
 * writes are reported as a FRACTION of all writes to that bone. "FOOTIK wrote LeftUpLeg 900 times"
 * means nothing until you know whether the clip wrote it 900 times or 9.
 *
 * --nofootik is the control (window.FOOT_IK=false) in the SAME build, per the A/B law. It exists so
 * the leg-bone write totals can be read with this module out of the way — i.e. so question 3 has a
 * baseline. It is NOT a candidate.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const GAME = path.join(ROOT, 'BANNON_v150.html');
const OUT = path.join(ROOT, 'dist', 'playtest');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg',
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NOFIK = process.argv.indexOf('--nofootik') > 0;

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

/* THE MODULE'S OWN LINE RANGE, read off the file rather than hardcoded. A line number is a stable
 * identity in a single-file game (already banked law) but only for the build in front of you — every
 * edit to this file moves it, so it is derived per run and never written down. */
function footikRange(){
  const L = fs.readFileSync(GAME, 'utf8').split('\n');
  let a = -1, b = -1;
  for (let i = 0; i < L.length; i++){
    if (a < 0 && L[i].indexOf('BANNON_FOOTIK — TWO-BONE FOOT IK') >= 0) a = i + 1;
    else if (a > 0 && b < 0 && L[i].indexOf('window.BANNON_FOOTIK = {') >= 0) b = i + 40;
  }
  return { from: a, to: b };
}

function PROBE(cfg){
  const S = window.__FW = { on:false, ledger:{}, frames:0, states:{} };
  if (cfg.nofik) window.FOOT_IK = false;

  const LEGS = ['LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot','Hips'];

  /* WRITE LEDGER. three.js fires Quaternion._onChangeCallback from inside its own copy()/slerp(),
   * so the nearest stack frame naming the GAME file is the real writer. Anything else on the stack
   * is the library, and a ledger that names the library as the author is a broken instrument that
   * reports "no contention" — that trap is already banked from pose_ledger.cjs. */
  function watch(model){
    if (!model || model.__fwWatched) return;
    model.__fwWatched = 1;
    model.traverse(function(o){
      if (!o.isBone) return;
      var nm = String(o.name || '').replace(/^mixamorig\d*/, '');
      if (LEGS.indexOf(nm) < 0) return;
      var q = o.quaternion, prev = q._onChangeCallback;
      q._onChange(function(){
        if (prev) { try{ prev(); }catch(e){} }
        if (!S.on) return;
        var st = '';
        try{ st = new Error().stack || ''; }catch(e){ return; }
        var m = st.match(/BANNON_v150\.html:(\d+):\d+/);
        if (!m) return;
        var line = +m[1];
        var b = S.ledger[nm] || (S.ledger[nm] = { total:0, byLine:{} });
        b.total++;
        b.byLine[line] = (b.byLine[line] || 0) + 1;
      });
    });
  }
  setInterval(function(){
    try{
      var F = new Function('return typeof fighters!=="undefined"?fighters:null')();
      if (F && F[0] && F[0].model) watch(F[0].model);
    }catch(e){}
  }, 250);

  /* WHAT STATE WAS THE FIGHTER IN. FOOTIK's own gate is OK_STATE {idle,walk,run,block,taunt} plus a
   * pile of exclusions, so "it wrote 900 times" is only readable next to how many frames it was even
   * allowed to run. Counted here rather than inferred from the drive script. */
  (function tick(){
    if (S.on){
      S.frames++;
      try{
        var F = new Function('return typeof fighters!=="undefined"?fighters:null')();
        var f = F && F[0];
        if (f) S.states[f.state] = (S.states[f.state] || 0) + 1;
      }catch(e){}
    }
    requestAnimationFrame(tick);
  })();

  window.__fwStart = function(){
    S.ledger = {}; S.frames = 0; S.states = {}; S.on = true;
    try{ window.BANNON_FOOTIK && window.BANNON_FOOTIK.reset(); }catch(e){}
  };
  window.__fwStop = function(){
    S.on = false;
    var w = null, s = null;
    try{ w = window.BANNON_FOOTIK.writes(); s = window.BANNON_FOOTIK.stats(); }catch(e){}
    return { ledger:S.ledger, frames:S.frames, states:S.states, writes:w, stats:s };
  };

  try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; } }catch(e){}
  // Render stubbed: swiftshader gives ~2 fps and a gait at 2 fps is aliased into a flat line. Banked
  // law — measure animation with the rasteriser out of the way, never off it.
  setInterval(function(){
    try{
      var R = new Function('return typeof renderer!=="undefined"?renderer:null')();
      if (R && R.render && !R.render.__stub){ var w = function(){}; w.__stub = 1; R.render = w; }
    }catch(e){}
  }, 300);
}

const R3 = x => Math.round(x*1000)/1000;
const DEG = r => (r * 180 / Math.PI);

(async () => {
  const range = footikRange();
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,140)));
  await page.addInitScript(PROBE, { nofik: NOFIK });
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);
  await sleep(9000);

  // FREEZE THE AI through the engine's own gate, and put the opponent out of range. A deterministic
  // walk cannot be taken from inside a live fight — banked from grapple_contact.cjs, where the first
  // run measured the player being grabbed by the CPU.
  await page.evaluate(() => { try{
    const F = new Function('return fighters')();
    if (F && F[1]){ F[1].x = F[0].x + 7; F[1].z = F[0].z + 7; F[1].__frozen = 1; }
    if (typeof window.updateAI === 'function' && !window.updateAI.__fw){
      const o = window.updateAI; const w = function(f){ if (f && f.__frozen) return; return o.apply(this, arguments); };
      w.__fw = 1; window.updateAI = w;
    }
  }catch(e){} });

  await page.evaluate(() => window.__fwStart());
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})));
  await sleep(15000);
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
  const res = await page.evaluate(() => window.__fwStop());

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const inFik = l => l >= range.from && l <= range.to;

  console.log('\n===== FOOTIK WRITE MAP ' + (NOFIK ? '(CONTROL — FOOT_IK=false)' : '') + ' =====');
  console.log('  module occupies lines ' + range.from + '-' + range.to + ' of this build');
  console.log('  ' + res.frames + ' frames sampled;  player states: ' +
    Object.keys(res.states).map(k => k + ' ' + res.states[k]).join(', '));
  if (res.stats) console.log('  module counters: ' + JSON.stringify(res.stats));

  console.log('\n--- 1. WHICH BONES  (from the write ledger, not the module) ---');
  console.log('  bone            total    FOOTIK   share   other writers (line:count)');
  const order = ['Hips','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
  const share = {};
  for (const nm of order){
    const b = res.ledger[nm];
    if (!b){ console.log('   ' + nm.padEnd(14) + '   (no writes observed)'); continue; }
    let mine = 0; const others = [];
    for (const l in b.byLine){ if (inFik(+l)) mine += b.byLine[l]; else others.push(l + ':' + b.byLine[l]); }
    share[nm] = b.total ? mine / b.total : 0;
    others.sort((x,y) => (+y.split(':')[1]) - (+x.split(':')[1]));
    console.log('   ' + nm.padEnd(14) + String(b.total).padStart(6) + String(mine).padStart(9) +
      String((share[nm]*100).toFixed(0) + '%').padStart(8) + '   ' + (others.slice(0,4).join('  ') || '—'));
  }

  console.log('\n--- 2. HOW MUCH  (world-space rotation applied per write) ---');
  // The unit is a property of the CHANNEL, not of "everything I did not name". Deriving it by
  // exclusion is how `.attempt` — a distance — came out labelled in degrees on the first run.
  const CM = k => /\.(err|res|attempt)\./.test(k);
  const isSkip = k => k.indexOf('skip.') === 0;
  const W = res.writes || {};
  const chans = Object.keys(W).filter(k => !isSkip(k)).sort();
  if (!chans.length) console.log('   no corrections recorded');
  else {
    console.log('  channel               n      mean        sd       max    unit');
    for (const k of chans){
      const w = W[k], cm = CM(k), f = cm ? (x => x*100) : DEG;
      console.log('   ' + k.padEnd(20) + String(w.n).padStart(5) +
        String(f(w.mean).toFixed(2)).padStart(10) + String(f(w.sd).toFixed(2)).padStart(10) +
        String(f(w.max).toFixed(2)).padStart(10) + '    ' + (cm ? 'cm' : 'deg'));
    }
  }

  // WHY it stood down, per fighter. 'skipped' as one number cannot tell "correctly excluded during a
  // grapple" from "never ran", and a second body on the apron inflates it past the player entirely.
  const skips = Object.keys(W).filter(isSkip).sort((a,b) => W[b].n - W[a].n);
  if (skips.length){
    console.log('\n  stood down (frames):');
    let p = 0, ai = 0;
    for (const k of skips){
      console.log('   ' + k.slice(5).padEnd(24) + String(W[k].n).padStart(6));
      if (k.indexOf('skip.p.') === 0) p += W[k].n; else ai += W[k].n;
    }
    const elig = res.frames - p;
    console.log('   player skipped ' + p + ' of ' + res.frames + ' frames (the other ' + ai +
      ' are the opponent) -> ELIGIBLE on ~' + elig + ', SOLVED on ' + (res.stats ? res.stats.solved : '?') +
      ' = ' + (elig > 0 ? ((res.stats.solved / elig) * 100).toFixed(1) : '?') + '%');
  }

  console.log('\n--- 3. AGAINST WHAT  (is the rotation buying a correction, or authoring a pose) ---');
  for (const side of ['L','R']){
    for (const ph of ['plant','swing']){
      const e = res.writes && res.writes[side + '.err.' + ph];
      const r = res.writes && res.writes[side + '.res.' + ph];
      const h = res.writes && res.writes[side + '.hip.' + ph];
      const k = res.writes && res.writes[side + '.knee.' + ph];
      if (!e || !r) continue;
      // n<8 is noise wearing a number — banked from grapple_contact's THIN rule. Say so, don't judge.
      const thin = e.n < 8 ? '   [THIN n=' + e.n + ']' : '';
      console.log('   ' + side + ' ' + ph.padEnd(6) +
        ' plant error ' + (e.mean*100).toFixed(2) + 'cm (max ' + (e.max*100).toFixed(1) + ')' +
        ' -> residual ' + (r.mean*100).toFixed(2) + 'cm' +
        '  = ' + (e.mean > 0 ? (100 * (1 - r.mean/e.mean)).toFixed(0) : '0') + '% removed' +
        ';  spent hip ' + (h ? DEG(h.mean).toFixed(1) + '°' : '0') +
        ' + knee ' + (k ? DEG(k.mean).toFixed(1) + '°' : '0') + thin);
    }
  }

  if (errs.length) console.log('\n  page errors: ' + errs.slice(0,4).join(' | '));
  const file = path.join(OUT, 'footik_writemap' + (NOFIK ? '_control' : '') + '.json');
  fs.writeFileSync(file, JSON.stringify({ range, nofootik:NOFIK, share, ...res }, null, 1));
  console.log('\n  report -> ' + file);
})();
