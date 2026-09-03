#!/usr/bin/env node
/* find.mjs — ASK THE FEDERATION WHERE SOMETHING ALREADY EXISTS.
 *
 *   node tools/federation/find.mjs "multi-agent orchestration"
 *   node tools/federation/find.mjs worker pool
 *   node tools/federation/find.mjs --list            # every capability, and who has it
 *   node tools/federation/find.mjs --repo CODEDUMMY  # what one repo actually contains
 *
 * OWNER: "when Claude encounters 'I need a worker pool' the orchestrator should automatically
 * search the federation and discover the implementation you already built elsewhere instead of
 * making you say 'Go add M.-Engine-'."
 *
 * This reads tools/federation/registry.json, which is DERIVED FROM THE FILES by index_repos.mjs —
 * never from a hand-written description of what a repo is supposed to contain. A registry of
 * intentions goes stale the day after it is written; a registry of paths goes stale only when the
 * code does, and `--refresh` fixes that in one command.
 *
 * IT ANSWERS WITH EVIDENCE, NOT A VERDICT: the matching capability, how many files earned the tag,
 * the subsystem directories, and the entry points to open. A ranked guess with no receipts is what
 * sends someone rebuilding something that already exists three repos over.
 */
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REG = path.join(HERE, 'registry.json');
if (!fs.existsSync(REG)){
  console.error('no registry yet — run: node tools/federation/index_repos.mjs');
  process.exit(2);
}
const R = JSON.parse(fs.readFileSync(REG, 'utf8'));
const args = process.argv.slice(2);
const indexed = R.repos.filter(r => r.indexed);

if (args.includes('--list') || !args.length){
  console.log('\nregistry built ' + R.generatedAt);
  console.log(indexed.length + ' of ' + R.repos.length + ' repos indexed\n');
  const byCap = {};
  indexed.forEach(r => (r.capabilities||[]).forEach(c => {
    (byCap[c.capability] = byCap[c.capability] || []).push({ repo: r.full_name.split('/')[1], files: c.files });
  }));
  Object.entries(byCap).sort((a,b)=>b[1].length-a[1].length).forEach(([cap, list]) => {
    console.log('  ' + cap);
    list.sort((a,b)=>b.files-a.files).forEach(x =>
      console.log('      ' + String(x.files).padStart(5) + ' files  ' + x.repo));
  });
  const missing = R.repos.filter(r => !r.indexed && !r.skip_index);
  if (missing.length){
    console.log('\n  NOT INDEXED (attach with add_repo, then re-run index_repos.mjs):');
    missing.forEach(r => console.log('      ' + r.full_name));
  }
  process.exit(0);
}

const repoFlag = args.indexOf('--repo');
if (repoFlag >= 0){
  const want = (args[repoFlag+1] || '').toLowerCase();
  const r = indexed.find(x => x.full_name.toLowerCase().includes(want));
  if (!r){ console.error('no indexed repo matching ' + want); process.exit(1); }
  console.log('\n' + r.full_name + '   ' + r.fileCount + ' files');
  console.log('  role (as declared, a hint only): ' + (r.role || '-'));
  console.log('  languages   ' + (r.languages||[]).map(l => l.lang + ' ' + l.files).join(' · '));
  console.log('  capabilities');
  (r.capabilities||[]).forEach(c => console.log('      ' + String(c.files).padStart(5) + '  ' + c.capability));
  console.log('  subsystems');
  (r.subsystems||[]).forEach(s => console.log('      ' + String(s.files).padStart(5) + '  ' + s.dir));
  console.log('  entry points');
  (r.entryPoints||[]).forEach(e => console.log('      ' + e));
  process.exit(0);
}

// FREE TEXT: score every repo on how well its capability tags and subsystem names match the words
// asked for. Every term is scored separately so "worker pool" finds a repo tagged for orchestration
// AND one with a workers/ directory, rather than only an exact-phrase hit.
const terms = args.join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 2);
const scored = indexed.map(r => {
  let score = 0; const why = [];
  (r.capabilities||[]).forEach(c => {
    const hit = terms.filter(t => c.capability.toLowerCase().includes(t)).length;
    if (hit){ score += hit * 10 + Math.min(c.files, 60) / 10; why.push('capability "' + c.capability + '" (' + c.files + ' files)'); }
  });
  (r.subsystems||[]).forEach(s => {
    const hit = terms.filter(t => s.dir.toLowerCase().includes(t)).length;
    if (hit){ score += hit * 6 + Math.min(s.files, 60) / 20; why.push('directory ' + s.dir + '/ (' + s.files + ' files)'); }
  });
  (r.entryPoints||[]).forEach(e => {
    if (terms.some(t => e.toLowerCase().includes(t))){ score += 4; why.push('entry point ' + e); }
  });
  if (r.role && terms.some(t => r.role.toLowerCase().includes(t))){ score += 2; why.push('declared role (hint): ' + r.role); }
  return { r, score, why };
}).filter(x => x.score > 0).sort((a,b) => b.score - a.score);

console.log('\nfind: "' + args.join(' ') + '"');
if (!scored.length){
  console.log('  nothing matched in ' + indexed.length + ' indexed repos.');
  const missing = R.repos.filter(r => !r.indexed && !r.skip_index);
  if (missing.length) console.log('  ' + missing.length + ' repo(s) are NOT indexed and may hold it: ' +
    missing.map(m=>m.full_name.split('/')[1]).join(', '));
  console.log('  capability vocabulary: ' + R.capabilityTable.join(' · '));
  process.exit(1);
}
scored.slice(0, 5).forEach((x, i) => {
  console.log('\n  ' + (i+1) + '. ' + x.r.full_name + '   score ' + x.score.toFixed(1) + '   ' + x.r.fileCount + ' files');
  x.why.slice(0, 5).forEach(w => console.log('        ' + w));
  const eps = (x.r.entryPoints||[]).slice(0,4);
  if (eps.length) console.log('        open: ' + eps.join('  '));
});
console.log('');
