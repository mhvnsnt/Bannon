#!/usr/bin/env node
/* match_phases.cjs — DOES THE FIGHT ACTUALLY START AT THE BELL?
 *
 *   node tools/harness/match_phases.cjs [--nophase]
 *
 * Owner: "fight should start at the bell, after the entrances and announce obviously, the order WWE
 * games do" — and the architectural half: "STATE NAMES MUST DESCRIBE THE ACTUAL CAPABILITY THEY
 * AUTHORIZE."
 *
 * This measures the ORDER OF EVENTS across a whole match start, in the page, on the page's own
 * clock. Not a screenshot, not an inference from gameState — the actual sequence:
 *
 *     gameState -> 'fight'        the match object exists
 *     entrance running            the walkouts, one man at a time
 *     entrance done               the last man is in the ring
 *     announce('FIGHT')           the bell
 *     first AI decision           the CPU is allowed to fight
 *     first player input read     the stick is allowed to fight
 *     first damage                somebody got hit
 *
 * THE ASSERTION IS THE ORDER, NOT A DURATION. "The entrance must take under N seconds" would be a
 * noisy lie across environments (this container is a software rasteriser — already law). What can
 * be asserted is that NOTHING THAT AUTHORISES COMBAT HAPPENS BEFORE THE BELL, however long the
 * presentation takes.
 *
 * The drive holds a movement key and mashes a strike THROUGH THE ENTRANCE on purpose. If input is
 * genuinely gated, that produces zero input reads and zero damage before the bell; if it is not,
 * this is exactly the "you can punch during your own entrance" case and the counters show it.
 *
 * --nophase disables BANNON_PHASE (window.BANNON_PHASE_OFF) so the same run measures the shipped
 * behaviour. Same build, same drive — never compare against a number from a previous session.
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
const NOPHASE = process.argv.indexOf('--nophase') > 0;
// --noentrance proves the FAILSAFE, which is the only part of this that is unrecoverable if wrong.
// BANNON_PHASE holds the bell for a presentation; if no entrance ever starts it must ring anyway
// (ARM_MS). An invariant that has never been observed to fire is not a test — same law as I10 in
// the fuzzer, where the fix was reverted to prove the check could fail before it was trusted.
const NOENT = process.argv.indexOf('--noentrance') > 0;

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
  const S = window.__MP = { ev: [], t0: 0, counts: { ai:0, input:0 }, hp0: null };

  function mark(name, extra){
    if (!S.t0) return;
    S.ev.push(Object.assign({ name, t: Math.round(performance.now() - S.t0) }, extra || {}));
  }
  window.__mpMark = mark;
  window.__mpStart = function(){ S.t0 = performance.now(); S.ev = []; S.counts = { ai:0, input:0 }; };

  if (cfg.noent){
    // STUB AFTER THE SEQUENCE HAS WRAPPED, NOT BEFORE. My first version replaced
    // BANNON_ENTRANCE.play as soon as the module existed — and BANNON_ENTRANCE_SEQ then wrapped
    // THAT, and its wrapper calls its own internal play(), never the original it captured. So the
    // stub became dead code, the entrance ran anyway, and the run reported sawEntrance:true while
    // claiming to prove the no-entrance path. A perturbation that did not change the variable is
    // not evidence — banked law, hit again here.
    // SEQ arms once and stamps __seq, so waiting for that stamp and replacing play afterwards is
    // the point where the override actually holds.
    const w2 = setInterval(function(){
      if (!window.BANNON_ENTRANCE || !window.BANNON_ENTRANCE.__seq) return;
      clearInterval(w2);
      window.BANNON_ENTRANCE.play = function(){ return false; };
      window.__NOENT_ARMED = true;
    }, 20);
  }
  if (cfg.nophase){
    // Neutralise the module without deleting it: combatActive() always true and roundStart() never
    // takes the announcement, which is precisely the shipped behaviour.
    const wait = setInterval(function(){
      if (!window.BANNON_PHASE) return;
      clearInterval(wait);
      window.BANNON_PHASE.combatActive = function(){ return true; };
      window.BANNON_PHASE.roundStart = function(){ return false; };
    }, 20);
  }

  /* THE AUTHORISING CALLS, counted where they actually are. readPlayerInput and updateAI are what
   * the loop gates, so those are the two that answer "was combat allowed to run". Fighter.prototype
   * .updateAI is wrappable; readPlayerInput is a top-level function declaration, so window.-wrapping
   * it DOES work here (unlike the lexically-called studioApplyClipPose — that trap is banked, and
   * the difference is which name the CALL SITE uses, so it is checked rather than assumed: the
   * counter reaching zero in BOTH arms would mean the wrapper missed, not that input was gated). */
  const arm = () => {
    try{
      if (typeof window.readPlayerInput === 'function' && !window.readPlayerInput.__mp){
        const o = window.readPlayerInput;
        const w = function(){ S.counts.input++; if (S.counts.input === 1) mark('FIRST player input read'); return o.apply(this, arguments); };
        w.__mp = 1; window.readPlayerInput = w;
      }
      const F = new Function('return typeof Fighter!=="undefined"?Fighter:null')();
      if (F && F.prototype.updateAI && !F.prototype.updateAI.__mp){
        const o = F.prototype.updateAI;
        const w = function(){ S.counts.ai++; if (S.counts.ai === 1) mark('FIRST AI decision'); return o.apply(this, arguments); };
        w.__mp = 1; F.prototype.updateAI = w;
      }
      if (typeof window.announce === 'function' && !window.announce.__mp){
        const o = window.announce;
        const w = function(a, b){ mark('announce "' + a + '" / "' + (b||'') + '"'); return o.apply(this, arguments); };
        w.__mp = 1; window.announce = w;
      }
    }catch(e){}
  };
  setInterval(arm, 120); arm();

  // state edges, polled in-page so a stalled main thread cannot skew the timestamps (an observer
  // outside the process cannot timestamp a freeze inside it — banked from menu_ledger)
  let lastG = null, lastRun = null, lastCombat = null;
  setInterval(function(){
    try{
      const g = new Function('return typeof gameState!=="undefined"?gameState:null')();
      if (g !== lastG){
        mark('gameState -> ' + g);
        // RE-BASELINE THE HP HERE. The window opens on the select screen, where `fighters` holds
        // PREVIEW bodies; startFight then throws those away and builds the match's own. Comparing
        // the new fighters against the preview's hp is comparing two different objects and would
        // report "damage" for a character swap. The match's fighters are the only valid baseline.
        if (g === 'fight'){ S.hp0 = null; S.dmgMarked = 0; }
        lastG = g;
      }
      let run = false;
      try{ run = !!(window.BANNON_ENTRANCE_SEQ && window.BANNON_ENTRANCE_SEQ.stats().running); }catch(e){}
      if (run !== lastRun){ mark(run ? 'ENTRANCE running' : 'ENTRANCE done'); lastRun = run; }
      let ca = null;
      try{ ca = window.BANNON_PHASE ? window.BANNON_PHASE.combatActive() : null; }catch(e){}
      if (ca !== lastCombat){ mark('combatActive -> ' + ca); lastCombat = ca; }
      // first damage: any fighter below the hp it started the window with
      const FI = new Function('return typeof fighters!=="undefined"?fighters:null')();
      if (FI && FI.length >= 2 && S.t0){
        if (S.hp0 == null) S.hp0 = FI.map(f => f && f.hp);
        else if (!S.dmgMarked){
          for (let i = 0; i < FI.length && i < S.hp0.length; i++){
            if (FI[i] && S.hp0[i] != null && FI[i].hp < S.hp0[i] - 0.5){
              S.dmgMarked = 1; mark('FIRST damage', { who: i }); break;
            }
          }
        }
      }
    }catch(e){}
  }, 50);

  window.__mpStop = function(){
    let ph = null; try{ ph = window.BANNON_PHASE ? window.BANNON_PHASE.state() : null; }catch(e){}
    return { ev: S.ev, counts: S.counts, phase: ph, noentArmed: !!window.__NOENT_ARMED };
  };

  try{ if (window.BANNON_PERF && window.BANNON_PERF.setTier){ window.BANNON_PERF.setTier(4); window.BANNON_PERF_AUTO = false; } }catch(e){}
  setInterval(function(){ try{ var R = new Function('return typeof renderer!=="undefined"?renderer:null')();
    if (R && R.render && !R.render.__stub){ var w = function(){}; w.__stub = 1; R.render = w; } }catch(e){} }, 300);
}

