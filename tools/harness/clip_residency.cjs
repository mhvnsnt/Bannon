#!/usr/bin/env node
/* clip_residency.cjs — WHEN A MOVE FIRES, IS ITS CAPTURE ACTUALLY IN MEMORY?
 *
 *   node tools/harness/clip_residency.cjs
 *
 * Owner, still: "the animations still are not correct cause the animation are still looking
 * procedural". smoke.cjs shows why that is not a matter of opinion — the same scripted session
 * reports `strike poseCalls 44` on one run and `18` on the next, `grapple 14` then `0`, `walk 20`
 * then `0`. A move that applies no clip pose IS procedural: it falls through to the spring rig.
 *
 * So the number that matters is not "does mocap work", it is the HIT RATE: of the moves that fire,
 * how many had their capture resident at that instant. This drives a long session, and for every
 * attack records (a) whether the move carried a clip name at all, (b) whether __studioClip could
 * resolve it right then, and (c) whether the name later became resident — which separates
 * "unmapped" from "mapped but not loaded in time", two completely different bugs.
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
  const S = window.__CR = { fires:[], poseCalls:0, byName:{} };
  const arm = () => {
    try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.__crTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; window.__crTier = 1; } }catch(e){}
    if (window.studioApplyClipPose && !window.studioApplyClipPose.__cr){
      const o = window.studioApplyClipPose;
      const w = function(){ S.poseCalls++; return o.apply(this, arguments); };
      w.__cr = 1; for (const k in o) { try{ w[k] = o[k]; }catch(e){} }
      window.studioApplyClipPose = w;
    }
    // MEASURE WHERE THE DECISION IS MADE, NOT WHERE THE MOVE IS CHOSEN. My first version wrapped
    // startAttack and read this.move.clip straight after — and reported FIRE JAB as unmapped when
    // combat_clip_map.json plainly contains it, while reporting RIP UPPERCUT as mapped when it is
    // not in the file at all. The clip is stamped inside poseAttack (__combatClipFor, then
    // equippedClipFor, then __slotClipRotate), which runs FRAMES LATER. The probe was reading the
    // field before anything wrote it. Wrap poseAttack, sample AFTER it runs, and count each move
    // ONCE by tracking the attack instance.
    try{
      const F = new Function('return typeof Fighter!=="undefined"?Fighter:null')();
      if (F && F.prototype.poseAttack && !F.prototype.poseAttack.__cr){
        const o = F.prototype.poseAttack;
        const w = function(dt){
          const r = o.apply(this, arguments);
          try{
            // THE MOVE IS `this.attackData`, NOT `this.move`. Reading the wrong field reported
            // LEO CROSS as unmapped seven times when __combatClipFor('LEO CROSS') plainly returns
            // 'Combo Punch' when asked directly. Second harness bug on the same measurement.
            // COUNT EACH ATTACK ONCE, BUT READ ITS FINAL STATE — not its first frame. Recording on
            // first sight reported LEO CROSS as clipless five times running; the engine assigns the
            // NEXT attackData at the tail of the previous move's processing, so the frame I was
            // sampling belonged to the move before it. The record now lives on the move object and
            // is refreshed every frame, so what gets reported is what the body actually played.
            const mv = this.attackData || null;
            if (mv){
              let rec = mv.__crRec;
              if (!rec){
                const nm = mv.name || '?';
                let fromMap = null;
                try{ fromMap = window.__combatClipFor ? window.__combatClipFor(nm) : null; }catch(e){}
                rec = mv.__crRec = { move:nm, clip:null, resident:false, mapWanted:fromMap, t:Math.round(performance.now()) };
                S.fires.push(rec);
                const b = S.byName[nm] || (S.byName[nm] = { n:0, mapped:0, resident:0, clips:{}, mapWanted:fromMap, overridden:0 });
                b.n++; rec.__b = b;
              }
              const clip = mv.clip || null;
              if (clip && clip !== rec.clip){
                if (!rec.clip) rec.__b.mapped++;
                rec.clip = clip; rec.__b.clips[clip] = (rec.__b.clips[clip]||0) + 1;
                if (rec.mapWanted && clip !== rec.mapWanted) rec.__b.overridden++;
              }
              const res = !!(clip && window.__studioClip && window.__studioClip(clip));
              if (res && !rec.resident){ rec.resident = true; rec.__b.resident++; }
            }
          }catch(e){}
          return r;
        };
        w.__cr = 1; F.prototype.poseAttack = w;
      }
    }catch(e){}
  };
  arm(); setInterval(arm, 300);
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,140)));
  await page.addInitScript(PROBE);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);
  await sleep(4000);

  // drive a long, varied session: every attack button, every direction, both modifiers
  const keys = ['j','k','u','i','g','h'];
  const dirs = ['w','a','s','d',''];
  const close = () => page.evaluate(() => { try{ const F=new Function('return fighters')();
    if (F&&F[0]&&F[1]){ F[1].x=F[0].x+0.8; F[1].z=F[0].z; F[0].hp=Math.max(F[0].hp,5000); F[1].hp=Math.max(F[1].hp,5000); } }catch(e){} });
  for (let round = 0; round < 3; round++){
    for (const k of keys){
      for (const d of dirs){
        await close();
        if (d) await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown',{key:x,bubbles:true})), d);
        await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown',{key:x,bubbles:true})), k);
        await sleep(60);
        await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup',{key:x,bubbles:true})), k);
        if (d) await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup',{key:x,bubbles:true})), d);
        await sleep(420);
      }
    }
  }
  await sleep(2500);

  const R = await page.evaluate(() => {
    const S = window.__CR;
    let studio = 0, warm = null;
    try{ const C = new Function('return STUDIO')().clips; studio = Object.keys(C||{}).length; }catch(e){}
    try{ warm = window.BANNON_WARM && window.BANNON_WARM.stats ? window.BANNON_WARM.stats() : null; }catch(e){}
    let worker = null; try{ worker = window.BANNON_CLIPWORKER && window.BANNON_CLIPWORKER.stats ? window.BANNON_CLIPWORKER.stats() : null; }catch(e){}
    let fit = null; try{ fit = window.BANNON_CLIP_ROTATE && window.BANNON_CLIP_ROTATE.stats ? window.BANNON_CLIP_ROTATE.stats() : null; }catch(e){}
    // second look: how many of the clip names we saw are resident NOW?
    const late = {};
    for (const f of S.fires) if (f.clip && !f.resident)
      late[f.clip] = !!(window.__studioClip && window.__studioClip(f.clip));
    S.fires.forEach(f => { delete f.__b; });
    return { fires:S.fires, byName:S.byName, poseCalls:S.poseCalls, studio, warm, worker, fit, late };
  });

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const n = R.fires.length;
  const mapped = R.fires.filter(f => f.clip).length;
  const resident = R.fires.filter(f => f.resident).length;
  const lateKeys = Object.keys(R.late);
  const lateResident = lateKeys.filter(k => R.late[k]).length;

  console.log('\n===== CLIP RESIDENCY =====');
  console.log('  moves fired          ' + n);
  console.log('  carried a clip name  ' + mapped + (n ? '   (' + Math.round(100*mapped/n) + '%)' : ''));
  console.log('  CAPTURE RESIDENT     ' + resident + (n ? '   (' + Math.round(100*resident/n) + '%)  <- anything else played PROCEDURAL' : ''));
  console.log('  studioApplyClipPose  ' + R.poseCalls + ' calls');
  console.log('  clips in STUDIO      ' + R.studio);
  if (R.warm) console.log('  BANNON_WARM          ' + JSON.stringify(R.warm));
  if (R.worker) console.log('  BANNON_CLIPWORKER    ' + JSON.stringify(R.worker));
  if (R.fit) console.log('  BANNON_CLIP_FIT      ' + JSON.stringify(R.fit));
  console.log('  of the ' + lateKeys.length + ' distinct names that MISSED, ' + lateResident + ' are resident by the end' +
    ' (= mapped but too slow), ' + (lateKeys.length - lateResident) + ' never arrived (= no file, or the name is wrong)');

  const rows = Object.entries(R.byName).sort((a,b) => b[1].n - a[1].n);
  const overridden = R.fires.filter(f => f.mapWanted && f.clip && f.clip !== f.mapWanted).length;
  console.log('  map said one thing, something else won:  ' + overridden + ' of ' + n);
  console.log('\n  PER MOVE  (fired / mapped / resident)   PLAYED  [map wanted]');
  for (const [nm, b] of rows.slice(0, 26))
    console.log('   ' + String(b.n).padStart(3) + ' /' + String(b.mapped).padStart(3) + ' /' + String(b.resident).padStart(3) +
      '   ' + nm.padEnd(26) + Object.keys(b.clips).slice(0,3).join(', ').padEnd(34) +
      (b.mapWanted ? '[' + b.mapWanted + ']' : '[no map entry]'));
  if (lateKeys.length){
    console.log('\n  NAMES THAT MISSED  (✓ = arrived eventually, ✗ = never)');
    lateKeys.slice(0, 30).forEach(k => console.log('   ' + (R.late[k] ? '✓' : '✗') + ' ' + k));
  }
  if (errs.length) console.log('\n  page errors: ' + errs.slice(0,4).join(' | '));
  fs.writeFileSync(path.join(OUT, 'clip_residency.json'), JSON.stringify(R, null, 1));
  console.log('\n  report -> ' + path.join(OUT, 'clip_residency.json'));
})();
