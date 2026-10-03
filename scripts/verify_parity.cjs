#!/usr/bin/env node
/* BANNON BUILD PARITY — prove the HTML, the APK and the website all carry the SAME game.
 *
 *   node scripts/verify_parity.cjs
 *
 * Owner requirement (2026-07-25): "make sure all these things are hooking up to all testable and
 * playable versions of the game so the html and the app and the web all have all the same features
 * wired in after every push."
 *
 * There are three playable surfaces and they must never drift:
 *   1. BANNON_v150.html  — the source of truth, and what you open locally
 *   2. index.html + public/index.html — what GitHub Pages serves (the web build)
 *   3. the APK — android.yml stamps BANNON_v150.html and bundles it as assets/index.html
 * Drift here is silent and nasty: a feature lands in one surface, you play a different one, and it
 * looks like the work was never done.
 *
 * Exits NON-ZERO on drift, so it can gate a push.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'BANNON_v150.html');
const MIRRORS = [path.join(ROOT, 'index.html'), path.join(ROOT, 'public', 'index.html')];

let fail = 0;
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

console.log('BANNON BUILD PARITY');
console.log('='.repeat(64));

if (!fs.existsSync(SRC)) { console.error('::error:: BANNON_v150.html missing'); process.exit(1); }
const srcHash = sha(SRC);
const srcText = fs.readFileSync(SRC, 'utf8');
console.log('source  BANNON_v150.html  ' + (fs.statSync(SRC).size / 1e6).toFixed(2) + ' MB  ' + srcHash.slice(0, 12));

// 1. the web mirrors must be byte-identical to the source
for (const m of MIRRORS) {
  const rel = path.relative(ROOT, m);
  if (!fs.existsSync(m)) { console.log('  FAIL ' + rel + ' MISSING'); fail++; continue; }
  const h = sha(m);
  if (h !== srcHash) {
    console.log('  FAIL ' + rel + ' DRIFTED (' + h.slice(0, 12) + ' != ' + srcHash.slice(0, 12) + ')');
    fail++;
  } else console.log('  ok   ' + rel + ' identical');
}

// 2. the feature modules — every end-of-file system must be present in the source that ships everywhere
const FEATURES = [
  'BANNON_MOCAP', 'BANNON_MOVESET_LIB', 'BANNON_CAW_FRONT', 'BANNON_CREATION_SUITE',
  'BANNON_GNM_FACE', 'BANNON_VENUES', 'BANNON_OTA', 'BANNON_MDICKIE', 'BANNON_TRAVEL',
  'BANNON_CARDS', 'BANNON_TRAUMA', 'BANNON_RIGS', 'BANNON_IMPACT', 'BANNON_EVENTBUS',
  'BANNON_WEAPONS', 'BANNON_WORLD', 'BANNON_STORY', 'BANNON_CAREER', 'crowdReaction',
  'refreshMoveLibrary', 'BANNON_LIFT_CHECK'
];
console.log('\nfeature modules in the shipped source:');
const missing = FEATURES.filter(f => !srcText.includes(f));
FEATURES.forEach(f => { if (srcText.includes(f)) process.stdout.write(''); });
if (missing.length) { console.log('  FAIL missing: ' + missing.join(', ')); fail++; }
else console.log('  ok   all ' + FEATURES.length + ' present');

// 3. the APK bundles the STAMPED source (android.yml), not some other file
const ay = path.join(ROOT, '.github', 'workflows', 'android.yml');
if (fs.existsSync(ay)) {
  const t = fs.readFileSync(ay, 'utf8');
  const stamps = /sed .*__BANNON_BUILD__.*BANNON_v150\.html\s*>\s*BANNON_v150\.stamped\.html/.test(t);
  const bundles = /cp BANNON_v150\.stamped\.html \$A\/index\.html/.test(t);
  console.log('\nAPK (android.yml):');
  console.log('  ' + (stamps ? 'ok  ' : 'FAIL') + ' stamps the build number into BANNON_v150.html');
  console.log('  ' + (bundles ? 'ok  ' : 'FAIL') + ' bundles the stamped file as the app\'s index.html');
  if (!stamps || !bundles) fail++;
} else { console.log('\n::warning:: android.yml missing'); }

// 4. Pages serves the same source
const py = path.join(ROOT, '.github', 'workflows', 'pages.yml');
if (fs.existsSync(py)) {
  const t = fs.readFileSync(py, 'utf8');
  const ok = /cp BANNON_v150\.html _site\/index\.html/.test(t);
  console.log('\nWEB (pages.yml):');
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' deploys BANNON_v150.html as the site index');
  if (!ok) fail++;
} else { console.log('\n::warning:: pages.yml missing'); }

console.log('\n' + (fail ? 'PARITY BROKEN — ' + fail + ' problem(s). Run: cp BANNON_v150.html index.html && cp BANNON_v150.html public/index.html'
                        : 'PARITY OK — html, app and web all ship the same game.'));
process.exit(fail ? 1 : 0);
