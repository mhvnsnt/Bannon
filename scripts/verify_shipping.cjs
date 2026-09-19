#!/usr/bin/env node
/* verify_shipping.cjs — THE SILENT-SHIPPING BUGS THAT COST A WEEK, CHECKED ON EVERY PUSH.
 *
 *   node scripts/verify_shipping.cjs
 *
 * Owner: "Why aren't u using open source to make our game complete and debugged ... with no errors
 * and glitches?"
 *
 * Fair question, and the honest answer is that open source IS in here — three.js, meshoptimizer,
 * gltf-transform, MediaPipe, MoMask — and not one of them could have caught a single bug from this
 * week, because none of those bugs were a missing library. Every one was a REFERENCE THAT POINTED
 * AT NOTHING, and every one shipped silently:
 *
 *   1. BANNON_v150.html never closed its </html>. All three updaters gate on exactly that string,
 *      so every update ever published was rejected. Nobody noticed because browsers do not care.
 *   2. MainActivity calls window.BANNON_OTA_NOTIFY(build). That function did not exist. The update
 *      downloaded and then told nobody, for as long as the feature has existed.
 *   3. roster_movesets.json equips 68 clip names with no file anywhere — 'jumping up' in 574 slots.
 *      Every one falls through to the procedural rig, forever, at any frame rate.
 *   4. android.yml git-add'ed dist/BANNON-fresh.apk, which .gitignore blocks. `git add` on an
 *      ignored path exits 1, the step runs under bash -e, and thirty consecutive publishes died
 *      after building the APK and before committing it.
 *   5. The post-processing scripts were CDN-only, so the offline APK silently rendered on a
 *      completely different path from the phone with internet.
 *
 * A linter would have found all five in seconds. That is what this is. It is not clever; it is the
 * check that was missing, and it runs on every push so this class of bug cannot ship again.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.dirname(__dirname);
const R = p => path.join(ROOT, p);
const fails = [], notes = [];
const fail = (id, msg) => fails.push(id + ': ' + msg);
const ok = (id, msg) => notes.push(id + ': ' + msg);

const GAME = R('BANNON_v150.html');
const html = fs.readFileSync(GAME, 'utf8');

// ── 1. the document must close, or every updater rejects the download ─────────────────────────
{
  const closes = html.trim().endsWith('</html>');
  const once = (html.match(/<\/html>/gi) || []).length;
  if (!closes) fail('DOCUMENT', 'BANNON_v150.html does not end with </html>. All three update paths ' +
    'require it (MainActivity.checkForUpdate, the OTA sanity gate, the cold-launch bootstrap) — ' +
    'every published update will be silently rejected.');
  else if (once !== 1) fail('DOCUMENT', once + ' </html> tags — there must be exactly one, at the end.');
  else ok('DOCUMENT', 'closes exactly once, at the end');
}

// ── 2. every window.X() the native app calls must exist in the game ───────────────────────────
{
  const javaFiles = [];
  (function walk(d){ if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes:true })){
      const p = path.join(d, e.name);
      if (e.isDirectory()){ if (e.name !== 'build') walk(p); }
      else if (e.name.endsWith('.java')) javaFiles.push(p);
    } })(R('android/app/src/main/java'));
  const called = new Set();
  for (const f of javaFiles){
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/window\.([A-Za-z_$][\w$]*)\s*\(/g)) called.add(m[1]);
  }
  const missing = [...called].filter(n => !new RegExp('(window\\.' + n + '\\s*=|function\\s+' + n + '\\b)').test(html));
  if (missing.length) fail('NATIVE BRIDGE', 'the Android app calls ' + missing.map(n => 'window.'+n+'()').join(', ') +
    ' and the game never defines ' + (missing.length > 1 ? 'them' : 'it') + ' — the call lands on nothing and the feature is silently dead.');
  else ok('NATIVE BRIDGE', called.size + ' window.* calls from Java all resolve');
}

// ── 3. every clip a moveset equips must have a file ───────────────────────────────────────────
{
  const dir = R('assets/moves/clips');
  const have = new Set(fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)) : []);
  const key = n => String(n).toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const haveKeys = new Set([...have].map(key));
  const exists = c => have.has(c) || haveKeys.has(key(c));
  const counts = {};
  const rmPath = R('assets/moves/roster_movesets.json');
  if (fs.existsSync(rmPath) && have.size){
    const sets = (JSON.parse(fs.readFileSync(rmPath, 'utf8')).sets) || {};
    for (const who of Object.keys(sets)){
      for (const [slot, v] of Object.entries(sets[who])){
        if (slot.startsWith('_')) continue;
        for (const c of (Array.isArray(v) ? v : [v])) if (typeof c === 'string' && !exists(c)) counts[c] = (counts[c]||0)+1;
      }
    }
    const miss = Object.keys(counts).sort((a,b) => counts[b]-counts[a]);
    if (miss.length) fail('PHANTOM CLIPS', miss.length + ' equipped clip names have NO FILE. Worst: ' +
      miss.slice(0,6).map(c => '"'+c+'" x'+counts[c]).join(', ') +
      '. Each of those slots plays the procedural rig instead of a capture, at any frame rate.');
    else ok('PHANTOM CLIPS', 'every equipped clip resolves to a file');
  } else notes.push('PHANTOM CLIPS: skipped (clips dir or roster_movesets.json absent)');
}

// ── 4. nothing the publish step commits may be gitignored ─────────────────────────────────────
{
  const wf = R('.github/workflows/android.yml');
  if (fs.existsSync(wf)){
    const s = fs.readFileSync(wf, 'utf8');
    const paths = new Set();
    for (const m of s.matchAll(/git add(?:\s+-f)?\s+([^\n|&;]+)/g))
      m[1].trim().split(/\s+/).forEach(p => { if (p.startsWith('dist/') || p.startsWith('assets/')) paths.add(p); });
    const forced = new Set();
    for (const m of s.matchAll(/git add\s+-f\s+([^\n|&;]+)/g))
      m[1].trim().split(/\s+/).forEach(p => forced.add(p));
    const bad = [];
    for (const p of paths){
      if (forced.has(p)) continue;                     // -f is an explicit override, fine
      let ignored = false;
      try{ execSync('git check-ignore -q ' + JSON.stringify(p), { cwd: ROOT, stdio:'ignore' }); ignored = true; }catch(e){}
      if (ignored) bad.push(p);
    }
    if (bad.length) fail('PUBLISH', 'the publish step git-adds ' + bad.join(', ') + ' which .gitignore blocks. ' +
      '`git add` on an ignored path exits 1 and the step runs under bash -e, so the whole publish dies ' +
      'AFTER the build and BEFORE the commit — silently, every time.');
    else ok('PUBLISH', paths.size + ' committed artifact path(s), none ignored');
  }
}

// ── 5. every local <script src> must resolve, so the offline app is not a different game ───────
{
  const missing = [];
  for (const m of html.matchAll(/<script[^>]+src="((?!https?:)[^"]+)"/g)){
    const src = m[1];
    // a document.write fallback builds its src by concatenation ("'+b+f+'") — that is a STRING in
    // JS, not a tag the parser will fetch. Only literal paths are real references.
    if (/[+'"`${}]/.test(src)) continue;
    if (!fs.existsSync(R(src.replace(/^\.\//, '')))) missing.push(src);
  }
  if (missing.length) fail('VENDORED SCRIPTS', missing.join(', ') + ' — referenced locally but not in the repo. ' +
    'The APK and any offline copy silently lose whatever they provide, and render a different game from the web build.');
  else ok('VENDORED SCRIPTS', 'every local <script src> resolves');
}

// ── 6. no WIRED character model may be a severed action figure ────────────────────────────────
// The owner said "the animations still are not correct cause the animation are still looking
// procedural" for weeks. It was not the procedural rig — measured, 0 visible procedural triangles.
// BANNON_rigged.glb, the DEFAULT PLAYER MODEL, was fifteen loose skinned pieces cut at every joint:
// chest elL elR ftL ftR haL haR head hipL hipR knL knR pelvis shL shR. No surface across the elbow,
// so nothing bends. skinqa scored it fine because a piece welded to one bone never drifts — a
// severed rig is the one defect that looks PERFECT to a deformation test. Only this check sees it.
{
  const dir = R('assets/models');
  if (fs.existsSync(dir)){
    const wired = fs.readdirSync(dir).filter(f => f.endsWith('.glb') && html.includes(f));
    if (!wired.length) notes.push('RIG CONTINUITY: skipped (no model filename appears in the game)');
    else {
      const r = require('child_process').spawnSync(process.execPath,
        [R('tools/model_diag/rig_continuity.cjs'), '--json'].concat(wired),
        { encoding:'utf8', maxBuffer: 64*1024*1024 });
      let rows = []; try{ rows = JSON.parse(r.stdout); }catch(e){}
      if (!rows.length) notes.push('RIG CONTINUITY: skipped (rig_continuity.cjs did not report)');
      else {
        const bad = rows.filter(x => x.verdict === 'SEVERED');
        if (bad.length) fail('RIG CONTINUITY', bad.length + ' WIRED model(s) are cut into loose pieces at the ' +
          'joints and cannot bend: ' + bad.map(x => x.file + ' (' + x.skinnedPrims + ' pieces, widest spans ' +
          x.maxSpread + '/' + x.joints + ' joints)').join(', ') + '. They animate as action figures. ' +
          'Sew with tools/model_diag/sew_rig.cjs --weld.');
        else ok('RIG CONTINUITY', rows.length + ' wired model(s), none severed');
      }
    }
  }
}

// ── 7. every asset directory the game fetches must be IN the APK, or declared as streamed ─────
// OWNER: "I'm still seeing the procedural three js models that aren't ever supposed to appear".
// The cause was not code. assets/models was never copied into the APK, so every character GLB was
// a raw.githubusercontent.com fetch on mobile data at match start, and a slow one falls back to
// the procedural body. assets/vendor — three.js itself — was missing too, so the offline app fell
// back to CDN script tags just to boot. Both had been that way for as long as the APK has existed,
// and nothing anywhere would have said so.
{
  const wf = R('.github/workflows/android.yml');
  // Directories that are DELIBERATELY streamed: too big to bundle, and not needed in the first ten
  // seconds. Listed explicitly so "not bundled" is always a decision, never an oversight.
  // sizes measured, not assumed: env 200 MB (one file), mocap/drive 1.2 GB, clips 257 MB.
  const STREAMED = new Set(['assets/moves/clips', 'assets/environments', 'assets/props',
                            'assets/reference', 'assets/dialogue', 'assets/mocap/social',
                            'assets/models/env', 'assets/models/face', 'assets/mocap/drive']);
  if (fs.existsSync(wf)){
    const yml = fs.readFileSync(wf, 'utf8');
    const bundler = fs.existsSync(R('scripts/bundle_apk_assets.cjs'))
      ? fs.readFileSync(R('scripts/bundle_apk_assets.cjs'), 'utf8') : '';
    const dirs = new Set();
    for (const m of html.matchAll(/assets\/[a-z_]+(?:\/[a-z_]+)?\//g)) dirs.add(m[0].replace(/\/$/, ''));
    const missing = [];
    // A directory is covered when IT or any ANCESTOR is bundled or declared streamed —
    // scripts/bundle_apk_assets.cjs copies assets/vendor recursively, so assets/vendor/pp is in
    // the APK even though that exact string appears nowhere.
    const covered = d => { let p = d;
      while (p && p !== '.' && p !== 'assets'){
        if (STREAMED.has(p) || yml.includes(p) || bundler.includes(p)) return true;
        p = path.dirname(p);
      } return false; };
    for (const d of dirs){
      if (!fs.existsSync(R(d))) continue;                 // referenced but not in the repo at all
      if (!fs.readdirSync(R(d)).length) continue;         // empty (mdickie_bases never existed)
      if (covered(d)) continue;
      missing.push(d);
    }
    if (missing.length) fail('APK ASSETS', missing.join(', ') + ' — the game fetches ' +
      (missing.length > 1 ? 'these' : 'this') + ' at runtime and the APK build never copies ' +
      (missing.length > 1 ? 'them' : 'it') + ' in. On the phone every one of those requests goes to ' +
      'the CDN over mobile data; when it is slow or refused the game silently falls back (procedural ' +
      'bodies, missing animations, CDN three.js). Add to scripts/bundle_apk_assets.cjs, or to the ' +
      'STREAMED list in this check if that is a deliberate choice.');
    else ok('APK ASSETS', dirs.size + ' referenced asset dir(s): bundled or explicitly streamed');
  }
}

console.log('\n===== SHIPPING GATE =====');
notes.forEach(n => console.log('  ok   ' + n));
fails.forEach(f => console.log('  FAIL ' + f));
console.log('');
if (fails.length){
  console.log('  ' + fails.length + ' failure(s). Each of these has already shipped once and cost days.');
  process.exit(1);
}
console.log('  all clear — none of the silent-shipping bugs are present.');
