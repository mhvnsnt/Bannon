#!/usr/bin/env node
/* BANNON ORPHAN AUDIT — find every exported thing with ZERO callers.
 *
 *   node scripts/orphan_audit.cjs [--json]
 *
 * WHY THIS EXISTS: the single most common defect in this codebase is a fully-written system that
 * nothing ever calls. Real examples already found and fixed by hand:
 *   - BANNON_CAREER.injure()      — a complete persistent-injury model, zero callers, so match damage
 *                                   never became a career injury.
 *   - window.addEvent             — never defined at all, while 37 call sites invoked it behind
 *                                   `if (window.addEvent)`, silently discarding every event.
 *   - triggerCourt / triggerMeeting / postMatchAftermath — real MDickie features, zero callers.
 *   - BANNON_LIFE.meeting() / BANNON_NEWS.generate() — called against APIs that do not exist.
 * Each was invisible: no error, no warning, just a feature that quietly did nothing. Finding them one
 * at a time is luck. This makes it mechanical and repeatable.
 *
 * WHAT IT CHECKS
 *   A. window.X = function        -> is X ever called?
 *   B. module exports (return { a, b, c } inside window.MOD = (function(){...})()) -> is MOD.a ever used?
 *   C. calls to window.Y(...) where Y is NEVER assigned  -> a call into the void (the addEvent class).
 *
 * Heuristic, deliberately: it reports CANDIDATES to look at, and self-hooking modules (setInterval /
 * endMatch wrappers / DOM listeners) legitimately have no direct callers. Exit code is always 0 —
 * this is a report, not a gate, because a false positive must never block a build.
 */
const fs = require('fs');
const path = require('path');

const FILE = process.argv.find(a => a.endsWith('.html')) ||
             path.join(__dirname, '..', 'BANNON_v150.html');
const asJson = process.argv.includes('--json');
const src = fs.readFileSync(FILE, 'utf8');

// strip comments + string literals so matches are real code references, not prose or docs
function strip(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');
}
const code = strip(src);

function countCalls(name) {
  // name( ... )  or  .name( ... )  — any invocation form
  const re = new RegExp('(?:^|[^A-Za-z0-9_$.])' + name.replace(/[$]/g, '\\$') + '\\s*\\(', 'g');
  const dot = new RegExp('\\.' + name.replace(/[$]/g, '\\$') + '\\s*\\(', 'g');
  return (code.match(re) || []).length + (code.match(dot) || []).length;
}
function countRefs(name) {
  const re = new RegExp('(?:^|[^A-Za-z0-9_$.])' + name.replace(/[$]/g, '\\$') + '(?![A-Za-z0-9_$])', 'g');
  return (code.match(re) || []).length;
}

// ── A. window.X = function
const directFns = new Set();
{
  const re = /window\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/g;
  let m; while ((m = re.exec(code))) directFns.add(m[1]);
}

// ── B. module exports: window.MOD = (function(){ ... return { a, b, c } ... })()
const modules = {};
{
  const re = /window\.([A-Za-z_$][\w$]*)\s*=\s*\(function\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    const name = m[1];
    // scan forward for the LAST `return {` before the IIFE closes (best-effort brace walk)
    let i = m.index, depth = 0, end = -1;
    for (let k = m.index; k < code.length; k++) {
      const c = code[k];
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0 && k > m.index + 10) { end = k; break; } }
    }
    if (end < 0) continue;
    const body = code.slice(m.index, end);
    const rets = [...body.matchAll(/return\s*\{([^{}]*)\}/g)];
    if (!rets.length) continue;
    const last = rets[rets.length - 1][1];
    const keys = last.split(',').map(s => s.trim()).filter(Boolean).map(s => {
      const k = s.split(':')[0].trim();
      return /^[A-Za-z_$][\w$]*$/.test(k) ? k : null;
    }).filter(Boolean);
    if (keys.length) modules[name] = keys;
  }
}

