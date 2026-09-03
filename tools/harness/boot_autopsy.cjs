#!/usr/bin/env node
/* boot_autopsy.cjs — MAKE IT IMPOSSIBLE FOR A MULTI-SECOND STALL TO HAPPEN ANONYMOUSLY.
 *
 *   node tools/harness/boot_autopsy.cjs               # boot -> menu -> match, attributed
 *   node tools/harness/boot_autopsy.cjs --long 400    # what counts as a long frame
 *   node tools/harness/boot_autopsy.cjs --json
 *
 * WHY. Every harness in this directory starts measuring at the bell, and the fuzzer's PASSING runs
 * reported worst frames of 2,856 / 2,624 / 3,615 ms with several of them BEFORE A MATCH EXISTS.
 * The worst stalls in this game are happening in the one region nothing has ever looked at:
 *     PAGE START ------------------ MATCH START ------------- MATCH
 *                ^ unmeasured                    ^ measured
 *
 * THE RULE THAT SHAPES THIS TOOL: do not measure duration, ATTRIBUTE it. A 3.6-second frame with no
 * name attached is not a finding, it is a rumour. So every long frame is stamped with the boot PHASE
 * that was active, the work in flight at that instant, and — where the browser will tell us — the
 * script that blocked the thread.
 *
 * PHASES ARE OBSERVED, NEVER ASSUMED. Each one opens when its MARKER IS SEEN, not on a timeline:
 *     PAGE            document exists, no game code has run
 *     SCRIPT_EVAL     the first inline script has executed
 *     ENGINE          THREE is defined
 *     RENDERER        a WebGLRenderer exists
 *     FIRST_FRAME     the first renderer.render call has been made
 *     MENU            gameState === 'menu'
 *     SELECT          the character select is on screen
 *     MATCH_LOAD      FIGHT pressed, gameState not yet 'fight'
 *     MATCH           gameState === 'fight'
 * A hardcoded timeline would invent boundaries and then attribute stalls to them confidently, which
 * is the exact failure this file's history keeps recording.
 *
 * THE INVARIANT IS ATTRIBUTION COMPLETENESS, NOT A BUDGET. "Boot must be under X ms" would be a
 * noisy lie across environments — this container is a software rasteriser. What CAN be asserted is:
 *     every long frame must fall inside exactly one open phase, and every phase must have a start
 * If a stall lands with no phase, the MODEL is wrong and the report says so instead of quietly
 * filing it under whatever was nearest.
 *
 * INSTRUMENTS, all real browser facilities rather than inference:
 *   PerformanceObserver('longtask')  the browser's own main-thread blockage record, with its
 *                                    attribution (containerName/containerSrc) where provided
 *   a rAF frame clock                the gaps a player actually feels
 *   gl.linkProgram / shaderSource    shader work in flight, counted per phase
 *   WebAssembly.instantiate(Streaming) physics/wasm init, which nothing here has ever measured
 *   JSON.parse                       synchronous decode, with the byte count that caused it
 *   fetch + XMLHttpRequest           how many requests are outstanding at the moment of the stall
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
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json','.jgz':'application/octet-stream',
  '.wasm':'application/wasm' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; };
const has = n => process.argv.indexOf('--' + n) > 0;
const LONG_MS = +arg('long', '400');

function BOOT(LONG){
  var B = window.__BOOT = {
    t0: performance.now(), long: LONG,
    phases: [], stalls: [], longtasks: [], marks: [], gaps: 0,
    counters: { shaders:0, wasm:0, jsonBytes:0, jsonCalls:0, fetches:0, pending:0, renders:0 },
    frames: 0
  };
  var openPhase = null;
  function now(){ return +(performance.now() - B.t0).toFixed(1); }
  function snapshot(){
    return { shaders: B.counters.shaders, wasm: B.counters.wasm,
             jsonMB: +(B.counters.jsonBytes/1048576).toFixed(2), jsonCalls: B.counters.jsonCalls,
             pending: B.counters.pending, renders: B.counters.renders };
  }
  function phase(name){
    if (openPhase && openPhase.name === name) return;
    var t = now();
    if (openPhase){ openPhase.end = t; openPhase.ms = +(t - openPhase.start).toFixed(1);
                    openPhase.endCounters = snapshot(); }
    openPhase = { name: name, start: t, end: null, ms: null, startCounters: snapshot(), longFrames: 0, worst: 0 };
    B.phases.push(openPhase);
    B.marks.push({ at: t, phase: name });
  }
  B.phase = phase;
  B.currentPhase = function(){ return openPhase; };
  phase('PAGE');

  // ── the frame clock: the gaps a player actually feels ────────────────────────────────────
  var last = 0;
  (function tick(){
    var n = performance.now();
    if (last){
      var d = n - last;
      if (d >= B.long){
        var p = openPhase;
        if (!p) B.gaps++;                       // a stall with NO open phase = the model is wrong
        else { p.longFrames++; if (d > p.worst) p.worst = Math.round(d); }
        B.stalls.push({ at: +((n - B.t0)/1).toFixed(0), ms: Math.round(d),
                        phase: p ? p.name : null, ctx: snapshot(),
                        state: (function(){ try{ return new Function('return gameState')(); }catch(e){ return null; } })() });
      }
    }
    last = n; B.frames++;
    requestAnimationFrame(tick);
  })();

  // ── the browser's OWN blockage record. This is the only instrument that can name the script. ──
  try{
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){
        var att = (e.attribution || []).map(function(a){
          return { name: a.name, containerType: a.containerType, containerName: a.containerName,
                   containerSrc: (a.containerSrc || '').slice(-60) }; });
        B.longtasks.push({ at: Math.round(e.startTime - B.t0), ms: Math.round(e.duration),
                           phase: openPhase ? openPhase.name : null, attribution: att.slice(0,2) });
      });
    }).observe({ entryTypes: ['longtask'] });
  }catch(e){ B.longtaskUnsupported = true; }

  // ── shader work ───────────────────────────────────────────────────────────────────────────
  function hookGL(){
    ['WebGL2RenderingContext','WebGLRenderingContext'].forEach(function(k){
      var P = window[k] && window[k].prototype;
      if (!P || P.__bootHooked) return;
      P.__bootHooked = true;
      var lp = P.linkProgram;
      P.linkProgram = function(){ B.counters.shaders++; return lp.apply(this, arguments); };
    });
  }
  hookGL();

  // ── WASM: physics init, which no harness here has ever measured ───────────────────────────
  try{
    ['instantiate','instantiateStreaming','compile','compileStreaming'].forEach(function(k){
      if (typeof WebAssembly[k] !== 'function') return;
      var o = WebAssembly[k];
      WebAssembly[k] = function(){
        var t = performance.now();
        B.counters.wasm++;
        B.marks.push({ at: now(), wasm: k });
        var r = o.apply(WebAssembly, arguments);
        if (r && r.then) r.then(function(){ B.marks.push({ at: now(), wasmDone: k, ms: Math.round(performance.now()-t) }); },
                                function(){});
        return r;
      };
    });
  }catch(e){}

  // ── synchronous JSON decode, with the size that caused it ─────────────────────────────────
  try{
    var jp = JSON.parse;
    JSON.parse = function(text){
      if (typeof text === 'string' && text.length > 65536){
        B.counters.jsonBytes += text.length; B.counters.jsonCalls++;
      }
      return jp.apply(JSON, arguments);
    };
  }catch(e){}

  // ── how much is in flight at the moment of a stall ────────────────────────────────────────
  try{
    var of = window.fetch;
    window.fetch = function(){
      B.counters.fetches++; B.counters.pending++;
      var p = of.apply(window, arguments);
      var done = function(){ B.counters.pending--; };
      p.then(done, done);
      return p;
    };
    var os = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(){
      B.counters.fetches++; B.counters.pending++;
      var self = this, done = function(){ B.counters.pending--; };
      self.addEventListener('loadend', done);
      return os.apply(this, arguments);
    };
  }catch(e){}

  // ── PHASE MARKERS, each one an OBSERVED fact ──────────────────────────────────────────────
  var seenRenderer = false, seenRender = false;
  setInterval(function(){
    try{
      hookGL();
      var lex = function(n){ try{ return new Function('return typeof '+n+'!=="undefined"?'+n+':null')(); }catch(e){ return null; } };
      var gs = lex('gameState');
      var r  = lex('renderer');
      if (!seenRenderer && r){
        seenRenderer = true;
        phase('RENDERER');
        // count real frames, and open FIRST_FRAME the moment one is actually drawn
        try{
          var orig = r.render.bind(r);
          r.render = function(){ B.counters.renders++;
            if (!seenRender){ seenRender = true; B.phase('FIRST_FRAME'); }
            return orig.apply(null, arguments); };
        }catch(e){}
      }
      if (gs === 'menu' && (!openPhase || openPhase.name !== 'MENU') && seenRender
          && ['PAGE','SCRIPT_EVAL','ENGINE','RENDERER','FIRST_FRAME'].indexOf(openPhase && openPhase.name) >= 0)
        phase('MENU');
      if (gs === 'fight' && (!openPhase || openPhase.name !== 'MATCH')) phase('MATCH');
      if (!seenRenderer && typeof THREE !== 'undefined'
          && openPhase && ['PAGE','SCRIPT_EVAL'].indexOf(openPhase.name) >= 0) phase('ENGINE');
      if (openPhase && openPhase.name === 'PAGE' && document.readyState !== 'loading') phase('SCRIPT_EVAL');
    }catch(e){}
  }, 60);
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

(async () => {
  fs.mkdirSync(OUT, { recursive:true });
  const port = 9800 + Math.floor(Math.random()*150);
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,140)));
  await page.addInitScript(new Function('L', '(' + BOOT.toString() + ')(L)'), LONG_MS);

  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:120000 });
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i=0;i<500 && (await gs())!=='menu'; i++) await sleep(400);
  await page.evaluate(() => { try{ window.__BOOT.phase('SELECT'); }catch(e){} });
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i=0;i<80;i++){ if (await page.evaluate(()=>{ const s=document.getElementById('csStart'); return !!(s&&s.offsetParent!==null); })) break; await sleep(300); }
  await page.evaluate(() => { try{ window.__BOOT.phase('MATCH_LOAD'); }catch(e){} const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i=0;i<160 && (await gs())!=='fight'; i++) await sleep(400);
  await sleep(6000);

  const B = await page.evaluate(() => {
    try{ var p = window.__BOOT.currentPhase(); if (p && p.end == null){ p.end = +(performance.now()-window.__BOOT.t0).toFixed(1); p.ms = +(p.end - p.start).toFixed(1); } }catch(e){}
    return window.__BOOT;
  });
  await browser.close(); srv.close();

  const FAILS = [];
  // ── THE INVARIANT: ATTRIBUTION COMPLETENESS ─────────────────────────────────────────────────
  if (B.gaps > 0) FAILS.push(B.gaps + ' long frame(s) fell OUTSIDE every phase — the phase model has a hole');
  const unstamped = (B.stalls || []).filter(s => !s.phase);
  if (unstamped.length) FAILS.push(unstamped.length + ' stall(s) carry no phase');
  const noStart = (B.phases || []).filter(p => p.start == null);
  if (noStart.length) FAILS.push(noStart.length + ' phase(s) have no start timestamp');
  if (B.longtaskUnsupported) FAILS.push('longtask observer unsupported — main-thread attribution unavailable');
  if (errs.length) FAILS.push(errs.length + ' page error(s): ' + errs.slice(0,2).join(' | '));

  fs.writeFileSync(path.join(OUT, 'boot_autopsy.json'), JSON.stringify({ B, errs }, null, 1));
  if (has('json')){ console.log(JSON.stringify({ B, errs }, null, 1)); process.exit(FAILS.length?1:0); }

  console.log('\n===== BOOT LIFECYCLE (long frame >= ' + LONG_MS + 'ms) =====');
  console.log('  ' + 'phase'.padEnd(13) + 'start'.padStart(9) + 'ms'.padStart(10) +
              'long'.padStart(6) + 'worst'.padStart(8) + '   work done in the phase');
  (B.phases||[]).forEach(p => {
    const a = p.startCounters || {}, b = p.endCounters || {};
    const d = k => (b[k] != null && a[k] != null) ? (b[k] - a[k]) : null;
    const bits = [];
    if (d('shaders'))  bits.push(d('shaders') + ' shaders');
    if (d('renders'))  bits.push(d('renders') + ' renders');
    if (d('jsonCalls'))bits.push(d('jsonCalls') + ' big JSON.parse');
    if (d('wasm'))     bits.push(d('wasm') + ' wasm');
    if (d('fetches'))  bits.push(d('fetches') + ' requests');
    console.log('  ' + p.name.padEnd(13) + String(p.start).padStart(9) + String(p.ms == null ? '-' : p.ms).padStart(10) +
                String(p.longFrames).padStart(6) + String(p.worst || 0).padStart(8) + '   ' + bits.join(' · '));
  });

  const byPhase = {};
  (B.stalls||[]).forEach(s => { const k = s.phase || '(none)';
    byPhase[k] = byPhase[k] || { n:0, total:0, worst:0 };
    byPhase[k].n++; byPhase[k].total += s.ms; byPhase[k].worst = Math.max(byPhase[k].worst, s.ms); });
  console.log('\n  STALLS BY PHASE (' + (B.stalls||[]).length + ' total, frames sampled ' + B.frames + ')');
  Object.entries(byPhase).sort((a,b)=>b[1].worst-a[1].worst).forEach(([k,v]) =>
    console.log('    ' + k.padEnd(13) + v.n + ' stalls   ' + v.total + 'ms total   worst ' + v.worst + 'ms'));

  console.log('\n  TEN WORST FRAMES, ATTRIBUTED');
  (B.stalls||[]).slice().sort((a,b)=>b.ms-a.ms).slice(0,10).forEach(s =>
    console.log('    ' + String(s.ms).padStart(6) + 'ms  t+' + String(s.at).padStart(6) + 'ms  ' +
      String(s.phase||'(none)').padEnd(12) + ' shaders ' + String(s.ctx.shaders).padStart(4) +
      '  pending ' + String(s.ctx.pending).padStart(3) + '  jsonMB ' + s.ctx.jsonMB +
      '  renders ' + s.ctx.renders));

  const lt = (B.longtasks||[]).slice().sort((a,b)=>b.ms-a.ms).slice(0,8);
  console.log('\n  BROWSER LONGTASK RECORD (' + (B.longtasks||[]).length + ' entries) — its own attribution');
  if (!lt.length) console.log('    none reported');
  lt.forEach(t => console.log('    ' + String(t.ms).padStart(6) + 'ms  t+' + String(t.at).padStart(6) +
    'ms  ' + String(t.phase||'-').padEnd(12) + ' ' +
    (t.attribution||[]).map(a => (a.containerName||a.name||'?') + (a.containerSrc?(' '+a.containerSrc):'')).join(' | ')));

  console.log('\n  totals: ' + B.counters.shaders + ' shader links · ' + B.counters.wasm + ' wasm instantiations · ' +
    B.counters.jsonCalls + ' large JSON.parse (' + (B.counters.jsonBytes/1048576).toFixed(1) + ' MB) · ' +
    B.counters.fetches + ' requests · ' + B.counters.renders + ' renders');
  console.log('\n  ' + (FAILS.length ? 'ATTRIBUTION INCOMPLETE:' : 'ATTRIBUTION COMPLETE — every long frame has exactly one phase'));
  FAILS.forEach(f => console.log('    x ' + f));
  console.log('  report -> dist/playtest/boot_autopsy.json\n');
  process.exit(FAILS.length ? 1 : 0);
})();
