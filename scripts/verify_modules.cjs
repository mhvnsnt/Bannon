#!/usr/bin/env node
/* BANNON MODULE RUNTIME GATE — actually EXECUTE every end-of-file module, don't just parse it.
 *
 *   node scripts/verify_modules.cjs
 *
 * WHY: the syntax gate (new Function(src)) only proves a block PARSES. It cannot catch a
 * ReferenceError, which is what a stale identifier produces — and that is a whole-module killer,
 * because these systems are IIFEs: one bad reference and the entire module throws at load, silently,
 * leaving the feature simply absent with no error anyone sees.
 *
 * That is not hypothetical. Refactoring BANNON_FLOW's cadence system left the export line still
 * referencing the removed BEAT_EARLY/BEAT_LATE constants. It PARSED perfectly. At runtime it threw
 * ReferenceError: BEAT_EARLY is not defined, which would have killed the entire rhythm-combat system
 * on load while every other check reported green.
 *
 * This runs each module in a stubbed DOM/window and reports anything that throws.
 * Exit non-zero if any module fails to initialise.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.join(__dirname, '..', 'BANNON_v150.html');
const src = fs.readFileSync(FILE, 'utf8');

// the guaranteed-running end-of-file systems, by the marker each one logs/declares
const MODULES = [
  'BANNON_MOCAP', 'BANNON_MOVESET_LIB', 'BANNON_CAW_FRONT', 'BANNON_CREATION_SUITE',
  'BANNON_VENUES', 'BANNON_MDICKIE', 'BANNON_TRAVEL', 'BANNON_CARDS', 'BANNON_TRAUMA',
  'BANNON_RIGS', 'BANNON_IMPACT', 'BANNON_FLOW', 'BANNON_SHOTCALLER', 'BANNON_MOVEPOOL',
  'BANNON_INTERFERENCE', 'BANNON_SEGMENT', 'BANNON_COMBAT_MOCAP', 'BANNON_MOVESET_SLOTS', 'BANNON_BASES', 'BANNON_COMBO', 'BANNON_PROCGEN', 'BANNON_AUTHORED', 'BANNON_VARIANTS', 'BANNON_LEGAL', 'BANNON_LIFE', 'BANNON_LIFE_UI', 'BANNON_MOVE_VARIANTS', 'BANNON_PINS', 'BANNON_MOVESET_STUDIO', 'BANNON_REACH', 'BANNON_GRID', 'BANNON_ROAMFREE', 'BANNON_PERF', 'BANNON_ROSTER_MOVESETS', 'BANNON_PAYBACKS', 'BANNON_CLIP_ROTATE', 'BANNON_SHOWTIME', 'BANNON_SEASON', 'BANNON_TAG', 'BANNON_ROSTER', 'BANNON_SAVES', 'BANNON_STIP', 'BANNON_OWNER_MOVES', 'BANNON_WARM', 'BANNON_GFX', 'BANNON_PREWARM', 'BANNON_BRIDGE', 'BANNON_PANELS', 'BANNON_STYLE', 'BANNON_WALKOUT'
];

function stubContext() {
  const noop = () => {};
  const el = () => ({
    style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop, removeEventListener: noop, appendChild: noop, removeChild: noop,
    insertBefore: noop, remove: noop, querySelectorAll: () => [], querySelector: () => null,
    setAttribute: noop, getAttribute: () => null, focus: noop, click: noop,
    innerHTML: '', textContent: '', value: '', parentElement: null, children: []
  });
  const doc = {
    createElement: el, createElementNS: el, body: el(), documentElement: el(),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: noop, removeEventListener: noop, cookie: ''
  };
  const store = {};
  const ctx = {
    console: { log: noop, warn: noop, error: noop, info: noop },
    document: doc,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
    location: { protocol: 'file:', href: 'file:///x', reload: noop },
    navigator: { userAgent: 'node' },
    announce: noop, addEvent: noop, alert: noop,
    Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, Promise, isNaN, isFinite,
    parseInt, parseFloat, encodeURIComponent, decodeURIComponent
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  return vm.createContext(ctx);
}

let failed = 0, ran = 0;
console.log('BANNON MODULE RUNTIME GATE');
console.log('='.repeat(64));

for (const name of MODULES) {
  // find the module's own <script> block: the marker appears inside it
  const idx = src.indexOf(name);
  if (idx < 0) { console.log('  SKIP ' + name + ' (not present)'); continue; }
  // Find the block that ASSIGNS the module, not one that merely mentions it. A plain
  // lastIndexOf('window.' + name) is wrong two ways: it matches references (BANNON_GODWITHIN's patch
  // does `if(window.BANNON_LIFE)`), and it matches LONGER NAMES BY PREFIX — `window.BANNON_LIFE_UI`
  // contains `window.BANNON_LIFE`, so BANNON_LIFE was graded against the UI's script block and
  // reported "ran but did not define itself" while being perfectly fine.
  const assign = new RegExp('window\\.' + name + '\\s*=(?!=)', 'g');
  let defIdx = -1, m;
  while ((m = assign.exec(src)) !== null) defIdx = m.index;   // last real assignment wins
  if (defIdx < 0) defIdx = idx;
  const start = src.lastIndexOf('<script>', defIdx);
  const end = src.indexOf('</script>', defIdx);
  if (start < 0 || end < 0) { console.log('  SKIP ' + name + ' (no enclosing script block)'); continue; }
  const code = src.slice(start + 8, end);
  const ctx = stubContext();
  ran++;
  try {
    vm.runInContext(code, ctx, { timeout: 5000, filename: name + '.js' });
    const defined = typeof ctx[name] !== 'undefined' || typeof ctx.window[name] !== 'undefined';
    console.log('  ' + (defined ? 'ok  ' : 'warn') + ' ' + name + (defined ? ' initialised' : ' ran but did not define itself'));
  } catch (e) {
    console.log('  FAIL ' + name + ' threw at load: ' + String(e.message).split('\n')[0]);
    failed++;
  }
}

console.log('\n' + (failed
  ? 'RUNTIME GATE FAILED — ' + failed + ' of ' + ran + ' modules throw at load (the feature would be silently absent).'
  : 'RUNTIME GATE OK — all ' + ran + ' modules initialise without throwing.'));
process.exit(failed ? 1 : 0);
