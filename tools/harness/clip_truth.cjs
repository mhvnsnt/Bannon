#!/usr/bin/env node
/* clip_truth.cjs — CLIP TRUTH, decided STRUCTURALLY on a real rig, banked at import time.
 *
 *   node tools/harness/clip_truth.cjs [--limit N] [--only NAME,NAME] [--write]
 *
 * OWNER: "The clip library contains at least two rotation conventions, but the runtime assumes
 * exactly one." Confirmed in the engine — same clip, same phase, same rest pose, thigh direction
 * (dirY -1 = straight down):
 *     GEN_WALK_FWD    rest*clip -0.975 DOWN    as absolute +0.999 up
 *     BOX_IDLE        rest*clip +0.890 UP      as absolute -0.939 DOWN
 * And: "Convert at import/preprocess time, not by random special cases during gameplay."
 *
 * WHY THIS IS AN IN-ENGINE TEST AND NOT AN OFFLINE HEURISTIC — two attempts failed first and both
 * are worth keeping, because each looked reasonable and each was wrong for a different reason.
 *
 *   ATTEMPT 1: minimum angle-to-identity of the thigh track, offline, rig-free.
 *   It separated the nine verified clips with a 120-degree gap (offset 2.3-6.8, absolute 127.8-165)
 *   and it is CONFOUNDED: in a capoeira au the thigh genuinely REACHES the orientation identity
 *   represents, so an absolute track dips near identity once and votes offset. Every MIXED verdict
 *   it produced was an acrobatic clip doing exactly that.
 *
 *   ATTEMPT 2: median angle to IDENTITY (offset hypothesis) vs to the bone's BIND rotation
 *   (absolute hypothesis), per bone, bind-relative — the correct formulation on paper:
 *       OFFSET    final = B * Q  -> at rest when Q is near identity
 *       ABSOLUTE  final = Q      -> at rest when Q is near B
 *   It reported 120-175 degrees for BOTH hypotheses on essentially every clip. TWO REASONS:
 *   (a) it assumes the animation spends most of its time NEAR REST, and a boxing stance is a
 *       permanently bent crouch that never visits rest; and
 *   (b) LIMB DIRECTION IS A CHAIN PROPERTY. Under the absolute reading the HIPS rotation changes
 *       too, and the leg's world direction is the product down the chain — so a single bone's local
 *       quaternion cannot say what the leg does.
 *
 * SO THE TEST IS THE THING WE ACTUALLY CARE ABOUT: assemble the pose BOTH WAYS on a real rig and
 * measure whether the resulting body is plausible. A standing human's thigh and shin point DOWN.
 * That is the owner's "structural plausibility", and it is not a proxy for the answer, it IS it.
 *
 * EVERY CLIP IS JUDGED FROM THE SAME REST POSE, over several phases, and a clip only gets a verdict
 * when the two hypotheses genuinely disagree. UNKNOWN and AMBIGUOUS are not passes and are not
 * converted — they keep the engine's existing behaviour and are listed for a human.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.dirname(path.dirname(__dirname));
const CLIPS = path.join(ROOT, 'assets', 'moves', 'clips');
const OUT = path.join(ROOT, 'assets', 'moves', 'clip_conventions.json');
const MIME = { '.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary',
  '.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg',
  '.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json','.jgz':'application/octet-stream' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const argv = process.argv.slice(2);
const has = f => argv.indexOf('--' + f) >= 0;
const num = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 ? (+argv[i+1] || d) : d; };
const str = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 ? argv[i+1] : d; };

function serve(port){
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/BANNON_v150.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
                         'Cache-Control':'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

function PROBE(){
  const V = () => new THREE.Vector3();
  const FIGHTERS = new Function('return typeof fighters!=="undefined"?fighters:null');

  window.__ctReady = function(){
    const A = FIGHTERS() || []; const f = A[0];
    return !!(f && f.model && window.__boneOf && window.__boneOf(f.model, 'LeftUpLeg') &&
              typeof window.studioApplyClipPose === 'function');
  };

  window.__ctInit = function(){
    const A = FIGHTERS() || []; const f = window.__ctF = A[0];
    if (!f || !f.model) return { err:'no model' };
    const C = new Function('return typeof Fighter!=="undefined"?Fighter:null')();
    if (C && C.prototype.update && !window.__ctFrozen){ const o = C.prototype.update;
      C.prototype.update = function(){ return; }; window.__ctFrozen = o; }
    const bones = window.__ctBones = [];
    f.model.traverse(o => { if (o.isBone && o.userData && o.userData.restQuat) bones.push(o); });
    window.__ctUFM = new Function('return typeof updateFighterModel==="function"?updateFighterModel:null')();
    return { bones:bones.length, ufm:!!window.__ctUFM };
  };

  // ONE CLIP, BOTH COMPOSITIONS, SEVERAL PHASES, ALWAYS FROM REST.
  window.__ctScan = function(payload){
    const f = window.__ctF, UFM = window.__ctUFM, bones = window.__ctBones;
    if (!f || !UFM) return { err:'not initialised' };
    const out = [];
    const euler = new THREE.Euler();
    const reset = () => { for (const b of bones){ b.quaternion.copy(b.userData.restQuat);
      if (b.userData.restPos) b.position.copy(b.userData.restPos); } };
    const seg = (a, b) => {
      const A2 = window.__boneOf(f.model, a), B2 = window.__boneOf(f.model, b);
      if (!A2 || !B2) return null;
      const p1 = A2.getWorldPosition(V()), p2 = B2.getWorldPosition(V());
      const v = p2.sub(p1), L = v.length();
      return L < 1e-6 ? null : { dirY:v.y/L, lenM:L };
    };
    // THE BASELINE IS THE RIG AT REST, MEASURED IN THIS SAME RUN. A standing rig's thigh and shin
    // point down; whatever number that actually is here is the reference, not a constant I picked.
    reset(); f.model.updateMatrixWorld(true);
    const base = { thighL:seg('LeftUpLeg','LeftLeg'), shinL:seg('LeftLeg','LeftFoot'),
                   thighR:seg('RightUpLeg','RightLeg') };

    for (const item of payload){
      try{
        const clip = item.clip;
        const phases = [0.15, 0.35, 0.55, 0.75];
        let offSum = 0, absSum = 0, n = 0, legTracks = 0, nTracks = 0;
        for (const ph of phases){
          reset();
          window.studioApplyClipPose(f, clip, ph, 1);
          const cb = f.model.userData.clipBones || {};
          const tracks = {}; nTracks = 0;
          for (const k in cb){ tracks[k] = cb[k]; nTracks++; }
          if (!nTracks){ f.model.userData.clipBones = null; continue; }
          legTracks = Object.keys(tracks).filter(k => /upleg|leg\b|leg_|shin|thigh/i.test(k)).length;
          // OFFSET: let the engine's own clip block run (rest * clip), which is the shipped path.
          f.model.userData.clipAbs = false;
          UFM(f); f.model.updateMatrixWorld(true);
          const o = { thighL:seg('LeftUpLeg','LeftLeg'), shinL:seg('LeftLeg','LeftFoot'),
                      thighR:seg('RightUpLeg','RightLeg') };
          // ABSOLUTE: same tracks, applied as the bone's own local rotation.
          reset();
          for (const k in tracks){
            const b = window.__boneOf(f.model, k); if (!b) continue;
            const t = tracks[k];
            euler.set(t.rx || 0, t.ry || 0, t.rz || 0, 'XYZ');
            b.quaternion.setFromEuler(euler);
          }
          f.model.updateMatrixWorld(true);
          const a = { thighL:seg('LeftUpLeg','LeftLeg'), shinL:seg('LeftLeg','LeftFoot'),
                      thighR:seg('RightUpLeg','RightLeg') };
          // SCORE = how far DOWN the legs point. Summed over thigh L/R and shin L, so one leg
          // legitimately raised in a kick cannot decide the verdict on its own.
          const score = s => (s.thighL ? s.thighL.dirY : 0) + (s.thighR ? s.thighR.dirY : 0) +
                             (s.shinL ? s.shinL.dirY : 0);
          offSum += score(o); absSum += score(a); n++;
          f.model.userData.clipBones = null;
        }
        if (!n){ out.push({ name:item.name, verdict:'UNKNOWN', why:'clip drove no bones' }); continue; }
        const offAvg = offSum/n, absAvg = absSum/n;      // more NEGATIVE is more upright
        const margin = Math.abs(offAvg - absAvg);
        let verdict, conv;
        if (margin < 0.35){ verdict = 'AMBIGUOUS'; conv = null; }
        else if (absAvg < offAvg){ verdict = 'ABSOLUTE'; conv = true; }
        else { verdict = 'OFFSET'; conv = false; }
        out.push({ name:item.name, verdict, absolute:conv,
                   offsetScore:+offAvg.toFixed(3), absoluteScore:+absAvg.toFixed(3),
                   margin:+margin.toFixed(3), phases:n, tracks:nTracks, legTracks });
      }catch(e){ out.push({ name:item.name, verdict:'ERROR', why:String(e && e.message).slice(0,90) }); }
    }
    return { base:{ thighL:base.thighL ? +base.thighL.dirY.toFixed(3) : null,
                    shinL:base.shinL ? +base.shinL.dirY.toFixed(3) : null }, rows:out };
  };
}

function load(p){
  if (p.endsWith('.jgz')) return JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString('utf8'));
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

(async () => {
  const only = str('only', null);
  let files = fs.existsSync(CLIPS)
    ? fs.readdirSync(CLIPS).filter(f => f.endsWith('.json') || f.endsWith('.jgz')).sort() : [];
  if (only){ const want = only.split(',').map(s => s.trim().toUpperCase());
    files = files.filter(f => want.indexOf(f.replace(/\.(json|jgz)$/,'').toUpperCase()) >= 0); }
  const LIMIT = num('limit', files.length);
  files = files.slice(0, LIMIT);

  const port = 9700 + Math.floor(Math.random()*300);
  const srv = await serve(port);
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args:['--use-gl=swiftshader','--no-sandbox','--no-proxy-server','--proxy-bypass-list=<-loopback>'] });
  const page = await browser.newPage({ viewport:{ width:412, height:915 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e.message).split('\n')[0].slice(0,120)));
  await page.addInitScript(PROBE);
  // The scan needs a bound rig, not a match. Suppress the entrance so it does not eat the clock.
  await page.addInitScript(() => { window.__SEQ_SKIP_ALL = true; });
  await page.goto(`http://127.0.0.1:${port}/BANNON_v150.html`, { waitUntil:'domcontentloaded', timeout:60000 });

  const gs = () => page.evaluate(() => { try{ return new Function('return gameState')(); }catch(e){ return null; } }).catch(()=>null);
  for (let i = 0; i < 300 && (await gs()) !== 'menu'; i++) await sleep(400);
  await page.evaluate(() => { const b = document.getElementById('btnFight'); if (b) b.click(); });
  for (let i = 0; i < 60; i++){ const ok = await page.evaluate(() => { const s=document.getElementById('csStart'); return !!(s && s.offsetParent !== null); }); if (ok) break; await sleep(400); }
  await page.evaluate(() => { const s = document.getElementById('csStart'); if (s) s.click(); });
  for (let i = 0; i < 90 && (await gs()) !== 'fight'; i++) await sleep(400);
  // WAIT FOR THE RIG, NOT FOR A CLOCK — banked law: never sleep a guessed number of seconds.
  let ready = false;
  for (let i = 0; i < 90 && !ready; i++){ ready = await page.evaluate(() => window.__ctReady()); if (!ready) await sleep(500); }
  if (!ready){ console.log('  the rig never bound — cannot scan. No table written.');
    try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){} process.exitCode = 1; return; }
  const init = await page.evaluate(() => window.__ctInit());

  console.log('\n===== CLIP TRUTH — ROTATION CONVENTION, DECIDED ON A REAL RIG =====');
  console.log('  ' + files.length + ' capture(s), ' + init.bones + ' bones with a rest pose, sim frozen');

  const rows = [];
  const BATCH = 12;
  let base = null;
  for (let i = 0; i < files.length; i += BATCH){
    const chunk = files.slice(i, i + BATCH).map(f => {
      try{ return { name:f.replace(/\.(json|jgz)$/,''), clip:load(path.join(CLIPS, f)) }; }
      catch(e){ return { name:f.replace(/\.(json|jgz)$/,''), clip:null, bad:String(e.message).slice(0,60) }; }
    });
    const good = chunk.filter(c => c.clip);
    for (const c of chunk) if (!c.clip) rows.push({ name:c.name, verdict:'ERROR', why:c.bad });
    if (!good.length) continue;
    const r = await page.evaluate(p => window.__ctScan(p), good);
    if (r.err){ console.log('  scan error: ' + r.err); break; }
    base = base || r.base;
    rows.push(...r.rows);
    if ((i / BATCH) % 8 === 0) process.stdout.write('   ' + Math.min(i + BATCH, files.length) + '/' + files.length + '\r');
  }
  try{ await browser.close(); }catch(e){} try{ srv.close(); }catch(e){}

  const by = { OFFSET:[], ABSOLUTE:[], AMBIGUOUS:[], UNKNOWN:[], ERROR:[] };
  for (const r of rows) (by[r.verdict] || by.ERROR).push(r);
  console.log('  rest baseline measured this run: thigh dirY ' + (base ? base.thighL : '?') +
              '  shin dirY ' + (base ? base.shinL : '?') + '   (-1 = straight down)');
  for (const k of ['OFFSET','ABSOLUTE','AMBIGUOUS','UNKNOWN','ERROR'])
    console.log('   ' + k.padEnd(11) + String(by[k].length).padStart(5) +
      (k === 'AMBIGUOUS' ? '   (the two readings differ by less than the bar — NOT converted)' :
       k === 'UNKNOWN'   ? '   (drives no bones — nothing to decide, NOT a pass)' : ''));

  const show = (k, n) => { if (!by[k].length) return;
    console.log('\n  ' + k + ' — leg-uprightness score under each reading (more negative = more upright):');
    for (const r of by[k].slice(0, n))
      console.log('   ' + String(r.name).slice(0,36).padEnd(37) +
        'offset ' + String(r.offsetScore).padStart(7) + '   absolute ' + String(r.absoluteScore).padStart(7) +
        '   margin ' + String(r.margin).padStart(6) + '   ' + r.tracks + ' tracks');
    if (by[k].length > n) console.log('   ... and ' + (by[k].length - n) + ' more'); };
  show('ABSOLUTE', 10); show('OFFSET', 10); show('AMBIGUOUS', 8);

  if (has('write')){
    const table = {};
    for (const r of rows) if (r.verdict === 'ABSOLUTE' || r.verdict === 'OFFSET')
      table[r.name] = { absolute:!!r.absolute, margin:r.margin,
                        offsetScore:r.offsetScore, absoluteScore:r.absoluteScore };
    fs.writeFileSync(OUT, JSON.stringify({
      note: 'Measured on a real rig by assembling each clip under both compositions and reading limb ' +
            'direction. AMBIGUOUS and UNKNOWN clips are deliberately absent — the engine keeps its ' +
            'existing rest*clip behaviour for anything not listed here.',
      restBaseline: base, decided: Object.keys(table).length, total: rows.length,
      clips: table }, null, 1));
    console.log('\n  banked -> ' + path.relative(ROOT, OUT) + '   (' + Object.keys(table).length + ' decided of ' + rows.length + ')');
  } else {
    console.log('\n  (dry run — pass --write to bank assets/moves/clip_conventions.json)');
  }
  if (errs.length) console.log('  page errors: ' + errs.slice(0,3).join(' | '));
})();
