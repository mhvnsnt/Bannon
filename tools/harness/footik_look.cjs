#!/usr/bin/env node
/* footik_look.cjs — SEE IT. Side-by-side stills of the walk, reach guard OFF vs ON.
 *
 *   node tools/harness/footik_look.cjs
 *
 * OWNER LAW: a number is not a look. The reach-guard candidate raises lock occupancy 3% -> 35% by
 * letting the solver clamp onto the reach sphere instead of abandoning the plant — and the obvious
 * way that could go wrong is a leg pinned at full extension, i.e. a stiff straight-legged walk that
 * measures better and looks worse. Nothing in the A/B can see that.
 *
 * So: the same walk, the same frames, both arms, from a camera close enough that a knee is legible.
 * The broadcast camera puts a wrestler at ~80px and a locked-straight knee would be invisible in it
 * — that lesson is already banked from the grapple stills. Borrows the engine's own __camShot blend
 * rather than reaching past the camera code, and hands the camera back afterwards.
 *
 * ALSO REPORTS THE KNEE ANGLE, because "does it look stiff" has a number underneath it: the interior
 * angle at the knee, sampled every frame through the walk. A straight-legged walk is a knee that
 * stops flexing, and that is measurable next to the picture rather than argued about over it.
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

function PROBE(cfg){
  window.FOOT_IK_REACH2 = !!cfg.reach2;
  const S = window.__LK = { knee:{ L:[], R:[] }, on:false };
  // INTERIOR KNEE ANGLE off the live bones: 180 deg is a locked-straight leg. Read from world
  // positions, not from the bone's local quaternion, because the local rotation is expressed in a
  // parent frame that itself moves — the angle between the two segments is the thing being asked
  // about and it is frame-independent.
  (function tick(){
    if (S.on){
      try{
        const F = new Function('return typeof fighters!=="undefined"?fighters:null')();
        const f = F && F[0];
        if (f && f.model && window.__boneOf){
          for (const s of ['Left','Right']){
            const up = window.__boneOf(f.model, s+'UpLeg'), lo = window.__boneOf(f.model, s+'Leg'),
                  ft = window.__boneOf(f.model, s+'Foot');
            if (!up || !lo || !ft) continue;
            const A = up.getWorldPosition(new THREE.Vector3()),
                  B = lo.getWorldPosition(new THREE.Vector3()),
                  C = ft.getWorldPosition(new THREE.Vector3());
            const v1 = A.sub(B), v2 = C.sub(B);
            if (v1.lengthSq() < 1e-8 || v2.lengthSq() < 1e-8) continue;
            S.knee[s[0]].push(+(v1.angleTo(v2) * 180 / Math.PI).toFixed(2));
          }
        }
      }catch(e){}
    }
    requestAnimationFrame(tick);
  })();
  window.__lkStart = () => { S.knee = { L:[], R:[] }; S.on = true; };
  window.__lkStop  = () => { S.on = false; return S.knee; };
  try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO=false; } }catch(e){}
}

const stat = v => {
  if (!v.length) return { n:0 };
  const s = v.slice().sort((a,b)=>a-b);
  return { n:v.length, mean:+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1),
           p5:+s[Math.floor(s.length*0.05)].toFixed(1), p95:+s[Math.floor(s.length*0.95)].toFixed(1),
           straight: +(100 * v.filter(a => a > 170).length / v.length).toFixed(1) };
};

async function arm(browser, port, reach2, tag){
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,120)));
  await page.addInitScript(PROBE, { reach2 });
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i=0;i<300 && (await gs())!=='menu';i++) await sleep(400);
  await page.evaluate(() => { const b=document.getElementById('btnFight'); if (b) b.click(); });
  for (let i=0;i<60;i++){ const ok=await page.evaluate(()=>{ const s=document.getElementById('csStart'); return !!(s&&s.offsetParent!==null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s=document.getElementById('csStart'); if (s) s.click(); });
  for (let i=0;i<90 && (await gs())!=='fight';i++) await sleep(400);
// THE BELL IS NOT THE FIGHT. gameState flips to 'fight' and BANNON_ENTRANCE_SEQ then walks both
  // men down the ramp, up to 15s each, during which the player is on the RAMP and the APRON and not
  // on the mat at all. Driving a walk into that measures the entrance — it is why the stills came
  // back showing a SKIP ENTRANCES chip and an 'apron' state in every state histogram. Skip it
  // explicitly and WAIT for the sequence to actually report itself finished, rather than sleeping a
  // guessed number of seconds.
  await page.evaluate(() => { try{
    window.__SEQ_SKIP_ALL = true;
    if (window.BANNON_WALKOUT && window.BANNON_WALKOUT.skip) window.BANNON_WALKOUT.skip();
  }catch(e){} });
  for (let i = 0; i < 50; i++){
    const running = await page.evaluate(() => { try{
      return !!(window.BANNON_ENTRANCE_SEQ && window.BANNON_ENTRANCE_SEQ.stats().running);
    }catch(e){ return false; } });
    if (!running) break;
    await sleep(400);
  }
  await sleep(10000);
  await page.evaluate(() => { try{
    const F = new Function('return fighters')();
    if (F && F[1] && F[0]){ F[1].x = F[0].x - 3.4; F[1].z = F[0].z + 1.4; F[1].__frozen = 1; }
    if (typeof window.updateAI==='function' && !window.updateAI.__lk){
      const o=window.updateAI; const w=function(f){ if (f&&f.__frozen) return; return o.apply(this,arguments); };
      w.__lk=1; window.updateAI=w; } }catch(e){} });

  await page.evaluate(() => window.__lkStart());
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})));

  // Three stills spread through the walk. Pixels are ON here on purpose — this is the one harness
  // whose whole output is the picture, so the render must not be stubbed.
  // The shot has to be RE-PINNED every frame. Set once and left, it goes stale the moment he walks
  // out of it — the first run of this framed an empty corner of the ring while he was two metres
  // away, and a still of the wrong thing is worse than no still. Camera sits PERPENDICULAR to the
  // walk (he travels +x, so the camera stands off in z): a foot plant is a side-on question and a
  // three-quarter view behind him hides exactly the contact being judged.
  await page.evaluate(() => { try{
    if (window.__lkCam) clearInterval(window.__lkCam);
    window.__lkCam = setInterval(function(){ try{
      const f = new Function('return fighters')()[0]; if (!f) return;
      window.__camShot = { px: f.x + 0.35, py: 0.95, pz: f.z + 2.45,
                           lx: f.x, ly: 0.72, lz: f.z, w: 1, speed: 30 };
    }catch(e){} }, 33);
  }catch(e){} });
  for (let i = 0; i < 3; i++){
    await sleep(3000);
    try{ await page.screenshot({ path: path.join(OUT, 'footik_' + tag + '_' + (i+1) + '.png') }); }catch(e){}
  }
  await page.evaluate(() => { try{ clearInterval(window.__lkCam); }catch(e){} });
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
  await page.evaluate(() => { try{ window.__camShot = null; }catch(e){} });
  const knee = await page.evaluate(() => window.__lkStop());
  try{ await page.close(); }catch(e){}
  return { knee: { L: stat(knee.L||[]), R: stat(knee.R||[]) }, errs };
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });

  const off = await arm(browser, port, false, 'off');
  const on  = await arm(browser, port, true,  'on');
  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  console.log('\n===== KNEE FLEX THROUGH THE WALK  (180 deg = locked straight) =====');
  console.log('  arm            leg      n    mean     p5    p95   % over 170 deg');
  for (const [n, r] of [['guard OFF', off], ['guard ON ', on]])
    for (const s of ['L','R']){
      const k = r.knee[s];
      console.log('  ' + n.padEnd(14) + s.padEnd(6) + String(k.n).padStart(5) +
        String(k.mean).padStart(8) + String(k.p5).padStart(7) + String(k.p95).padStart(7) +
        String(k.straight + '%').padStart(12));
    }
  console.log('\n  A stiff walk is a knee that stops flexing: mean climbing toward 180 and the');
  console.log('  "% over 170" column rising. Compare the stills, they are the actual verdict.');
  console.log('  stills -> ' + OUT + '/footik_off_[1-3].png  and  footik_on_[1-3].png');
  const e = off.errs.length + on.errs.length;
  console.log('  page errors: ' + e + (e ? '  ' + off.errs.concat(on.errs).slice(0,3).join(' | ') : ''));
})();