// ── C. window.Y(...) called but Y never assigned anywhere
const calledIntoVoid = [];
{
  // Browser/DOM built-ins live on window without us ever assigning them — not orphans.
  const BUILTIN = new Set(['addEventListener','removeEventListener','dispatchEvent','getComputedStyle',
    'requestAnimationFrame','cancelAnimationFrame','setTimeout','setInterval','clearTimeout',
    'clearInterval','fetch','alert','confirm','prompt','open','close','matchMedia','scrollTo','btoa',
    'atob','postMessage','getSelection']);
  const called = new Set();
  const re = /window\.([A-Za-z_$][\w$]*)\s*\(/g;
  let m; while ((m = re.exec(code))) called.add(m[1]);
  for (const name of called) {
    if (BUILTIN.has(name)) continue;
    // Test assignment against the RAW source, not the stripped copy. Checking the stripped copy
    // mis-reported surfaceImpact / equippedClipFor / BANNON_FORGE_LOOP / openMovesetLib as undefined
    // when all four are plainly assigned — a tool that cries wolf is worse than no tool.
    const assigned = new RegExp('window\\.' + name + '\\s*=[^=]').test(src) ||
                     new RegExp('(?:var|let|const|function)\\s+' + name + '\\b').test(src) ||
                     new RegExp('\\b' + name + '\\s*[:=]\\s*function').test(src);
    if (!assigned) calledIntoVoid.push(name);
  }
}

// self-hooking modules legitimately have no direct callers — flag them separately, don't cry wolf
const SELF_HOOK = /setInterval|setTimeout|addEventListener|__traumaHooked|__aftermathHooked|_mdHooked|_cardsHooked/;

const report = { orphanFunctions: [], orphanExports: [], callsIntoVoid: calledIntoVoid.sort() };

for (const fn of [...directFns].sort()) {
  if (countCalls(fn) === 0) report.orphanFunctions.push(fn);
}
for (const [mod, keys] of Object.entries(modules)) {
  const modIdx = code.indexOf('window.' + mod + ' =');
  const bodyGuess = code.slice(modIdx, modIdx + 20000);
  const selfHooks = SELF_HOOK.test(bodyGuess);
  const dead = keys.filter(k => {
    // MOD.key usage anywhere, or the bare function being called internally by another module
    const viaMod = new RegExp('\\b' + mod + '\\s*(?:&&\\s*' + mod + ')?\\s*\\.\\s*' + k + '\\b').test(code);
    if (viaMod) return false;
    return countCalls(k) <= 1;   // <=1 = only its own definition
  });
  if (dead.length) report.orphanExports.push({ module: mod, selfHooking: selfHooks, dead });
}

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

console.log('BANNON ORPHAN AUDIT — ' + path.basename(FILE));
console.log('='.repeat(72));
console.log('\nC. CALLS INTO THE VOID (window.X() invoked but X never assigned) — ' +
            report.callsIntoVoid.length + '\n   These are the addEvent class: silent no-ops, no error, feature simply absent.');
report.callsIntoVoid.forEach(n => console.log('   window.' + n + '()  called ' + countCalls(n) + 'x, never defined'));

console.log('\nA. window.* FUNCTIONS WITH ZERO CALLERS — ' + report.orphanFunctions.length);
report.orphanFunctions.forEach(n => console.log('   window.' + n));

console.log('\nB. MODULE EXPORTS WITH ZERO USAGE — ' +
            report.orphanExports.reduce((s, r) => s + r.dead.length, 0) + ' across ' +
            report.orphanExports.length + ' modules');
report.orphanExports.forEach(r => {
  console.log('   ' + r.module + (r.selfHooking ? '  [self-hooking: some are fine]' : '') +
              '\n      dead: ' + r.dead.join(', '));
});
console.log('\n(report only — exit 0 always; a heuristic must never block a build)');
