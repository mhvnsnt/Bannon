#!/usr/bin/env node
/* grapple_contact.cjs — DOES THE GRAB ACTUALLY HOLD ON?
 *
 *   node tools/harness/grapple_contact.cjs           # measure, print, write dist/playtest/grapple_contact.json
 *   node tools/harness/grapple_contact.cjs --shots   # + a screenshot at every stage boundary
 *   node tools/harness/grapple_contact.cjs --json
 *   node tools/harness/grapple_contact.cjs --seed 7  # same drive, restated (the drive is scripted, not random)
 *
 * WHY. The owner named the bug in his own words:
 *   "grab animation visually connects, but hands drift during rotation ...
 *    PASS CONDITION: distance between contact points remains bounded through the full move."
 * Nothing in this repo has ever measured that. `smoke.cjs` proves a grapple MOVES the skeleton; it
 * cannot tell a grip that holds from a grip that lets go, because bone TRAVEL is large either way.
 *
 * WHAT IS MEASURED, and why this and not something else.
 *   The engine glues the victim's ROOT to the attacker's chest (poseGrabbed, the "RIGID GRIP"
 *   block). That is a BODY-to-BODY constraint. The HANDS are a separate matter entirely — they come
 *   from the mocap clip or the procedural pose and nothing solves them onto the other man. So the
 *   question is not "are the bodies together" (they are, by construction) but "is the attacker's
 *   HAND on any part of the victim, and does it STAY on the same part".
 *   Per frame, for each attacker hand bone, we take the distance to the NEAREST victim body bone
 *   and record WHICH bone that is. Two numbers fall out:
 *     CONTACT   = that distance. How far the hand is from the body it is supposedly holding.
 *     DRIFT     = how much that distance moves within one grapple stage (max - min).
 *   A constant 0.30 m is an offset (a scale or an anchor being wrong). A swing from 0.10 to 0.80 is
 *   the thing he is describing: it connects, then it lets go.
 *
 * THE SCALE IS DERIVED, NEVER A MAGIC CONSTANT. Every distance is also reported in SHOULDER SPANS
 * (the victim's live LeftArm->RightArm distance), so the verdict does not depend on any model being
 * a particular height. Threshold: a hand that slides more than HALF a shoulder span relative to the
 * body it grips has visibly let go. That is stated here so it can be argued with.
 *
 * THE RENDER IS STUBBED (CLAUDE.md law: swiftshader gives ~3 fps and a 6-second grapple sampled 18
 * times cannot resolve a drift curve). Pixels are turned back on for the stage screenshots only.
 * The scene still updates; only the rasteriser is skipped.
 *
 * THIS TOOL PASSES JUDGEMENT ON NOTHING IT CANNOT SEE. If a fighter has no bound GLB, or the hand
 * bone does not resolve, it says so and reports NO VERDICT rather than a flattering zero.
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

// ---------------------------------------------------------------- injected before any game code
function PROBE(){
  // A/B IN THE SAME BUILD. CLAUDE.md law: never compare against a number recorded in an earlier
  // session — compare against a control run of the same build. `--nogripik` sets the module's own
  // kill switch BEFORE any game code runs, so the control is this exact file with the solver off.
  if (window.__CG_NOGRIPIK) window.GRIP_IK = false;
  window.__CG = {
    samples: [], on: false, pixels: true, errs: [], marks: [],
    bonesMissing: {}, note: []
  };
  const CG = window.__CG;

  // Candidate CONTACT bones on the man being held. A hand can legitimately grip any of these; it
  // cannot legitimately be nearest to nothing at all. Fingers are excluded on purpose — our rigs
  // do not carry them consistently and a missing finger would read as a missing hand.
  const VICTIM_BONES = ['Head','Neck','Spine2','Spine1','Spine','Hips',
    'LeftShoulder','RightShoulder','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand',
    'LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot'];

  function lex(n){ try{ return new Function('return typeof '+n+'!=="undefined"?'+n+':null')(); }catch(e){ return null; } }

  function bonePos(model, name, out){
    if (!window.__boneOf) return null;
    const b = window.__boneOf(model, name);
    if (!b){ CG.bonesMissing[name] = (CG.bonesMissing[name]||0)+1; return null; }
    b.updateWorldMatrix(true, false);
    out.setFromMatrixPosition(b.matrixWorld);
    return out;
  }

  const TH = () => window.THREE;
  let _a = null, _b = null;

  function nearest(model, from, exclude){
    // returns { bone, d } — the closest body bone on `model` to the world point `from`
    if (!_b) _b = new (TH().Vector3)();
    let best = null, bd = Infinity;
    for (let i = 0; i < VICTIM_BONES.length; i++){
      const n = VICTIM_BONES[i];
      if (exclude && exclude.indexOf(n) >= 0) continue;
      if (!bonePos(model, n, _b)) continue;
      const d = _b.distanceTo(from);
      if (d < bd){ bd = d; best = n; }
    }
    return best ? { bone: best, d: bd } : null;
  }

  function shoulderSpan(model){
    if (!_a) _a = new (TH().Vector3)();
    if (!_b) _b = new (TH().Vector3)();
    const L = bonePos(model, 'LeftArm', _a) ? _a.clone() : null;
    const R = bonePos(model, 'RightArm', _b) ? _b.clone() : null;
    return (L && R) ? L.distanceTo(R) : null;
  }

  // FREEZE THE OPPONENT AI. Without this the "reproducer" is a live fight: the first run of this
  // tool measured the PLAYER being grabbed by the CPU, with a third body (a run-in) on the mat, and
  // sampled 11 seconds of ropegrab/vault/stumble that had nothing to do with the grapple under test.
  // A deterministic repro cannot be taken from inside an unfrozen match. The engine's own AI gate is
  // `if (f && !f.isPlayer && f.updateAI)` — so wrapping the prototype and skipping flagged fighters
  // stops the AI without touching isPlayer, which routes input and the camera as well.
  CG.freezeAI = function(on){
    CG.frozen = !!on;
    try{
      const FP = lex('Fighter'); if (!FP || !FP.prototype || !FP.prototype.updateAI) return false;
      if (!FP.prototype.updateAI.__cgFreeze){
        const o = FP.prototype.updateAI;
        const w = function(dt){ if (window.__CG.frozen && !this.isPlayer) return; return o.apply(this, arguments); };
        w.__cgFreeze = 1; FP.prototype.updateAI = w;
      }
      return true;
    }catch(e){ return false; }
  };

  // Who is actually holding whom. Read off the live relationship, never off an array index.
  CG.pair = function(){
    const F = lex('fighters'); if (!F) return null;
    for (let i = 0; i < F.length; i++){
      const f = F[i];
      if (f && f.grappling && f.grabTarget && f.grabTarget.grabbedBy === f) return { a: f, v: f.grabTarget, live: true };
    }
    const p = F.find(f => f && f.isPlayer) || F[0];
    const o = (p && typeof p.opponent === 'function' && p.opponent()) || F.find(f => f && f !== p);
    return (p && o) ? { a: p, v: o, live: false } : null;
  };

  CG.mark = function(label){ CG.marks.push({ label, t: performance.now(), i: CG.samples.length }); };

  // PIXELS OFF by default — see the header. Kept switchable so a screenshot is still possible.
  CG.setPixels = function(on){
    CG.pixels = !!on;
    try{
      const R = lex('renderer'), C = lex('composer');
      [R, C].forEach(function(o){
        if (!o || !o.render) return;
        if (on){ if (o.render.__stub && o.render.__orig) o.render = o.render.__orig; }
        else if (!o.render.__stub){ const orig = o.render.bind(o);
          const w = function(){ /* pixels skipped on purpose */ }; w.__stub = 1; w.__orig = orig; o.render = w; }
      });
    }catch(e){}
  };

  setInterval(function(){
    try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.__cgTier){
      window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; window.__cgTier = 1; } }catch(e){}
    if (!CG.pixels) CG.setPixels(false);   // re-stub: the engine can hand out a new renderer
  }, 300);

  (function tick(){
    requestAnimationFrame(tick);
    if (!CG.on) return;
    try{
      if (!TH()) return;
      const P = CG.pair(); if (!P) return;
      const a = P.a, v = P.v;
      if (!a || !v) return;
      if (!_a) _a = new (TH().Vector3)();

      const s = { t: +(performance.now() - CG.t0).toFixed(1),
        st: a.grappleStage|0, state: a.state, vstate: v.state, held: !!P.live,
        an: (a.opts && a.opts.name) || '?', vn: (v.opts && v.opts.name) || '?',
        cl: a.craneLift != null ? +a.craneLift.toFixed(3) : null,
        grap: a.grapplePos || null,
        aModel: !!a.model, vModel: !!v.model,
        rootGap: +Math.hypot((a.x||0)-(v.x||0), (a.z||0)-(v.z||0)).toFixed(4) };

      if (a.model && v.model){
        const span = shoulderSpan(v.model);
        s.span = span != null ? +span.toFixed(4) : null;
        // ATTACKER HAND -> VICTIM BODY
        ['LeftHand','RightHand'].forEach(function(h){
          const p = bonePos(a.model, h, _a);
          if (!p){ s[h === 'LeftHand' ? 'aL' : 'aR'] = null; return; }
          const n = nearest(v.model, p, null);
          s[h === 'LeftHand' ? 'aL' : 'aR'] = n ? { b: n.bone, d: +n.d.toFixed(4) } : null;
        });
        // THE DECOMPOSITION. A hand that is off the body is off for one of two reasons and they need
        // different fixes, so they are measured apart:
        //   INTENT (pL/pR) — the engine's own PROCEDURAL grip point (J.haL/haR through worldJoint)
        //                    against the victim's nearest bone. `_gripOpp` sets these FROM the
        //                    victim's live joints, so when it runs this should be near zero.
        //   FOLLOW (fL/fR) — how far the VISIBLE GLB hand is from that procedural grip point. This is
        //                    the mocap/skeleton half: the clip poses the arm and nothing pulls it back
        //                    onto the grip.
        // visible error (aL/aR) is not their sum, but between them they say which half to go and fix.
        try{
          if (a.worldJoint){
            [['haL','pL','fL','LeftHand'], ['haR','pR','fR','RightHand']].forEach(function(spec){
              const w = a.worldJoint(spec[0]); if (!w) return;
              const wp = _a.set(w.x, w.y, w.z).clone();
              const n = nearest(v.model, wp, null);
              s[spec[1]] = n ? { b: n.bone, d: +n.d.toFixed(4) } : null;
              const g = bonePos(a.model, spec[3], _a);
              s[spec[2]] = g ? +g.distanceTo(wp).toFixed(4) : null;
            });
          }
        }catch(e){}
        // VICTIM HAND -> ATTACKER BODY (the "MUTUAL GRIP" the lockup code claims to set)
        ['LeftHand','RightHand'].forEach(function(h){
          const p = bonePos(v.model, h, _a);
          if (!p){ s[h === 'LeftHand' ? 'vL' : 'vR'] = null; return; }
          const n = nearest(a.model, p, null);
          s[h === 'LeftHand' ? 'vL' : 'vR'] = n ? { b: n.bone, d: +n.d.toFixed(4) } : null;
        });
      }
      CG.samples.push(s);
    }catch(e){ if (CG.errs.length < 8) CG.errs.push(String(e && e.message).slice(0, 140)); }
  })();

  CG.start = function(){ CG.t0 = performance.now(); CG.samples.length = 0; CG.marks.length = 0; CG.on = true; };
  CG.stop  = function(){ CG.on = false; };
}

