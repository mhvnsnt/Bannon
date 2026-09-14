#!/usr/bin/env node
/**
 * Dependency graph for the single-file web engine.
 *
 * WHY. BANNON_v150.html is ~60,000 lines in one file. Splitting it by intuition
 * is how a working engine gets broken; the only safe first extraction is the one
 * the DATA says has the fewest inbound edges. This measures that instead of
 * guessing, per the project's standing rule.
 *
 * WHAT IT MEASURES. Top-level `window.BANNON_*` modules are the file's own
 * declared seams — the engine already namespaces its subsystems that way. For
 * each one this counts how many OTHER modules reference it (inbound = how much
 * would break if it moved) and how many it references (outbound = how much it
 * needs to take with it).
 *
 * COMMENTS AND STRINGS ARE STRIPPED FIRST, and that is not a detail. Measured
 * on the real file: with them counted, EVERY module had at least one inbound
 * edge and the tool reported no safe extraction existed. Checking three by hand
 * showed all their "edges" were a `//` comment and two `console.log` strings —
 * i.e. real leaves, hidden by the instrument. An over-counting measure is not
 * "safe"; it produced exactly the wrong answer.
 *
 * WHAT IT STILL DOES NOT DO, AND THIS BOUNDS HOW MUCH TO TRUST IT. A module's
 * span is taken as "its declaration line to the next declaration line". That is
 * LINE-BASED, NOT SCOPE-BASED, so ordinary engine code sitting after a
 * declaration is attributed to it and can manufacture an edge that no function
 * actually has. Measured consequence: no module reports zero inbound, yet
 * BANNON_MOVESET_STUDIO, BANNON_EDITOR and BANNON_STATS were each checked by
 * hand and had no real referencing code at all.
 *
 * SO: TREAT THE RANKING AS A SHORTLIST, NOT A VERDICT. The ordering is useful —
 * a module with one apparent edge really is more isolated than one with
 * nineteen. Every candidate's remaining edges must still be read by hand before
 * extraction. A proper answer needs a real JS parser; this is a cheap
 * approximation that says so.
 */
const fs = require('fs');
const path = require('path');

// Flags must not be mistaken for the path — `--json` alone was being opened as
// a filename.
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const file = args[0] || path.resolve(__dirname, '..', 'BANNON_v150.html');
const raw = fs.readFileSync(file, 'utf8');

/**
 * Blanks comments and string literals, preserving newlines so every line number
 * stays true. Replacing with spaces rather than deleting is what keeps the
 * declaration line numbers usable afterwards.
 */
function stripCommentsAndStrings(text) {
  const out = text.split('');
  let i = 0;
  const blank = (from, to) => {
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (two === '//') {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? text.length : end;
      blank(i, stop); i = stop; continue;
    }
    if (two === '/*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      blank(i, stop); i = stop; continue;
    }
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === '\\') { j += 2; continue; }
        if (text[j] === c) { j += 1; break; }
        // A template literal may span lines; a quoted string may not.
        if (c !== '`' && text[j] === '\n') break;
        j += 1;
      }
      blank(i, j); i = j; continue;
    }
    i += 1;
  }
  return out.join('');
}

const src = stripCommentsAndStrings(raw);
const lines = src.split('\n');

// Declaration sites: `window.BANNON_X = ` — an assignment, not a reference.
const declRe = /window\.(BANNON_[A-Z0-9_]+)\s*=/g;
const modules = new Map();
let m;
while ((m = declRe.exec(src)) !== null) {
  const name = m[1];
  const line = src.slice(0, m.index).split('\n').length;
  if (!modules.has(name)) modules.set(name, { name, declaredAt: [], size: 0 });
  modules.get(name).declaredAt.push(line);
}

if (modules.size === 0) {
  console.error('no window.BANNON_* modules found — wrong file?');
  process.exit(1);
}

const names = [...modules.keys()];

