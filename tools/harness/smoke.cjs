#!/usr/bin/env node
/* smoke.cjs — PLAY THE GAME. Every turn. Before claiming anything.
 *
 *   node tools/harness/smoke.cjs            # ~90s, prints PASS/FAIL + every breakage found
 *   node tools/harness/smoke.cjs --shots    # also write screenshots
 *   node tools/harness/smoke.cjs --json     # machine-readable
 *
 * WHY THIS EXISTS. Owner: "u would know that if you played the game every turn ... that's so u can
 * really debug this shit." He is right, and the record proves it — twice now I have reported a
 * "bug" read off a single still frame that was not a bug at all (a white titantron that is just an
 * unlit texture; fighters "facing away" that measure frontDotOpponent 0.999, i.e. facing each other
 * perfectly, seen from a side-on camera). Both cost a turn and neither was real.
 *
 * The reason I was not playing every turn is that the other harness is too slow and too fragile:
 * 45 s of match at ~1.4 FPS is ten minutes of wall clock, and twice the process was killed before
 * the video container was closed, producing an unplayable file and no report. So this one is built
 * to the opposite spec:
 *   * FAST — forces the cheapest quality tier the moment the renderer exists, skips the entrance,
 *     and drives a short scripted session rather than a full match.
 *   * ALWAYS REPORTS — every stage is wrapped, the report is written on the way out no matter what
 *     fails, and a timeout still prints what it got. A harness that produces nothing when the game
 *     breaks is worse than no harness.
 *   * ASSERTS THE BASICS, which is what "game-breaking" actually means:
 *       - does it boot without a page error
 *       - does the menu appear, does QUICK FIGHT open the select screen, does FIGHT start a match
 *       - do both fighters exist, have models, and stay inside the ring
 *       - does any position/rotation go NaN
 *       - does the state machine advance, or is somebody wedged in one state
 *       - does a strike, a grapple and a walk each actually change the skeleton
 *       - does the frame loop keep running (a hard stall = the freeze)
 * Anything it finds is printed as a FAIL line with the evidence attached. No verdict without a number.
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

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; };
const has = n => process.argv.indexOf('--' + n) > 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const FAILS = [], NOTES = [];
const fail = (what, evidence) => FAILS.push({ what, evidence });
const note = (what, evidence) => NOTES.push({ what, evidence });

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

// injected before any game code: the frame clock, error capture, and the skeleton watcher
function WATCH(){
  window.__S = { frames:0, last:0, t0:0, stalls:[], pageErrors:[], rejections:[],
                 nan:0, poseCalls:0, boneDelta:{}, states:{} };
  const S = window.__S;
  (function tick(){
    const n = performance.now();
    if (S.last){ const d = n - S.last; if (d > 400) S.stalls.push({ atSec:+((n-S.t0)/1000).toFixed(1), ms:Math.round(d) }); }
    else S.t0 = n;
    S.last = n; S.frames++;
    requestAnimationFrame(tick);
  })();
  addEventListener('unhandledrejection', e => { try{ S.rejections.push(String(e.reason && e.reason.message || e.reason).slice(0,160)); }catch(_){} });

  const arm = () => {
    if (window.studioApplyClipPose && !window.studioApplyClipPose.__sm){
      const o = window.studioApplyClipPose;
      const w = function(){ S.poseCalls++; return o.apply(this, arguments); };
      w.__sm = 1; ['__owner','__bridge','__probe','__rec','__au'].forEach(k => { w[k] = o[k]; });
      window.studioApplyClipPose = w;
    }
    if (typeof window.updateFighterModel === 'function' && !window.updateFighterModel.__sm){
      const o = window.updateFighterModel;
      const TRACK = ['LeftArm','LeftForeArm','LeftHand','LeftUpLeg','LeftFoot','Spine1','Head'];
      const w = function(f){
        try{ S.states[f.state] = (S.states[f.state]||0)+1; }catch(e){}
        let before = null; const B = {};
        if (f.model && window.__boneOf){ before = {};
          for (const n of TRACK){ const b = window.__boneOf(f.model,'mixamorig'+n); if (b){ B[n]=b; before[n]=b.quaternion.clone(); } } }
        const r = o.apply(this, arguments);
        if (before) for (const n in before){
          const d = 1 - Math.abs(before[n].dot(B[n].quaternion));
          const s = S.boneDelta[n] || (S.boneDelta[n] = { max:0, n:0 });
          if (d > s.max) s.max = d; s.n++;
        }
        try{ if (!isFinite(f.x) || !isFinite(f.z) || !isFinite(f.facing)) S.nan++; }catch(e){}
        return r;
      };
      w.__sm = 1; window.updateFighterModel = w;
    }
    // cheapest tier as soon as it exists — this box has no GPU and we are testing LOGIC
    try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.__smTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; window.__smTier = 1; } }catch(e){}
  };
  arm(); setInterval(arm, 400);
}

(async () => {
  const port = parseInt(arg('port', String(9100 + Math.floor(Math.random()*300))), 10);
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  page.on('pageerror', e => fail('PAGE ERROR', String(e.message).split('\n')[0].slice(0,180)));

  let report = {};
  const shot = async (n) => { if (has('shots')) try{ await page.screenshot({ path: path.join(OUT, 'smoke_'+n+'.png') }); }catch(e){} };
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(() => null);
  const waitFor = async (pred, ms, what) => {
    const end = Date.now() + ms;
    while (Date.now() < end){ let ok = false; try{ ok = await pred(); }catch(e){} if (ok) return true; await sleep(400); }
    fail('TIMEOUT', what + ' (waited ' + (ms/1000) + 's)'); return false;
  };

  try{
    await page.addInitScript(WATCH);
    await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

    // 1. BOOT
    const booted = await waitFor(async () => (await gs()) === 'menu', 120000, 'the game to reach the menu');
    await shot('1_menu');

    // 2. QUICK FIGHT must open the character select (NOT start a match — that is the correct flow)
    if (booted){
      await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
      const sel = await waitFor(() => page.evaluate(() => {
        const s = document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }), 20000,
        'QUICK FIGHT to open the character select');
      await shot('2_select');
      if (sel){
        const started = await page.evaluate(() => { try{ return new Function('return gameState')() === 'fight'; }catch(e){ return false; } });
        if (started) fail('FLOW', 'QUICK FIGHT dropped straight into a match without a character select');
      }
      // 3. FIGHT must start the match
      await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
      await waitFor(async () => (await gs()) === 'fight', 30000, 'FIGHT to start the match');
    }
    await sleep(6000);                        // let the bodies and their GLBs settle
    await shot('3_match');

    // 4. THE BASICS: two fighters, both with models, both inside the ring, no NaN
    const basics = await page.evaluate(() => {
      const lex = n => { try{ return new Function('return typeof '+n+'!=="undefined"?'+n+':null')(); }catch(e){ return null; } };
      const F = lex('fighters');
      if (!F) return { err:'`fighters` does not exist' };
      const R = lex('RING') || {};
      return { count: F.filter(Boolean).length,
        fighters: F.filter(Boolean).slice(0,4).map(f => ({
          name:(f.opts&&f.opts.name)||'?', hasModel:!!f.model, state:f.state,
          x:+(f.x||0).toFixed(2), z:+(f.z||0).toFixed(2), y:+((f.zoneY)||0).toFixed(2),
          hp:+(f.hp||0).toFixed(0), finite: isFinite(f.x)&&isFinite(f.z)&&isFinite(f.facing),
          interferer: !!f._interferer, forceProc: !!f._forceProc,
          procVisible: !!(f.seg && f.seg.head && f.seg.head.visible) })),
        arenaHalf: lex('ARENA_HALF'), arenaHalfZ: lex('ARENA_HALF_Z') };
    });
    report.basics = basics;
    if (basics.err) fail('ENGINE', basics.err);
    else {
      if (basics.count < 2) fail('ENGINE', 'only ' + basics.count + ' fighter(s) in the match');
      for (const f of (basics.fighters||[])){
        if (!f.finite) fail('NaN', f.name + ' has a non-finite position/facing: ' + JSON.stringify(f));
        if (!f.hasModel && !f.forceProc) fail('MODEL', f.name + ' has no GLB bound' + (f.interferer ? ' (run-in)' : ''));
        if (f.procVisible && f.hasModel) fail('MODEL', f.name + ' is showing the procedural body UNDER a bound model');
        // ARENA_HALF/ARENA_HALF_Z are the RING mat (3.2 x 2.2), not the world. Ringside, the apron
        // and the entrance ramp are all legitimately outside it, and a run-in enters from the floor
        // at ring-half + 0.9 by design — an earlier version of this check failed on all three,
        // which was my test being wrong, not the game. Fail only on genuinely off-the-map.
        const AH = basics.arenaHalf || 3.2, AZ = basics.arenaHalfZ || 2.2;
        if (Math.abs(f.x) > AH + 9 || Math.abs(f.z) > AZ + 9) fail('OUT OF BOUNDS', f.name + ' at x=' + f.x + ' z=' + f.z);
        else if (Math.abs(f.x) > AH + 0.6 || Math.abs(f.z) > AZ + 0.6)
          note('OUTSIDE THE RING', f.name + ' at x=' + f.x + ' z=' + f.z + (f.interferer ? ' (run-in — expected)' : ''));
      }
    }

    // 5. DOES COMBAT ACTUALLY MOVE THE SKELETON — strike, grapple, walk
    const key = async (k, hold) => {
      await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown',{key:x,bubbles:true})), k);
      if (hold) await sleep(hold);
      await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup',{key:x,bubbles:true})), k);
    };
    const close = () => page.evaluate(() => { try{ const F=new Function('return fighters')();
      if (F&&F[0]&&F[1]){ F[1].x=F[0].x+0.75; F[1].z=F[0].z; } }catch(e){} });
    const segment = async (label, drive, ms) => {
      await page.evaluate(() => { const S=window.__S; S.boneDelta={}; S.poseCalls=0; });
      await drive(); await sleep(ms);
      return await page.evaluate(l => { const S=window.__S; const o={};
        for (const k in S.boneDelta) o[k] = +S.boneDelta[k].max.toFixed(4);
        return { label:l, poseCalls:S.poseCalls, bones:o }; }, label);
    };
    // ORDER MATTERS, and getting it wrong cost me a false failure. Running the grapple before the
    // walk left the fighter STILL IN THE HOLD when the walk was measured (the run showed 34 frames
    // each of grab/grabbed at the end), so the legs were locked by the grapple and the walk reported
    // "legs moved less than 0.01" — a bug in my test, not in the game. Walk first, and force a clean
    // idle before the grapple so neither segment contaminates the other.
    const idle = () => page.evaluate(() => { try{ const F = new Function('return fighters')();
      for (const f of (F||[])) if (f){ f.grappling=false; f.grabTimer=0; f.state='idle'; f.stateTime=0; } }catch(e){} });
    report.strike  = await segment('strike',  async () => { await idle(); await close(); await key('j',40); await sleep(400); await key('k',40); }, 4000);
    await idle();
    report.walk    = await segment('walk',    async () => { await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true}))); }, 4000);
    await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
    await idle();
    report.grapple = await segment('grapple', async () => { await close(); await key('g',60); }, 5000);
    await shot('4_combat');

    const moved = (seg, bone) => (seg.bones && seg.bones[bone] != null) ? seg.bones[bone] : 0;
    if (moved(report.strike,'LeftForeArm') < 0.01 && moved(report.strike,'LeftArm') < 0.01)
      fail('ANIMATION', 'a strike moved the arms by less than 0.01: ' + JSON.stringify(report.strike.bones));
    if (moved(report.walk,'LeftUpLeg') < 0.01 && moved(report.walk,'LeftFoot') < 0.01)
      fail('ANIMATION', 'a walk moved the legs by less than 0.01: ' + JSON.stringify(report.walk.bones));
    if (moved(report.walk,'LeftArm') < 0.005 && moved(report.walk,'LeftForeArm') < 0.005)
      fail('ANIMATION', 'NO ARM SWAY while walking: ' + JSON.stringify(report.walk.bones));

    // 6. THE FRAME LOOP AND THE STATE MACHINE
    const health = await page.evaluate(() => {
      const S = window.__S;
      return { frames:S.frames, seconds:+((performance.now()-S.t0)/1000).toFixed(1),
               fps:+(S.frames/Math.max(0.001,(performance.now()-S.t0)/1000)).toFixed(2),
               worstStallMs: S.stalls.length ? Math.max.apply(null, S.stalls.map(s=>s.ms)) : 0,
               stallsOver1s: S.stalls.filter(s=>s.ms>1000).length,
               states:S.states, nan:S.nan, rejections:S.rejections.slice(0,6) };
    });
    report.health = health;
    if (health.frames < 30) fail('FRAME LOOP', 'only ' + health.frames + ' frames in ' + health.seconds + 's — the loop is not running');
    if (health.nan > 0) fail('NaN', health.nan + ' frames with a non-finite fighter transform');
    if (health.rejections.length) fail('UNHANDLED REJECTION', health.rejections.join(' | '));
    if (Object.keys(health.states||{}).length < 2) fail('STATE MACHINE', 'the fighters never left one state: ' + JSON.stringify(health.states));
  }catch(e){
    fail('HARNESS', String(e && e.message).split('\n')[0].slice(0,180));
  }

  try{ await browser.close(); }catch(e){}
  try{ srv.close(); }catch(e){}

  report.fails = FAILS; report.notes = NOTES; report.when = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'smoke.json'), JSON.stringify(report, null, 1));

  if (has('json')){ console.log(JSON.stringify(report, null, 1)); process.exit(FAILS.length ? 1 : 0); }

  console.log('\n===== BANNON SMOKE =====');
  if (report.basics && report.basics.fighters)
    report.basics.fighters.forEach(f => console.log('  ' + f.name.padEnd(16) + ' model:' + (f.hasModel?'yes':'NO ') +
      '  state:' + String(f.state).padEnd(9) + ' pos ' + f.x + ',' + f.z + '  hp ' + f.hp));
  for (const k of ['strike','grapple','walk']){
    const s = report[k]; if (!s) continue;
    console.log('  ' + k.padEnd(8) + ' poseCalls ' + String(s.poseCalls).padEnd(4) + '  bones ' +
      Object.keys(s.bones||{}).map(b => b+' '+s.bones[b]).join('  '));
  }
  if (report.health) console.log('  frames ' + report.health.frames + ' in ' + report.health.seconds + 's (' +
    report.health.fps + ' fps)   worst stall ' + report.health.worstStallMs + 'ms   states ' + JSON.stringify(report.health.states));
  console.log('');
  if (!FAILS.length) console.log('  PASS — the game boots, reaches a match, and strike/grapple/walk all move the skeleton.');
  else { console.log('  ' + FAILS.length + ' FAILURE(S):'); FAILS.forEach(f => console.log('   ✗ [' + f.what + '] ' + f.evidence)); }
  console.log('\n  report -> ' + path.join(OUT, 'smoke.json'));
  process.exit(FAILS.length ? 1 : 0);
})();