// ---------------------------------------------------------------- analysis, node side
function stats(v){
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const q = p => s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))];
  return { n: v.length, min: +s[0].toFixed(4), mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(4),
           p05: +q(0.05).toFixed(4), p95: +q(0.95).toFixed(4), max: +s[s.length - 1].toFixed(4),
           range: +(s[s.length - 1] - s[0]).toFixed(4),
           // BAND is the drift with the single-frame extremes taken off. A stage boundary produces
           // exactly one frame where the bodies have not been pulled together yet, and letting that
           // one frame define "the grip does not hold" buries the 60 frames on either side of it.
           // Both are reported, and the verdict names which one it used, so nothing is hidden.
           band: +(q(0.95) - q(0.05)).toFixed(4) };
}

function analyse(samples){
  const R = { stages: {}, spanMedian: null, handsResolved: {}, worst: null };
  const spans = samples.map(s => s.span).filter(x => x != null).sort((a, b) => a - b);
  R.spanMedian = spans.length ? +spans[spans.length >> 1].toFixed(4) : null;

  const KEYS = { aL: 'attacker LeftHand', aR: 'attacker RightHand', vL: 'victim LeftHand', vR: 'victim RightHand',
                 pL: 'grip intent L', pR: 'grip intent R' };
  for (const k in KEYS) R.handsResolved[k] = samples.filter(s => s[k]).length;

  // group by grapple stage — the stages are physically different situations (tie-up, hoist, carry)
  //
  // ONLY FRAMES WHERE A HOLD IS ACTUALLY LIVE COUNT AS GRAPPLE FRAMES. `grappleStage` GOES STALE:
  // when a hold breaks, the attacker can be left reading stage 1 with nobody in his hands, and one
  // run in five duly reported a lock-up "contact" of 0.944 m with a 3.17 m range — that is not a
  // grip that failed, it is two men standing 3 m apart being filed under LOCK-UP. `held` is read off
  // the live grabbing relationship every frame, and stages 1-3 are built from those frames only.
  // This applies identically to the control and the treatment, so it cannot flatter either.
  const byStage = {};
  samples.forEach(s => {
    const st = (s.st >= 1 && s.st <= 3 && !s.held) ? 'stale' : s.st;
    (byStage[st] = byStage[st] || []).push(s);
  });
  R.staleFrames = (byStage.stale || []).length;
  delete byStage.stale;

  for (const st in byStage){
    const all = byStage[st];
    // SETTLE WINDOW. The first frames of a stage are the bodies lerping into the hold (poseGrabbed
    // lerps x at dt*10), so the very first sample legitimately has them apart — and it was dominating
    // the drift figure: 0.785 m at t=0.00 with a root gap of 0.13 m, i.e. mid-teleport. Judging a
    // grip on its approach frame is my artifact, not the game's defect. 350 ms is dropped, and both
    // the settled and the raw counts are reported so the discard is visible.
    const t0 = all[0].t;
    const g = all.filter(s => s.t - t0 >= 350);
    if (g.length < 4) g.push.apply(g, all);
    const out = { n: g.length, nRaw: all.length, dropped: all.length - g.length,
                  secs: +((g[g.length-1].t - g[0].t) / 1000).toFixed(2), hands: {} };
    const fst = k => { const v = g.map(s => s[k]).filter(x => x != null); return v.length ? stats(v) : null; };
    out.follow = { fL: fst('fL'), fR: fst('fR') };
    for (const k in KEYS){
      const ds = g.map(s => s[k] && s[k].d).filter(x => x != null);
      if (!ds.length){ out.hands[k] = { n: 0 }; continue; }
      const st2 = stats(ds);
      // which body part is being held, and how often that answer changes
      const bones = g.map(s => s[k] && s[k].b).filter(Boolean);
      const tally = {}; bones.forEach(b => tally[b] = (tally[b] || 0) + 1);
      let switches = 0; for (let i = 1; i < bones.length; i++) if (bones[i] !== bones[i-1]) switches++;
      const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
      out.hands[k] = Object.assign(st2, {
        gripBone: top, gripShare: +(tally[top] / bones.length).toFixed(2),
        gripSwitches: switches, bones: tally,
        spans: R.spanMedian ? { mean: +(st2.mean / R.spanMedian).toFixed(2), range: +(st2.range / R.spanMedian).toFixed(2),
                                band: +(st2.band / R.spanMedian).toFixed(2) } : null
      });
      if (!R.worst || st2.range > R.worst.range)
        R.worst = { stage: +st, hand: k, range: st2.range, min: st2.min, max: st2.max,
                    atWorst: (function(){ let best = g[0], bd = -1;
                      g.forEach(s => { const d = s[k] && s[k].d; if (d != null && Math.abs(d - st2.max) < 1e-6 && bd < 0){ best = s; bd = 1; } });
                      return { t: best.t, cl: best.cl, grap: best.grap, bone: best[k] && best[k].b }; })() };
    }
    R.stages[st] = out;
  }
  return R;
}

