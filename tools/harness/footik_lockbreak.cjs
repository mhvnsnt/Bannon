#!/usr/bin/env node
/* footik_lockbreak.cjs — WHY DOES THE PLANTED-FOOT LOCK GIVE UP 121 TIMES IN 15 SECONDS?
 *
 *   node tools/harness/footik_lockbreak.cjs [--nofootik]
 *
 * footik_writemap.cjs established that FOOTIK is NOT the second author of the leg chain (2-4% of
 * leg-bone writes; the clip writes every leg bone every frame). It also found the real defect: the
 * module solves on 10% of the frames it is eligible for, and RELEASES its lock more often than it
 * PLANTS one. This tool asks the one question that follows, and changes nothing.
 *
 * Owner: "I would trace every lock break into a small number of explicit causes rather than
 * immediately changing reach or weight logic ... Don't change anything until that distribution
 * exists."
 *
 * THE CAUSES ARE NOW DISTINCT IN THE ENGINE, not inferred here. twoBone() had ONE `return false`
 * covering a leg stretched past its own length, a leg folded tighter than a knee can bend, and a
 * degenerate rig — three defects with three different fixes, averaged into one counter. They are
 * separated at the source now, and support_switch (the gait working normally, the weight moving to
 * the other foot) is recorded as its own cause so the healthy case cannot sit at the top of the
 * histogram hiding the failure underneath it.
 *
 * AND THE PAIRED SLIDE ACCOUNT, which is the question behind the question: is the cost a POOR
 * CORRECTION WHILE LOCKED, or TIME SPENT UNLOCKED? Foot travel per frame is sampled at the end of
 * step() — FOOTIK is the last pose pass, so that is the rendered pose — and bucketed by whether the
 * foot was locked on that frame, against body travel measured on the SAME frames.
 *
 * --nofootik is the control in the same build: what the slide ratio is with no plant constraint at
 * all. That is the baseline the 6.45x figure in the module header was taken against.
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
const NOFIK = process.argv.indexOf('--nofootik') > 0;
const SECS  = 15;

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
  if (cfg.nofik) window.FOOT_IK = false;
  const S = window.__LB = { frames:0, states:{} };
  (function tick(){
    if (S.on){
      S.frames++;
      try{
        const F = new Function('return typeof fighters!=="undefined"?fighters:null')();
        if (F && F[0]) S.states[F[0].state] = (S.states[F[0].state] || 0) + 1;
      }catch(e){}
    }
    requestAnimationFrame(tick);
  })();
  window.__lbStart = function(){ S.frames = 0; S.states = {}; S.on = true;
    try{ window.BANNON_FOOTIK.reset(); }catch(e){} };
  window.__lbStop = function(){ S.on = false;
    var o = { frames:S.frames, states:S.states };
    try{ o.writes = window.BANNON_FOOTIK.writes(); o.stats = window.BANNON_FOOTIK.stats();
         o.breaks = window.BANNON_FOOTIK.breaks(); }catch(e){ o.err = String(e); }
    return o; };
  try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; } }catch(e){}
  setInterval(function(){
    try{ var R = new Function('return typeof renderer!=="undefined"?renderer:null')();
      if (R && R.render && !R.render.__stub){ var w = function(){}; w.__stub = 1; R.render = w; }
    }catch(e){}
  }, 300);
}

(async () => {
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

  // Opponent frozen through the engine's own AI gate and moved out of range, but kept INSIDE the
  // ring: dropping him outside puts him on the apron/floor where he ragdolls, and his skips then
  // swamp the counters. That cost a readable number once already.
  await page.evaluate(() => { try{
    const F = new Function('return fighters')();
    if (F && F[1] && F[0]){ F[1].x = F[0].x - 3.2; F[1].z = F[0].z + 1.2; F[1].__frozen = 1; }
    if (typeof window.updateAI === 'function' && !window.updateAI.__lb){
      const o = window.updateAI; const w = function(f){ if (f && f.__frozen) return; return o.apply(this, arguments); };
      w.__lb = 1; window.updateAI = w;
    }
  }catch(e){} });

  await page.evaluate(() => window.__lbStart());
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})));
  await sleep(SECS * 1000);
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
  const res = await page.evaluate(() => window.__lbStop());

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const W = res.writes || {}, st = res.stats || {};
  const g = k => W[k] || { n:0, mean:0, max:0 };

  console.log('\n===== PLANT LOCK BREAKS ' + (NOFIK ? '(CONTROL — FOOT_IK=false)' : '') + ' =====');
  console.log('  ' + res.frames + ' frames;  player states: ' +
    Object.keys(res.states).map(k => k + ' ' + res.states[k]).join(', '));
  console.log('  plants ' + (st.plants||0) + '   releases ' + (st.releases||0) + '   solves ' + (st.solved||0));

  console.log('\n--- THE HISTOGRAM  (all breaks, by cause, player and opponent kept apart) ---');
  const causes = Object.keys(W).filter(k => k.indexOf('break.') === 0)
                              .sort((a,b) => W[b].n - W[a].n);
  if (!causes.length) console.log('   no breaks recorded');
  const tot = { p:0, ai:0 };
  for (const c of causes){
    const w = W[c], parts = c.split('.');
    tot[parts[1]] = (tot[parts[1]] || 0) + w.n;
    console.log('   ' + (parts[1] + '  ' + parts[2]).padEnd(28) + String(w.n).padStart(5) +
      '   mean reach ratio ' + w.mean.toFixed(2) + '  (max ' + w.max.toFixed(2) + ')');
  }
  console.log('   ' + '—'.repeat(46));
  console.log('   PLAYER ' + (tot.p||0) + ' breaks,  opponent ' + (tot.ai||0));

  console.log('\n--- IS THE COST A BAD CORRECTION, OR TIME SPENT UNLOCKED? ---');
  for (const who of ['p','ai']){
    const body = g('speed.' + who + '.body'), lk = g('slide.' + who + '.locked'), fr = g('slide.' + who + '.free');
    if (!body.n) continue;
    const tf = lk.n + fr.n;
    console.log('   ' + (who === 'p' ? 'player  ' : 'opponent') +
      '  body ' + body.mean.toFixed(3) + ' m/s' +
      '   foot LOCKED ' + lk.mean.toFixed(3) + ' m/s (' + lk.n + ' leg-frames, ' +
        (tf ? (100*lk.n/tf).toFixed(0) : 0) + '%)' +
      '   foot FREE ' + fr.mean.toFixed(3) + ' m/s (' + fr.n + ')');
    if (body.mean > 0.01)
      console.log('            slide ratio  locked ' + (lk.mean/body.mean).toFixed(2) + 'x' +
                  '   free ' + (fr.mean/body.mean).toFixed(2) + 'x' +
                  '   <- a planted foot should be well under 1x');
  }

  console.log('\n--- IS IT THE TARGET, OR THE POSE THE CLIP ALREADY PUT THE LEG IN? ---');
  // |hip->ankle| / (L1+L2) with no target involved. If the leg is already at ~1.0 when the break
  // fires, the target is not what is out of reach — the skeleton's own configuration is, and the
  // module is refusing a pose the character is standing in.
  for (const who of ['p','ai']){
    const e = g('extAtBreak.' + who); if (!e.n) continue;
    console.log('   ' + (who === 'p' ? 'player' : 'opponent') + '  leg extension AT THE BREAK  mean ' +
      e.mean.toFixed(3) + '  max ' + e.max.toFixed(3) + '   (1.000 = perfectly straight)');
  }
  const exts = Object.keys(W).filter(k => k.indexOf('ext.') === 0 && k.indexOf('extAt') < 0).sort();
  for (const k of exts) console.log('   baseline ' + k.slice(4).padEnd(12) +
    ' mean ' + W[k].mean.toFixed(3) + '  max ' + W[k].max.toFixed(3) + '   n=' + W[k].n);
  console.log('   the module refuses to solve past REACH=0.97 of full extension');

  console.log('\n--- THE INDIVIDUAL EVENTS  (first 14) ---');
  console.log('  who leg  cause            age  err(cm)  reach   ext  weight  body(m/s)');
  (res.breaks || []).slice(0, 14).forEach(b => console.log('   ' + b.who.padEnd(4) + b.leg.padEnd(4) +
    b.why.padEnd(17) + String(b.ageFrames).padStart(4) + String((b.err*100).toFixed(1)).padStart(9) +
    String(b.reach.toFixed(2)).padStart(7) + String((b.ext||0).toFixed(2)).padStart(6) +
    String(b.w.toFixed(2)).padStart(8) + String(b.bodySpd.toFixed(2)).padStart(10)));

  if (errs.length) console.log('\n  page errors: ' + errs.slice(0,4).join(' | '));
  const file = path.join(OUT, 'footik_lockbreak' + (NOFIK ? '_control' : '') + '.json');
  fs.writeFileSync(file, JSON.stringify({ nofootik:NOFIK, seconds:SECS, ...res }, null, 1));
  console.log('\n  report -> ' + file);
})();