(async () => {
  const port = 9100 + Math.floor(Math.random()*300);
  fs.mkdirSync(OUT, { recursive:true });
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,140)));
  await page.addInitScript(PROBE, { nophase: NOPHASE, noent: NOENT });
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }

  // START THE WINDOW BEFORE PRESSING FIGHT. Everything this tool exists to order happens in the
  // first seconds after that press, so a window opened afterwards cannot see the thing it measures.
  await page.evaluate(() => window.__mpStart());
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });

  // MASH THROUGH THE ENTRANCE ON PURPOSE. If combat is gated this produces nothing; if it is not,
  // this is the "punch during your own entrance" case and the counters will say so.
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown',{key:'d',bubbles:true})));
  for (let i = 0; i < 90; i++){
    await page.evaluate(() => { dispatchEvent(new KeyboardEvent('keydown',{key:'j',bubbles:true}));
                                dispatchEvent(new KeyboardEvent('keyup',{key:'j',bubbles:true})); });
    await sleep(400);
    const st = await page.evaluate(() => { try{ return window.BANNON_PHASE ? window.BANNON_PHASE.state().combatState : 'ACTIVE'; }catch(e){ return 'ACTIVE'; } });
    if (st === 'ACTIVE' && i > 4) { await sleep(2500); break; }
  }
  await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup',{key:'d',bubbles:true})));
  const r = await page.evaluate(() => window.__mpStop());

  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  console.log('\n===== MATCH START, IN ORDER ' + (NOPHASE ? '(CONTROL — phase model disabled)' : (NOENT ? '(FAILSAFE — no entrance runs at all)' : '')) + ' =====');
  for (const e of r.ev) console.log('  ' + String((e.t/1000).toFixed(2) + 's').padStart(8) + '   ' + e.name);
  console.log('\n  readPlayerInput calls ' + r.counts.input + '   updateAI calls ' + r.counts.ai);
  if (r.phase) console.log('  final phase: ' + JSON.stringify(r.phase));

  // THE ASSERTION: the order, not the clock.
  const at = n => { const e = r.ev.find(x => x.name.indexOf(n) === 0); return e ? e.t : null; };
  const bell   = (() => { const e = r.ev.find(x => x.name.indexOf('announce "FIGHT"') === 0); return e ? e.t : null; })();
  const entDone= at('ENTRANCE done');
  const firstAI= at('FIRST AI decision');
  const firstIn= at('FIRST player input read');
  const firstDm= at('FIRST damage');

  console.log('\n--- ORDER CHECKS ---');
  // THE REFERENCE POINT IS THE END OF THE ENTRANCE, NOT THE BELL. My first version measured
  // everything against the bell and reported "no AI decision before the bell — ok", because the
  // bell was at 0.44 s and the entrance ran until 20.4 s: the AI was fighting for twenty seconds
  // and every check passed. A check anchored to a broken reference certifies the break. The bell's
  // own position is now one of the assertions rather than the ruler for the others.
  const gate = (entDone != null && bell != null) ? Math.max(entDone, bell) : (entDone != null ? entDone : bell);
  const rows = [
    ['the bell rings AFTER the entrances',    entDone, bell,    'the entrances finished'],
    ['no AI decision before combat opens',    gate,    firstAI, 'combat opened'],
    ['no player input read before it',        gate,    firstIn, 'combat opened'],
    ['no damage before it',                   gate,    firstDm, 'combat opened']
  ];
  let bad = 0;
  for (const [label, must, then, ref] of rows){
    let verdict;
    if (must == null){ verdict = 'UNKNOWN — ' + ref + ' was never observed'; bad++; }
    else if (then == null) verdict = 'ok (never happened in the window)';
    else if (then >= must - 60) verdict = 'ok  (' + ((then-must)/1000).toFixed(2) + 's after)';
    else { verdict = 'FAIL  ' + ((must-then)/1000).toFixed(2) + 's BEFORE ' + ref; bad++; }
    console.log('   ' + label.padEnd(38) + verdict);
  }
  // AND THE COUNT, which is what "they fought through the entrance" actually looks like: how much
  // authorised combat ran before the gate. Zero is the only correct answer.
  const before = { ai: 0, input: 0 };
  if (gate != null){
    const a = r.ev.find(x => x.name === 'FIRST AI decision'), i = r.ev.find(x => x.name === 'FIRST player input read');
    before.ai = (a && a.t < gate - 60) ? 1 : 0;
    before.input = (i && i.t < gate - 60) ? 1 : 0;
  }
  const preCombat = r.ev.filter(x => gate != null && x.t < gate - 60 &&
    /^announce "(?!FIGHT|RING THE BELL|.* — )/.test(x.name)).length;
  console.log('   ' + 'commentary lines before combat opened'.padEnd(38) +
    preCombat + (preCombat ? '   <- these are combat events during the walk' : ''));
  // UNKNOWN IS NOT PASS. A check that cannot see the failure it looks for must not report clean.
  console.log('\n  ' + (bad ? bad + ' CHECK(S) NOT SATISFIED' : 'ALL CHECKS SATISFIED — combat begins at the bell'));
  if (errs.length) console.log('  page errors: ' + errs.slice(0,4).join(' | '));
  if (NOENT){
    // The failsafe has exactly one requirement: the bell rings anyway, and reasonably promptly.
    const armed = bell != null;
    const saw = !!(r.phase && r.phase.sawEntrance);
    console.log('\n--- FAILSAFE ---');
    // THE PERTURBATION MUST BE CONFIRMED BEFORE THE RESULT IS READ. sawEntrance:true here means the
    // stub did not take and this run measured the ordinary path, not the failsafe.
    console.log('   override armed: ' + (r.noentArmed ? 'yes' : 'NO') + '   entrance observed: ' + saw);
    if (saw || !r.noentArmed){
      console.log('   INVALID — the entrance ran anyway, so this says NOTHING about the failsafe');
    } else {
      console.log('   no entrance ever ran; the bell ' + (armed ? 'RANG at ' + (bell/1000).toFixed(2) + 's' : 'NEVER RANG'));
      console.log('   ' + (armed ? 'combat is reachable with entrances absent' : 'UNRECOVERABLE — the match can never start'));
    }
  }
  fs.writeFileSync(path.join(OUT, 'match_phases' + (NOPHASE ? '_control' : (NOENT ? '_failsafe' : '')) + '.json'),
                   JSON.stringify({ nophase:NOPHASE, ...r, errs }, null, 1));
  console.log('  report -> ' + path.join(OUT, 'match_phases' + (NOPHASE ? '_control' : (NOENT ? '_failsafe' : '')) + '.json'));
})();
