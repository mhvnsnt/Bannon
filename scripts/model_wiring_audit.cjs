#!/usr/bin/env node
/* BANNON MODEL WIRING AUDIT — does every model the game asks for actually EXIST, and does every
 * character actually HAVE one?
 *
 *   node scripts/model_wiring_audit.cjs [--gate]
 *
 * WHY THIS EXISTS: a model entry that points at a file which was never produced is invisible. The
 * loader fails, retries the CDN, fails again, and quietly restores the procedural body — after
 * _hideProc() has already hidden it, so you get a visible pop and a built-in tube instead of the
 * character. Nothing throws. It looks exactly like "the models aren't loading" with no cause.
 *
 * Worse is a model entry for a character that DOES NOT EXIST. A "v160 UniRig pipeline pass" wired
 * eight of those — GHOST, PHANTOM, DEMON_X, LUNA_VEGA, SAMI_Z, JAXON_RYKER, BIG_BULL, COSMIC_DUST —
 * with no _addChar entry and no GLB on disk. charModelFor() is keyed on a FIGHTER's name, so those
 * entries could never be reached by anything. Pure dead weight that read as real progress.
 *
 * WHAT IT REPORTS
 *   1. PHANTOM ENTRIES — a wired model whose file is missing (the ones that pop to procedural)
 *   2. UNREACHABLE ENTRIES — a wired model for a character the roster has never heard of
 *   3. UNMODELLED CHARACTERS — a real character with no GLB wired (procedural by design, but you
 *      should know the number)
 *   4. BASE-BODY DIRS — the archetype fallback dirs the code points at, and whether they exist
 *
 * --gate makes 1 and 2 fail the build. 3 is informational: a procedural character is a choice, a
 * broken URL is a bug.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'BANNON_v150.html');
const gate = process.argv.includes('--gate');
const src = fs.readFileSync(SRC, 'utf8');

// ── wired models ────────────────────────────────────────────────────────────────────────────
const dStart = src.indexOf('const CHAR_MODEL_DEFAULTS');
const dEnd = src.indexOf('\n};', dStart);
const dBlock = src.slice(dStart, dEnd);
const wired = [];
{
  const re = /^\s*([A-Z0-9_]+)\s*:\s*\{\s*url\s*:\s*'([^']+)'/gm;
  let m; while ((m = re.exec(dBlock))) wired.push({ key: m[1], url: m[2] });
}

// ── real characters ─────────────────────────────────────────────────────────────────────────
// THREE registries feed the game, and a model key only has to match ONE of them. Reading just
// _addChar reports BANNON, VIPER, TITAN and five more as "unreachable" — which is nonsense, they are
// the characters you actually fight. charModelKey() upper-cases and underscores a fighter's NAME, so
// that transform is what every registry has to be normalised through.
const norm = n => String(n).toUpperCase().replace(/[^A-Z0-9]/g, '_');
const chars = new Set();
{
  const re = /_addChar\('([A-Z0-9_]+)'/g;                        // 1. the main roster builder
  let m; while ((m = re.exec(src))) chars.add(m[1]);
}
function namesInBlock(startMarker, endMarker) {
  const i = src.indexOf(startMarker); if (i < 0) return;
  const j = src.indexOf(endMarker, i); if (j < 0) return;
  const blk = src.slice(i, j);
  const re = /name\s*:\s*'([^']+)'/g;
  let m; while ((m = re.exec(blk))) chars.add(norm(m[1]));
}
namesInBlock('const OPPONENTS = [', '\n];');                     // 2. the exhibition opponents
namesInBlock('window.BANNON_ROSTER = [', '\n];');                // 3. the shaped-body roster
{                                                                // 4. CHAR_META identity table
  const i = src.indexOf('const CHAR_META = {'), j = src.indexOf('\n};', i);
  if (i >= 0 && j > i) { const re = /^\s*([A-Z0-9_]+)\s*:\s*\{/gm; let m;
    const blk = src.slice(i, j); while ((m = re.exec(blk))) chars.add(m[1]); }
}
{                                                                // 5. alt-attire charKey bindings
  const re = /charKey\s*:\s*'([A-Z0-9_]+)'/g; let m;
  while ((m = re.exec(src))) chars.add(m[1]);
}

// ── alternate attires (CHAR_ALT_MODELS) count as wired files too ────────────────────────────
const alts = [];
{
  const re = /url\s*:\s*'(assets\/models\/[^']+\.glb)'/g;
  let m; while ((m = re.exec(src))) alts.push(m[1]);
}

const exists = u => { try { return fs.statSync(path.join(ROOT, u)).size > 0; } catch (_) { return false; } };

const phantom     = wired.filter(w => !exists(w.url));
const unreachable = wired.filter(w => !chars.has(w.key));
const modelled    = new Set(wired.filter(w => chars.has(w.key)).map(w => w.key));
const unmodelled  = [...chars].filter(c => !modelled.has(c)).sort();

console.log('BANNON MODEL WIRING AUDIT');
console.log('='.repeat(72));
console.log('characters defined: ' + chars.size + '   models wired: ' + wired.length +
            '   with a real file: ' + wired.filter(w => exists(w.url)).length);

console.log('\n1. PHANTOM ENTRIES (wired, file missing -> procedural pop, no error) — ' + phantom.length);
phantom.forEach(w => console.log('   ' + w.key.padEnd(18) + w.url));

console.log('\n2. UNREACHABLE ENTRIES (no such character — charModelFor() can never be called with this key) — ' + unreachable.length);
unreachable.forEach(w => console.log('   ' + w.key.padEnd(18) + w.url + (exists(w.url) ? '   [file exists but nothing can ask for it]' : '')));

console.log('\n3. CHARACTERS WITH NO MODEL WIRED (procedural body by design) — ' + unmodelled.length + ' of ' + chars.size);
for (let i = 0; i < unmodelled.length; i += 4) console.log('   ' + unmodelled.slice(i, i + 4).map(s => s.padEnd(24)).join(''));

console.log('\n4. BASE-BODY DIRECTORIES the code falls back to:');
const dirs = [...new Set((src.match(/'assets\/models\/[a-z_]+\/'/g) || []).map(s => s.replace(/'/g, '')))];
dirs.forEach(d => {
  let n = 0; try { n = fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.glb')).length; } catch (_) { n = -1; }
  console.log('   ' + d.padEnd(34) + (n < 0 ? 'MISSING — every fallback through it lands on procedural' : n + ' glb'));
});

const bad = phantom.length + unreachable.length;
console.log('\n' + (bad
  ? (gate ? 'GATE FAILED — ' : 'PROBLEMS FOUND — ') + bad + ' broken model entr' + (bad === 1 ? 'y' : 'ies') + '.'
  : 'OK — every wired model resolves to a real file for a real character.'));
process.exit(gate && bad ? 1 : 0);
