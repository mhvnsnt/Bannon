#!/usr/bin/env node
/**
 * Builds the shipped single-file engine from source + extracted modules.
 *
 * WHY THIS EXISTS. `BANNON_v150.html` is ~60,000 lines and wants splitting, but
 * BOTH delivery paths assume exactly one file:
 *
 *   OTA  android.yml copies BANNON_v150.stamped.html -> dist/BANNON.html, and
 *        the in-game updater downloads that ONE file and swaps it in.
 *   APK  scripts/bundle_apk_assets.cjs copies a FIXED directory list; `src/`
 *        is not in it and would not be bundled.
 *
 * So a plain `<script src="src/modules/x.js">` 404s twice — absent from the APK
 * and never delivered by an OTA update. It would work perfectly served from the
 * repo and vanish on the phone: the same failure already recorded as "the APK
 * had no models in it".
 *
 * THE CONTRACT. Developers edit `src/modules/*.js`. This concatenates them back
 * into a single `BANNON_v150.html`, so the OTA swap, the cold-launch
 * document.write bootstrap and the APK bundle keep working untouched.
 *
 *   node scripts/build_web.cjs            build
 *   node scripts/build_web.cjs --check    fail if the committed file is stale
 *
 * THE GATE THAT MAKES IT TRUSTWORTHY. With no module extracted, the output must
 * be BYTE-IDENTICAL to the file that shipped before this script existed. A build
 * step is only safe to hand real splits once it has been proven a no-op.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const SRC = path.join(ROOT, 'BANNON_v150.src.html');
const OUT = path.join(ROOT, 'BANNON_v150.html');
const MODULES = path.join(ROOT, 'src', 'modules');

/**
 * The marker sits on its own line and is consumed WITH its trailing newline, so
 * zero modules produces zero bytes rather than a stray blank line. That is what
 * makes the empty build byte-identical rather than merely equivalent.
 */
const MARKER = '<!--@BANNON_MODULES@-->\n';

/**
 * Concatenation order comes from the MANIFEST, never from readdir.
 *
 * Filesystem enumeration order varies by filesystem and is not a contract, and
 * a module must be spliced back in the order it was extracted or execution
 * order changes. The manifest is the authority; a `.js` present on disk but
 * absent from it is an error rather than something silently appended, because a
 * module that lands in the wrong place is far worse than one that fails loudly.
 */
function moduleFiles() {
  if (!fs.existsSync(MODULES)) return [];
  const manifestPath = path.join(MODULES, 'manifest.json');
  const onDisk = fs.readdirSync(MODULES).filter((f) => f.endsWith('.js')).sort();

  if (!fs.existsSync(manifestPath)) {
    if (onDisk.length === 0) return [];
    console.error(`src/modules holds ${onDisk.length} module(s) but no manifest.json — refusing to guess an order.`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const ordered = (manifest.modules || []).map((m) => m.file);

  const missing = ordered.filter((f) => !onDisk.includes(f));
  if (missing.length) {
    console.error(`manifest names module(s) not on disk: ${missing.join(', ')}`);
    process.exit(1);
  }
  const unlisted = onDisk.filter((f) => !ordered.includes(f));
  if (unlisted.length) {
    console.error(`module(s) on disk but not in manifest.json: ${unlisted.join(', ')}`);
    console.error('Add them with an explicit position — order is a decision, not a directory listing.');
    process.exit(1);
  }
  return ordered.map((f) => path.join(MODULES, f));
}

function build() {
  if (!fs.existsSync(SRC)) {
    console.error(`missing ${path.relative(ROOT, SRC)} — nothing to build from.`);
    process.exit(1);
  }
  const src = fs.readFileSync(SRC, 'utf8');
  if (!src.includes(MARKER)) {
    console.error(`source has no ${MARKER.trim()} marker — refusing to guess where modules go.`);
    process.exit(1);
  }

  const files = moduleFiles();
  // INJECTED RAW, NOT WRAPPED IN <script>. Two reasons, both load-bearing:
  //   1. ORDER. A module is spliced back exactly where it was, so execution
  //      order is unchanged. Injecting at some other point in the file would
  //      run it before the engine it may need.
  //   2. LEXICAL SCOPE. The engine's top-level `let fighters` is a LEXICAL
  //      binding — it is not on `window`, and a separate <script> block cannot
  //      see it (already recorded in CLAUDE.md). Opening a new block here would
  //      split the surrounding one and cut every later statement off from it.
  // The consequence is that the round trip is byte-exact, which is what makes
  // the extraction provably lossless rather than merely plausible.
  const injected = files.map((f) => fs.readFileSync(f, 'utf8')).join('');

  const out = src.replace(MARKER, injected);
  return { out, files };
}

const { out, files } = build();

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (current === out) {
    console.log(`BUILD UP TO DATE — ${files.length} module(s), ${out.split('\n').length} lines`);
    process.exit(0);
  }
  console.error('BANNON_v150.html IS STALE — it does not match a fresh build.');
  console.error('Run: node scripts/build_web.cjs');
  if (current !== null) {
    const a = current.split('\n');
    const b = out.split('\n');
    console.error(`  committed ${a.length} lines, fresh build ${b.length} lines`);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) { console.error(`  first difference at line ${i + 1}`); break; }
    }
  }
  process.exit(1);
}

fs.writeFileSync(OUT, out);
console.log(`built BANNON_v150.html — ${files.length} module(s) inlined, ${out.split('\n').length} lines`);
for (const f of files) console.log(`  + ${path.relative(ROOT, f)}`);
