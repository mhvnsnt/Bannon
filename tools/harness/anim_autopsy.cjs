#!/usr/bin/env node
/* anim_autopsy.cjs — WATCH ONE MOVE, PROPERLY.
 *
 *   node tools/harness/anim_autopsy.cjs                 # strike, grapple and walk
 *   node tools/harness/anim_autopsy.cjs --only strike
 *   node tools/harness/anim_autopsy.cjs --slow 0.15     # slower = more frames per move
 *
 * WHY: a jab lasts ~0.4s. The play-and-record harness runs at ~1.4 FPS in this container, so a
 * strike gets ONE frame — you cannot see an animation in one frame, and neither can I. Judging
 * "the strike looks bad" off that is exactly the guessing the owner keeps catching.
 *
 * TWO THINGS AT ONCE, so the picture and the numbers cannot disagree:
 *  1. SLOW THE GAME CLOCK (TUNE.timeScale). At 0.15x a 0.4s jab spans ~2.7s of wall clock, which is
 *     several real frames even here — a genuine flipbook of the move.
 *  2. SAMPLE THE SKELETON every animation frame: the WORLD position of the striking hand, the
 *     elbow, the shoulder, the hips and both feet, plus which clip (if any) is driving. A punch that
 *     reads as "bad" is measurable — the hand does not travel, or it travels without the hips
 *     leading, or the feet slide instead of planting.
 *
 * It reports, per move: hand travel, peak extension from the shoulder, whether the hips led the
 * hand (kinetic chain), foot slip during the move, and the clip that played. Screenshots land beside
 * the JSON so the numbers can be checked against the picture.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.css':'text/css','.svg':'image/svg+xml' };

function arg(n, d){ const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

function serve(port){
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/BANNON_v150.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Access-Control-Allow-Origin':'*' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

// Sampler installed in the page: records the striking side's chain in WORLD space every frame.
function SAMPLER(){
  window.__A = { rec: [], on: false, label: '', clip: null, poseCalls: 0 };
  const A = window.__A;
  const lex = n => { try { return new Function('return typeof '+n+'!=="undefined"?'+n+':null')(); } catch(e){ return null; } };

  const arm = () => {
    if (window.studioApplyClipPose && !window.studioApplyClipPose.__au){
      const o = window.studioApplyClipPose;
      const w = function(f, clip, ph, wt){ if (A.on){ A.poseCalls++; A.clipSeen = true; } return o.apply(this, arguments); };
      w.__au = 1; w.__owner = o.__owner; w.__bridge = o.__bridge; w.__probe = o.__probe; w.__rec = o.__rec;
      window.studioApplyClipPose = w;
    }
    if (typeof window.updateFighterModel === 'function' && !window.updateFighterModel.__au){
      const o = window.updateFighterModel;
      const V = () => new window.THREE.Vector3();
      const w = function(f){
        const r = o.apply(this, arguments);
        try{
          const F = lex('fighters');
          if (!A.on || !F || f !== F[0] || !f.model) return r;
          const B = n => window.__boneOf ? window.__boneOf(f.model, 'mixamorig' + n) : null;
          const wp = b => { if (!b) return null; const v = V(); b.getWorldPosition(v); return [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)]; };
          A.rec.push({
            t: +performance.now().toFixed(0), state: f.state, st: +(f.stateTime||0).toFixed(3),
            handR: wp(B('RightHand')), elbowR: wp(B('RightForeArm')), shR: wp(B('RightArm')),
            handL: wp(B('LeftHand')),  elbowL: wp(B('LeftForeArm')),
            hips: wp(B('Hips')), ftL: wp(B('LeftFoot')), ftR: wp(B('RightFoot')),
            root: [+(f.x||0).toFixed(4), +(f.z||0).toFixed(4)], facing: +(f.facing||0).toFixed(3),
            clip: (f._curMoveClip || null), poseCalls: A.poseCalls
          });
        }catch(e){}
        return r;
      };
      w.__au = 1; window.updateFighterModel = w;
    }
  };
  arm(); const iv = setInterval(arm, 400); setTimeout(() => clearInterval(iv), 40000);

  // remember which clip the current move carried, so a sample can say what drove it
  const armMove = () => {
    const Fp = (function(){ try { return new Function('return typeof Fighter!=="undefined"?Fighter:null')(); } catch(e){ return null; } })();
    if (Fp && Fp.prototype.startAttack && !Fp.prototype.startAttack.__au){
      const o = Fp.prototype.startAttack;
      const w = function(mv){ try{ this._curMoveClip = (mv && mv.clip) || null; this._curMoveName = (mv && mv.name) || null; }catch(e){}
        return o.apply(this, arguments); };
      w.__au = 1; Fp.prototype.startAttack = w;
    }
  };
  armMove(); const iv2 = setInterval(armMove, 400); setTimeout(() => clearInterval(iv2), 40000);
}

(async () => {
  const slow = parseFloat(arg('slow', '0.15'));
  const only = arg('only', null);
  const port = parseInt(arg('port', '8940'), 10);
  const outDir = arg('out', path.join(ROOT, 'dist', 'playtest', 'autopsy'));
  fs.mkdirSync(outDir, { recursive: true });

  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).slice(0,140)));
  await page.addInitScript(SAMPLER);
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:120000 });

  // wait out the loader, then take the real two-screen route to a match
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } });
  for (let i = 0; i < 120 && (await gs()) !== 'menu'; i++) await sleep(500);
  await page.evaluate(() => { window.MATCH_SETUP = { p1Name:'BANNON', p2Name:'VIPER', p1Control:'YOU', p2Control:'CPU' }; });
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  await sleep(4000);
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 80 && (await gs()) !== 'fight'; i++) await sleep(500);
  await sleep(14000);                                    // entrance + let the GLBs bind

  // force the cheapest tier so the frame rate is as high as this box can manage, and slow the clock
  await page.evaluate((s) => {
    try{ window.BANNON_PERF && window.BANNON_PERF.setTier && window.BANNON_PERF.setTier(4); }catch(e){}
    try{ window.BANNON_PERF_AUTO = false; }catch(e){}
    try{ new Function('return TUNE')().timeScale = s; }catch(e){}
  }, slow);
  await sleep(1500);

  const shot = async (n) => { try{ await page.screenshot({ path: path.join(outDir, n + '.png') }); }catch(e){} };

  const runMove = async (label, driver, ms) => {
    await page.evaluate(l => { const A = window.__A; A.rec = []; A.on = true; A.label = l; A.poseCalls = 0; A.clipSeen = false; }, label);
    await driver();
    const shots = Math.min(6, Math.max(3, Math.round(ms / 900)));
    for (let i = 0; i < shots; i++){ await sleep(Math.round(ms / shots)); await shot(label + '_' + i); }
    return await page.evaluate(() => {
      const A = window.__A; A.on = false;
      const R = A.rec.filter(s => s.handR && s.hips);
      if (!R.length) return { samples: 0 };
      const d3 = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
      const path3 = (k) => { let s = 0; for (let i = 1; i < R.length; i++) if (R[i][k] && R[i-1][k]) s += d3(R[i][k], R[i-1][k]); return s; };
      const span = (k) => { let m = 0; for (let i = 0; i < R.length; i++) for (let j = i+1; j < R.length; j++)
                              if (R[i][k] && R[j][k]) m = Math.max(m, d3(R[i][k], R[j][k])); return m; };
      // reach = hand distance from its own shoulder; a punch EXTENDS, a flail does not
      let reachMin = 1e9, reachMax = 0, reachAtMax = 0, iMax = 0;
      R.forEach((s, i) => { if (!s.handR || !s.shR) return; const d = d3(s.handR, s.shR);
        if (d < reachMin) reachMin = d; if (d > reachMax){ reachMax = d; iMax = i; } });
      // kinetic chain: did the hips peak BEFORE the hand?
      let hipPeak = 0, hipI = 0;
      R.forEach((s, i) => { if (!s.hips) return; const d = d3(s.hips, R[0].hips); if (d > hipPeak){ hipPeak = d; hipI = i; } });
      const footSlip = Math.max(span('ftL'), span('ftR'));
      return {
        samples: R.length, durationMs: R[R.length-1].t - R[0].t,
        states: R.reduce((a,s) => { a[s.state] = (a[s.state]||0)+1; return a; }, {}),
        clip: R.map(s => s.clip).find(Boolean) || null, poseCalls: A.poseCalls,
        handRTravel: +path3('handR').toFixed(3), handRSpan: +span('handR').toFixed(3),
        handLTravel: +path3('handL').toFixed(3),
        elbowRTravel: +path3('elbowR').toFixed(3),
        hipsTravel: +path3('hips').toFixed(3), hipsSpan: +span('hips').toFixed(3),
        reachMin: +reachMin.toFixed(3), reachMax: +reachMax.toFixed(3),
        extension: +(reachMax - reachMin).toFixed(3),
        hipsPeakedAtFrame: hipI, handPeakedAtFrame: iMax, framesHipLedHand: iMax - hipI,
        footSlip: +footSlip.toFixed(3),
        rootMoved: +Math.hypot(R[R.length-1].root[0]-R[0].root[0], R[R.length-1].root[1]-R[0].root[1]).toFixed(3)
      };
    });
  };

  const key = async (k, hold) => {
    await page.evaluate(x => window.dispatchEvent(new KeyboardEvent('keydown',{key:x,bubbles:true})), k);
    if (hold) await sleep(hold);
    await page.evaluate(x => window.dispatchEvent(new KeyboardEvent('keyup',{key:x,bubbles:true})), k);
  };
  const closeIn = () => page.evaluate(() => { try{ const F = new Function('return fighters')();
    if (F && F[0] && F[1]){ F[1].x = F[0].x + 0.72; F[1].z = F[0].z; F[1].facing = F[0].facing + Math.PI; } }catch(e){} });

  const out = {};
  const want = n => !only || only === n;

  if (want('strike')){
    await closeIn();
    out.strike = await runMove('strike', async () => { await closeIn(); await key('j', 50); }, 5000);
  }
  if (want('heavy')){
    await closeIn();
    out.heavy = await runMove('heavy', async () => { await closeIn(); await key('k', 50); }, 5000);
  }
  if (want('kick')){
    await closeIn();
    out.kick = await runMove('kick', async () => { await closeIn(); await key('l', 50); }, 5000);
  }
  if (want('grapple')){
    await closeIn();
    out.grapple = await runMove('grapple', async () => { await closeIn(); await key('g', 60); }, 9000);
  }
  if (want('walk')){
    out.walk = await runMove('walk', async () => {
      await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})));
    }, 6000);
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
  }

  out.errs = errs.slice(0, 8);
  out.slow = slow;
  fs.writeFileSync(path.join(outDir, 'autopsy.json'), JSON.stringify(out, null, 1));

  console.log('\n===== ANIMATION AUTOPSY (game clock at ' + slow + 'x) =====');
  for (const k of ['strike','heavy','kick','grapple','walk']){
    const m = out[k]; if (!m) continue;
    if (!m.samples){ console.log(k.toUpperCase() + ': NO SAMPLES — the move never ran'); continue; }
    console.log('\n' + k.toUpperCase() + '  ' + m.samples + ' frames over ' + m.durationMs + 'ms   states ' + JSON.stringify(m.states));
    console.log('  clip        ' + (m.clip || 'NONE (procedural)') + '   poseCalls ' + m.poseCalls);
    console.log('  right hand  travels ' + m.handRTravel + 'm, straight-line span ' + m.handRSpan + 'm');
    console.log('  extension   reach ' + m.reachMin + ' -> ' + m.reachMax + '  (arm extends ' + m.extension + 'm)');
    console.log('  hips        travel ' + m.hipsTravel + 'm, span ' + m.hipsSpan + 'm');
    console.log('  chain       hips peak @f' + m.hipsPeakedAtFrame + ', hand peak @f' + m.handPeakedAtFrame +
                '  (hips led by ' + m.framesHipLedHand + ' frames)');
    console.log('  feet        slip ' + m.footSlip + 'm    root moved ' + m.rootMoved + 'm');
  }
  console.log('\nshots + json -> ' + outDir);
  if (errs.length) console.log('page errors: ' + errs.length);
  await ctx.close(); await browser.close(); srv.close();
})();
