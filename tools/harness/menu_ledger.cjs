#!/usr/bin/env node
/* menu_ledger.cjs — WHICH WORK OWNS EACH MENU STALL? A LEDGER, NOT A THEORY.
 *
 *   node tools/harness/menu_ledger.cjs                 # A: baseline
 *   node tools/harness/menu_ledger.cjs --perturb noreadback
 *   node tools/harness/menu_ledger.cjs --perturb noglb
 *   node tools/harness/menu_ledger.cjs --perturb nobust
 *   node tools/harness/menu_ledger.cjs --perturb nowarm
 *   node tools/harness/menu_ledger.cjs --perturb none --dwell 45
 *
 * boot_autopsy proved WHERE: the MENU is 34 s long with 35.6 s of stall, worst frame 4,756 ms,
 * against 4.3 s across the whole MATCH. This asks WHICH WORK, and it answers with a ledger —
 * every long frame assigned to one OBSERVED subphase with the exact counts for that frame.
 *
 * THE SUBPHASES ARE HOOKED ON THE REAL FUNCTIONS, never inferred from timing:
 *   PORTRAIT_BUST   BANNON_PORTRAITS renders a procedural bust and reads it back
 *   PORTRAIT_GLB    it loads a CHARACTER GLB, renders it, and reads it back
 *   CLIP_WARM       BANNON_WARM pulls capture JSON
 *   MENU_IDLE       none of the above is inside a call
 *
 * WHY THOSE THREE. The portrait module carries its own measured note from an earlier pass:
 * "openSelect 11,267ms -> renderRoster 11,168ms -> get() 11,122ms, of which toDataURL is 9,095ms
 * SELF and shader linking another 2,345ms." That burst was fixed by draining ONE portrait per
 * animation frame instead of 121 in a forEach — but SPREADING work does not REMOVE it, and the
 * menu still has to render 121 characters and read each one back. toDataURL is a synchronous GPU
 * readback plus a PNG encode on the main thread; the GLB path additionally parses a multi-megabyte
 * model and mints new shader programs for its materials. Both are prime suspects and neither is
 * accused here — they are MEASURED.
 *
 * PERTURB EXACTLY ONE VARIABLE, FROM OUTSIDE THE GAME. No source edits, so nothing is "fixed"
 * before it is understood, and the perturbation is provably the only difference:
 *   noreadback  toDataURL returns a stub instantly     -> isolates the GPU readback + PNG encode
 *   noglb       the GLB portrait queue never pumps     -> isolates model parse + its new programs
 *   nobust      the procedural bust never renders      -> isolates the bust render path
 *   nowarm      BANNON_WARM.warm is a no-op            -> isolates capture fetching
 *
 * COUNTS ARE THE VERDICT, NOT MILLISECONDS. This file's own law: a single run of a render harness
 * cannot resolve a difference under ~50%, so the report leads with STALL COUNT and readback COUNT,
 * which are tight, and prints the milliseconds beside them as context rather than proof.
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
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json','.jgz':'application/octet-stream' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const arg = (n,d) => { const i = process.argv.indexOf('--'+n); return i>0 && process.argv[i+1] ? process.argv[i+1] : d; };
const PERTURB = arg('perturb', 'none');
const DWELL = +arg('dwell', '40');
const LONG = +arg('long', '400');

function LEDGER(LONG, PERTURB){
  var L = window.__LEDGER = {
    t0: performance.now(), long: LONG, perturb: PERTURB, phase: 'PRE',
    stalls: [], frames: 0,
    c: { bust:0, bustMs:0, glb:0, glbMs:0, warm:0, warmMs:0,
         readback:0, readbackMs:0, shaders:0, pending:0, fetches:0 },
    depth: { PORTRAIT_BUST:0, PORTRAIT_GLB:0, CLIP_WARM:0 }
  };
  function now(){ return Math.round(performance.now() - L.t0); }
  function active(){
    if (L.depth.PORTRAIT_GLB > 0)  return 'PORTRAIT_GLB';
    if (L.depth.PORTRAIT_BUST > 0) return 'PORTRAIT_BUST';
    if (L.depth.CLIP_WARM > 0)     return 'CLIP_WARM';
    return 'MENU_IDLE';
  }
  // A long frame is a GAP, so the work that caused it has usually already returned by the time the
  // next rAF runs. Remember what was open DURING the gap, sampled far more often than a frame.
  var lastSeen = 'MENU_IDLE', sawDuringGap = {};
  setInterval(function(){ var a = active(); lastSeen = a; sawDuringGap[a] = (sawDuringGap[a]||0)+1; }, 8);

  var last = 0, prevC = JSON.parse(JSON.stringify(L.c));
  (function tick(){
    var n = performance.now();
    if (last){
      var d = n - last;
      if (d >= L.long){
        // ── ATTRIBUTE BY WORK COMPLETED ACROSS THE GAP, NOT BY SAMPLING INSIDE IT ────────────
        // The first version picked whichever subphase a setInterval saw most often during the
        // stall. It reported MENU_IDLE for all 24 stalls with `samples {}` on several of them —
        // because A STALLED MAIN THREAD DOES NOT RUN TIMERS EITHER. Same-thread sampling is blind
        // during precisely the window it exists to observe; that is the same mistake as marking
        // the phase from the driver, one layer in.
        // What survives a freeze is a COUNTER. Diff every counter across the gap and the deltas
        // say what the thread actually finished while it was not answering.
        var dc = {};
        for (var ck in L.c) dc[ck] = +(L.c[ck] - (prevC[ck] || 0)).toFixed(1);
        var owner = 'MENU_IDLE', best = 0;
        for (var k in sawDuringGap) if (sawDuringGap[k] > best){ best = sawDuringGap[k]; owner = k; }
        L.stalls.push({ at: now(), ms: Math.round(d), phase: L.phase, owner: owner,
                        samples: Object.assign({}, sawDuringGap),
                        did: dc, c: JSON.parse(JSON.stringify(L.c)) });
      }
      prevC = JSON.parse(JSON.stringify(L.c));
      sawDuringGap = {};
    }
    last = n; L.frames++;
    requestAnimationFrame(tick);
  })();

  // ── shader links + in-flight requests ────────────────────────────────────────────────────
  function hookGL(){
    ['WebGL2RenderingContext','WebGLRenderingContext'].forEach(function(k){
      var P = window[k] && window[k].prototype; if (!P || P.__ledger) return; P.__ledger = 1;
      var lp = P.linkProgram; P.linkProgram = function(){ L.c.shaders++; return lp.apply(this, arguments); };
    });
  }
  hookGL();
  try{
    var of = window.fetch;
    window.fetch = function(){ L.c.fetches++; L.c.pending++;
      var p = of.apply(window, arguments); var d = function(){ L.c.pending--; }; p.then(d,d); return p; };
    var os = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(){ L.c.fetches++; L.c.pending++;
      this.addEventListener('loadend', function(){ L.c.pending--; }); return os.apply(this, arguments); };
  }catch(e){}

  // ── THE READBACK, measured directly, and stubbed for the perturbation ────────────────────
  try{
    var otd = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(){
      if (L.perturb === 'noreadback'){ L.c.readback++;
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; }
      var t = performance.now();
      var r = otd.apply(this, arguments);
      L.c.readbackMs += (performance.now() - t); L.c.readback++;
      return r;
    };
  }catch(e){}

  // ── wrap the REAL menu workers, once each module exists ──────────────────────────────────
  function wrap(obj, key, name, counter, msKey, disabled){
    if (!obj || typeof obj[key] !== 'function' || obj[key].__ledger) return false;
    var o = obj[key];
    var w = function(){
      if (disabled) return undefined;
      L.depth[name]++; L.c[counter]++;
      var t = performance.now();
      try{ return o.apply(this, arguments); }
      finally { L.c[msKey] += (performance.now() - t); L.depth[name]--; }
    };
    w.__ledger = 1;
    try{ obj[key] = w; }catch(e){ return false; }
    return true;
  }
  setInterval(function(){
    hookGL();
    try{
      var P = window.BANNON_PORTRAITS;
      if (P){
        // get() is the entry the roster calls; it registers want and (historically) rendered.
        wrap(P, 'get', 'PORTRAIT_BUST', 'bust', 'bustMs', L.perturb === 'nobust');
        wrap(P, 'prioritise', 'PORTRAIT_BUST', 'bust', 'bustMs', L.perturb === 'nobust');
      }
      var W = window.BANNON_WARM;
      if (W) wrap(W, 'warm', 'CLIP_WARM', 'warm', 'warmMs', L.perturb === 'nowarm');
    }catch(e){}
    // GLB portraits: the queue is module-private, so intercept the LOADER instead — every portrait
    // model goes through GLTFLoader.load, and so does nothing else at the menu.
    try{
      if (typeof THREE !== 'undefined' && THREE.GLTFLoader && !THREE.GLTFLoader.prototype.__ledger){
        THREE.GLTFLoader.prototype.__ledger = 1;
        var ol = THREE.GLTFLoader.prototype.load;
        THREE.GLTFLoader.prototype.load = function(url, onLoad, onProg, onErr){
          if (L.perturb === 'noglb' && L.phase === 'MENU'){ if (onErr) try{ onErr(new Error('ledger: glb suppressed')); }catch(e){} return; }
          var self = this;
          return ol.call(this, url, function(g){
            L.depth.PORTRAIT_GLB++; L.c.glb++;
            var t = performance.now();
            try{ return onLoad && onLoad(g); }
            finally { L.c.glbMs += (performance.now() - t); L.depth.PORTRAIT_GLB--; }
          }, onProg, onErr);
        };
      }
    }catch(e){}
  }, 60);

  L.mark = function(p){ L.phase = p; };

  // ── MARK THE MENU FROM INSIDE THE PAGE, NOT FROM NODE ───────────────────────────────────────
  // The first version of this harness marked MENU when the DRIVER noticed gameState === 'menu',
  // and measured almost nothing: 2 stalls in 40 s against boot_autopsy's 23. The driver can only
  // notice once page.evaluate returns, and page.evaluate cannot return WHILE THE MAIN THREAD IS
  // STALLED — so the window opened only after the stalls it was meant to catch had finished.
  // AN OBSERVER OUTSIDE THE PROCESS CANNOT TIMESTAMP A FREEZE INSIDE IT. Mark it in here, where a
  // 60 ms interval sees the state change the moment the thread is free enough to run anything.
  var menuMarked = false;
  setInterval(function(){
    if (menuMarked) return;
    try{
      var gs = new Function('return typeof gameState!=="undefined"?gameState:null')();
      if (gs === 'menu'){ menuMarked = true; L.phase = 'MENU'; L.menuAt = now(); }
    }catch(e){}
  }, 60);
}

function serve(port){
  const srv = http.createServer((req,res)=>{
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/BANNON_v150.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()]||'application/octet-stream', 'Cache-Control':'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

(async () => {
  fs.mkdirSync(OUT, { recursive:true });
  const port = 9300 + Math.floor(Math.random()*400);
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,120)));
  await page.addInitScript(new Function('A','B','(' + LEDGER.toString() + ')(A,B)'), LONG, PERTURB);

  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:120000 });
  const gs = () => page.evaluate(()=>{ try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  // wait for the PAGE's own mark, never impose one from out here
  for (let i=0;i<600;i++){
    const m = await page.evaluate(() => !!(window.__LEDGER && window.__LEDGER.menuAt != null)).catch(()=>false);
    if (m) break;
    await sleep(400);
  }
  // SIT ON THE MENU AND DO NOTHING. That is the owner's actual complaint.
  await sleep(DWELL * 1000);
  const L = await page.evaluate(() => window.__LEDGER);
  await browser.close(); srv.close();

  const menu = (L.stalls||[]).filter(s => s.phase === 'MENU');
  const by = {};
  menu.forEach(s => { by[s.owner] = by[s.owner] || { n:0, total:0, worst:0 };
    by[s.owner].n++; by[s.owner].total += s.ms; by[s.owner].worst = Math.max(by[s.owner].worst, s.ms); });

  const row = {
    perturb: PERTURB, dwellS: DWELL, frames: L.frames, menuAt: L.menuAt,
    menuStalls: menu.length, menuStallMs: menu.reduce((n,s)=>n+s.ms,0),
    worst: menu.reduce((n,s)=>Math.max(n,s.ms),0),
    readbacks: L.c.readback, readbackMs: Math.round(L.c.readbackMs),
    bustCalls: L.c.bust, glbPortraits: L.c.glb, glbMs: Math.round(L.c.glbMs),
    warmCalls: L.c.warm, shaders: L.c.shaders, fetches: L.c.fetches, pageErrors: errs.length
  };
  const file = path.join(OUT, 'menu_ledger_' + PERTURB + '.json');
  fs.writeFileSync(file, JSON.stringify({ row, byOwner: by, stalls: menu, errs }, null, 1));

  console.log('\n===== MENU LEDGER  perturb=' + PERTURB + '  dwell ' + DWELL + 's  (long >= ' + LONG + 'ms) =====');
  console.log('  menu reached (page clock) t+' + L.menuAt + 'ms');
  console.log('  MENU STALLS  ' + row.menuStalls + '   total ' + row.menuStallMs + 'ms   worst ' + row.worst + 'ms   frames ' + row.frames);
  console.log('\n  OWNER OF EACH STALL');
  Object.entries(by).sort((a,b)=>b[1].total-a[1].total).forEach(([k,v]) =>
    console.log('    ' + k.padEnd(15) + String(v.n).padStart(3) + ' stalls   ' + String(v.total).padStart(6) + 'ms   worst ' + v.worst + 'ms'));
  if (!menu.length) console.log('    (none)');
  console.log('\n  WORK DONE WHILE SITTING ON THE MENU');
  console.log('    canvas readbacks (toDataURL) ' + String(row.readbacks).padStart(5) + '   ' + row.readbackMs + 'ms self');
  console.log('    GLB portraits loaded         ' + String(row.glbPortraits).padStart(5) + '   ' + row.glbMs + 'ms in onLoad');
  console.log('    portrait get/prioritise      ' + String(row.bustCalls).padStart(5));
  console.log('    clip warm calls              ' + String(row.warmCalls).padStart(5));
  console.log('    shader links                 ' + String(row.shaders).padStart(5));
  console.log('    requests issued              ' + String(row.fetches).padStart(5));
  console.log('    page errors                  ' + String(row.pageErrors).padStart(5));
  console.log('\n  WHAT COMPLETED DURING EACH STALL (deltas across the gap — the only thing a freeze cannot hide)');
  menu.slice().sort((a,b)=>b.ms-a.ms).slice(0,8).forEach(s => {
    const d = s.did || {};
    const bits = Object.keys(d).filter(k => d[k] > 0 && !/Ms$/.test(k)).map(k => k + ' +' + d[k]);
    const ms = Object.keys(d).filter(k => /Ms$/.test(k) && d[k] > 1).map(k => k + ' ' + Math.round(d[k]) + 'ms');
    console.log('    ' + String(s.ms).padStart(6) + 'ms t+' + String(s.at).padStart(6) + '   ' +
      (bits.concat(ms).join(' · ') || 'NOTHING COUNTED COMPLETED'));
  });
  // the aggregate is the honest headline: how much of the stalled time coincides with each counter
  const agg = {};
  menu.forEach(s => { const d = s.did || {}; for (const k in d) if (d[k] > 0) agg[k] = (agg[k]||0) + d[k]; });
  console.log('\n  SUMMED ACROSS ALL ' + menu.length + ' MENU STALLS: ' +
    Object.entries(agg).filter(([k,v]) => v > 0).map(([k,v]) => k + ' ' + Math.round(v)).join(' · '));
  const noWork = menu.filter(s => { const d = s.did||{}; return !Object.keys(d).some(k => !/Ms$/.test(k) && d[k] > 0); });
  console.log('  stalls with NO counted work at all: ' + noWork.length + ' of ' + menu.length +
    (noWork.length ? '   <- these are outside every instrument here' : ''));
  console.log('\n  -> ' + path.relative(ROOT, file) + '\n');
})();
