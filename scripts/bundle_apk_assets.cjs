#!/usr/bin/env node
/* bundle_apk_assets.cjs — PUT THE GAME'S ASSETS INSIDE THE GAME.
 *
 *   node scripts/bundle_apk_assets.cjs <stamped.html> <android/app/src/main/assets>
 *   node scripts/bundle_apk_assets.cjs --report        # what would be bundled, and what streams
 *
 * OWNER: "I'm still seeing the procedural three js models that aren't ever supposed to appear
 * unless selected."
 *
 * Not a bug in the procedural ban, and not a bug in the loader. THE MODELS ARE NOT ON THE PHONE.
 * The APK bundle step copied index.html, manifest.json, icons, assets/moves, assets/mocap and
 * assets/audio — and NOTHING ELSE. assets/models was never in the list. Every character GLB was a
 * multi-megabyte fetch from raw.githubusercontent.com, on mobile data, at the exact moment a match
 * starts. When that is slow or refused the loader falls back to the procedural body, which is
 * precisely what he keeps seeing. Bundling was never a size problem: the 59 WIRED models total
 * 36.6 MB. The 3.6 GB in assets/models is intermediates and backups, not what the game loads.
 *
 * assets/vendor was missing too, and that one is worse: it holds three.js, GLTFLoader, FBXLoader,
 * the post-processing chain and the meshopt decoder. They were vendored specifically so the engine
 * is not hostage to the network — and then the APK shipped without them, so every launch fell back
 * to the CDN tags to boot at all.
 *
 * WHAT GETS BUNDLED, and why each one:
 *   assets/vendor      the engine itself. Nothing works before these parse.
 *   assets/ring        ring textures — small, and visible in every single match.
 *   assets/models      only the GLBs whose filename actually appears in the shipped HTML. Wiring is
 *                      the test, not the directory listing, or the APK carries 3.6 GB of workbench.
 *   assets/moves/clips only the captures named by combat_clip_map.json — the ones a strike or a
 *                      grapple reaches on the hot path. 27 clips, 7.6 MB.
 * WHAT KEEPS STREAMING: the other ~950 clips (257 MB), the tag captures (77 MB — a tag match can
 * afford to wait), environments, props. Those are opt-in content, not the first ten seconds.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.dirname(__dirname);
const REPORT = process.argv.includes('--report');
const HTML_IN = process.argv[2] || path.join(ROOT, 'BANNON_v150.html');
const DEST    = process.argv[3] || path.join(ROOT, 'android/app/src/main/assets');

const R = p => path.join(ROOT, p);
const key = n => String(n).toUpperCase().replace(/[^A-Z0-9]/g, '_');
const MB = b => (b / 1048576).toFixed(1) + ' MB';

const html = fs.readFileSync(fs.existsSync(HTML_IN) ? HTML_IN : R('BANNON_v150.html'), 'utf8');

function walkFiles(dir, out){
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes:true })){
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out); else out.push(p);
  }
  return out;
}

// ── pick the files ────────────────────────────────────────────────────────────────────────────
const picks = [];      // {rel, bytes}
const seenRel = new Set();
const add = rel => { const abs = R(rel);
  if (seenRel.has(rel)) return;                      // a JSON can be both named and inside a copied dir
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()){
    seenRel.add(rel); picks.push({ rel, bytes: fs.statSync(abs).size }); } };

// assets/models/props are the weapons and furniture a stipulation match spawns (chair, ladder,
// table); assets/models/mdickie_char are base attires. Both are small and both appear DURING a
// match, which is the worst possible moment to discover they are a CDN round trip away.
for (const dir of ['assets/vendor', 'assets/ring', 'assets/models/props',
                   'assets/models/mdickie_char', 'assets/mocap/open'])
  for (const f of walkFiles(R(dir))) add(path.relative(ROOT, f));

// ── EVERY JSON MANIFEST THE GAME NAMES OUT LOUD ───────────────────────────────────────────────
// Found by running the bundle OFFLINE with the internet blocked and reading the 404s: the models
// loaded fine and the game still asked for fbx_move_map.json, bannon_move_library.json,
// mdickie_weapons.json, procedural_clips.json, bannon_dialogue.json and venues.json. Those are
// MANIFESTS — the small files that tell the game what exists — and several live inside directories
// that are deliberately streamed for their bulk (assets/models/env is 200 MB of GLB and one small
// venues.json). Streaming the bulk is right; streaming the index of the bulk is not, because the
// system that reads it goes quiet with no error at all.
// Only paths written LITERALLY in the shipped HTML: 24 files, 4.1 MB. Names built at runtime
// (clips/<MOVE>.json) stay streamed — that is the 250 MB we are deliberately not shipping.
for (const m of html.matchAll(/assets\/[A-Za-z0-9_.\/-]+\.json/g)) add(m[0]);

// models: WIRED ONLY. A filename that never appears in the shipped HTML is not part of the game.
let modelBytes = 0, modelCount = 0;
if (fs.existsSync(R('assets/models'))){
  for (const f of fs.readdirSync(R('assets/models'))){
    if (!f.endsWith('.glb') || !html.includes(f)) continue;
    add('assets/models/' + f); modelCount++;
    modelBytes += fs.statSync(R('assets/models/' + f)).size;
  }
}

// ── EVERY CAPTURE, GZIPPED ────────────────────────────────────────────────────────────────────
// Owner, repeatedly: "none of the hundreds of animations are showing or legible or happening".
// Bundling only the 27 hot ones left 946 captures a CDN round trip away, fired at the instant a
// move plays — and a move lasts a fraction of a second while the fetch does not, so the body
// played nothing and the move looked procedural. MEASURED: 257.2 MB of keyframe JSON gzips to
// 8-9%, about 22 MB, which fits. Nothing is rounded or re-encoded; these are the exact baked bytes,
// just compressed. The game inflates them with fflate, which is already vendored for FBXLoader.
let gzCount = 0, gzRaw = 0, gzOut = 0;
if (!REPORT){
  const dir = R('assets/moves/clips');
  if (fs.existsSync(dir)){
    const outDir = path.join(DEST, 'assets/moves/clips');
    fs.mkdirSync(outDir, { recursive:true });
    for (const f of fs.readdirSync(dir)){
      if (!f.endsWith('.json')) continue;
      const raw = fs.readFileSync(path.join(dir, f));
      const gz = zlib.gzipSync(raw, { level: 9 });
      fs.writeFileSync(path.join(outDir, f + '.gz'), gz);
      gzCount++; gzRaw += raw.length; gzOut += gz.length;
    }
  }
} else {
  const dir = R('assets/moves/clips');
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)){
    if (!f.endsWith('.json')) continue;
    const raw = fs.readFileSync(path.join(dir, f));
    gzCount++; gzRaw += raw.length; gzOut += zlib.gzipSync(raw, { level: 9 }).length;
  }
}

// clips: the hot combat set only, ALSO shipped uncompressed so the very first strike of a match
// never waits on an inflate on a cold main thread
let clipCount = 0, clipBytes = 0;
{
  const dir = R('assets/moves/clips');
  const mapPath = R('assets/moves/combat_clip_map.json');
  if (fs.existsSync(dir) && fs.existsSync(mapPath)){
    const have = {};
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) have[key(f.slice(0,-5))] = f;
    const want = new Set();
    (function walk(o){
      if (typeof o === 'string') want.add(o);
      else if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') Object.values(o).forEach(walk);
    })(JSON.parse(fs.readFileSync(mapPath, 'utf8')));
    const seen = new Set();
    for (const w of want){
      const f = have[key(w)];
      if (!f || seen.has(f)) continue;
      seen.add(f); add('assets/moves/clips/' + f);
      clipCount++; clipBytes += fs.statSync(path.join(dir, f)).size;
    }
  }
}

const total = picks.reduce((n, p) => n + p.bytes, 0);

if (REPORT){
  console.log('\n===== APK ASSET BUNDLE =====');
  console.log('  vendor + ring   ' + picks.filter(p=>/^assets\/(vendor|ring)/.test(p.rel)).length + ' files');
  console.log('  models          ' + modelCount + ' wired GLBs        ' + MB(modelBytes));
  console.log('  combat clips    ' + clipCount + ' captures          ' + MB(clipBytes));
  console.log('  ---------------------------------------------');
  console.log('  all captures    ' + gzCount + ' gzipped          ' + MB(gzRaw) + ' -> ' + MB(gzOut) +
              '  (' + (100*gzOut/Math.max(1,gzRaw)).toFixed(0) + '%)');
  console.log('  ---------------------------------------------');
  console.log('  TOTAL           ' + (picks.length + gzCount) + ' files            ' + MB(total + gzOut));
  console.log('\n  still streamed from the CDN: environments (200 MB), raw mocap FBX (1.2 GB),');
  console.log('  reference art. Every ANIMATION now ships in the package.');
  process.exit(0);
}

// ── copy ──────────────────────────────────────────────────────────────────────────────────────
let copied = 0;
for (const p of picks){
  const dst = path.join(DEST, p.rel);
  fs.mkdirSync(path.dirname(dst), { recursive:true });
  fs.copyFileSync(R(p.rel), dst);
  copied++;
}
console.log('bundled ' + (copied + gzCount) + ' asset files into the APK (' + MB(total + gzOut) + '): ' +
            modelCount + ' wired models, ' + gzCount + ' captures gzipped ' + MB(gzRaw) + ' -> ' + MB(gzOut) +
            ', engine vendor + ring art');
