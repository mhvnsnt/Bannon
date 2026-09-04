#!/usr/bin/env node
/* move_truth.cjs — A MOVE IS NOT ITS STATE NAME.
 *
 *   node tools/harness/move_truth.cjs                # watch live play, judge every claimed pin
 *   node tools/harness/move_truth.cjs --drive        # also try to force one through the real buttons
 *   node tools/harness/move_truth.cjs --secs 60 --shots --json
 *
 * WHY THIS EXISTS, and it is my own failure that caused it.
 * I published a screenshot and called it "a pin". I read that off the engine's state bucket
 * (`pinnedDown` appeared in the state list) and narrated the picture to match. The owner looked at
 * the frame and said it is not a pin — and he was right. In that frame the two bodies are not in a
 * cover topology and are barely in contact at all. The state machine had reached its enum and the
 * rendered result did not realise the move.
 *
 * So the reporting rule changes, permanently:
 *
 *     STATE CLAIM          the engine says pinCover / pinnedDown
 *          v
 *     ANIMATION CLAIM      a clip is selected and resident
 *          v
 *     SKELETON TRANSFORMS  that clip actually drives the VISIBLE GLB
 *          v
 *     CONTACT GEOMETRY     the bodies are where the move requires
 *          v
 *     RENDERED GLB         and it holds for more than one frame
 *
 * A HIGHER-LEVEL LABEL CANNOT OVERRULE LOWER-LEVEL PHYSICAL EVIDENCE. If the geometry fails, the
 * report says CLAIMED PIN -> INVALID, never "pin successful".
 *
 * EVERY THRESHOLD IS DERIVED, AND WHERE THE ENGINE ALREADY DECLARES ONE, THE ENGINE'S IS USED:
 *   * shoulders-to-mat uses `BANNON_PINS.probe()` -> `shoulderLimit` (SHOULDER_H = 0.15 m, the
 *     owner's own 15 cm shoulder proxy test). Not a number invented in this file.
 *   * every distance is ALSO expressed in SHOULDER SPANS off the live model, so no verdict depends
 *     on a character being a particular height.
 *   * anything that cannot be measured reports UNKNOWN. UNKNOWN is not PASS. A test that cannot see
 *     the failure it is looking for must not return a clean result — that is the severed-rig lesson
 *     and it is the reason this harness exists at all.
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
  window.__MT = { on:false, claims:{}, frames:0, errs:[], pixels:true, worst:null };
  const MT = window.__MT;
  function lex(n){ try{ return new Function('return typeof '+n+'!=="undefined"?'+n+':null')(); }catch(e){ return null; } }

  MT.setPixels = function(on){
    MT.pixels = !!on;
    try{ const R = lex('renderer'), C = lex('composer');
      [R, C].forEach(function(o){ if (!o || !o.render) return;
        if (on){ if (o.render.__stub && o.render.__orig) o.render = o.render.__orig; }
        else if (!o.render.__stub){ const orig = o.render.bind(o);
          const w = function(){}; w.__stub = 1; w.__orig = orig; o.render = w; } });
    }catch(e){}
  };

  // Core body bones only. A cover is a TORSO relationship; letting a fingertip satisfy "contact"
  // is how a test passes on a frame that looks nothing like the move.
  const TORSO = ['Spine','Spine1','Spine2','Neck','Hips'];
  const BODY  = TORSO.concat(['Head','LeftShoulder','RightShoulder','LeftArm','RightArm',
    'LeftForeArm','RightForeArm','LeftHand','RightHand','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg']);

  let _v = null, _w = null;
  function bp(model, n){
    if (!window.__boneOf || !model) return null;
    const b = window.__boneOf(model, n); if (!b) return null;
    b.updateWorldMatrix(true, false);
    if (!_v) _v = new window.THREE.Vector3();
    return _v.setFromMatrixPosition(b.matrixWorld).clone();
  }
  function span(model){ const L = bp(model,'LeftArm'), R = bp(model,'RightArm'); return (L&&R) ? L.distanceTo(R) : null; }
  function minSep(a, b, listA, listB){
    let best = Infinity, pair = null;
    for (const na of listA){ const pa = bp(a, na); if (!pa) continue;
      for (const nb of listB){ const pb = bp(b, nb); if (!pb) continue;
        const d = pa.distanceTo(pb); if (d < best){ best = d; pair = na + '->' + nb; } } }
    return best === Infinity ? null : { d: best, pair: pair };
  }
  function clipShare(f){
    try{
      const m = f.model; if (!m) return null;
      const drv = m.userData.__driven || {};
      const mapped = m.userData.mapped || [];
      if (!mapped.length) return null;
      let c = 0; for (const mp of mapped) if (mp && mp.bone && (drv[mp.bone.uuid]||0) > 0.5) c++;
      return +(c / mapped.length).toFixed(3);
    }catch(e){ return null; }
  }

  // ---- THE PIN SPECIFICATION. Each check returns PASS / FAIL / UNKNOWN plus the number it saw.
  function judgePin(att, def){
    const R = { checks:{}, numbers:{} };
    const sp = span(def.model) || span(att.model);
    R.numbers.shoulderSpan = sp != null ? +sp.toFixed(3) : null;
    const S = sp || 0.37;                              // fall back to a typical span, and SAY so
    R.numbers.spanAssumed = sp == null;

    // 1. CLIP AUTHORITY over the visible bodies of BOTH men.
    R.numbers.clipAtt = clipShare(att); R.numbers.clipDef = clipShare(def);

    // 2. SHOULDERS ON THE MAT — the engine's OWN test and the engine's OWN limit.
    try{
      // SIGNATURE IS probe(VICTIM, ATTACKER) — victim first. I wrote probe(att, def) and that would
      // have measured the ATTACKER's shoulder heights and reported them as the pinned man's. Reading
      // the signature instead of assuming an order is already law in this repo; it cost a whole
      // mechanic once when an options object was passed as applyDamage's attacker.
      const P = window.BANNON_PINS && window.BANNON_PINS.probe && window.BANNON_PINS.probe(def, att);
      if (P && P.shoulders){
        R.numbers.shoulderL = +P.shoulders[0].toFixed(3);
        R.numbers.shoulderR = +P.shoulders[1].toFixed(3);
        R.numbers.shoulderLimit = P.shoulderLimit;
        R.checks.shouldersOnMat = (P.shoulders[0] <= P.shoulderLimit && P.shoulders[1] <= P.shoulderLimit) ? 'PASS' : 'FAIL';
      } else R.checks.shouldersOnMat = 'UNKNOWN';
      // The engine's own rule is "both shoulders on the mat WHERE THE REFEREE CAN SEE THEM", so the
      // referee's line of sight is part of the move, not a separate system.
      if (P && P.refCanCount != null) R.checks.refCanSee = P.refCanCount ? 'PASS' : 'FAIL';
      else R.checks.refCanSee = 'UNKNOWN';
    }catch(e){ R.checks.shouldersOnMat = 'UNKNOWN'; }

    if (!att.model || !def.model){ R.checks.bodyContact = 'UNKNOWN'; R.checks.coverTopology = 'UNKNOWN';
      R.checks.separation = 'UNKNOWN'; return R; }

    // 3. REQUIRED CONTACT — the attacker's body must actually touch the defender's TORSO. Threshold
    //    is HALF A SHOULDER SPAN, which is the same scale the grapple contact harness uses.
    const ms = minSep(att.model, def.model, BODY, TORSO);
    if (!ms){ R.checks.bodyContact = 'UNKNOWN'; }
    else { R.numbers.minSep = +ms.d.toFixed(3); R.numbers.minSepPair = ms.pair;
      R.numbers.minSepSpans = +(ms.d / S).toFixed(2);
      R.checks.bodyContact = (ms.d <= 0.5 * S) ? 'PASS' : 'FAIL'; }

    // 4. COVER TOPOLOGY — the attacker's torso must be OVER the defender's, not merely nearby: above
    //    him in Y, and within about one shoulder span horizontally. A man standing a metre away with
    //    an arm out satisfies "contact" and is not covering anybody.
    const aC = bp(att.model,'Spine2') || bp(att.model,'Spine1');
    const dC = bp(def.model,'Spine2') || bp(def.model,'Spine1');
    if (!aC || !dC) R.checks.coverTopology = 'UNKNOWN';
    else {
      const horiz = Math.hypot(aC.x - dC.x, aC.z - dC.z);
      R.numbers.torsoHoriz = +horiz.toFixed(3);
      R.numbers.torsoHorizSpans = +(horiz / S).toFixed(2);
      R.numbers.torsoAbove = +(aC.y - dC.y).toFixed(3);
      R.checks.coverTopology = (horiz <= 1.0 * S && (aC.y - dC.y) > -0.05) ? 'PASS' : 'FAIL';
    }

    // 5. NO IMPOSSIBLE SEPARATION — roots within one body width. This is the check that would have
    //    caught the frame I mislabelled.
    const rd = Math.hypot((att.x||0)-(def.x||0), (att.z||0)-(def.z||0));
    R.numbers.rootGap = +rd.toFixed(3);
    R.checks.separation = (rd <= 1.2 * S * 2) ? 'PASS' : 'FAIL';
    return R;
  }

  const SPEC = { pinCover:{ role:'attacker', other:'_pinTarget', judge:judgePin, label:'PIN' } };

  (function tick(){
    requestAnimationFrame(tick);
    if (!MT.on) return;
    MT.frames++;
    try{
      const F = lex('fighters'); if (!F) return;
      for (const f of F){
        if (!f) continue;
        const spec = SPEC[f.state]; if (!spec) continue;
        // PROVENANCE. If this harness picked the WRONG body, every number below is about the wrong
        // man and the finding is worthless. startPin sets `_pinTarget`, so that is the authority;
        // `opponent()` is only a fallback and any run that leans on it must say so.
        const def = f._pinTarget || (typeof f.opponent === 'function' ? f.opponent() : null);
        if (!def) continue;
        const defFrom = f._pinTarget ? '_pinTarget' : 'opponent()';
        const key = spec.label;
        const C = MT.claims[key] || (MT.claims[key] = { claimed:0, valid:0, byCheck:{}, samples:[], firstFail:null, defFrom:{}, defState:{} });
        C.claimed++;
        C.defFrom[defFrom] = (C.defFrom[defFrom]||0)+1;
        C.defState[def.state] = (C.defState[def.state]||0)+1;
        const r = spec.judge(f, def);
        let ok = true, unknown = 0;
        for (const k in r.checks){
          const v = r.checks[k];
          const s = C.byCheck[k] || (C.byCheck[k] = { PASS:0, FAIL:0, UNKNOWN:0 });
          s[v]++;
          if (v === 'FAIL') ok = false;
          if (v === 'UNKNOWN'){ unknown++; ok = false; }     // UNKNOWN IS NOT PASS
        }
        if (ok) C.valid++;
        else if (!C.firstFail) C.firstFail = { checks:r.checks, numbers:r.numbers,
          att:(f.opts&&f.opts.name)||'?', def:(def.opts&&def.opts.name)||'?', frame:MT.frames };
        if (C.samples.length < 40) C.samples.push({ checks:r.checks, numbers:r.numbers });
      }
    }catch(e){ if (MT.errs.length < 6) MT.errs.push(String(e && e.message).slice(0,110)); }
  })();

  MT.start = function(){ MT.on = true; };
  MT.stop  = function(){ MT.on = false; };
  MT.live  = function(){ try{ const F = lex('fighters')||[]; return F.filter(Boolean).map(f => f.state); }catch(e){ return []; } };
  setInterval(function(){
    try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier && !window.__mtTier){
      window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; window.__mtTier = 1; } }catch(e){}
  }, 300);
}

(async () => {
  const port = parseInt(arg('port', String(9700 + Math.floor(Math.random() * 300))), 10);
  const SECS = parseFloat(arg('secs', '45'));
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).split('\n')[0].slice(0, 160)));

  const report = { when:new Date().toISOString(), pageErrors, blockers:[] };
  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(() => null);
  const waitFor = async (pred, ms, what) => { const end = Date.now() + ms;
    while (Date.now() < end){ let ok = false; try{ ok = await pred(); }catch(e){} if (ok) return true; await sleep(300); }
    report.blockers.push('TIMEOUT: ' + what); return false; };
  const key = async (k, hold) => {
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keydown', { key:x, bubbles:true })), k);
    await sleep(hold || 40);
    await page.evaluate(x => dispatchEvent(new KeyboardEvent('keyup', { key:x, bubbles:true })), k);
  };

  try{
    await page.addInitScript(PROBE);
    await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });
    if (await waitFor(async () => (await gs()) === 'menu', 120000, 'the menu')){
      await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
      await waitFor(() => page.evaluate(() => { const s = document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }), 20000, 'select');
      await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
      await waitFor(async () => (await gs()) === 'fight', 40000, 'the match');
    }
    await waitFor(() => page.evaluate(() => { try{ const F = new Function('return fighters')();
      return !!(F && F[0] && F[1] && F[0].model && F[1].model); }catch(e){ return false; } }), 45000, 'both GLBs');
    await page.evaluate(() => window.__MT.setPixels(false));
    await page.evaluate(() => window.__MT.start());

    // LIVE PLAY, AI NOT FROZEN. The frame I mislabelled came out of ordinary play, so ordinary play
    // is what has to be judged. Every claimed pin that occurs is evaluated, however it arose.
    // WHAT STATES ACTUALLY HAPPENED. A run that reports zero claims must say whether the move never
    // occurred or the watcher never saw it — otherwise a zero is indistinguishable from a broken
    // instrument, which is the failure mode this whole file exists to stop.
    await page.evaluate(() => { window.__MT_STATES = {};
      setInterval(function(){ try{ const F = new Function('return fighters')()||[];
        F.forEach(function(f){ if (f) window.__MT_STATES[f.state] = (window.__MT_STATES[f.state]||0)+1; });
      }catch(e){} }, 100); });

    if (has('drive')){
      // FREEZE THE AI and stand him in front of you. With the AI live he simply walks away and the
      // pin precondition (opponent DOWN, inside 1.1 m) never occurs — the first run reported
      // 0 drive attempts over 70 s for exactly that reason.
      await page.evaluate(() => { try{ const FP = new Function('return Fighter')();
        if (FP && FP.prototype.updateAI && !FP.prototype.updateAI.__mtFreeze){
          const o = FP.prototype.updateAI;
          const w = function(){ if (!this.isPlayer) return; return o.apply(this, arguments); };
          w.__mtFreeze = 1; FP.prototype.updateAI = w; } }catch(e){} });
    }
    const place = () => page.evaluate(() => { try{ const F = new Function('return fighters')().filter(Boolean);
      const p = F.find(f => f.isPlayer) || F[0], o = F.find(f => f !== p);
      if (p && o){ const d = p.dir || 1; p.x = -d*0.35; p.z = 0; o.x = d*0.35; o.z = 0; o.vx = 0; o.vz = 0; } }catch(e){} });

    const end = Date.now() + SECS * 1000;
    let driveN = 0;
    while (Date.now() < end){
      if (has('drive')){
        await place();
        // The real path, through the real buttons: knock him down with strikes, then hold DOWN and
        // press the ZONE pill. `fire` binds touchstart/mousedown — dispatching a PointerEvent at it
        // does nothing (banked lesson, hit twice before).
        await key('j'); await sleep(180); await key('k'); await sleep(180); await key('l'); await sleep(220);
        const downNear = await page.evaluate(() => { try{ const F = new Function('return fighters')();
          const p = F[0], o = p.opponent && p.opponent();
          return !!(o && o.state === 'down' && Math.hypot(o.x-p.x,(o.z||0)-(p.z||0)) < 1.1); }catch(e){ return false; } });
        if (downNear){
          driveN++;
          await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { key:'s', bubbles:true })));
          await page.evaluate(() => { const b = document.getElementById('btnZone');
            if (b){ b.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); b.dispatchEvent(new MouseEvent('mouseup', { bubbles:true })); } });
          await sleep(1200);
          await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup', { key:'s', bubbles:true })));
        }
      } else await sleep(500);
    }
    report.driveAttempts = driveN;
    await page.evaluate(() => window.__MT.stop());
    report.mt = await page.evaluate(() => ({ claims: window.__MT.claims, frames: window.__MT.frames, errs: window.__MT.errs }));
    report.statesSeen = await page.evaluate(() => window.__MT_STATES || {});

    if (has('shots')){
      await page.evaluate(() => window.__MT.setPixels(true));
      await sleep(900);
      try{ await page.screenshot({ path: path.join(OUT, 'move_truth.png') }); }catch(e){}
    }
  }catch(e){ report.blockers.push('HARNESS: ' + String(e && e.message).split('\n')[0].slice(0,180)); }

  try{ await browser.close(); }catch(e){}
  try{ srv.close(); }catch(e){}
  fs.writeFileSync(path.join(OUT, 'move_truth.json'), JSON.stringify(report, null, 1));
  if (has('json')){ console.log(JSON.stringify(report, null, 1)); process.exit(0); }

  console.log('\n===== MOVE TRUTH =====');
  console.log('  frames watched ' + ((report.mt && report.mt.frames) || 0) +
    '   drive attempts ' + (report.driveAttempts || 0) + '   page errors ' + pageErrors.length);
  if (report.blockers.length) console.log('  BLOCKERS: ' + report.blockers.join(' | '));
  const claims = (report.mt && report.mt.claims) || {};
  if (!Object.keys(claims).length){
    console.log('\n  NO MOVE WAS CLAIMED in this window. Nothing is asserted — that is not a pass.');
    console.log('  states actually seen: ' + JSON.stringify(report.statesSeen || {}));
  }
  for (const k of Object.keys(claims)){
    const C = claims[k];
    console.log('\n  CLAIMED: ' + k + '   ' + C.claimed + ' frames   PHYSICALLY REALISED on ' +
      C.valid + ' (' + Math.round(100 * C.valid / Math.max(1, C.claimed)) + '%)');
    console.log('    defender identified via ' + JSON.stringify(C.defFrom || {}) +
      '   defender state while pinned ' + JSON.stringify(C.defState || {}));
    for (const chk of Object.keys(C.byCheck)){
      const s = C.byCheck[chk];
      const tot = s.PASS + s.FAIL + s.UNKNOWN;
      console.log('    ' + chk.padEnd(18) + ' PASS ' + String(s.PASS).padStart(5) + '   FAIL ' +
        String(s.FAIL).padStart(5) + '   UNKNOWN ' + String(s.UNKNOWN).padStart(5) +
        '   (' + Math.round(100 * s.PASS / Math.max(1, tot)) + '% pass)');
    }
    if (C.firstFail){
      const F = C.firstFail;
      console.log('    FIRST INVALID FRAME — ' + F.att + ' over ' + F.def + ':');
      for (const kk of Object.keys(F.checks)) console.log('      ' + kk.padEnd(18) + F.checks[kk]);
      console.log('      numbers ' + JSON.stringify(F.numbers));
    }
    console.log('    RESULT: ' + (C.valid === C.claimed && C.claimed > 0
      ? 'VALID ' + k
      : 'INVALID ' + k + ' — the state was entered, the move was not physically realised'));
  }
  if (report.mt && report.mt.errs && report.mt.errs.length) console.log('\n  probe errors: ' + report.mt.errs.join(' | '));
  console.log('\n  report -> ' + path.join(OUT, 'move_truth.json') + '\n');
  process.exit(0);
})();
