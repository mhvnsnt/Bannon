#!/usr/bin/env node
/* pose_ledger.cjs — WHO WRITES THE VISIBLE SKELETON, AND DOES THE ANIMATION EVER REACH IT?
 *
 *   node tools/harness/pose_ledger.cjs             # boot -> menu -> select -> match, drive idle/walk/strike/grapple
 *   node tools/harness/pose_ledger.cjs --json
 *   node tools/harness/pose_ledger.cjs --secs 8    # seconds per driven motion class
 *
 * WHY THIS AND NOT THE PIPELINE THAT WAS DESCRIBED TO ME.
 * The brief named RigAnalyzer -> CharacterRuntime -> PoseBuffer/AnimationClipAdapter -> PoseBlender ->
 * Inertializer -> PhysicsAnimationBridge. MEASURED FIRST: six of those seven identifiers appear
 * ZERO times anywhere in this repository, and the seventh is a two-line cross-fade patch. Building
 * an autopsy against a pipeline that does not exist would have produced a confident report about
 * fiction. OWNER LAW: derive from the data. So the layers here are the ones the CODE actually has,
 * and the writer of every bone is identified by its SOURCE LINE, not by a name I chose.
 *
 * THE REAL PIPELINE, read out of updateFighterModel:
 *   1. PROCEDURAL RETARGET  every mapped bone is slerped 30-40% per frame toward an aim computed
 *                           from the PROCEDURAL rig's joint positions (worldJoint(from)->worldJoint(to)).
 *   2. ARM LEASH            arms pulled part-way back to rest when no clip owns them.
 *   3. CLIP BLOCK           mocap replaces the aim, but ONLY on the bones that clip drives.
 *   4. SECONDARY MOTION     soft/cloth/hair bones.
 *   5. FOOT IK, GRIP IK     contact solvers, after the pose.
 *
 * WHAT IS MEASURED, three questions, each with a number:
 *
 *   A. AUTHORITY CENSUS — of the bones that make up the visible body, how many are driven by the
 *      CLIP this frame and how many are chasing the procedural rig? If the answer is "mostly
 *      procedural", then the body is a puppet of the procedural skeleton BY CONSTRUCTION and no
 *      amount of better mocap can change what it looks like. Read off the engine's own
 *      `userData.__driven` stamp, not inferred.
 *
 *   B. THE LAG — the retarget writes `bone.quaternion.slerp(aim, 0.3..0.4)`. That is a first-order
 *      filter with NO dt term, so the bone reaches only a third of the way to its own target each
 *      frame and how fast it converges depends on the FRAME RATE. This measures the angle between
 *      where the bone IS and where its own aim says it should be, in degrees, per bone per frame.
 *      A body permanently tens of degrees behind its own target is a body that reads as rubber.
 *
 *   C. THE WRITE LEDGER — every write to a visible bone's rotation is counted and attributed to the
 *      SOURCE LINE that made it, via the stack. Two different lines writing the same bone in the
 *      same frame is two authorities fighting, which is the single-final-authority question asked
 *      concretely instead of architecturally.
 *
 * FRAME-RATE DEPENDENCE IS TESTED, NOT ASSUMED: the same drive runs with the rasteriser stubbed
 * (fast) and live (slow). If the lag moves with the frame rate, the missing dt is proven rather
 * than argued from reading the line.
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
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json','.jgz':'application/octet-stream' };

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i+1] ? process.argv[i+1] : d; };
const has = n => process.argv.indexOf('--' + n) > 0;
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
  window.__PL = {
    on: false, frame: 0, bucket: 'idle', pixels: true,
    // per bucket: { frames, lagSum, lagN, lagMax, clipBones, procBones, boneFrames, writes:{line:n}, multi:n }
    b: {}, wired: false, bones: 0, errs: [], fps: {}
  };
  const PL = window.__PL;
  function lex(n){ try{ return new Function('return typeof '+n+'!=="undefined"?'+n+':null')(); }catch(e){ return null; } }
  const B = () => PL.b[PL.bucket] || (PL.b[PL.bucket] = { frames:0, lagSum:0, lagN:0, lagMax:0, lagLimbSum:0, lagLimbN:0,
    clip:0, proc:0, boneFrames:0, writes:{}, multi:0, multiBones:{}, rafMs:0, rafN:0 });

  PL.setPixels = function(on){
    PL.pixels = !!on;
    try{ const R = lex('renderer'), C = lex('composer');
      [R, C].forEach(function(o){ if (!o || !o.render) return;
        if (on){ if (o.render.__stub && o.render.__orig) o.render = o.render.__orig; }
        else if (!o.render.__stub){ const orig = o.render.bind(o);
          const w = function(){}; w.__stub = 1; w.__orig = orig; o.render = w; } });
    }catch(e){}
  };

  // ---- B. THE LAG. The engine hands us the aim it is about to slerp toward. The angle between the
  // bone's CURRENT rotation and that aim is exactly how far behind its own target the visible bone
  // is sitting at the moment of the write.
  window.__PL_AIM = function(bone, aim, isLimb, f){
    if (!PL.on) return;
    try{
      var d = Math.abs(bone.quaternion.dot(aim));
      if (d > 1) d = 1;
      var deg = 2 * Math.acos(d) * 180 / Math.PI;    // full angle between the two orientations
      var b = B();
      b.lagSum += deg; b.lagN++; if (deg > b.lagMax) b.lagMax = deg;
      if (isLimb){ b.lagLimbSum += deg; b.lagLimbN++; }
    }catch(e){ if (PL.errs.length < 6) PL.errs.push('aim:' + String(e && e.message).slice(0,90)); }
  };

  // ---- C. THE WRITE LEDGER. three.js Quaternion carries a change callback (Object3D itself uses it
  // to flag a matrix update), so chaining it counts EVERY write to a bone's rotation with no polling
  // and no guesswork about who calls what. The writer is identified by the SOURCE LINE off the stack
  // — this game is one HTML file, so a line number IS an identity, and it cannot be wrong the way a
  // hand-written list of "layers" can be.
  function wire(){
    if (PL.wired) return true;
    const F = lex('fighters'); if (!F) return false;
    const p = F.find(f => f && f.isPlayer) || F[0];
    if (!p || !p.model) return false;
    const seen = {};
    let n = 0;
    p.model.traverse(function(o){
      if (!o.isBone || seen[o.uuid]) return;
      seen[o.uuid] = 1; n++;
      const q = o.quaternion;
      const prev = q._onChangeCallback;
      const name = o.name;
      q._onChange(function(){
        if (PL.on){
          try{
            // ATTRIBUTE TO A LINE IN THE GAME, NOT TO WHOEVER HAPPENED TO BE ON TOP OF THE STACK.
            // The first version took the first stack frame that was not this probe and every single
            // write in five motion classes came back as ONE key, `59:24` — a line inside the
            // vendored three.min.js, because Quaternion.slerp/copy fire the callback from in there.
            // A ledger where every writer is the same library function is not a clean result, it is
            // a broken instrument. Only frames that name the game FILE are writers; the deepest such
            // frame is the call site.
            const st = new Error().stack || '';
            const m = st.split('\n').find(function(L){ return L.indexOf('BANNON_v150.html:') > 0; });
            const key = m ? (m.match(/BANNON_v150\.html:(\d+):(\d+)/) || [,'?','?']).slice(1).join(':') : 'vendor';
            const b = B();
            b.writes[key] = (b.writes[key] || 0) + 1;
            const fk = name + '|' + PL.frame;
            if (!PL.__seenFrame) PL.__seenFrame = {};
            const rec = PL.__seenFrame[fk] || (PL.__seenFrame[fk] = {});
            rec[key] = 1;
            if (Object.keys(rec).length === 2){ b.multi++; b.multiBones[name] = (b.multiBones[name] || 0) + 1; }
          }catch(e){}
        }
        if (prev) prev.call(q);
      });
    });
    PL.bones = n; PL.wired = n > 0;
    return PL.wired;
  }
  PL.wire = wire;

  // ---- A. AUTHORITY CENSUS, once per frame, read off the engine's own __driven stamp.
  let last = 0;
  (function tick(){
    requestAnimationFrame(tick);
    const now = performance.now();
    if (!PL.on){ last = now; return; }
    try{
      if (!PL.wired) wire();
      const F = lex('fighters'); if (!F) return;
      const p = F.find(f => f && f.isPlayer) || F[0];
      if (!p || !p.model) return;
      const b = B();
      b.frames++;
      if (last){ b.rafMs += (now - last); b.rafN++; }
      const drv = p.model.userData.__driven || {};
      let clip = 0, tot = 0;
      const mapped = p.model.userData.mapped || [];
      for (let i = 0; i < mapped.length; i++){
        const mp = mapped[i]; if (!mp || !mp.bone) continue;
        tot++;
        if ((drv[mp.bone.uuid] || 0) > 0.5) clip++;
      }
      b.clip += clip; b.proc += (tot - clip); b.boneFrames += tot;
      PL.frame++;
      PL.__seenFrame = {};          // the multi-writer test is PER FRAME; reset the window
    }catch(e){ if (PL.errs.length < 6) PL.errs.push('tick:' + String(e && e.message).slice(0,90)); }
    last = now;
  })();

  PL.start = function(bucket){ PL.bucket = bucket; PL.on = true; };
  PL.stop  = function(){ PL.on = false; };
  setInterval(function(){
    try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.__plTier){
      window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; window.__plTier = 1; } }catch(e){}
    if (!PL.pixels) PL.setPixels(false);
  }, 300);
}

(async () => {
  const port = parseInt(arg('port', String(9600 + Math.floor(Math.random() * 300))), 10);
  const SECS = parseFloat(arg('secs', '6'));
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).split('\n')[0].slice(0, 160)));

  const report = { when: new Date().toISOString(), pageErrors, blockers: [] };
  const block = m => report.blockers.push(m);
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(() => null);
  const waitFor = async (pred, ms, what) => { const end = Date.now() + ms;
    while (Date.now() < end){ let ok = false; try{ ok = await pred(); }catch(e){} if (ok) return true; await sleep(300); }
    block('TIMEOUT: ' + what); return false; };
  const key = async (k, hold) => {
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown', { key: x, bubbles: true })), k);
    await sleep(hold || 40);
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup', { key: x, bubbles: true })), k);
  };

  try{
    await page.addInitScript(PROBE);
    await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
    if (await waitFor(async () => (await gs()) === 'menu', 120000, 'the menu')){
      await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
      await waitFor(() => page.evaluate(() => { const s = document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }), 20000, 'the select screen');
      await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
      await waitFor(async () => (await gs()) === 'fight', 40000, 'the match');
    }
    await page.evaluate(() => window.__PL.setPixels(false));
    const bound = await waitFor(() => page.evaluate(() => { try{ const F = new Function('return fighters')();
      const p = (F||[]).find(f => f && f.isPlayer) || (F||[])[0]; return !!(p && p.model); }catch(e){ return false; } }),
      45000, 'the player to bind a GLB');
    if (!bound) block('the player never bound a GLB — nothing about the visible skeleton can be measured');
    await sleep(1500);
    report.wired = await page.evaluate(() => window.__PL.wire());
    report.bones = await page.evaluate(() => window.__PL.bones);
    if (!report.wired) block('could not hook the bone rotations — the ledger would be empty, not clean');

    // FREEZE THE AI so a motion class is the motion class and not a live fight.
    await page.evaluate(() => { try{ const FP = new Function('return Fighter')();
      if (FP && FP.prototype.updateAI && !FP.prototype.updateAI.__plFreeze){
        const o = FP.prototype.updateAI;
        const w = function(){ if (!this.isPlayer) return; return o.apply(this, arguments); };
        w.__plFreeze = 1; FP.prototype.updateAI = w; } }catch(e){} });

    const run = async (bucket, drive, undrive) => {
      await page.evaluate(b => window.__PL.start(b), bucket);
      if (drive) await drive();
      await sleep(SECS * 1000);
      if (undrive) await undrive();
      await page.evaluate(() => window.__PL.stop());
      await sleep(300);
    };
    const holdKey = k => () => page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown', { key: x, bubbles: true })), k);
    const relKey  = k => () => page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup',   { key: x, bubbles: true })), k);
    const close = () => page.evaluate(() => { try{ const F = new Function('return fighters')().filter(Boolean);
      const p = F.find(f => f.isPlayer) || F[0], o = F.find(f => f !== p);
      if (p && o){ const d = p.dir || 1; p.x = -d*0.4; p.z = 0; o.x = d*0.4; o.z = 0;
        [p,o].forEach(f => { f.state='idle'; f.stateTime=0; f.grappling=false; f.grabTarget=null; f.grabbedBy=null; f.grappleStage=0; f.ragdoll=false; }); } }catch(e){} });

    await close();
    await run('idle');
    await run('walk', holdKey('d'), relKey('d'));
    await close(); await run('strike', async () => { await key('j'); await sleep(500); await key('k'); });
    await close(); await run('grapple', async () => { await key('g'); await sleep(700); await key('j'); });

    // FRAME-RATE DEPENDENCE. Same drive, rasteriser live. If the lag moves with the frame rate then
    // the missing dt in the retarget slerp is proven rather than read off the line.
    await close();
    await page.evaluate(() => window.__PL.setPixels(true));
    await sleep(1200);
    await run('walk_slowfps', holdKey('d'), relKey('d'));
    await page.evaluate(() => window.__PL.setPixels(false));

    report.ledger = await page.evaluate(() => ({ b: window.__PL.b, errs: window.__PL.errs, bones: window.__PL.bones }));
  }catch(e){
    block('HARNESS: ' + String(e && e.message).split('\n')[0].slice(0, 180));
  }

  try{ await browser.close(); }catch(e){}
  try{ srv.close(); }catch(e){}

  // ---- analysis
  const L = report.ledger && report.ledger.b || {};
  report.summary = {};
  for (const k in L){
    const b = L[k];
    report.summary[k] = {
      frames: b.frames,
      fps: b.rafN ? +(1000 / (b.rafMs / b.rafN)).toFixed(1) : 0,
      clipShare: b.boneFrames ? +(b.clip / b.boneFrames).toFixed(3) : 0,
      bonesPerFrame: b.frames ? +(b.boneFrames / b.frames).toFixed(1) : 0,
      lagMeanDeg: b.lagN ? +(b.lagSum / b.lagN).toFixed(2) : 0,
      lagLimbDeg: b.lagLimbN ? +(b.lagLimbSum / b.lagLimbN).toFixed(2) : 0,
      lagMaxDeg: +b.lagMax.toFixed(1),
      multiWriterBoneFrames: b.multi,
      topWriters: Object.keys(b.writes).sort((x, y) => b.writes[y] - b.writes[x]).slice(0, 6)
        .map(x => x + ' x' + b.writes[x]),
      topContested: Object.keys(b.multiBones || {}).sort((x, y) => b.multiBones[y] - b.multiBones[x]).slice(0, 6)
        .map(x => x + ' x' + b.multiBones[x])
    };
  }
  fs.writeFileSync(path.join(OUT, 'pose_ledger.json'), JSON.stringify(report, null, 1));
  if (has('json')){ console.log(JSON.stringify(report, null, 1)); process.exit(0); }

  console.log('\n===== POSE LEDGER =====');
  console.log('  bones hooked ' + (report.bones || 0) + '   page errors ' + pageErrors.length);
  if (report.blockers.length) console.log('  BLOCKERS: ' + report.blockers.join(' | '));
  console.log('');
  console.log('  motion         fps   clip-driven   bones/frame   lag mean   lag limb   lag max   contested');
  for (const k of Object.keys(report.summary)){
    const s = report.summary[k];
    console.log('  ' + k.padEnd(14) + String(s.fps).padStart(5) + '   ' +
      (Math.round(s.clipShare * 100) + '%').padStart(11) + '   ' +
      String(s.bonesPerFrame).padStart(11) + '   ' +
      (s.lagMeanDeg + '°').padStart(8) + '   ' + (s.lagLimbDeg + '°').padStart(8) + '   ' +
      (s.lagMaxDeg + '°').padStart(7) + '   ' + String(s.multiWriterBoneFrames).padStart(9));
  }
  console.log('\n  WRITERS (source line in BANNON_v150.html x writes):');
  for (const k of Object.keys(report.summary))
    console.log('    ' + k.padEnd(14) + (report.summary[k].topWriters.join('  ') || '—'));
  console.log('\n  BONES WRITTEN BY TWO DIFFERENT LINES IN ONE FRAME:');
  for (const k of Object.keys(report.summary))
    console.log('    ' + k.padEnd(14) + (report.summary[k].topContested.join('  ') || 'none'));
  if (report.ledger && report.ledger.errs && report.ledger.errs.length)
    console.log('\n  probe errors: ' + report.ledger.errs.join(' | '));
  console.log('\n  report -> ' + path.join(OUT, 'pose_ledger.json') + '\n');
  process.exit(0);
})();