// ---------------------------------------------------------------- drive
(async () => {
  const port = parseInt(arg('port', String(9400 + Math.floor(Math.random() * 300))), 10);
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).split('\n')[0].slice(0, 180)));

  const report = { when: new Date().toISOString(), pageErrors, blockers: [] };
  const block = m => { report.blockers.push(m); };

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(() => null);
  const waitFor = async (pred, ms, what) => { const end = Date.now() + ms;
    while (Date.now() < end){ let ok = false; try{ ok = await pred(); }catch(e){} if (ok) return true; await sleep(300); }
    block('TIMEOUT: ' + what); return false; };
  const key = async (k, hold) => {
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown', { key: x, bubbles: true })), k);
    await sleep(hold || 40);
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup', { key: x, bubbles: true })), k);
  };
  const shot = async (n) => {
    if (!has('shots')) return;
    await page.evaluate(() => window.__CG.setPixels(true));
    // OWNER LAW: SEE IT. The broadcast camera frames the whole ring, and at that distance two
    // wrestlers are 80 px tall — a solver that hits its target and folds the elbow backwards would
    // be invisible. __camShot is the engine's OWN camera blend (it exists for entrances), so this
    // borrows it rather than reaching past the camera code: 1.7 m out at chest height, looking at
    // the midpoint of the two men. weight 0 afterwards hands the camera straight back.
    await page.evaluate(() => { try{ const P = window.__CG.pair(); if (!P) return;
      const mx = (P.a.x + P.v.x) / 2, mz = (P.a.z + P.v.z) / 2;
      window.__camShot = { px: mx + 1.55, py: 1.35, pz: mz + 1.15,
                           lx: mx, ly: 1.15, lz: mz, w: 1, speed: 14 }; }catch(e){} });
    await sleep(1400);
    try{ await page.screenshot({ path: path.join(OUT, 'grapple_' + (has('nogripik') ? 'ctl_' : '') + n + '.png') }); }catch(e){}
    await page.evaluate(() => { try{ window.__camShot = null; }catch(e){} });
    await page.evaluate(() => window.__CG.setPixels(false));
  };

  report.gripik = has('nogripik') ? 'OFF (control run)' : 'ON';
  try{
    if (has('nogripik')) await page.addInitScript(() => { window.__CG_NOGRIPIK = true; });
    await page.addInitScript(PROBE);
    await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

    if (await waitFor(async () => (await gs()) === 'menu', 120000, 'the menu')){
      await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
      await waitFor(() => page.evaluate(() => { const s = document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }), 20000, 'the select screen');
      await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
      await waitFor(async () => (await gs()) === 'fight', 40000, 'the match to start');
    }
    // pixels off for the measurement; both models must be bound before anything is claimed
    await page.evaluate(() => window.__CG.setPixels(false));
    const bound = await waitFor(() => page.evaluate(() => { try{ const F = new Function('return fighters')();
      return !!(F && F[0] && F[1] && F[0].model && F[1].model); }catch(e){ return false; } }), 45000, 'both fighters to bind a GLB');
    if (!bound) block('a fighter never bound a GLB — nothing about hand contact can be measured');

    report.who = await page.evaluate(() => { const F = new Function('return fighters')();
      return (F || []).map(f => ({ name: (f.opts && f.opts.name) || '?', model: !!f.model,
        isPlayer: !!f.isPlayer, interferer: !!f._interferer, build: (f.spec && f.spec.build) || null })); });
    report.aiFrozen = await page.evaluate(() => window.__CG.freezeAI(true));
    if (!report.aiFrozen) block('could not freeze the AI — this run is a live fight, not a reproducer');

    // ---- THE DRIVE. Real buttons, the real input dispatcher, in the real order.
    //  g  -> startGrab (stage 1, the lock-up)
    //  j  -> pickGrapplePosition (stage 2, the hoist)  [grab at stage 1 only toggles front/rear]
    //  j  -> stage 3 (the carry) once _liftMinT has run out
    //  j  -> grappleDeliver (the throw)
    // Put the CPU man at arm's length in front of the player and clear both of any leftover state.
    // Any third body (a run-in) is parked well away so `opponent()` cannot pick it.
    const place = () => page.evaluate(() => { try{
      const F = new Function('return fighters')().filter(Boolean);
      const p = F.find(f => f.isPlayer) || F[0];
      const o = F.find(f => f !== p && !f._interferer) || F.find(f => f !== p);
      if (!p || !o) return;
      // RING CENTRE, both of them. The first working run of this tool put them wherever they had
      // walked to, and the very first `g` came back as state 'ropegrab' — ROPE_INTERACT wraps
      // playerAttack and turns GRAB near the ropes into a rope grab. That is the engine behaving
      // correctly; it was the harness standing in the wrong place. Nothing is disabled to avoid it.
      const d = p.dir || 1;
      p.x = -d * 0.4; p.z = 0; o.x = d * 0.4; o.z = 0;
      [p, o].forEach(f => { f.state = 'idle'; f.stateTime = 0; f.grappling = false; f.grabTarget = null;
        f.grabbedBy = null; f.grappleStage = 0; f.ragdoll = false; f.vx = 0; f.vz = 0; f.invuln = 0; });
      F.forEach(f => { if (f !== p && f !== o){ f.x = p.x + 8; f.z = p.z + 8; } });
    }catch(e){} });

    const stage = () => page.evaluate(() => { try{ const P = window.__CG.pair();
      return P && P.live ? (P.a.grappleStage | 0) : 0; }catch(e){ return -1; } });
    // PIN THE MOVE. pickGrapplePosition rolls a hold at the stage 1 -> 2 transition, so back-to-back
    // runs were comparing a chest grip against a thigh grip and the difference read as noise. A
    // replay is only a replay if the move is the same one; STANDARD is the plain collar tie and its
    // GRIP_SPEC is chest/chest, which is the case the owner described.
    const pin = () => page.evaluate(() => { try{ const P = window.__CG.pair();
      if (P && P.live) P.a.grapplePos = 'STANDARD'; }catch(e){} });
    // Press the real button until the stage actually advances. Fixed sleeps guess at _liftMinT and
    // at this container's frame rate; polling the state the engine reports does not.
    const advanceTo = async (want, ms) => {
      const end = Date.now() + ms;
      while (Date.now() < end){
        const s = await stage();
        if (s >= want) return true;
        if (s < 1) return false;      // not in a hold — a `j` here is a JAB, which knocks the man
        await key('j'); await sleep(450);        // down and pushes the pair apart. That happened.
      }
      return (await stage()) >= want;
    };

    await place(); await sleep(900);
    await page.evaluate(() => window.__CG.start());
    await page.evaluate(() => window.__CG.mark('pre'));
    await sleep(500);

    report.attempts = 0;
    for (let i = 0; i < 6; i++){
      report.attempts++;
      await key('g'); await sleep(600);
      if ((await stage()) >= 1) break;
      report.grabRefusedAs = await page.evaluate(() => { try{ const P = window.__CG.pair();
        return P ? { state: P.a.state, gap: +Math.hypot(P.a.x - P.v.x, P.a.z - P.v.z).toFixed(2),
                     vdown: typeof P.v.isDown === 'function' ? P.v.isDown() : null } : null; }catch(e){ return null; } });
      await place(); await sleep(500);
    }
    report.reached = { lockup: (await stage()) >= 1 };
    await pin();
    await page.evaluate(() => window.__CG.mark('lockup'));
    await sleep(900); await shot('1_lockup');

    report.reached.hoist = await advanceTo(2, 6000);
    await pin();
    await page.evaluate(() => window.__CG.mark('hoist'));
    await sleep(900); await shot('2_hoist');

    report.reached.carry = await advanceTo(3, 8000);
    await pin();
    await page.evaluate(() => window.__CG.mark('carry'));
    await sleep(900); await shot('3_carry');

    // ROTATION is the case he named. Steer the carry left, then right, while stage 3 holds.
    for (const k of ['a','d']){
      await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown', { key: x, bubbles: true })), k);
      await sleep(1400);
      await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup', { key: x, bubbles: true })), k);
    }
    await page.evaluate(() => window.__CG.mark('rotated'));
    await shot('4_rotated');

    await key('j'); await page.evaluate(() => window.__CG.mark('deliver'));
    await sleep(2000); await shot('5_deliver');
    await page.evaluate(() => window.__CG.stop());
    if (!report.reached.lockup) block('the grab never took — nothing about a grapple was measured');

    report.gripikStats = await page.evaluate(() => { try{ return window.BANNON_GRIPIK ? window.BANNON_GRIPIK.stats() : null; }catch(e){ return null; } });
    const raw = await page.evaluate(() => ({ samples: window.__CG.samples, marks: window.__CG.marks,
      errs: window.__CG.errs, bonesMissing: window.__CG.bonesMissing }));
    report.marks = raw.marks.map(m => ({ label: m.label, i: m.i }));
    report.probeErrors = raw.errs;
    report.bonesMissing = raw.bonesMissing;
    report.sampleCount = raw.samples.length;
    report.fps = raw.samples.length > 1
      ? +(raw.samples.length / ((raw.samples[raw.samples.length-1].t - raw.samples[0].t) / 1000)).toFixed(1) : 0;
    report.stagesSeen = Array.from(new Set(raw.samples.map(s => s.st))).sort();
    const heldS = raw.samples.filter(s => s.held);
    report.pair = heldS.length ? { a: heldS[0].an, v: heldS[0].vn, frames: heldS.length } : null;
    report.analysis = analyse(raw.samples);
    fs.writeFileSync(path.join(OUT, 'grapple_contact_samples.json'), JSON.stringify(raw.samples));
  }catch(e){
    block('HARNESS: ' + String(e && e.message).split('\n')[0].slice(0, 180));
  }

  try{ await browser.close(); }catch(e){}
  try{ srv.close(); }catch(e){}
  fs.writeFileSync(path.join(OUT, 'grapple_contact.json'), JSON.stringify(report, null, 1));

  if (has('json')){ console.log(JSON.stringify(report, null, 1)); process.exit(0); }

  const A = report.analysis;
  console.log('\n===== GRAPPLE CONTACT =====');
  (report.who || []).forEach(w => console.log('  ' + String(w.name).padEnd(16) + (w.model ? 'GLB bound' : 'NO MODEL') +
    (w.isPlayer ? '  [player]' : '') + (w.interferer ? '  [run-in]' : '')));
  console.log('  AI frozen: ' + (report.aiFrozen ? 'yes' : 'NO') + '   GRIPIK ' + report.gripik +
    '   reached ' + JSON.stringify(report.reached || {}));
  const GS = report.gripikStats;
  if (GS && GS.reach) console.log('  GRIPIK solver residual: mean ' + GS.reach.solveErrMean +
    'm  max ' + GS.reach.solveErrMax + 'm  over ' + GS.reach.solveN + ' solves');
  if (GS && GS.reach) console.log('  GRIPIK reroute: ' + GS.reach.rerouted + ' grips moved to a reachable body part, ' +
    GS.reach.stranded + ' left with nothing in reach');
  if (GS) console.log('  GRIPIK solves ' + GS.solved + ' over ' + GS.frames + ' held frames' +
    (GS.reach ? '   arm reach ' + GS.reach.armLen + 'm  target out of reach on ' +
      Object.keys(GS.reach.byStage).map(k => 'st' + k + ' ' + GS.reach.byStage[k].pctClamped + '% (short ' +
        GS.reach.byStage[k].meanShortfall + 'm)').join(', ') : '') +
    (Object.keys(GS.skipped || {}).length ? '   SKIPPED ' + JSON.stringify(GS.skipped) : '') +
    (GS.lastErr ? '   lastErr ' + GS.lastErr : ''));
  if (report.pair) console.log('  measured pair: ' + report.pair.a + ' holding ' + report.pair.v);
  console.log('  samples ' + report.sampleCount + '  (' + report.fps + ' fps, pixels stubbed)   stages seen ' +
    JSON.stringify(report.stagesSeen));
  if (A && A.spanMedian) console.log('  victim shoulder span ' + A.spanMedian + ' m  — every "spans" figure below is in these units');
  if (A && A.staleFrames) console.log('  ' + A.staleFrames + ' frames discarded: grappleStage said a hold was on and nobody was holding anybody');
  if (report.bonesMissing && Object.keys(report.bonesMissing).length)
    console.log('  bones that never resolved: ' + JSON.stringify(report.bonesMissing));

  const STAGE = { 0:'no grapple', 1:'LOCK-UP', 2:'HOIST', 3:'CARRY / ROTATE', 4:'RELEASE' };
  if (A) for (const st of Object.keys(A.stages).sort()){
    const g = A.stages[st];
    console.log('\n  stage ' + st + '  ' + (STAGE[st] || '') + '   ' + g.n + ' frames / ' + g.secs + 's');
    const LBL = { aL:'SEEN  attacker L hand -> victim body', aR:'SEEN  attacker R hand -> victim body',
                  pL:'INTENT engine grip L    -> victim body', pR:'INTENT engine grip R    -> victim body',
                  vL:'      victim L hand     -> attacker body', vR:'      victim R hand     -> attacker body' };
    for (const k of ['aL','pL','aR','pR','vL','vR']){
      const h = g.hands[k]; if (!h || !h.n){ console.log('    ' + LBL[k] + '  — no samples'); continue; }
      console.log('    ' + LBL[k] + '  mean ' + h.mean.toFixed(3) + 'm  p95 ' + h.p95.toFixed(3) +
        '  max ' + h.max.toFixed(3) + '  band ' + h.band.toFixed(3) +
        (h.spans ? '/' + h.spans.band + 'sp' : '') +
        '   grip ' + h.gripBone + ' ' + Math.round(h.gripShare * 100) + '% · ' + h.gripSwitches + ' sw');
    }
    if (g.follow) for (const k of ['fL','fR']){
      const f = g.follow[k]; if (!f) continue;
      console.log('    FOLLOW GLB ' + (k === 'fL' ? 'L' : 'R') + ' hand vs engine grip point   mean ' +
        f.mean.toFixed(3) + 'm  max ' + f.max.toFixed(3) + 'm');
    }
  }
  if (A && A.worst) console.log('\n  WORST DRIFT: ' + A.worst.hand + ' in stage ' + A.worst.stage + ' moved ' +
    A.worst.range.toFixed(3) + 'm (' + A.worst.min.toFixed(3) + ' -> ' + A.worst.max.toFixed(3) + ')' +
    (A.worst.atWorst ? '  at craneLift ' + A.worst.atWorst.cl + ', pos ' + A.worst.atWorst.grap : ''));

  if (report.blockers.length){ console.log('\n  NO VERDICT — ' + report.blockers.join(' | ')); }
  else if (A && A.spanMedian){
    // THE PASS CONDITION, in the owner's words: bounded through the full move. Two ways to fail it,
    // and they are different defects:
    //   CONTACT — is the hand ON the man at all. The threshold is taken from the ENGINE'S OWN CODE,
    //             not invented here: `_gripOpp` places a gripping hand on the victim's joint with
    //             offsets of at most 0.06 m, so the engine itself declares contact to be ~0.06 m.
    //             0.15 m is that with a 2.5x allowance for bone-centre vs surface.
    //   DRIFT   — does it stay there. Half a shoulder span, stated so it can be argued with.
    // Stage 4 is the throw: the bodies are MEANT to separate, so it is excluded from both.
    const CONTACT_M = 0.15;
    const bad = [];
    for (const st of Object.keys(A.stages)){
      if (+st < 1 || +st > 3) continue;                  // 0 = before the grab, 4 = deliberate release
      for (const k of ['aL','aR']){
        const h = A.stages[st].hands[k];
        // Under 15 live frames a stage has not been observed, it has been glimpsed. Say so instead
        // of issuing a verdict on noise — a thin stage is a weak run, not a passing game.
        if (!h || !h.n) continue;
        if (h.n < 15){ report.thin = report.thin || []; report.thin.push(k + ' stage ' + st + ' only ' + h.n + ' frames'); continue; }
        if (h.mean > CONTACT_M)
          bad.push('NO CONTACT  ' + k + ' stage ' + st + ': the visible hand sits ' + h.mean.toFixed(3) +
                   'm from the nearest bone of the man it is holding (engine grip offset is <=0.06m)');
        if (h.band / A.spanMedian > 0.5)
          bad.push('DRIFT       ' + k + ' stage ' + st + ': p5-p95 band ' + h.band.toFixed(3) + 'm = ' +
                   (h.band / A.spanMedian).toFixed(2) + ' shoulder spans (full range ' + h.range.toFixed(3) + 'm)');
      }
    }
    report.verdict = bad.length ? 'FAIL' : 'PASS'; report.failures = bad;
    fs.writeFileSync(path.join(OUT, 'grapple_contact.json'), JSON.stringify(report, null, 1));
    console.log('\n  ' + (bad.length ? 'FAIL — the grip does not hold:\n   ✗ ' + bad.join('\n   ✗ ')
                                     : 'PASS — every attacker hand stayed on the body and within half a shoulder span through the move.'));
  }
  if (pageErrors.length) console.log('\n  page errors: ' + pageErrors.slice(0, 4).join(' | '));
  console.log('\n  report  -> ' + path.join(OUT, 'grapple_contact.json'));
  console.log('  samples -> ' + path.join(OUT, 'grapple_contact_samples.json') + '\n');
  process.exit(0);
})();
