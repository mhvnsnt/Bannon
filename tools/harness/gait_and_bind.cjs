#!/usr/bin/env node
/* gait_and_bind.cjs — IS THE WALK A STRIDE OR A HELD POSE, AND WHEN DOES THE BODY ACTUALLY ARRIVE?
 *
 *   node tools/harness/gait_and_bind.cjs
 *
 * Owner, for weeks: "glbs appearing late and with no animations during moving like procedural
 * puppets in strings".
 *
 * WHY MY OWN HARNESS KEPT SAYING THIS WAS FIXED. smoke.cjs records the MAXIMUM angular distance a
 * bone travelled from where it started. A leg that swings into one position and then holds it
 * scores exactly the same as a leg that strides — the max delta is identical. So a marionette that
 * snaps to a pose and freezes passes the test with a healthy-looking number, which is precisely
 * what he has been describing and precisely what I have been calling green. The number was never
 * wrong; it was measuring the wrong property.
 *
 * A WALK IS PERIODIC. That is the whole difference. So sample each joint every frame and ask of the
 * resulting signal:
 *   * how many times does it CHANGE DIRECTION (a stride reverses each leg once per half-cycle;
 *     a held pose reverses zero times)
 *   * what is its dominant frequency, and is it in the 0.5-3 Hz band a human gait lives in
 *   * peak-to-peak amplitude, and RMS about the mean rather than distance from the first frame
 *   * are left and right ANTI-PHASE, which is what makes a walk read as a walk
 * A puppet scores: reversals ~0, frequency ~0, RMS ~0, and a large max-delta. That combination is
 * the signature, and it is invisible to every measurement I have taken so far.
 *
 * SECOND HALF: time from the match starting to each fighter's GLB being BOUND, measured on the
 * clock rather than inferred. That is the "appearing late" complaint, and after the 72% meshopt
 * compression it has never been re-measured.
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
  const S = window.__G = { series:{}, sampling:false, bind:[], t0:performance.now(), fightAt:0, reqAt:{} };
  const JOINTS = ['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot',
                  'LeftArm','RightArm','LeftForeArm','RightForeArm','Spine1','Spine','Hips'];

  // ---- WHEN DOES THE MODEL ARRIVE ------------------------------------------------------------
  const armLoad = () => {
    if (typeof window.loadFighterModel === 'function' && !window.loadFighterModel.__g){
      const o = window.loadFighterModel;
      const w = function(side, url, name){
        S.reqAt[side] = performance.now();
        try{ S.bind.push({ side, url:String(url||'').split('/').pop(), ev:'request',
                           t:+((performance.now()-S.t0)/1000).toFixed(2) }); }catch(e){}
        return o.apply(this, arguments);
      };
      w.__g = 1; for (const k in o){ try{ w[k]=o[k]; }catch(_){} }
      window.loadFighterModel = w;
    }
  };
  // the bind itself: watch each fighter's .model flip from null to an object
  setInterval(function(){
    try{
      const F = new Function('return typeof fighters!=="undefined"?fighters:null')();
      (F||[]).forEach(function(f, i){
        if (!f) return;
        if (f.model && !f.__gBound){
          f.__gBound = 1;
          const side = 'p' + (i+1);
          const req = S.reqAt[side];
          S.bind.push({ side, name:(f.opts&&f.opts.name)||'?', ev:'BOUND',
                        t:+((performance.now()-S.t0)/1000).toFixed(2),
                        sinceRequest: req ? +((performance.now()-req)/1000).toFixed(2) : null,
                        sinceFight: S.fightAt ? +((performance.now()-S.fightAt)/1000).toFixed(2) : null });
        }
        if (!f.model) f.__gBound = 0;
      });
    }catch(e){}
  }, 100);
  setInterval(armLoad, 200); armLoad();

  // ---- THE GAIT SIGNAL -----------------------------------------------------------------------
  // Sample every frame while sampling is on. Euler-free: use the quaternion's angle about the
  // bone's own dominant axis via the w component, which is monotonic in rotation magnitude and
  // signed by direction — enough to detect reversals and periodicity without axis bookkeeping.
  window.__gStart = function(){ S.series = {}; S.sampling = true; };
  window.__gStop  = function(){ S.sampling = false; return S.series; };
  (function tick(){
    if (S.sampling){
      try{
        const F = new Function('return typeof fighters!=="undefined"?fighters:null')();
        const f = F && F[0];
        if (f && f.model && window.__boneOf){
          for (const j of JOINTS){
            const b = window.__boneOf(f.model, 'mixamorig' + j);
            if (!b) continue;
            const q = b.quaternion;
            // signed scalar: rotation angle with the sign of the largest-magnitude axis component
            const ax = Math.abs(q.x) >= Math.abs(q.y) && Math.abs(q.x) >= Math.abs(q.z) ? q.x
                     : Math.abs(q.y) >= Math.abs(q.z) ? q.y : q.z;
            const ang = 2 * Math.acos(Math.max(-1, Math.min(1, Math.abs(q.w)))) * (ax < 0 ? -1 : 1);
            (S.series[j] || (S.series[j] = [])).push(+ang.toFixed(5));
          }
          (S.series.__t || (S.series.__t = [])).push(+performance.now().toFixed(1));
        }
      }catch(e){}
    }
    requestAnimationFrame(tick);
  })();

  const armState = () => { try{
    if (!S.fightAt && new Function('return gameState')() === 'fight') S.fightAt = performance.now();
  }catch(e){} };
  setInterval(armState, 100);
  try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; } }catch(e){}

  // STUB THE RENDER, OR THIS MEASUREMENT IS WORTHLESS. CLAUDE.md already records this trap costing
  // a turn: swiftshader gives ~5 frames in 3 seconds, and at that rate a 1-2 Hz gait is aliased
  // into a flat line — the harness then reports a broken state machine that is not broken. The
  // first run of THIS tool sampled 26 frames in 15.4s (1.7 fps) and duly reported zero striding
  // legs, which is exactly the artifact, not necessarily the bug. With the rasterizer out of the
  // way the same code runs at a real frame rate and the signal is actually resolvable.
  // The scene still updates; only the pixels are skipped.
  setInterval(function(){
    try{
      var R = new Function('return typeof renderer!=="undefined"?renderer:null')();
      if (R && R.render && !R.render.__stub){ var o = R.render.bind(R);
        var w = function(){ /* pixels skipped on purpose */ }; w.__stub = 1; R.render = w; }
    }catch(e){}
  }, 300);
}

