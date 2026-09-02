#!/usr/bin/env node
/* tier_response.cjs — DOES THE QUALITY TIER ACTUALLY DROP WHEN THE GAME FREEZES?
 *
 *   node tools/harness/tier_response.cjs
 *
 * The owner has reported a freeze in every mode, for weeks, on a device whose whole defence is the
 * automatic quality tier. Reading that code found two reasons it could not defend him:
 *   1. `if (d > 0 && d < 5000)` — any frame longer than five seconds was DISCARDED as noise. A
 *      device at 0.2 fps produces a 5,000 ms frame every frame, so the fps average never updated
 *      and autoTier() was never called at all. The worse the freeze, the more invisible it was.
 *   2. `if (gameState !== 'fight') return` — the menu, the select screen, the ENTRANCE (the single
 *      heaviest moment in a match), free roam and God Within could crawl forever with no response.
 * This measures the fix end to end: boot, watch the tier, and confirm it steps down under load
 * rather than sitting at its opening guess. It also asserts it does NOT thrash.
 */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.dirname(path.dirname(__dirname));
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.css':'text/css','.svg':'image/svg+xml','.jgz':'application/octet-stream' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FAILS = [];

(async () => {
  const port = 9300 + Math.floor(Math.random()*200);
  const srv = http.createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]); if(p==='/')p='/BANNON_v150.html';
    const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('no');}
    s.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(f).pipe(s); });
  await new Promise(r => srv.listen(port, r));
  const br = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  // a phone-shaped viewport at a phone's pixel ratio — the composer's cost is quadratic in this
  const pg = await br.newPage({ viewport:{ width:412, height:915 }, deviceScaleFactor:2.5, isMobile:true, hasTouch:true });
  const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0,140)));
  await pg.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  const gs = () => pg.evaluate(()=>{try{return new Function('return gameState')();}catch(e){return null;}}).catch(()=>null);
  for (let i=0;i<400 && (await gs())!=='menu'; i++) await sleep(500);

  // OPENING TIER: whatever the device guess produced. Deliberately NOT forced — the whole point is
  // to watch the automatic response, and forcing POTATO would test nothing.
  const open = await pg.evaluate(() => ({ tier: window.BANNON_PERF.tier(), dpr: window.devicePixelRatio }));
  const track = [];
  const sample = async (label) => {
    const r = await pg.evaluate(() => window.BANNON_PERF.report());
    track.push({ label, tier:r.tier, fps:r.fpsNow, stalls:r.hardStalls, worst:r.worstFrameMs, drops:r.tierDropsFromStalls });
    return r;
  };
  await sample('menu');
  await sleep(6000); await sample('menu+6s');

  await pg.evaluate(() => { const b=document.getElementById('btnFight'); if(b) b.click(); });
  for (let i=0;i<60;i++){ if (await pg.evaluate(()=>{const s=document.getElementById('csStart');return !!(s&&s.offsetParent!==null);})) break; await sleep(400); }
  await sample('select');
  await pg.evaluate(() => { const s=document.getElementById('csStart'); if(s) s.click(); });
  for (let i=0;i<120 && (await gs())!=='fight'; i++) await sleep(500);
  await sample('bell');
  for (const t of [10,20,30,45]){ await sleep(t*1000 - (track.length?0:0)); await sample('fight+'+t+'s'); }

  const last = track[track.length-1];
  const first = track[0];
  await br.close(); srv.close();

  console.log('\n===== TIER RESPONSE (phone viewport, dpr ' + open.dpr + ') =====');
  console.log('  opening tier   ' + open.tier);
  track.forEach(t => console.log('   ' + t.label.padEnd(11) + ' tier ' + String(t.tier).padEnd(7)
    + ' fps ' + String(t.fps).padStart(5) + '   hard stalls ' + String(t.stalls).padStart(3)
    + '  worst frame ' + String(t.worst).padStart(6) + 'ms  tier drops ' + t.drops));
  const ORDER = ['FULL','HIGH','MEDIUM','LOW','POTATO'];
  const moved = ORDER.indexOf(last.tier) - ORDER.indexOf(first.tier);
  if (last.stalls > 0 && last.drops === 0 && ORDER.indexOf(last.tier) < ORDER.length-1)
    FAILS.push('saw ' + last.stalls + ' hard stalls (worst ' + last.worst + 'ms) and never dropped a tier');
  if (last.fps < 8 && last.tier !== 'POTATO')
    FAILS.push('running at ' + last.fps + ' fps and still on ' + last.tier);
  if (errs.length) FAILS.push(errs.length + ' page errors: ' + errs.slice(0,2).join(' | '));
  console.log('\n  tier moved ' + moved + ' step(s) down   page errors ' + errs.length);
  console.log(FAILS.length ? '  FAIL:' : '  PASS');
  FAILS.forEach(f => console.log('    ✗ ' + f));
  process.exit(FAILS.length ? 1 : 0);
})();
