#!/usr/bin/env node
/* stall_autopsy.cjs — WHERE DOES THE FREEZE GO?
 *
 *   node tools/harness/stall_autopsy.cjs
 *
 * The owner says the game freezes "as soon as I start fighting". smoke.cjs proves the stall is real
 * (worst stall 11,067-11,308 ms at fight start) but says nothing about WHAT is holding the thread,
 * and I have now guessed at that three times. A stall is by definition a window in which no JS
 * runs, so nothing inside the page can sample it while it happens — but everything that CAN block
 * the main thread is a function call, and a function call can be wrapped and timed.
 *
 * So: wrap every candidate blocker BEFORE any game code loads, accumulate self-time per bucket, and
 * snapshot the cumulative totals once per animation frame. The stall then appears as ONE row with a
 * huge dt, and the bucket deltas on that row are the answer. Anything not in a bucket shows up as
 * "unattributed", which is itself a finding (it means the time is outside JS entirely).
 *
 * Buckets: GL shader compile/link, texture upload, buffer upload, draw, readback, JSON.parse,
 * GLTFLoader.parse, FBXLoader.parse, fetch/XHR, Image decode, and three.js renderer.compile.
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
  const T = window.__T = { b:{}, rows:[], t0:0, notes:[] };
  const bump = (k, ms) => { const b = T.b[k] || (T.b[k] = { ms:0, n:0 }); b.ms += ms; b.n++; };
  T.bump = bump;

  function wrap(obj, name, bucket, note){
    if (!obj || typeof obj[name] !== 'function' || obj[name].__ap) return false;
    const o = obj[name];
    const w = function(){
      const t = performance.now();
      try { return o.apply(this, arguments); }
      finally { const d = performance.now() - t; bump(bucket, d); if (note && d > note) T.notes.push({ at:+((performance.now()-T.t0)/1000).toFixed(2), what:bucket+'.'+name, ms:Math.round(d) }); }
    };
    w.__ap = 1; try { obj[name] = w; return true; } catch(e){ return false; }
  }

  // --- WebGL. This is the whole point: on a real device the driver blocks here, not in JS. -------
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]){
    if (!C) continue; const P = C.prototype;
    ['compileShader','linkProgram','shaderSource','attachShader','validateProgram'].forEach(n => wrap(P, n, 'gl.shader', 200));
    // getProgramParameter(LINK_STATUS) is where most drivers actually wait for an async link
    ['getProgramParameter','getShaderParameter','getProgramInfoLog','getShaderInfoLog'].forEach(n => wrap(P, n, 'gl.linkWait', 200));
    ['texImage2D','texSubImage2D','texStorage2D','compressedTexImage2D','generateMipmap'].forEach(n => wrap(P, n, 'gl.texture', 200));
    ['bufferData','bufferSubData'].forEach(n => wrap(P, n, 'gl.buffer', 200));
    ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'].forEach(n => wrap(P, n, 'gl.draw'));
    ['readPixels','finish','getError','checkFramebufferStatus'].forEach(n => wrap(P, n, 'gl.sync', 200));
  }

  // --- IS IT JS AT ALL? -------------------------------------------------------------------------
  // The decisive split. Everything the page runs arrives through rAF, a timer, or an event, so if
  // those three add up to far less than the frame delta then the thread is not in JS at all and the
  // cost is the compositor / rasterizer — which on this GPU-less box is swiftshader and on the
  // owner's phone is a real GPU. Getting this backwards is how a render cost gets "fixed" in game
  // logic for a month.
  const orq = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function(cb){
    return orq(function(ts){ const t = performance.now(); try { return cb(ts); }
      finally { const d = performance.now() - t; bump('js.raf', d); if (d > T.rafMax) T.rafMax = d; } });
  };
  T.rafMax = 0;
  const ost = window.setTimeout.bind(window), osi = window.setInterval.bind(window);
  window.setTimeout = function(fn, ms){ if (typeof fn !== 'function') return ost.apply(null, arguments);
    const a = [].slice.call(arguments, 2);
    return ost(function(){ const t = performance.now(); try { return fn.apply(null, a); } finally { bump('js.timer', performance.now() - t); } }, ms); };
  window.setInterval = function(fn, ms){ if (typeof fn !== 'function') return osi.apply(null, arguments);
    const a = [].slice.call(arguments, 2);
    return osi(function(){ const t = performance.now(); try { return fn.apply(null, a); } finally { bump('js.timer', performance.now() - t); } }, ms); };
  const oael = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, fn, opt){
    if (typeof fn !== 'function') return oael.call(this, type, fn, opt);
    if (!fn.__apw){ const w = function(ev){ const t = performance.now(); try { return fn.apply(this, arguments); }
      finally { const d = performance.now() - t; bump('js.event', d);
        if (d > 300){ let tag = '?';
          try { tag = (this.tagName || this.constructor.name || '?') + (this.id ? '#' + this.id : '') + (this.className && this.className.split ? '.' + this.className.split(' ')[0] : ''); } catch(_){}
          T.notes.push({ at:+((performance.now()-T.t0)/1000).toFixed(2), ms:Math.round(d),
            what:'EVENT ' + type + ' on ' + tag, fn:String(fn).replace(/\s+/g,' ').slice(0, 200) }); } } };
      fn.__apw = w; w.__apsrc = fn; }
    return oael.call(this, type, fn.__apw, opt);
  };

  // --- parsing --------------------------------------------------------------------------------
  wrap(JSON, 'parse', 'JSON.parse', 200);
  const of_ = window.fetch;
  if (of_) window.fetch = function(){ const t = performance.now(); const r = of_.apply(this, arguments);
    bump('fetch.call', performance.now() - t); return r; };
  if (window.Image){ /* decode happens off-thread; texImage2D is the on-thread cost */ }

  // --- three.js / loaders arrive later, so keep trying --------------------------------------
  const arm = () => {
    const TH = window.THREE;
    if (TH){
      if (TH.WebGLRenderer && TH.WebGLRenderer.prototype) wrap(TH.WebGLRenderer.prototype, 'compile', 'three.compile', 100);
      if (TH.GLTFLoader && TH.GLTFLoader.prototype) wrap(TH.GLTFLoader.prototype, 'parse', 'GLTF.parse', 100);
      if (TH.FBXLoader && TH.FBXLoader.prototype) wrap(TH.FBXLoader.prototype, 'parse', 'FBX.parse', 100);
      if (TH.SkinnedMesh && TH.SkinnedMesh.prototype) wrap(TH.SkinnedMesh.prototype, 'bind', 'three.skinBind', 100);
      if (TH.Skeleton && TH.Skeleton.prototype) wrap(TH.Skeleton.prototype, 'computeBoneTexture', 'three.boneTex', 100);
      if (TH.BufferGeometry && TH.BufferGeometry.prototype) wrap(TH.BufferGeometry.prototype, 'computeVertexNormals', 'three.normals', 100);
    }
    if (window.GLTFLoader && window.GLTFLoader.prototype) wrap(window.GLTFLoader.prototype, 'parse', 'GLTF.parse', 100);
    if (window.FBXLoader && window.FBXLoader.prototype) wrap(window.FBXLoader.prototype, 'parse', 'FBX.parse', 100);
    // cheapest tier the moment it exists (headless has no GPU; we are attributing, not benchmarking)
    try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.__apTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; window.__apTier = 1; } }catch(e){}
  };
  arm(); setInterval(arm, 250);

  // --- the timeline: one row per frame, cumulative bucket totals snapshotted ---------------------
  let last = 0, prev = {};
  (function tick(){
    const n = performance.now();
    if (!T.t0) T.t0 = n;
    if (last){
      const dt = n - last;
      if (dt > 120){                                   // only keep frames that actually cost something
        const row = { at:+((last - T.t0)/1000).toFixed(2), dt:Math.round(dt), by:{} };
        let js = 0;
        for (const k in T.b){
          const d = T.b[k].ms - (prev[k] || 0);
          if (d > 1) row.by[k] = Math.round(d);
          if (k === 'js.raf' || k === 'js.timer' || k === 'js.event') js += d;   // gl.* nest inside these
        }
        row.js = Math.round(js);
        row.outsideJS = Math.max(0, Math.round(dt - js));
        try{ row.gs = new Function('return typeof gameState!=="undefined"?gameState:null')(); }catch(e){}
        T.rows.push(row);
        if (T.rows.length > 400) T.rows.shift();
      }
      for (const k in T.b) prev[k] = T.b[k].ms;
    } else { for (const k in T.b) prev[k] = T.b[k].ms; }
    last = n;
    requestAnimationFrame(tick);
  })();
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

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  const waitFor = async (pred, ms) => { const end = Date.now()+ms;
    while (Date.now() < end){ let ok=false; try{ ok = await pred(); }catch(e){} if (ok) return true; await sleep(300); } return false; };

  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  await waitFor(async () => (await gs()) === 'menu', 120000);
  await page.evaluate(() => { window.__T.rows.length = 0; window.__T.notes.length = 0; window.__T.mark = 'menu'; });

  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  await waitFor(() => page.evaluate(() => { const s = document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }), 20000);
  const atSelect = await page.evaluate(() => ({ mark:'select', t:+((performance.now()-window.__T.t0)/1000).toFixed(2) }));

  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  const atFight = await page.evaluate(() => ({ mark:'fightClick', t:+((performance.now()-window.__T.t0)/1000).toFixed(2) }));
  await waitFor(async () => (await gs()) === 'fight', 40000);
  await sleep(25000);                                   // ride out the whole fight-start window

  const T = await page.evaluate(() => ({ rows: window.__T.rows, notes: window.__T.notes, totals: window.__T.b,
    programs: (function(){ try{ const r = new Function('return renderer')();
      if (!r || !r.info) return null;
      return { programs:(r.info.programs||[]).length, geometries:r.info.memory.geometries,
               textures:r.info.memory.textures, calls:r.info.render.calls, tris:r.info.render.triangles };
    }catch(e){ return null; } })() }));

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const rows = T.rows.slice().sort((a,b) => b.dt - a.dt);
  const worst = rows.slice(0, 12);
  const sum = {};
  for (const r of T.rows){ for (const k in r.by) sum[k] = (sum[k]||0) + r.by[k];
    sum.__outsideJS = (sum.__outsideJS||0) + r.outsideJS; sum.__frameTotal = (sum.__frameTotal||0) + r.dt; }

  console.log('\n===== STALL AUTOPSY =====');
  console.log('  marks:', JSON.stringify([atSelect, atFight]));
  console.log('  renderer:', JSON.stringify(T.programs));
  console.log('\n  WORST FRAMES — is the thread IN JS, or waiting on the GPU/compositor?');
  for (const r of worst){
    const gl = Object.keys(r.by).filter(k => k.startsWith('gl.') || k.startsWith('three.') || k.indexOf('parse') >= 0)
      .sort((a,b)=>r.by[b]-r.by[a]).map(k => k+' '+r.by[k]).join(' ');
    console.log('   t=' + String(r.at).padStart(7) + 's ' + String(r.gs||'?').padEnd(6) + ' dt=' + String(r.dt).padStart(6) +
      'ms   JS ' + String(r.js).padStart(6) + 'ms   OUTSIDE-JS ' + String(r.outsideJS).padStart(6) + 'ms   ' + gl);
  }
  console.log('\n  TOTAL over the whole captured window:');
  Object.keys(sum).sort((a,b)=>sum[b]-sum[a]).slice(0,16).forEach(k =>
    console.log('   ' + k.padEnd(20) + String(Math.round(sum[k])).padStart(8) + ' ms'));
  if (T.notes.length){ console.log('\n  SINGLE CALLS OVER THRESHOLD (worst first):');
    T.notes.slice().sort((a,b)=>b.ms-a.ms).slice(0,14).forEach(n =>
      console.log('   t=' + String(n.at).padStart(7) + 's  ' + String(n.ms).padStart(6) + 'ms  ' + n.what + (n.fn ? '\n        ' + n.fn : ''))); }
  if (errs.length) console.log('\n  page errors: ' + errs.slice(0,5).join(' | '));

  fs.writeFileSync(path.join(OUT, 'stall_autopsy.json'), JSON.stringify({ marks:[atSelect,atFight], programs:T.programs, rows:T.rows, notes:T.notes, sum }, null, 1));
  console.log('\n  report -> ' + path.join(OUT, 'stall_autopsy.json'));
})();
