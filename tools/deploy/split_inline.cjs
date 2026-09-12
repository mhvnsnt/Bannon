#!/usr/bin/env node
/*
 * split_inline.cjs — take the single-file game and emit a version whose JS loads externally.
 *
 * WHY: the owner reports "slow load of everything still". Measured on a 4x-throttled phone-shaped
 * viewport: the HTML itself downloads in 561 ms, and domInteractive lands at 32,288 ms. Thirty-one
 * seconds between the bytes arriving and the page being interactive, with 70% of the load profile in
 * "(program)" — V8 parsing and compiling 2.59 MB of inline script across 161 blocks, serially, while
 * the HTML parser sits and waits because an inline <script> blocks parsing until it has run.
 *
 * External scripts change that in three ways that matter on a phone:
 *   1. the browser can fetch and COMPILE them off the parser's critical path
 *   2. V8's code cache can persist compiled bytecode across loads — an inline script in a 3 MB
 *      document gets far worse cache treatment
 *   3. the document itself becomes small enough to parse and paint immediately
 *
 * WHY IT IS A BUILD STEP AND NOT A REFACTOR OF THE SOURCE: BANNON_v150.html being one file is
 * deliberate and load-bearing — the APK ships it over file://, and the OTA updater swaps ONE file to
 * push an update without a reinstall. Splitting the source would break both. So the source stays
 * single-file and this produces a split BUILD, the same way the APK and dist/ are builds.
 *
 * ORDER IS PRESERVED EXACTLY. Inline scripts run in document order and later blocks depend on
 * earlier ones (the whole engine is one long chain of globals). Each block becomes an external file
 * emitted in the same position, and NOTHING is marked defer or async — deferring would reorder
 * execution relative to the remaining inline blocks and the document.write fallbacks, which is how
 * you turn a slow game into a broken one.
 *
 *   node tools/deploy/split_inline.cjs                       # -> dist/split/
 *   node tools/deploy/split_inline.cjs --out web/ --min 4096
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const SRC = path.join(REPO, 'BANNON_v150.html');
const argv = process.argv.slice(2);
const flag = (k, d) => { const a = argv.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const OUT = path.resolve(REPO, flag('out', 'dist/split'));
// Only blocks above this size are worth externalising; a 200-byte block costs more as a request than
// it saves in compile time.
const MIN = parseInt(flag('min', '8192'), 10);

const src = fs.readFileSync(SRC, 'utf8');

// Walk the document for <script> tags with no src. A regex over 3 MB is fine here because the shape
// is simple, but the CLOSING tag has to be found by scanning rather than by a lazy match: the file
// contains document.write('<script src=...><\/script>') string literals, and a naive match would cut
// a block in half at one of those.
const out = [];
let i = 0, n = 0, externalised = 0, bytes = 0;
const files = [];

while (true) {
  const open = src.indexOf('<script', i);
  if (open < 0) { out.push(src.slice(i)); break; }
  const gt = src.indexOf('>', open);
  if (gt < 0) { out.push(src.slice(i)); break; }
  const tag = src.slice(open, gt + 1);
  // an escaped closer inside a JS string is written <\/script>, so the real one is the first
  // UNESCAPED occurrence
  let close = src.indexOf('</script>', gt);
  while (close > 0 && src[close - 1] === '\\') close = src.indexOf('</script>', close + 1);
  if (close < 0) { out.push(src.slice(i)); break; }

  const body = src.slice(gt + 1, close);
  out.push(src.slice(i, open));

  if (/\bsrc\s*=/.test(tag) || body.length < MIN) {
    out.push(src.slice(open, close + 9));          // leave it exactly as it was
  } else {
    n++;
    const name = 'b' + String(n).padStart(3, '0') + '.js';
    files.push([name, body]);
    bytes += body.length;
    externalised++;
    // no defer, no async, no type=module — execution order must match the original document
    const attrs = tag.slice(7, -1).trim();
    out.push('<script src="js/' + name + '"' + (attrs ? ' ' + attrs : '') + '></script>');
  }
  i = close + 9;
}

if (!externalised) {
  console.log('nothing above ' + MIN + ' bytes to externalise');
  process.exit(0);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
// --profile wraps each block in a timer, so a slow boot can be attributed to the exact block that
// is spending the time instead of guessed at. I burned a lot of this session eliminating suspects
// one at a time — parse, canvas, shaders — and accounting for only 4 of 26 seconds. Measure first.
const PROFILE = argv.includes('--profile');
for (const [name, body] of files) {
  const text = PROFILE
    ? '(function(){var __t0=performance.now();try{\n' + body +
      '\n}finally{(window.__BOOT=window.__BOOT||[]).push(["' + name + '",+(performance.now()-__t0).toFixed(1)]);}})();'
    : body;
  fs.writeFileSync(path.join(OUT, 'js', name), text);
}
const html = out.join('');
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// the split build needs the assets next to it; symlink rather than copy so this stays cheap
for (const dir of ['assets', 'dist']) {
  const from = path.join(REPO, dir), to = path.join(OUT, dir);
  if (fs.existsSync(from) && !fs.existsSync(to)) {
    try { fs.symlinkSync(from, to, 'dir'); } catch (e) { /* windows / no perms: copy is the caller's job */ }
  }
}

console.log('split ' + externalised + ' inline block(s) out of ' + SRC.split('/').pop());
console.log('  document ' + (src.length / 1048576).toFixed(2) + ' MB -> ' + (html.length / 1024).toFixed(0) + ' KB');
console.log('  externalised ' + (bytes / 1048576).toFixed(2) + ' MB into ' + files.length + ' files under ' + path.relative(REPO, OUT) + '/js/');
console.log('  execution order preserved: no defer, no async, blocks emitted in place');