// ---- signal analysis, on the node side -------------------------------------------------------
function analyse(v, times){
  const n = v.length;
  if (n < 8) return { n, verdict:'too few samples' };
  const mean = v.reduce((a,b)=>a+b,0)/n;
  const c = v.map(x => x-mean);
  const rms = Math.sqrt(c.reduce((a,b)=>a+b*b,0)/n);
  const min = Math.min.apply(null,v), max = Math.max.apply(null,v);
  // direction reversals, with a deadband so sensor noise is not counted as a stride
  const band = Math.max(1e-4, (max-min)*0.12);
  let rev = 0, dir = 0, last = v[0];
  for (let i=1;i<n;i++){
    const d = v[i]-last;
    if (Math.abs(d) < band) continue;
    const nd = d > 0 ? 1 : -1;
    if (dir && nd !== dir) rev++;
    dir = nd; last = v[i];
  }
  const secs = times && times.length>1 ? (times[times.length-1]-times[0])/1000 : 0;
  const hz = secs > 0 ? (rev/2)/secs : 0;      // one full cycle = two reversals
  return { n, rms:+rms.toFixed(4), p2p:+(max-min).toFixed(4), reversals:rev,
           seconds:+secs.toFixed(2), hz:+hz.toFixed(2) };
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,140)));
  // A/B IN THE SAME BUILD (CLAUDE.md law: never compare against a number from a past session).
  // --noloco leaves locomotion to the procedural retarget exactly as it shipped.
  if (process.argv.indexOf('--noloco') > 0)
    await page.addInitScript(() => { window.STATE_CLIP_LOCO = false; });
  await page.addInitScript(PROBE);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);
  await sleep(8000);

  // WALK, for a long time and in a straight line, with nobody in range to trigger a guard
  await page.evaluate(() => { try{ const F = new Function('return fighters')();
    if (F && F[0] && F[1]){ F[1].x = F[0].x + 6; F[1].z = F[0].z + 6; } }catch(e){} });
  await page.evaluate(() => window.__gStart());
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})));
  await sleep(14000);
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
  const series = await page.evaluate(() => window.__gStop());
  const bind = await page.evaluate(() => window.__G.bind);

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const times = series.__t || [];
  delete series.__t;
  console.log('\n===== GAIT: IS IT A STRIDE OR A HELD POSE? =====');
  console.log('  ' + (times.length) + ' frames sampled over ' +
    (times.length>1 ? ((times[times.length-1]-times[0])/1000).toFixed(1) : '0') + 's of holding the walk key\n');
  console.log('  joint          RMS      peak-peak   reversals    Hz    reading');
  const rows = {};
  for (const j of Object.keys(series)){
    const a = analyse(series[j], times); rows[j] = a;
    if (a.verdict) { console.log('   ' + j.padEnd(14) + a.verdict); continue; }
    // a human gait cycles at roughly 0.5-3 Hz; anything with no reversals is a HELD POSE
    const reading = a.reversals === 0 ? 'HELD — no direction change at all'
                  : a.hz < 0.25       ? 'drifting, not cycling'
                  : (a.hz > 0.4 && a.hz < 3.5 && a.rms > 0.01) ? 'STRIDING'
                  : 'moving but not a gait';
    console.log('   ' + j.padEnd(14) + String(a.rms).padStart(7) + String(a.p2p).padStart(12) +
                String(a.reversals).padStart(11) + String(a.hz).padStart(7) + '    ' + reading);
  }
  const legs = ['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot'];
  const striding = legs.filter(j => rows[j] && rows[j].hz > 0.4 && rows[j].hz < 3.5 && rows[j].rms > 0.01);
  console.log('\n  LEGS STRIDING: ' + striding.length + ' of ' + legs.length +
    (striding.length >= 3 ? '  — this is a walk' : '  <-- THIS IS THE PUPPET. The legs are not cycling.'));

  console.log('\n===== WHEN THE BODY ARRIVES =====');
  if (!bind.length) console.log('  no model requests or binds observed');
  bind.forEach(b => console.log('  t=' + String(b.t).padStart(6) + 's  ' + b.ev.padEnd(8) + ' ' +
    (b.side||'') + ' ' + (b.name||b.url||'') +
    (b.sinceRequest != null ? '   ' + b.sinceRequest + 's after the request' : '') +
    (b.sinceFight != null ? '   ' + b.sinceFight + 's after the bell' : '')));
  if (errs.length) console.log('\n  page errors: ' + errs.slice(0,4).join(' | '));
  fs.writeFileSync(path.join(OUT,'gait_and_bind.json'), JSON.stringify({ rows, bind, frames:times.length }, null, 1));
  console.log('\n  report -> ' + path.join(OUT,'gait_and_bind.json'));
})();
