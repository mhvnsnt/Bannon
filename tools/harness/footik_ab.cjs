#!/usr/bin/env node
/* footik_ab.cjs — A / B / A2 on the plant-lock reach guard, control re-run LAST.
 *
 *   node tools/harness/footik_ab.cjs
 *
 * Owner: "Run control -> candidate -> control. Check controls first." And the standing law in
 * CLAUDE.md, learned by nearly shipping a fix for a warmup curve: any A/B whose conditions run in
 * sequence MUST re-test the first condition at the end. If A and A2 disagree materially the
 * experiment measured TIME, not the variable, and the candidate gets no verdict.
 *
 *   A   FOOT_IK_REACH2 = false   (shipped behaviour: d > max releases the plant)
 *   B   FOOT_IK_REACH2 = true    (the candidate: a target inside the leg's own current extension is
 *                                 never out of reach; a small overshoot clamps onto the reach
 *                                 sphere; a far target still releases)
 *   A2  FOOT_IK_REACH2 = false   (the control again, LAST)
 *
 * THE VERDICT IS DECIDED IN THIS ORDER AND NOT ANOTHER:
 *   1. do A and A2 agree?           no -> VOID, report nothing about B
 *   2. did the dominant cause move?  out_of_reach breaks, and lock occupancy
 *   3. did the thing the module EXISTS for move?  the foot slide ratio
 * Counts before timings, per the noise-floor law — a single run cannot resolve a difference smaller
 * than roughly half, and every number here is a count or a ratio of counts.
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
const SECS = 15;

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
  const S = window.__AB = { frames:0, states:{} };
  (function tick(){ if (S.on){ S.frames++;
    try{ const F = new Function('return typeof fighters!=="undefined"?fighters:null')();
      if (F && F[0]) S.states[F[0].state] = (S.states[F[0].state]||0)+1; }catch(e){} }
    requestAnimationFrame(tick); })();
  window.__abStart = function(){ S.frames=0; S.states={}; S.on=true; try{ window.BANNON_FOOTIK.reset(); }catch(e){} };
  window.__abStop = function(){ S.on=false; var o={ frames:S.frames, states:S.states, reach2:window.FOOT_IK_REACH2 };
    try{ o.writes=window.BANNON_FOOTIK.writes(); o.stats=window.BANNON_FOOTIK.stats(); }catch(e){ o.err=String(e); }
    return o; };
  try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO=false; } }catch(e){}
  setInterval(function(){ try{ var R=new Function('return typeof renderer!=="undefined"?renderer:null')();
    if (R && R.render && !R.render.__stub){ var w=function(){}; w.__stub=1; R.render=w; } }catch(e){} }, 300);
}

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
  await sleep(9000);
  await page.evaluate(() => { try{
    const F = new Function('return fighters')();
    if (F && F[1] && F[0]){ F[1].x = F[0].x - 3.2; F[1].z = F[0].z + 1.2; F[1].__frozen = 1; }
    if (typeof window.updateAI==='function' && !window.updateAI.__ab){
      const o=window.updateAI; const w=function(f){ if (f&&f.__frozen) return; return o.apply(this,arguments); };
      w.__ab=1; window.updateAI=w; } }catch(e){} });
  await page.evaluate(() => window.__abStart());
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})));
  await sleep(SECS*1000);
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
  const r = await page.evaluate(() => window.__abStop());
  r.tag = tag; r.errs = errs;
  try{ await page.close(); }catch(e){}
  return r;
}

// the numbers a verdict is allowed to rest on, all counts or ratios of counts
function metrics(r){
  const W = r.writes || {}, st = r.stats || {};
  const g = k => W[k] || { n:0, mean:0, max:0 };
  const lk = g('slide.p.locked'), fr = g('slide.p.free'), body = g('speed.p.body');
  const oor = g('break.p.out_of_reach');
  return {
    frames: r.frames,
    plants: st.plants||0, releases: st.releases||0, solves: st.solved||0,
    outOfReach: oor.n,
    lockedFrames: lk.n, freeFrames: fr.n,
    lockedPct: (lk.n+fr.n) ? 100*lk.n/(lk.n+fr.n) : 0,
    bodySpd: body.mean,
    slideLocked: body.mean > 0.01 ? lk.mean/body.mean : 0,
    slideFree:   body.mean > 0.01 ? fr.mean/body.mean : 0,
    slideAll:    body.mean > 0.01 && (lk.n+fr.n) ? ((lk.mean*lk.n + fr.mean*fr.n)/(lk.n+fr.n))/body.mean : 0,
    clamps: g('clamp.plant').n + g('clamp.swing').n,
    errs: (r.errs||[]).length
  };
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });

  // REPETITIONS, because the first run of this experiment put the two controls 49% apart on the
  // very counter the candidate targets. One run per arm cannot resolve that, and the banked law
  // says a difference under ~50% is unproven from a single run. Interleaved A B A2 per rep, never
  // all the As then all the Bs, so a warmup trend cannot masquerade as the variable.
  const REPS = Math.max(1, +(process.argv.find(a => a.startsWith('--reps=')) || '--reps=3').split('=')[1] || 3);
  const runs = { A:[], B:[], A2:[] };
  for (let i = 0; i < REPS; i++){
    runs.A.push(metrics(await arm(browser, port, false, 'A')));
    runs.B.push(metrics(await arm(browser, port, true,  'B')));
    runs.A2.push(metrics(await arm(browser, port, false, 'A2')));
  }
  const agg = rs => {
    const o = {};
    for (const k of Object.keys(rs[0])){
      if (typeof rs[0][k] !== 'number') continue;
      const v = rs.map(r => r[k]);
      o[k] = v.reduce((a,b)=>a+b,0)/v.length;
      o['_' + k + '_lo'] = Math.min.apply(null, v);
      o['_' + k + '_hi'] = Math.max.apply(null, v);
    }
    o.errs = rs.reduce((a,r)=>a+r.errs,0);
    return o;
  };
  const A = agg(runs.A), B = agg(runs.B), A2 = agg(runs.A2);
  const band = (m, k) => m['_'+k+'_lo'].toFixed(1) + '-' + m['_'+k+'_hi'].toFixed(1);

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}
  console.log('\n  ' + REPS + ' repetition(s) per arm, interleaved A B A2');

  const row = (n, m) => '  ' + n.padEnd(14) +
    String(m.frames.toFixed(0)).padStart(7) + String(m.plants.toFixed(0)).padStart(8) +
    String(m.releases.toFixed(0)).padStart(9) + String(m.solves.toFixed(0)).padStart(8) +
    String(m.outOfReach.toFixed(0)).padStart(9) + String(m.clamps.toFixed(0)).padStart(8) +
    String(m.lockedPct.toFixed(1) + '%').padStart(9) + String(m.slideAll.toFixed(2) + 'x').padStart(9);

  console.log('\n===== FOOTIK REACH GUARD — A / B / A2 =====');
  console.log('  arm            frames  plants releases  solves  out_reach  clamps  locked%  slide');
  console.log(row('A  control', A));
  console.log(row('B  candidate', B));
  console.log(row('A2 control', A2));

  // 1. CONTROLS FIRST. Nothing about B is reportable until these agree.
  console.log('\n--- 1. DO THE CONTROLS AGREE? ---');
  const cmp = [];
  for (const k of ['outOfReach','lockedPct','slideAll','solves']){
    const a = A[k], b = A2[k];
    const base = Math.max(Math.abs(a), Math.abs(b), 1e-6);
    const drift = Math.abs(a - b) / base;
    cmp.push({ k, a, b, drift });
    console.log('   ' + k.padEnd(12) + 'A ' + (+a).toFixed(2).padStart(9) + ' [' + band(A,k) + ']' +
      '   A2 ' + (+b).toFixed(2).padStart(9) + ' [' + band(A2,k) + ']' +
      '   drift ' + (drift*100).toFixed(0) + '%');
  }
  // The banked noise floor: a single run cannot resolve a difference smaller than roughly half.
  const worst = Math.max.apply(null, cmp.map(c => c.drift));
  const VOID = worst > 0.5;
  console.log('   worst control drift ' + (worst*100).toFixed(0) + '%  ->  ' +
    (VOID ? 'CONTROLS DISAGREE — CANDIDATE VERDICT IS VOID' : 'controls agree within the noise floor'));

  if (VOID){
    console.log('\n  The experiment measured time, not the variable. No claim is made about B.');
  } else {
    console.log('\n--- 2. DID THE DOMINANT CAUSE MOVE? ---');
    const ctl = (A.outOfReach + A2.outOfReach) / 2;
    console.log('   out_of_reach breaks   control ' + ctl.toFixed(1) + '  ->  candidate ' + B.outOfReach);
    const lctl = (A.lockedPct + A2.lockedPct) / 2;
    console.log('   lock occupancy        control ' + lctl.toFixed(1) + '%  ->  candidate ' + B.lockedPct.toFixed(1) + '%');
    console.log('   clamps applied        ' + B.clamps + ' (control ' + A.clamps + '/' + A2.clamps + ', must be 0)');

    console.log('\n--- 3. DID THE THING THE MODULE EXISTS FOR MOVE? ---');
    const sctl = (A.slideAll + A2.slideAll) / 2;
    console.log('   foot slide ratio      control ' + sctl.toFixed(2) + 'x  ->  candidate ' + B.slideAll.toFixed(2) + 'x' +
      '   (a planted foot should be well under 1x)');
    console.log('   while LOCKED          control ' + ((A.slideLocked+A2.slideLocked)/2).toFixed(2) +
      'x  ->  candidate ' + B.slideLocked.toFixed(2) + 'x');
    const moved = Math.abs(B.slideAll - sctl) / Math.max(sctl, 1e-6);
    // With repetitions the honest test is whether the RANGES overlap, not whether two means differ
    // by some fraction. Non-overlapping ranges across interleaved arms is a real separation; means
    // that differ while every run overlaps is not, however large the percentage looks.
    const overlap = !(B['_slideAll_hi'] < Math.min(A['_slideAll_lo'], A2['_slideAll_lo']) ||
                      B['_slideAll_lo'] > Math.max(A['_slideAll_hi'], A2['_slideAll_hi']));
    console.log('\n   ranges  A ' + band(A,'slideAll') + '   A2 ' + band(A2,'slideAll') +
                '   B ' + band(B,'slideAll'));
    console.log('   slide moved ' + (moved*100).toFixed(0) + '% and the ranges ' +
      (overlap ? 'OVERLAP -> UNPROVEN whatever the direction'
               : 'DO NOT OVERLAP -> ' + (B.slideAll < sctl ? 'a real reduction' : 'a real REGRESSION')));
  }
  const errs = A.errs + B.errs + A2.errs;
  console.log('\n  page errors across all three arms: ' + errs);
  fs.writeFileSync(path.join(OUT,'footik_ab.json'), JSON.stringify({ A, B, A2, void:VOID }, null, 1));
  console.log('  report -> ' + path.join(OUT,'footik_ab.json'));
})();