// Approximate each module's span as declaration line -> next declaration line.
const allDecls = [];
for (const mod of modules.values()) for (const l of mod.declaredAt) allDecls.push({ name: mod.name, line: l });
allDecls.sort((a, b) => a.line - b.line);
for (let i = 0; i < allDecls.length; i++) {
  const end = i + 1 < allDecls.length ? allDecls[i + 1].line : lines.length;
  modules.get(allDecls[i].name).size += Math.max(0, end - allDecls[i].line);
}

// Edges: a reference to B inside A's span, excluding A's own declarations.
const edges = new Map(names.map((n) => [n, new Set()]));
for (let i = 0; i < allDecls.length; i++) {
  const owner = allDecls[i].name;
  const start = allDecls[i].line;
  const end = i + 1 < allDecls.length ? allDecls[i + 1].line : lines.length;
  const body = lines.slice(start, end).join('\n');
  for (const other of names) {
    if (other === owner) continue;
    // Word boundaries, not substring. BANNON_TRON is a prefix of
    // BANNON_TRON_STUDIO, so a plain includes() counted every mention of the
    // longer module as a reference to the shorter one and inflated its inbound
    // count — which is how a real leaf gets hidden.
    if (referenceRe(other).test(body)) edges.get(owner).add(other);
  }
}

/** Matches the module name only as a whole identifier. */
function referenceRe(name) {
  return new RegExp(`(?<![A-Za-z0-9_])${name}(?![A-Za-z0-9_])`);
}

const inbound = new Map(names.map((n) => [n, 0]));
for (const [, outs] of edges) for (const o of outs) inbound.set(o, inbound.get(o) + 1);

const rows = names.map((n) => ({
  name: n,
  lines: modules.get(n).size,
  out: edges.get(n).size,
  in: inbound.get(n),
  score: inbound.get(n) + edges.get(n).size,
})).sort((a, b) => a.score - b.score || a.lines - b.lines);

console.log(`FILE: ${path.basename(file)}  ${lines.length} lines  ${names.length} window.BANNON_* modules\n`);
console.log('EXTRACTION ORDER — fewest total edges first. `in` is what breaks if it moves.\n');
console.log('  ' + 'MODULE'.padEnd(30) + 'LINES'.padStart(7) + 'IN'.padStart(5) + 'OUT'.padStart(5) + '  DEPENDS ON');
for (const r of rows) {
  const deps = [...edges.get(r.name)].sort();
  const shown = deps.length > 4 ? `${deps.slice(0, 4).join(', ')} +${deps.length - 4}` : deps.join(', ');
  console.log('  ' + r.name.padEnd(30) + String(r.lines).padStart(7) + String(r.in).padStart(5) +
    String(r.out).padStart(5) + '  ' + (shown || '(nothing)'));
}

const shortlist = rows.filter((r) => r.in <= 1);
console.log(`\nSHORTLIST (${shortlist.length} modules with <= 1 apparent inbound edge).`);
console.log('Span attribution is line-based, so these counts are an UPPER BOUND —');
console.log('read each remaining edge by hand before extracting. Three spot-checked');
console.log('so far had no real referencing code at all.\n');
for (const r of shortlist.slice(0, 15)) {
  const deps = [...edges.get(r.name)].sort().join(', ') || '(nothing)';
  console.log(`  ${r.name.padEnd(28)} ${String(r.lines).padStart(6)} lines  needs: ${deps}`);
}

const hubs = rows.filter((r) => r.in >= 8).sort((a, b) => b.in - a.in);
console.log(`\nHUBS (${hubs.length}) — extract LAST. Moving one of these touches everything:`);
for (const r of hubs) {
  console.log(`  ${r.name.padEnd(28)} ${String(r.in).padStart(3)} inbound, ${String(r.lines).padStart(6)} lines`);
}

if (process.argv.includes('--json')) {
  const out = {
    file: path.basename(file), totalLines: lines.length, moduleCount: names.length,
    modules: rows.map((r) => ({ ...r, dependsOn: [...edges.get(r.name)].sort() })),
  };
  fs.writeFileSync('web_module_graph.json', JSON.stringify(out, null, 2) + '\n');
  console.log('\nwrote web_module_graph.json');
}
