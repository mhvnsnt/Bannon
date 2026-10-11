#!/usr/bin/env node
/*
 * bake_clips.cjs — turn the mocap FBX library into compact clip JSON, OFFLINE.
 *
 * WHY: the owner reported the game freezing mid-match. A V8 CPU profile of a live match is almost
 * entirely FBXLoader and fflate — genFace, genBuffers, getFloat64Array, parseNode,
 * generateRotationTrack, inflate. The cause is loadClipFor():
 *
 *      const buf = await r.arrayBuffer();
 *      const obj = (new THREE.FBXLoader()).parse(buf, '');     // <-- SYNCHRONOUS, main thread
 *
 * and it is called from inside poseAttack() when a move needs a clip that is not resident. So a
 * strike mid-match triggers a multi-megabyte FBX parse on the render thread. Measured frame times:
 * median 543 ms, worst 3766 ms. That is the freeze, exactly.
 *
 * 202 FBX files, 1,154 MB, to produce keyframed poses that are a few KB each. The engine already has
 * a compact clip format ({keys:[{t,pose,bones,morphs}],dur}) and already converts FBX to it at
 * runtime with extractClipFromGLTF. There is no reason for that conversion to happen on a phone,
 * during a match, ever.
 *
 * HOW: this runs the REAL game page in headless Chromium and calls the game's OWN
 * extractClipFromGLTF / NEUTRAL / mapExternalBone / _interpTrack. The baked clip is therefore
 * bit-identical to what the runtime would have produced — this is a cache, not a reimplementation.
 * If the engine's extraction changes, re-run this and the cache follows.
 *
 * COMPACTION (lossless for what the engine reads):
 *   - numbers rounded to 4 decimals (the engine feeds these to Euler angles; 1e-4 rad is 0.006 deg)
 *   - identity fields dropped: sc/sx/sy/sz===1 and tx/ty/tz===0 are what the consumer defaults to
 *   - a bone whose entry ends up empty is dropped entirely
 *   - pose joints equal to NEUTRAL are dropped (the consumer starts from NEUTRAL)
 *
 * USAGE
 *   node tools/mocap/bake_clips.cjs                     # bake everything mapped or referenced
 *   node tools/mocap/bake_clips.cjs --core              # only the core combat + locomotion set
 *   node tools/mocap/bake_clips.cjs --only "walking,running,idle"
 *   node tools/mocap/bake_clips.cjs --report            # what would be baked, and current sizes
 *
 * OUT
 *   assets/moves/clips/<KEY>.json    one per capture
 *   assets/moves/clips/index.json    key -> {file, bytes, dur, keys, bones, src}
 *   assets/moves/clips/core.json     the core set inlined in ONE file, for a single boot fetch
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const REPO = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(REPO, 'assets', 'moves', 'clips');
const GAME = path.join(REPO, 'BANNON_v150.html');

const argv = process.argv.slice(2);
const has = k => argv.includes('--' + k);
const flag = (k, d) => { const a = argv.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const CORE_ONLY = has('core');
const REPORT = has('report');
const ONLY = (flag('only', '') || '').split(',').map(s => s.trim()).filter(Boolean);
const PORT = parseInt(flag('port', '8250'), 10);

// ── which captures matter ─────────────────────────────────────────────────────────────────────────
// LOCOMOTION FIRST. These are the ones whose absence the owner is seeing as "they float around
// instead of walk" — the model holds its bind pose while the container slides, because
// updateFighterModel's _nativePose gate turns off all skeletal animation in any calm state and the
// locomotion clips it promised were never wired.
const LOCOMOTION = ['idle', 'walking', 'running', 'left turn', 'right turn', 'run to stop',
                    'idle (2)', 'idle (3)', 'idle (4)', 'idle (5)'];

function readCombatMap() {
  // the combat table -> capture mapping map_combat_moves.cjs already produced
  const p = path.join(REPO, 'assets', 'moves', 'combat_clip_map.json');
  if (!fs.existsSync(p)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const set = new Set();
    const walk = (o) => {
      if (!o) return;
      if (typeof o === 'string') { set.add(o.replace(/\.fbx$/i, '')); return; }
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (typeof o === 'object') Object.values(o).forEach(walk);
    };
    walk(j);
    return [...set];
  } catch (e) { return []; }
}

function readFbxMoveMap() {
  const p = path.join(REPO, 'assets', 'moves', 'fbx_move_map.json');
  if (!fs.existsSync(p)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const set = new Set();
    const walk = (o) => {
      if (!o) return;
      if (typeof o === 'string') { if (/\.fbx$/i.test(o) || o.length > 2) set.add(o.replace(/\.fbx$/i, '')); return; }
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (typeof o === 'object') Object.values(o).forEach(walk);
    };
    walk(j);
    return [...set];
  } catch (e) { return []; }
}

function findFbx(base) {
  const cands = [
    path.join(REPO, 'assets', 'mocap', 'drive', base + '.fbx'),
    path.join(REPO, 'assets', 'mocap', base + '.fbx'),
    path.join(REPO, 'assets', 'mocap', 'open', base + '.fbx'),
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  return null;
}

function allFbx() {
  const out = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d)) {
      const p = path.join(d, e);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.fbx$/i.test(e)) out.push(p);
    }
  };
  walk(path.join(REPO, 'assets', 'mocap'));
  return out;
}

function keyOf(base) { return String(base).toUpperCase().replace(/[^A-Z0-9]/g, '_'); }

// ── compaction ────────────────────────────────────────────────────────────────────────────────────
const R4 = (n) => {
  if (typeof n !== 'number' || !isFinite(n)) return 0;
  const r = Math.round(n * 1e4) / 1e4;
  return r === 0 ? 0 : r;
};

function compactClip(clip, neutral) {
  const out = { dur: R4(clip.dur || 1), keys: [] };
  for (const k of (clip.keys || [])) {
    const key = { t: R4(k.t) };
    // pose: only joints that differ from NEUTRAL (the consumer starts from NEUTRAL)
    const pose = {};
    for (const j in (k.pose || {})) {
      const v = k.pose[j], n = neutral[j];
      if (!Array.isArray(v)) continue;
      if (n && R4(v[0]) === R4(n[0]) && R4(v[1]) === R4(n[1]) && R4(v[2]) === R4(n[2])) continue;
      pose[j] = [R4(v[0]), R4(v[1]), R4(v[2])];
    }
    if (Object.keys(pose).length) key.pose = pose;
    // bones: drop identity scale and zero translation, which is what the consumer defaults to
    const bones = {};
    for (const b in (k.bones || {})) {
      const s = k.bones[b], o = {};
      if (s.rx) o.rx = R4(s.rx);
      if (s.ry) o.ry = R4(s.ry);
      if (s.rz) o.rz = R4(s.rz);
      if (s.tx) o.tx = R4(s.tx);
      if (s.ty) o.ty = R4(s.ty);
      if (s.tz) o.tz = R4(s.tz);
      if (s.sc != null && R4(s.sc) !== 1) o.sc = R4(s.sc);
      if (s.sx != null && R4(s.sx) !== 1) o.sx = R4(s.sx);
      if (s.sy != null && R4(s.sy) !== 1) o.sy = R4(s.sy);
      if (s.sz != null && R4(s.sz) !== 1) o.sz = R4(s.sz);
      if (Object.keys(o).length) bones[b] = o;
    }
    if (Object.keys(bones).length) key.bones = bones;
    const morphs = {};
    for (const m in (k.morphs || {})) { const v = R4(k.morphs[m]); if (v) morphs[m] = v; }
    if (Object.keys(morphs).length) key.morphs = morphs;
    out.keys.push(key);
  }
  return out;
}

// ── the run ───────────────────────────────────────────────────────────────────────────────────────
(async () => {
  // decide the work list
  const wanted = new Set();
  if (ONLY.length) {
    ONLY.forEach(n => wanted.add(n.replace(/\.fbx$/i, '')));
  } else {
    LOCOMOTION.forEach(n => wanted.add(n));
    readCombatMap().forEach(n => wanted.add(n));
    if (!CORE_ONLY) {
      readFbxMoveMap().forEach(n => wanted.add(n));
      allFbx().forEach(p => wanted.add(path.basename(p, path.extname(p))));
    }
  }

  const jobs = [];
  const missing = [];
  for (const base of wanted) {
    const p = findFbx(base);
    if (p) jobs.push({ base, file: p, bytes: fs.statSync(p).size });
    else missing.push(base);
  }
  jobs.sort((a, b) => a.bytes - b.bytes);

  const totalIn = jobs.reduce((s, j) => s + j.bytes, 0);
  console.log('bake_clips  ' + jobs.length + ' capture(s), ' + (totalIn / 1048576).toFixed(0) +
    ' MB of FBX' + (CORE_ONLY ? '  [core only]' : ''));
  if (missing.length) console.log(missing.length + ' referenced name(s) have no FBX on disk (skipped)');
  if (REPORT) {
    jobs.slice(-15).forEach(j => console.log('  ' + (j.bytes / 1048576).toFixed(1).padStart(7) + ' MB  ' + j.base));
    process.exit(0);
  }
  if (!jobs.length) { console.log('nothing to bake'); process.exit(0); }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // THREE COMES FROM A CDN IN THE SHIPPED PAGE. A bake box has no network, so THREE would be
  // undefined, nothing would initialise, and extractClipFromGLTF would never exist — which is exactly
  // how this first failed. Serve a copy of the page with those URLs pointed at a local three, and
  // serve that three from wherever it is vendored.
  const VENDOR = [
    process.env.THREE_VENDOR,
    '/tmp/claude-0/-home-user-Bannon/4ac21f6b-97dc-53a8-9769-7e549fb88a44/scratchpad/pwtest/vendor/three',
    path.join(REPO, 'assets', 'vendor'),
  ].filter(Boolean).find(d => d && fs.existsSync(path.join(d, 'three.min.js')));
  if (!VENDOR) {
    console.error('No local three.min.js found. Set THREE_VENDOR=<dir containing three.min.js + GLTFLoader.js + FBXLoader.js>');
    process.exit(2);
  }
  function localiseThree(html) {
    return html
      .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/g, '/vendor/three.min.js')
      .replace(/https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net\/npm)\/three@0\.128\.0\/build\/three\.min\.js/g, '/vendor/three.min.js')
      .replace(/https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net\/npm)\/three@0\.128\.0\/examples\/js\/(?:loaders|shaders|postprocessing|utils|libs)\/([A-Za-z0-9_.]+\.js)/g, '/vendor/$1');
  }
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
                  '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.png': 'image/png' };
  // serve the repo so the page can fetch the FBX by its real URL
  const srv = http.createServer((q, s) => {
    let u = decodeURIComponent(q.url.split('?')[0]);
    if (u === '/') u = '/BANNON_v150.html';
    if (u.startsWith('/vendor/')) {
      const vp = path.join(VENDOR, path.basename(u));
      if (!fs.existsSync(vp)) { s.writeHead(404); s.end(); return; }
      s.writeHead(200, { 'content-type': 'text/javascript' });
      fs.createReadStream(vp).pipe(s);
      return;
    }
    const p = path.join(REPO, u);
    if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); s.end(); return; }
    if (p === GAME) {
      const html = localiseThree(fs.readFileSync(p, 'utf8'));
      s.writeHead(200, { 'content-type': 'text/html' });
      s.end(html);
      return;
    }
    s.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(s);
  });
  await new Promise(r => srv.listen(PORT, r));

  const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');
  const br = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=swiftshader', '--no-sandbox', '--no-proxy-server', '--proxy-bypass-list=<-loopback>',
           '--js-flags=--max-old-space-size=4096'],
  });
  const pg = await br.newPage();
  pg.setDefaultTimeout(300000);
  const perr = [];
  pg.on('pageerror', e => perr.push(String(e).slice(0, 160)));
  await pg.goto('http://127.0.0.1:' + PORT + '/BANNON_v150.html', { waitUntil: 'domcontentloaded', timeout: 300000 });
  // the extractor and FBXLoader both have to be live, or we would be baking nothing
  await pg.waitForFunction(() => typeof window.extractClipFromGLTF === 'function'
    && typeof THREE !== 'undefined' && !!THREE.FBXLoader, null, { timeout: 300000 });

  const neutral = await pg.evaluate(() => {
    // NEUTRAL is module-scoped; the extractor closes over it. Recover it by extracting a bare clip.
    const c = window.extractClipFromGLTF({ duration: 1, tracks: [] });
    return (c.keys && c.keys[0] && c.keys[0].pose) || {};
  });
  console.log('NEUTRAL carries ' + Object.keys(neutral).length + ' joints');

  const index = {};
  let totalOut = 0, ok = 0, fail = 0;
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    const rel = path.relative(REPO, j.file).split(path.sep).join('/');
    let clip = null, err = null;
    try {
      clip = await pg.evaluate(async (url) => {
        const r = await fetch(url);
        if (!r.ok) return { err: 'http ' + r.status };
        const buf = await r.arrayBuffer();
        let obj;
        try { obj = (new THREE.FBXLoader()).parse(buf, ''); }
        catch (e) { return { err: 'parse: ' + String(e.message || e).slice(0, 80) }; }
        if (!obj.animations || !obj.animations.length) return { err: 'no animation track' };
        const c = window.extractClipFromGLTF(obj.animations[0], obj);
        // count how many DISTINCT bones the capture actually drives — a clip that drives 2 bones is
        // not a usable capture and should not be banked as if it were
        const bones = new Set();
        (c.keys || []).forEach(k => Object.keys(k.bones || {}).forEach(b => bones.add(b)));
        return { clip: c, boneCount: bones.size };
      }, 'http://127.0.0.1:' + PORT + '/' + rel.split('/').map(encodeURIComponent).join('/'));
    } catch (e) { err = String(e.message || e).slice(0, 90); }

    if (!clip || clip.err || err) {
      fail++;
      console.log('  [' + (i + 1) + '/' + jobs.length + '] SKIP  ' + j.base + '  (' + ((clip && clip.err) || err) + ')');
      continue;
    }
    if (clip.boneCount < 8) {
      fail++;
      console.log('  [' + (i + 1) + '/' + jobs.length + '] SKIP  ' + j.base + '  (drives only ' + clip.boneCount + ' bones — not a usable capture)');
      continue;
    }
    const compact = compactClip(clip.clip, neutral);
    const key = keyOf(j.base);
    const outFile = path.join(OUT_DIR, key + '.json');
    const text = JSON.stringify(compact);
    fs.writeFileSync(outFile, text);
    totalOut += text.length;
    ok++;
    index[key] = { file: key + '.json', bytes: text.length, dur: compact.dur,
                   keys: compact.keys.length, bones: clip.boneCount, src: path.basename(j.file) };
    if (i % 10 === 0 || jobs.length < 20) {
      console.log('  [' + (i + 1) + '/' + jobs.length + '] ' + (j.bytes / 1048576).toFixed(1) +
        ' MB -> ' + (text.length / 1024).toFixed(1) + ' KB  ' + j.base + '  (' + clip.boneCount + ' bones)');
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 1));

  // the CORE set inlined into one file, so boot is a single small fetch instead of 40 round trips
  const coreKeys = new Set();
  LOCOMOTION.forEach(n => coreKeys.add(keyOf(n)));
  readCombatMap().forEach(n => coreKeys.add(keyOf(n)));
  // CAP THE BOOT PAYLOAD. The first cut of core.json was 7.5 MB, which is worse at boot than simply
  // lazy-loading — a multi-character capture like TagSuperkick is 940 KB on its own (993 bones).
  // Anything over the cap stays a separate file and loads on first use; core carries the small,
  // frequently-hit clips so the opening exchange of a match is animated with one request.
  const CORE_CAP_KB = parseInt(flag('coreCap', '220'), 10);
  const CORE_TOTAL_KB = parseInt(flag('coreTotal', '2048'), 10);
  const core = {};
  let coreBytes = 0;
  const candidates = [...coreKeys]
    .map(k => ({ k, f: path.join(OUT_DIR, k + '.json') }))
    .filter(c => fs.existsSync(c.f))
    .map(c => ({ ...c, sz: fs.statSync(c.f).size }))
    .sort((a, b) => a.sz - b.sz);
  let running = 0, dropped = 0;
  for (const c of candidates) {
    if (c.sz > CORE_CAP_KB * 1024) { dropped++; continue; }
    if (running + c.sz > CORE_TOTAL_KB * 1024) { dropped++; continue; }
    core[c.k] = JSON.parse(fs.readFileSync(c.f, 'utf8'));
    running += c.sz;
  }
  if (dropped) console.log(dropped + ' clip(s) left out of core (over ' + CORE_CAP_KB + ' KB each, or past the ' + CORE_TOTAL_KB + ' KB budget) — they lazy-load on first use');
  const coreText = JSON.stringify(core);
  fs.writeFileSync(path.join(OUT_DIR, 'core.json'), coreText);
  coreBytes = coreText.length;

  console.log('\n' + ok + ' baked, ' + fail + ' skipped');
  console.log((totalIn / 1048576).toFixed(0) + ' MB of FBX -> ' + (totalOut / 1048576).toFixed(1) +
    ' MB of clip JSON  (' + (totalIn / Math.max(1, totalOut)).toFixed(0) + 'x smaller)');
  console.log('core.json: ' + Object.keys(core).length + ' clips, ' + (coreBytes / 1024).toFixed(0) +
    ' KB — one fetch at boot, no FBX parse at match time');
  if (perr.length) console.log('pageerrors during bake: ' + perr.length + ' (' + perr[0] + ')');
  await br.close();
  srv.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('CRASH', e); process.exit(1); });
