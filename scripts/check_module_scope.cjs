#!/usr/bin/env node
/**
 * LEXICAL-SCOPE GATE for extracted modules.
 *
 * Dependency independence does NOT authorize relocation. The engine's top-level
 * `let fighters` is a lexical binding — not on `window`, invisible to a separate
 * <script> block — and this file already records that trap. A module can be
 * dependency-clean and still require its exact original position.
 *
 * This classifies a candidate before it is allowed out:
 *   LEXICALLY_ISOLATED         reads nothing lexical from around it
 *   CONTINUOUS_SCOPE_REQUIRED  reads a let/const/class declared outside itself
 *   ORDER_SENSITIVE            runs work at load time rather than only defining
 *   RUNTIME_GLOBAL_DEPENDENT   touches window.* at load time
 *
 * Only LEXICALLY_ISOLATED may be relocated. Everything else must be spliced back
 * exactly where it came from — which is what the marker-in-place design does for
 * every module regardless, so this gate is about knowing WHY, not just that it
 * happens to work.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const SRC = path.join(ROOT, 'BANNON_v150.src.html');
const MODULES = path.join(ROOT, 'src', 'modules');

function stripCommentsAndStrings(text) {
  const out = text.split('');
  let i = 0;
  const blank = (a, b) => { for (let k = a; k < b && k < out.length; k++) if (out[k] !== '\n') out[k] = ' '; };
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (two === '//') { const e = text.indexOf('\n', i); const s = e === -1 ? text.length : e; blank(i, s); i = s; continue; }
    if (two === '/*') { const e = text.indexOf('*/', i + 2); const s = e === -1 ? text.length : e + 2; blank(i, s); i = s; continue; }
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === '\\') { j += 2; continue; }
        if (text[j] === c) { j += 1; break; }
        if (c !== '`' && text[j] === '\n') break;
        j += 1;
      }
      blank(i, j); i = j; continue;
    }
    i += 1;
  }
  return out.join('');
}

const srcRaw = fs.existsSync(SRC) ? fs.readFileSync(SRC, 'utf8') : '';
const src = stripCommentsAndStrings(srcRaw);

// Top-level lexical bindings in the surrounding stream. Indentation is the
// cheap proxy for "top level" here — a nested `let` is not a binding this
// module could reach anyway.
const outerLexical = new Set();
for (const m of src.matchAll(/^(?:let|const|class)\s+([A-Za-z_$][\w$]*)/gm)) outerLexical.add(m[1]);

const files = fs.existsSync(MODULES)
  ? fs.readdirSync(MODULES).filter((f) => f.endsWith('.js')).sort() : [];
if (!files.length) { console.log('no extracted modules — nothing to classify'); process.exit(0); }

let bad = 0;
for (const f of files) {
  const raw = fs.readFileSync(path.join(MODULES, f), 'utf8');
  const body = stripCommentsAndStrings(raw);

  // Identifiers the module declares itself never count as external reads.
  const own = new Set();
  for (const m of body.matchAll(/(?:let|const|var|class|function)\s+([A-Za-z_$][\w$]*)/g)) own.add(m[1]);
  for (const m of body.matchAll(/([A-Za-z_$][\w$]*)\s*(?:,|\))?\s*=>/g)) own.add(m[1]);

  const reads = new Set();
  for (const name of outerLexical) {
    if (own.has(name)) continue;
    if (new RegExp(`(?<![A-Za-z0-9_$.])${name}(?![A-Za-z0-9_$])`).test(body)) reads.add(name);
  }

  // Load-time work vs pure definition. An IIFE that only builds a table of
  // functions is inert; one that calls into the engine is not.
  const windowReads = [...body.matchAll(/window\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1])
    .filter((n) => !raw.includes(`window.${n} =`) && !raw.includes(`window.${n}=`));
  const timers = /\b(setTimeout|setInterval|requestAnimationFrame|addEventListener)\s*\(/.test(body);

  let cls = 'LEXICALLY_ISOLATED';
  if (reads.size) cls = 'CONTINUOUS_SCOPE_REQUIRED';
  else if (timers) cls = 'ORDER_SENSITIVE';
  else if (windowReads.length) cls = 'RUNTIME_GLOBAL_DEPENDENT';

  console.log(`  ${f.padEnd(22)} ${cls}`);
  if (reads.size) { console.log(`      reads outer lexical: ${[...reads].join(', ')}`); bad++; }
  if (windowReads.length) console.log(`      reads window.*: ${[...new Set(windowReads)].join(', ')}`);
  if (timers) console.log('      schedules work at load time');
}

console.log('\nEvery module is spliced back at its ORIGINAL position, so none of the');
console.log('above blocks the build. The classification records WHY a module is safe,');
console.log('so a future relocation is a decision rather than an accident.');
process.exit(bad && process.argv.includes('--strict') ? 1 : 0);
