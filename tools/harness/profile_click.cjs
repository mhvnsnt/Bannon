#!/usr/bin/env node
/* profile_click.cjs — CPU-profile ONE button press.
 *
 *   node tools/harness/profile_click.cjs                 # profiles QUICK FIGHT (btnFight)
 *   node tools/harness/profile_click.cjs --btn csStart   # profiles the FIGHT button
 *
 * stall_autopsy.cjs found the freeze and named the handler: clicking QUICK FIGHT runs `openSelect`
 * for 11,689 ms on the main thread. It cannot say WHICH line, because openSelect's callees
 * (renderRoster, spawnPreview, refresh) are closure-local inside an IIFE and cannot be wrapped from
 * outside. A V8 CPU profile can — it reports self time per function with a file:line, including
 * functions the page never exposes.
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
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; };

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
  const btnId = arg('btn', 'btnFight');
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  page.on('pageerror', e => console.log('  pageerror:', String(e.message).split('\n')[0].slice(0,140)));

  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  console.log('  at menu; profiling the click on #' + btnId);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });   // µs
  await cdp.send('Profiler.start');
  const t0 = Date.now();
  await page.evaluate(id => { const b = document.getElementById(id); if (b) b.click(); }, btnId);
  await sleep(1000);
  // wait until the thread frees up again
  for (let i = 0; i < 60; i++){ const t = Date.now(); await page.evaluate(() => 1); if (Date.now() - t < 60) break; await sleep(250); }
  const wall = Date.now() - t0;
  const { profile } = await cdp.send('Profiler.stop');

  // self time per node, from the sample deltas
  const byId = new Map();
  for (const n of profile.nodes) byId.set(n.id, n);
  const self = new Map();
  const deltas = profile.timeDeltas || [];
  for (let i = 0; i < profile.samples.length; i++){
    const id = profile.samples[i], d = (deltas[i] || 0) / 1000;   // ms
    self.set(id, (self.get(id) || 0) + d);
  }
  // roll up to function identity (name + line), and also to a "top frame in the game file" bucket
  const fn = new Map();
  for (const [id, ms] of self){
    const n = byId.get(id); if (!n) continue;
    const cf = n.callFrame || {};
    const key = (cf.functionName || '(anonymous)') + '  ' + String(cf.url || '').split('/').pop() + ':' + ((cf.lineNumber|0) + 1);
    fn.set(key, (fn.get(key) || 0) + ms);
  }
  // total time per function INCLUDING callees, walking the tree
  const children = new Map();
  for (const n of profile.nodes) children.set(n.id, n.children || []);
  const totalOf = id => { let t = self.get(id) || 0; for (const c of (children.get(id) || [])) t += totalOf(c); return t; };
  const tot = new Map();
  for (const n of profile.nodes){
    const cf = n.callFrame || {};
    const key = (cf.functionName || '(anonymous)') + '  ' + String(cf.url || '').split('/').pop() + ':' + ((cf.lineNumber|0) + 1);
    tot.set(key, Math.max(tot.get(key) || 0, totalOf(n.id)));
  }

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const top = a => [...a.entries()].sort((x,y) => y[1] - x[1]).slice(0, 22);
  console.log('\n===== CPU PROFILE of the click on #' + btnId + '  (' + wall + 'ms wall) =====');
  console.log('\n  SELF TIME (where the thread actually is):');
  for (const [k, ms] of top(fn)) if (ms > 5) console.log('   ' + String(Math.round(ms)).padStart(7) + 'ms  ' + k);
  console.log('\n  TOTAL TIME incl. callees (who is responsible):');
  for (const [k, ms] of top(tot)) if (ms > 20) console.log('   ' + String(Math.round(ms)).padStart(7) + 'ms  ' + k);
  fs.writeFileSync(path.join(OUT, 'profile_' + btnId + '.json'), JSON.stringify({ wall,
    self: top(fn).map(([k,v]) => ({ k, ms:Math.round(v) })), total: top(tot).map(([k,v]) => ({ k, ms:Math.round(v) })) }, null, 1));
  console.log('\n  report -> ' + path.join(OUT, 'profile_' + btnId + '.json'));
})();
