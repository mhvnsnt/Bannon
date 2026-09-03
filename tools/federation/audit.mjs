#!/usr/bin/env node
/* audit.mjs — IS THIS SUBSYSTEM INTEGRATED, OR JUST STORED? AND DOES ANOTHER REPO ALREADY OWN IT?
 *
 *   node tools/federation/audit.mjs                # both passes
 *   node tools/federation/audit.mjs --integration  # only: what is wired vs what is parked
 *   node tools/federation/audit.mjs --overlap      # only: what Bannon duplicates from elsewhere
 *   node tools/federation/audit.mjs --json
 *
 * OWNER'S QUESTION: "which imported open-source projects are actually integrated versus merely
 * stored", and "is Bannon carrying a vendored duplicate that should be replaced with a canonical
 * integration". Both are facts about the files, so neither is answered with an opinion.
 *
 * INTEGRATION HAS A DEFINITION HERE, AND IT IS DELIBERATELY BLUNT:
 *     A subsystem is INTEGRATED if something OUTSIDE it names it.
 * Not "does it look important", not "is it in the README". If the only files that mention
 * `box3d-0.1.0` live inside box3d-0.1.0, then nothing in this repository reaches it and it is
 * cargo. That test is cheap, it cannot flatter anything, and it is the same shape as the check
 * that found eleven BANNON_UNIVERSE functions with zero callers and a triggerRunIn that only ever
 * printed a line — both of which read as finished systems until somebody counted the callers.
 *
 * REFERENCES ARE COUNTED BY WEIGHT, because they are not equal:
 *   - the SHIPPED HTML naming it means the running game reaches it            (weight 100)
 *   - a build file, workflow or bundler naming it means it reaches a device   (weight 20)
 *   - a tool or script naming it means the pipeline reaches it                (weight 5)
 *   - documentation naming it means a human wrote about it                    (weight 1)
 * A subsystem whose only references are documentation scores 3, and the report says so, rather
 * than reporting "referenced" and letting a README stand in for a call site.
 *
 * OVERLAP IS BY PATH, NOT BY NAME. Two repos both having a `src/` proves nothing; the same
 * DISTINCTIVE relative paths appearing in both is a vendored copy. Common paths every JS project
 * has (package.json, README, .gitignore, index.html, LICENSE) are excluded before scoring.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.dirname(path.dirname(HERE));
const CACHE = process.env.FED_CACHE || '/tmp/fed_cache';
const JSONOUT = process.argv.includes('--json');
const ONLY_INT = process.argv.includes('--integration');
const ONLY_OVL = process.argv.includes('--overlap');
const DO_INT = !ONLY_OVL, DO_OVL = !ONLY_INT;

function sh(cmd, args, opts){
  try{ return execFileSync(cmd, args, { encoding:'utf8', maxBuffer: 512*1024*1024, timeout: 300000, ...opts }); }
  catch(e){ return (e.stdout || ''); }
}

const bannonFiles = sh('git', ['ls-files'], { cwd: ROOT }).split('\n').filter(Boolean);

// ── PASS 1: INTEGRATED, OR PARKED? ───────────────────────────────────────────────────────────
// Weighted by WHERE the reference lives. A README mention is not a call site.
const SHIPPED = 'BANNON_v150.html';
function weightOf(p){
  if (p === SHIPPED || /^dist\/BANNON\.html$/.test(p)) return 100;
  if (/^(\.github\/workflows\/|android\/|scripts\/bundle|package\.json$|.*\/(CMakeLists\.txt|build\.gradle)$)/.test(p)) return 20;
  if (/^(tools\/|scripts\/|src\/|server\/|native\/|app\/)/.test(p)) return 5;
  if (/\.(md|txt)$/i.test(p)) return 1;
  return 3;
}
function integration(){
  const tops = [...new Set(bannonFiles.map(f => f.split('/')[0]).filter(f => f.indexOf('.') !== 0))]
    .filter(t => bannonFiles.some(f => f.startsWith(t + '/')));
  const rows = [];
  for (const top of tops){
    const n = bannonFiles.filter(f => f.startsWith(top + '/')).length;
    // ripgrep for the literal directory name, listing FILES so we can weight by location, and
    // excluding the directory itself — a subsystem referring to itself proves nothing.
    // MATCH THE DIRECTORY AS A PATH, NOT AS A WORD. The first version searched the bare name and
    // reported `config` (ONE file) with 405 references and a score of 1,283 — it was matching the
    // English word in every comment and identifier in the repo. `logs`, `models`, `workspace` and
    // `dist` were inflated the same way, and the report read as if every generic-sounding folder
    // were load-bearing. A reference to a directory essentially always carries the slash.
    const out = sh('rg', ['--no-messages', '-l', '--fixed-strings', top + '/', '-g', '!' + top + '/**',
                          '-g', '!node_modules/**', '-g', '!.git/**', '--max-filesize', '80M', '.'],
                   { cwd: ROOT });
    const refs = out.split('\n').filter(Boolean).map(p => p.replace(/^\.\//, ''));
    let score = 0; const where = { shipped:0, build:0, tooling:0, docs:0, other:0 };
    for (const r of refs){
      const w = weightOf(r); score += w;
      if (w === 100) where.shipped++; else if (w === 20) where.build++;
      else if (w === 5) where.tooling++; else if (w === 1) where.docs++; else where.other++;
    }
    rows.push({ dir: top, files: n, refs: refs.length, score, where,
                verdict: where.shipped ? 'IN THE GAME'
                       : where.build   ? 'ships to the device'
                       : where.tooling ? 'pipeline only'
                       : refs.length   ? 'documentation only'
                                       : 'PARKED — nothing outside it names it' });
  }
  return rows.sort((a,b) => a.score - b.score || b.files - a.files);
}

// ── PASS 2: DOES ANOTHER REPO ALREADY OWN THIS? ──────────────────────────────────────────────
const COMMON = /^(package(-lock)?\.json|README(\.md)?|LICENSE.*|\.gitignore|index\.html|tsconfig\.json|\.env\.example|yarn\.lock|pnpm-lock\.yaml|Dockerfile|\.npmrc)$/i;
function treeOf(dir){
  if (!fs.existsSync(dir)) return null;
  return sh('git', ['-c','gc.auto=0','ls-tree','-r','--name-only','HEAD'], { cwd: dir })
    .split('\n').filter(Boolean);
}
function overlap(){
  const others = fs.existsSync(CACHE)
    ? fs.readdirSync(CACHE).filter(d => d !== 'Bannon' && fs.existsSync(path.join(CACHE, d, '.git')))
    : [];
  const mine = new Set(bannonFiles.filter(f => !COMMON.test(path.basename(f))));
  const rows = [];
  for (const o of others){
    const t = treeOf(path.join(CACHE, o));
    if (!t) continue;
    const theirs = t.filter(f => !COMMON.test(path.basename(f)));
    const shared = theirs.filter(f => mine.has(f));
    if (!shared.length) continue;
    // group the shared paths by their top-level directory — that is the DUPLICATED SUBSYSTEM,
    // and it is what a canonical-ownership decision is actually about.
    const byTop = {};
    shared.forEach(f => { const t0 = f.split('/')[0]; byTop[t0] = (byTop[t0]||0) + 1; });
    rows.push({ repo: o, sharedFiles: shared.length,
                pctOfTheirs: +(100*shared.length/Math.max(1,theirs.length)).toFixed(1),
                subsystems: Object.entries(byTop).sort((a,b)=>b[1]-a[1]).slice(0,8)
                              .map(([dir,n]) => ({ dir, files:n })) });
  }
  return rows.sort((a,b) => b.sharedFiles - a.sharedFiles);
}

const out = {};
if (DO_INT) out.integration = integration();
if (DO_OVL) out.overlap = overlap();
if (JSONOUT){ console.log(JSON.stringify(out, null, 1)); process.exit(0); }

if (out.integration){
  console.log('\n===== INTEGRATED, OR JUST STORED? =====');
  console.log('  a subsystem is INTEGRATED if something OUTSIDE it names it. weakest first.\n');
  console.log('  ' + 'directory'.padEnd(32) + 'files'.padStart(6) + 'refs'.padStart(6) + 'score'.padStart(7) + '  verdict');
  out.integration.forEach(r => console.log('  ' + r.dir.padEnd(32) + String(r.files).padStart(6) +
    String(r.refs).padStart(6) + String(r.score).padStart(7) + '  ' + r.verdict));
  const parked = out.integration.filter(r => r.score < 10);
  const files = parked.reduce((n,r) => n + r.files, 0);
  console.log('\n  ' + parked.length + ' subsystem(s), ' + files + ' files, are parked or documentation-only.');
}
if (out.overlap){
  console.log('\n===== VENDORED DUPLICATES (same paths, another repo) =====');
  if (!out.overlap.length) console.log('  none found across the cached federation clones.');
  out.overlap.forEach(r => {
    console.log('\n  ' + r.repo + '   ' + r.sharedFiles + ' shared paths  (' + r.pctOfTheirs + '% of that repo)');
    r.subsystems.forEach(s => console.log('      ' + String(s.files).padStart(5) + '  ' + s.dir + '/'));
  });
}
console.log('');
