#!/usr/bin/env node
/* BANNON STUB SCANNER — flags "fake / lying / shallow" stubs an assistant may have committed
 * (the pattern the owner keeps hitting: a tool that PRINTS success but computes nothing, a function
 * that only console.logs, a mock that fabricates output paths). Report-only by default; --strict makes
 * it exit 1 (used in a PR gate). Skips native/ C++ (cout is legit there) and vendored/build dirs. */
const fs = require('fs');
const path = require('path');

const ROOTS = ['tools', 'src', 'scripts', 'daemon', 'app'];
const SKIP = /node_modules|vendor|dist|build|\.git|pw-browsers|\.min\./;
const EXT = /\.(py|cjs|js|mjs|ts|tsx)$/;

// telltales of a fake/lying stub
const RED = [
  /\bmock (script|extract|impl|implementation|data)\b/i,
  /print\((['"]).*(Extracted|Cataloging|Initializing|Wired|Done)[^)]*\1\)/i,   // print-only "work"
  /throw new Error\(['"](not implemented|todo|stub|unimplemented)/i,
  /\breturn (null|\{\}|\[\]);?\s*\/\/\s*(stub|todo|mock|placeholder)/i,
  /#\s*(mock|stub|fake|placeholder)\b/i,
  /\/\/\s*(TODO: implement|FIXME: implement|stub only|fake impl)/i,
  /\bnp\.random\b.*#.*(ik|rig|skin|weight)/i,
];

function scan(file) {
  let src; try { src = fs.readFileSync(file, 'utf8'); } catch (e) { return []; }
  const lines = src.split('\n'); const hits = [];
  lines.forEach((ln, i) => { for (const r of RED) if (r.test(ln)) { hits.push({ line: i + 1, text: ln.trim().slice(0, 100) }); break; } });
  // whole-file heuristic: a python module whose ONLY real statements are print/json.dump (a "narrative mock")
  if (/\.py$/.test(file)) {
    const code = lines.filter(l => l.trim() && !l.trim().startsWith('#'));
    const printy = code.filter(l => /^\s*(print\(|json\.dump|f\.write\()/.test(l)).length;
    const real = code.filter(l => /=|def |class |import |for |while |if |return |with /.test(l)).length;
    if (code.length > 6 && printy >= 3 && printy >= real * 0.6 && !/UnityPy|struct|numpy|open\(.+rb/.test(src))
      hits.push({ line: 1, text: 'FILE looks like a print-only narrative mock (mostly print/json.dump, no real compute)' });
  }
  return hits;
}

function walk(dir, out) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name); if (SKIP.test(p)) continue;
    if (e.isDirectory()) walk(p, out); else if (EXT.test(e.name)) out.push(p);
  }
}

const files = []; for (const r of ROOTS) walk(r, files);
let total = 0; const report = [];
for (const f of files) { const h = scan(f); if (h.length) { total += h.length; report.push({ f, h }); } }

if (report.length) {
  console.log(`\n⚠ STUB SCAN — ${total} suspicious line(s) in ${report.length} file(s):\n`);
  for (const { f, h } of report) { console.log('  ' + f); for (const x of h) console.log(`    :${x.line}  ${x.text}`); }
  console.log('\nIf any of these are real fake/lying stubs, replace them with a working implementation.\n');
} else {
  console.log('✓ stub scan clean — no fake/lying-stub patterns found.');
}
process.exit(process.argv.includes('--strict') && report.length ? 1 : 0);
