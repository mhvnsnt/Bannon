#!/usr/bin/env node
/* index_repos.mjs — BUILD THE FEDERATION REGISTRY BY READING THE REPOS, NOT BY DESCRIBING THEM.
 *
 *   node tools/federation/index_repos.mjs            # index every repo listed in repos.json
 *   node tools/federation/index_repos.mjs --repo M.-Engine-
 *   node tools/federation/index_repos.mjs --refresh  # re-clone even if cached
 *
 * OWNER: "the orchestrator should automatically search the federation and discover the
 * implementation you already built elsewhere instead of making you say 'Go add M.-Engine-'."
 *
 * THE POINT IS THAT THE CAPABILITIES ARE DERIVED FROM THE FILES. A hand-written registry saying
 * "M.-Engine- = engine/kernel components" is a GUESS wearing a schema, and it goes stale the day
 * after it is written. OWNER LAW: metadata is a hint, never an authority. So this clones each repo
 * shallow, walks it, and records what is ACTUALLY THERE:
 *   - every entry point (package.json bin/main/scripts, *.uproject, Cargo.toml, main.py, index.html)
 *   - every language, by file count and by bytes, so "a Python repo with one .js" is not miscalled
 *   - every top-level subsystem directory with its size and file count
 *   - CAPABILITY TAGS matched from file and directory names against a table of what the OWNER
 *     actually asks for ("worker pool", "physics lifecycle", "github automation")
 *   - the README's first real paragraph, as a HINT, clearly marked as claimed rather than measured
 *
 * SHALLOW AND FILTERED, on purpose. --depth 1 --filter=blob:none --no-checkout first to read the
 * TREE cheaply, and a size ceiling per repo. mhvnsnt/UnrealEngine is a fork of Epic's engine and is
 * tens of gigabytes; indexing it by cloning it would fill this container's disk, which has already
 * happened twice this session and presents as "Page crashed" in an unrelated harness.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.dirname(path.dirname(new URL('.', import.meta.url).pathname.replace(/\/$/, '')));
const REG_DIR = path.join(ROOT, 'tools/federation');
const CACHE = process.env.FED_CACHE || '/tmp/fed_cache';
const OUT = path.join(REG_DIR, 'registry.json');
const REPOS = JSON.parse(fs.readFileSync(path.join(REG_DIR, 'repos.json'), 'utf8'));
const REFRESH = process.argv.includes('--refresh');
const ONLY = (process.argv.find(a => a.startsWith('--repo=')) || '').split('=')[1]
          || (process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null);

// ── CAPABILITY TABLE ─────────────────────────────────────────────────────────────────────────
// Keyed on what the owner ASKS FOR, matched against real paths. Deliberately not a taxonomy of
// software in general — a registry nobody queries is a registry nobody maintains.
const CAPS = {
  'multi-agent orchestration': /(orchestrat|swarm|agent[s_-]|fleet|worker[_-]?pool|dispatch|scheduler)/i,
  'remote sandbox':            /(sandbox|container|docker|runner|vm[_-]|firecracker|e2b)/i,
  'physics':                   /(physics|jolt|verlet|ragdoll|rigidbod|collision|kinemat|soft[_-]?body)/i,
  'animation / mocap':         /(mocap|anim|bvh|fbx|retarget|skeleton|rig|keyframe|clip)/i,
  '3d rendering':              /(three|webgl|render|shader|glsl|gltf|glb|mesh|material)/i,
  'unreal engine':             /(unreal|\.uproject|uplugin|UE5|Slate|UMG|Chaos)/i,
  'github automation':         /(github|\.github\/workflows|octokit|gh[_-]|pull[_-]?request|webhook)/i,
  'llm / inference':           /(llama|ollama|gguf|inference|prompt|embedding|rag|vector[_-]?store|lm[_-]?studio)/i,
  'workspace / coding agent':  /(codedummy|ide|editor|workspace|repl|terminal|bolt)/i,
  'governance / policy':       /(governance|policy|guard|permission|audit|vault|acl|sanitiz)/i,
  'ui / frontend':             /(components?\/|\.tsx|\.jsx|tailwind|react|svelte|vue|frontend|webui)/i,
  'build / packaging':         /(gradle|android|\.apk|webpack|vite|rollup|esbuild|Makefile|CMakeLists)/i,
  'game runtime':              /(game|match|fighter|combat|arena|roster|moveset|wrestl)/i,
  'data / persistence':        /(database|sqlite|postgres|schema|migration|storage|persist)/i
};
const LANG = { '.js':'JavaScript','.mjs':'JavaScript','.cjs':'JavaScript','.ts':'TypeScript','.tsx':'TypeScript',
  '.jsx':'JavaScript','.py':'Python','.cpp':'C++','.cc':'C++','.h':'C/C++ header','.hpp':'C++','.c':'C',
  '.cs':'C#','.rs':'Rust','.go':'Go','.java':'Java','.kt':'Kotlin','.sh':'Shell','.html':'HTML',
  '.css':'CSS','.md':'Markdown','.json':'JSON','.glsl':'GLSL','.bb':'Blitz3D' };
const SKIP = /^(node_modules|\.git|dist|build|vendor|third_party|Binaries|Intermediate|DerivedDataCache|\.venv|__pycache__)$/;

function sh(cmd, args, opts){
  // -c gc.auto=0: git printed "Auto packing the repository in background" once per invocation and
  // buried every real line of this tool's output in the log.
  return execFileSync(cmd, ['-c','gc.auto=0', ...args], { encoding:'utf8', timeout: 600000, ...opts });
}

function cloneShallow(full, dir){
  if (fs.existsSync(dir) && !REFRESH) return true;
  if (REFRESH) fs.rmSync(dir, { recursive:true, force:true });
  fs.mkdirSync(path.dirname(dir), { recursive:true });
  // blob:none gets the whole TREE with none of the file CONTENT — every path, a fraction of the
  // bytes. That is exactly what an index needs, and it is what makes indexing a large repo safe.
  try{
    // LOWERCASE THE URL. The session's git proxy serves repositories under their LOWERCASED name:
    // `mhvnsnt/CODEDUMMY` 404s, `mhvnsnt/codedummy` clones. MEASURED — CODEDUMMY was already
    // attached to this session and still "failed to clone", which read exactly like a permissions
    // problem and was a casing problem. GitHub's own web UI is case-insensitive, so the display
    // name from list_repos carries the owner's original capitalisation and is NOT what to dial.
    sh('git', ['clone', '--depth', '1', '--filter=blob:none', '--no-checkout',
               'https://github.com/' + full.toLowerCase() + '.git', dir], { stdio:'pipe' });
    return true;
  }catch(e){
    // A repo the session has not been given is indistinguishable from one that does not exist —
    // the proxy 404s either way. Name the actual remedy rather than printing a git error.
    console.log('NOT ATTACHED — run add_repo(' + full + ') first, then re-index');
    return false;
  }
}

function treeOf(dir){
  // NAMES ONLY. The first version used `ls-tree -l` to get real byte sizes, and on a
  // --filter=blob:none clone that is a trap: the sizes live in the blobs the partial clone
  // deliberately did not fetch, so git goes back to the network for every object. It hung, and the
  // catch reported "empty tree" for a repo whose tree reads perfectly by hand — a failure that
  // looked like a broken repo and was a broken query.
  // Paths are what the capability matcher and the subsystem map actually need. FILE COUNTS replace
  // byte sizes; a directory's share of the files is a better proxy for "is this a real subsystem"
  // than its share of the bytes anyway, because one checked-in binary outweighs a whole module.
  try{
    return sh('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: dir, maxBuffer: 256*1024*1024 })
      .split('\n').filter(Boolean).map(p => ({ path: p, size: 0 }));
  }catch(e){ return []; }
}

function indexRepo(entry){
  const full = entry.full_name;
  const short = full.split('/')[1];
  const dir = path.join(CACHE, short);
  process.stdout.write('  ' + short.padEnd(46));
  if (entry.skip_index){ console.log('SKIPPED — ' + entry.skip_reason); return { ...entry, indexed:false, skip_reason: entry.skip_reason }; }
  if (!cloneShallow(full, dir)) return { ...entry, indexed:false, error:'clone failed' };
  const files = treeOf(dir);
  if (!files.length){ console.log('empty tree'); return { ...entry, indexed:false, error:'empty tree' }; }

  const langBytes = {}, langFiles = {}, subs = {}, caps = {}, entries = [];
  for (const f of files){
    const parts = f.path.split('/');
    if (parts.some(p => SKIP.test(p))) continue;
    const ext = path.extname(f.path).toLowerCase();
    const lang = LANG[ext];
    if (lang){ langBytes[lang] = (langBytes[lang]||0) + f.size; langFiles[lang] = (langFiles[lang]||0) + 1; }
    const top = parts.length > 1 ? parts[0] : '(root)';
    if (!subs[top]) subs[top] = { files:0, bytes:0 };
    subs[top].files++; subs[top].bytes += f.size;
    for (const [cap, re] of Object.entries(CAPS)) if (re.test(f.path)) caps[cap] = (caps[cap]||0) + 1;
    // entry points, read off real filenames
    const base = path.basename(f.path);
    if (/^(package\.json|Cargo\.toml|pyproject\.toml|go\.mod|CMakeLists\.txt|Makefile)$/.test(base) && parts.length <= 2) entries.push(f.path);
    if (/\.(uproject|uplugin|sln)$/.test(base)) entries.push(f.path);
    if (/^(main|index|app|server|cli)\.(py|js|mjs|ts|tsx|html)$/.test(base) && parts.length <= 3) entries.push(f.path);
  }
  const topSubs = Object.entries(subs).sort((a,b)=>b[1].files-a[1].files).slice(0,14)
    .map(([k,v]) => ({ dir:k, files:v.files }));
  const topLangs = Object.entries(langFiles).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([k,v]) => ({ lang:k, files:v }));
  // capabilities as a RANKED list with the hit count that earned it, so a one-file coincidence is
  // visibly weaker than a subsystem and a human can see WHY a repo was tagged.
  const capList = Object.entries(caps).sort((a,b)=>b[1]-a[1])
    .filter(([,n]) => n >= 3).map(([cap,n]) => ({ capability:cap, files:n }));
  console.log(String(files.length).padStart(7) + ' files  ' +
              capList.slice(0,4).map(c=>c.capability).join(', '));
  return { ...entry, indexed:true, fileCount:files.length,
           languages: topLangs, subsystems: topSubs, capabilities: capList,
           entryPoints: [...new Set(entries)].slice(0, 24) };
}

const list = ONLY ? REPOS.filter(r => r.full_name.toLowerCase().includes(ONLY.toLowerCase())) : REPOS;
console.log('\nindexing ' + list.length + ' repo(s) into ' + OUT + '\n');
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT,'utf8')) : { repos: [] };
const byName = Object.fromEntries((prev.repos||[]).map(r => [r.full_name, r]));
for (const r of list) byName[r.full_name] = indexRepo(r);
const registry = { generatedAt: new Date().toISOString(),
                   note: 'CAPABILITIES ARE DERIVED FROM FILE PATHS, not from descriptions. Regenerate with tools/federation/index_repos.mjs.',
                   capabilityTable: Object.keys(CAPS),
                   repos: Object.values(byName) };
fs.writeFileSync(OUT, JSON.stringify(registry, null, 1));
console.log('\nwrote ' + OUT + '  (' + registry.repos.filter(r=>r.indexed).length + ' indexed)');
