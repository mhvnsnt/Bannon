#!/usr/bin/env node
/* render_cost.cjs — HOW MANY PIXELS DOES A FRAME COST, AND WHAT IS THE FRAME RATE?
 *
 *   node tools/harness/render_cost.cjs
 *
 * Every complaint the owner has left open resolves to frame rate (see gait_and_bind.cjs: the walk
 * is a correct 1.75 Hz stride and the GLB binds in 1.4s at 49 fps; the same code reads as a puppet
 * with a 10.5s bind at 1.7 fps). So the only number that matters now is the cost of a frame.
 *
 * This measures it honestly rather than trusting the tier label:
 *   * the COMPOSER's pixel ratio and its actual render-target dimensions — the composer draws the
 *     frame, not the renderer, and it owns separate targets that the tier system never touched
 *   * whether the bloom pass is enabled (five mip targets, each blurred twice per frame)
 *   * total pixels pushed per frame, which is the thing a phone GPU is actually limited by
 *   * measured fps at each tier, on the same scene
 * A software rasterizer's cost is close to linear in pixels, so while the ABSOLUTE fps here means
 * nothing about a phone, the RATIO between tiers is meaningful and is exactly what changed.
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
  window.__R = { frames:0 };
  (function tick(){ window.__R.frames++; requestAnimationFrame(tick); })();
  window.__renderFacts = function(){
    const out = { };
    try{
      const r = new Function('return typeof renderer!=="undefined"?renderer:null')();
      if (r){ out.rendererPR = r.getPixelRatio();
        out.drawCalls = r.info.render.calls; out.tris = r.info.render.triangles;
        out.programs = (r.info.programs||[]).length;
        out.shadowMap = r.shadowMap.enabled ? ('on/type' + r.shadowMap.type) : 'off'; }
    }catch(e){}
    const C = window.__composer;
    if (C){
      out.composerPR = C.__pr != null ? C.__pr : (C._pixelRatio != null ? C._pixelRatio : 'unknown');
      try{ const t = C.renderTarget1 || C.readBuffer;
        if (t) out.composerTarget = t.width + 'x' + t.height; }catch(e){}
      out.passes = (C.passes||[]).map(function(p){
        const n = (p.constructor && p.constructor.name) || '?';
        let px = null;
        try{ if (p.resolution) px = p.resolution.x + 'x' + p.resolution.y; }catch(e){}
        return n + (p.enabled === false ? ' [OFF]' : '') + (px ? ' @' + px : '');
      });
      // pixels a frame pushes through the post chain: the composer target, plus every bloom mip
      // (five levels, each blurred horizontally AND vertically) when the pass is on
      try{
        const t = C.renderTarget1 || C.readBuffer;
        let px = t ? t.width * t.height : 0;
        (C.passes||[]).forEach(function(p){
          const n = (p.constructor && p.constructor.name) || '';
          if (/BloomPass/.test(n) && p.enabled !== false && p.resolution){
            let w = p.resolution.x, h = p.resolution.y;
            for (let i = 0; i < 5; i++){ w = Math.round(w/2); h = Math.round(h/2); px += w*h*2; }
          }
        });
        out.postPixelsPerFrame = px;
      }catch(e){}
    } else out.composerPR = 'NO COMPOSER (direct render)';
    return out;
  };
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  // EMULATE THE PHONE. This container reports devicePixelRatio 1, so the composer's pixel-ratio cap
  // — the single biggest cost on a real handset — is never exercised here and every measurement
  // understates it. deviceScaleFactor 2.5 is what a modern Android actually reports, and it is the
  // number the old code fed straight into the post chain.
  const DSF = +(process.argv.includes('--dpr') ? process.argv[process.argv.indexOf('--dpr')+1] : 2.5);
  const page = await browser.newPage({ viewport:{ width:412, height:915 }, deviceScaleFactor: DSF,
    userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' });
  console.log('  emulating devicePixelRatio ' + DSF + ' on a 412x915 phone viewport');
  await page.addInitScript(PROBE);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  // stop the auto-tuner fighting the measurement
  await page.evaluate(() => { window.BANNON_PERF_AUTO = false; });
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);
  await sleep(9000);

  const rows = [];
  for (const tier of [0, 1, 2, 3, 4]){
    await page.evaluate(t => { try{ window.BANNON_PERF.setTier(t); window.BANNON_PERF_AUTO = false; }catch(e){} }, tier);
    await sleep(2500);                                   // let the tier settle
    const a = await page.evaluate(() => window.__R.frames);
    const t0 = Date.now();
    await sleep(9000);
    const b = await page.evaluate(() => window.__R.frames);
    const facts = await page.evaluate(() => window.__renderFacts());
    const fps = (b - a) / ((Date.now() - t0) / 1000);
    rows.push(Object.assign({ tier, fps: +fps.toFixed(2) }, facts));
  }
  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const NAMES = ['FULL','HIGH','MEDIUM','LOW','POTATO'];
  console.log('\n===== RENDER COST PER TIER =====');
  console.log('  tier      fps    rPR   cPR   composer target   post px/frame   bloom   tris   calls');
  for (const r of rows){
    const bloom = (r.passes||[]).some(p => /BloomPass/.test(p) && !/\[OFF\]/.test(p)) ? 'ON ' : 'off';
    console.log('  ' + NAMES[r.tier].padEnd(8) +
      String(r.fps).padStart(6) + String(r.rendererPR).padStart(7) + String(r.composerPR).padStart(6) +
      String(r.composerTarget||'?').padStart(18) +
      String(r.postPixelsPerFrame != null ? (r.postPixelsPerFrame/1e6).toFixed(2)+'M' : '?').padStart(16) +
      bloom.padStart(8) + String(r.tris).padStart(8) + String(r.drawCalls).padStart(7));
  }
  const full = rows[0], potato = rows[4];
  if (full && potato && full.postPixelsPerFrame && potato.postPixelsPerFrame){
    console.log('\n  FULL -> POTATO: post pixels ' + (full.postPixelsPerFrame/1e6).toFixed(2) + 'M -> ' +
      (potato.postPixelsPerFrame/1e6).toFixed(2) + 'M  (' +
      (100*(1 - potato.postPixelsPerFrame/full.postPixelsPerFrame)).toFixed(0) + '% fewer), fps ' +
      full.fps + ' -> ' + potato.fps + '  (x' + (potato.fps/Math.max(0.01,full.fps)).toFixed(2) + ')');
  }
  console.log('\n  passes at FULL:   ' + JSON.stringify((rows[0]||{}).passes));
  console.log('  passes at POTATO: ' + JSON.stringify((rows[4]||{}).passes));
  fs.writeFileSync(path.join(OUT,'render_cost.json'), JSON.stringify(rows, null, 1));
  console.log('\n  report -> ' + path.join(OUT,'render_cost.json'));
})();
