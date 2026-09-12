#!/usr/bin/env node
// BANNON Blitz3D (.bb) ingestion — the structural interpreter the owner spec'd for pulling MDickie's
// Wrestling Empire / MPire codebase into our engine's language. Blitz3D is flat, procedural, global-
// heavy plain text; this lexer tokenizes it into a typed AST (Functions / Types+Fields / Globals /
// Dim arrays / Consts) and a DOMAIN ROUTER classifies each file's payload into where it belongs in
// our stack (physics/combat -> native C++ + move DB; meta/booking/text -> Node/data). It does NOT
// blindly transpile Blitz (that would be noise) — it extracts the STRUCTURED, reusable knowledge:
// the move catalog (names + animation frame ranges + position taxonomy) and the function/AI map.
//
//   node tools/bbparse/bbparse.mjs <in.bb> [more.bb ...] --out=<dir>
//   node tools/bbparse/bbparse.mjs --moves <Moves.bb> --out=<dir>   (moves catalog extractor)
import fs from 'fs';
import path from 'path';

// ---- domain routing matrix (owner's parserMappingRules) ----------------------------------------
const DOMAIN = {
  'ai.bb':'native/ai (brawler state machine)', 'gameplay.bb':'native/ai + combat loop',
  'attacks.bb':'C++ rigid-body / poise params', 'moves.bb':'move DB (frame data + positions)',
  'anims.bb':'anim clip ranges -> STUDIO clips / move DB', 'particles.bb':'FX (blood/sweat) -> shaders',
  'career.bb':'Node meta backend', 'negotiations.bb':'Node meta backend', 'news.bb':'Node meta backend',
  'promos.bb':'dialogue pools -> data repo', 'texts.bb':'dialogue pools -> data repo',
  'values.bb':'balance constants -> config', 'players.bb':'roster schema -> data',
};

// ---- lexer -------------------------------------------------------------------------------------
// Blitz3D: line-oriented; `;` starts a comment (trailing comments name things — we KEEP those).
// Blocks: Function..End Function / Return ; Type..End Type (Field lines) ; Global ; Const ; Dim.
function lex(src, file) {
  const lines = src.split(/\r?\n/);
  const ast = { file, functions:[], types:[], globals:[], consts:[], dims:[], lineCount:lines.length };
  let curFn = null, curType = null;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // split code vs trailing comment (naive but fine for Blitz — no string-with-semicolon edge here matters)
    const ci = raw.indexOf(';');
    const code = (ci >= 0 ? raw.slice(0, ci) : raw).trim();
    const comment = ci >= 0 ? raw.slice(ci + 1).trim() : '';
    if (!code) continue;
    const low = code.toLowerCase();

    let m;
    if ((m = code.match(/^Function\s+([A-Za-z_]\w*)\s*(\(([^)]*)\))?/i))) {
      curFn = { name:m[1], args:(m[3]||'').trim(), line:i+1, calls:[], doc:comment };
      ast.functions.push(curFn); continue;
    }
    if (/^End\s*Function$/i.test(code)) { curFn = null; continue; }
    if ((m = code.match(/^Type\s+([A-Za-z_]\w*)/i))) {
      curType = { name:m[1], fields:[], line:i+1 }; ast.types.push(curType); continue;
    }
    if (/^End\s*Type$/i.test(code)) { curType = null; continue; }
    if (curType && (m = code.match(/^Field\s+(.+)$/i))) { curType.fields.push(m[1].trim()); continue; }
    if ((m = code.match(/^Global\s+(.+)$/i))) { ast.globals.push({ decl:m[1].trim(), line:i+1 }); continue; }
    if ((m = code.match(/^Const\s+(.+)$/i))) { ast.consts.push({ decl:m[1].trim(), line:i+1 }); continue; }
    if ((m = code.match(/^Dim\s+(.+)$/i))) { ast.dims.push({ decl:m[1].trim(), line:i+1 }); continue; }
    // record intra-function call graph (function names invoked) for the AI/gameplay map
    if (curFn) {
      const callRe = /([A-Za-z_]\w*)\s*\(/g; let c;
      while ((c = callRe.exec(code))) { const n = c[1]; if (!/^(If|For|While|Int|Float|Str|Rnd|Abs|Then)$/i.test(n)) curFn.calls.push(n); }
    }
  }
  // dedup call lists
  for (const f of ast.functions) f.calls = [...new Set(f.calls)].slice(0, 40);
  return ast;
}

// ---- moves catalog extractor -------------------------------------------------------------------
// Pull `pSeq(cyc,ID)=ExtractAnimSeq(p(cyc),START,END,base) ;name` lines, tagging each with the
// current CATEGORY (the nearest `;--- CATEGORY ---` / section comment above it). This yields a clean
// position-tagged move list — the MDickie taxonomy the owner wants to structure ours around.
function extractMoves(src) {
  const lines = src.split(/\r?\n/);
  const moves = []; let category = 'uncategorized'; let subcat = '';
  for (const raw of lines) {
    const t = raw.trim();
    // section header comment like ";//// STANDING MOVE SEQUENCES ////" or ";----- CATEGORY -----"
    const hdr = t.match(/^;[/\-\s]*([A-Za-z][A-Za-z0-9 '()\-]+?)[/\-\s]*$/);
    if (hdr && /[A-Z]{2,}/.test(hdr[1]) && !/=/.test(raw)) { category = hdr[1].trim(); continue; }
    // lightweight inline group comment (single leading ;) e.g. " ;standing grapple lunge"
    const grp = raw.match(/^\s+;([a-z][\w '()\-]+)$/);
    if (grp) { subcat = grp[1].trim(); }
    // id + start/end: ExtractAnimSeq's first arg is a call like p(cyc); match it explicitly so the
    // nested parens don't cut the match short. The move NAME is the trailing ; comment on the line.
    const m = raw.match(/pSeq\(cyc,\s*(\d+)\)\s*=\s*ExtractAnimSeq\(\s*[A-Za-z_]\w*\([^)]*\)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
      const id = +m[1], start = +m[2], end = +m[3];
      const semi = raw.indexOf(';');
      const name = (semi >= 0 ? raw.slice(semi + 1).trim() : '') || subcat || `move_${id}`;
      moves.push({ id, name, frames:[start, end], length:end-start, category, group:subcat });
    }
  }
  return moves;
}

// ---- main --------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const outDir = (args.find(a=>a.startsWith('--out='))||'--out=tools/bbparse/out').split('=')[1];
const movesMode = args.includes('--moves');
const files = args.filter(a => !a.startsWith('--'));
if (!files.length) { console.error('usage: bbparse.mjs <in.bb ...> [--moves] --out=<dir>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const index = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const base = path.basename(f);
  const ast = lex(src, base);
  const domain = DOMAIN[base.toLowerCase()] || 'reference only';
  fs.writeFileSync(path.join(outDir, base.replace(/\.bb$/i,'') + '.ast.json'), JSON.stringify(ast, null, 1));
  const rec = { file:base, domain, functions:ast.functions.length, types:ast.types.length,
                globals:ast.globals.length, consts:ast.consts.length, dims:ast.dims.length };
  if (movesMode || base.toLowerCase()==='moves.bb') {
    const moves = extractMoves(src);
    fs.writeFileSync(path.join(outDir, 'moves_catalog.json'), JSON.stringify({ source:base, count:moves.length, moves }, null, 1));
    rec.moves = moves.length;
    const cats = {}; moves.forEach(mv => cats[mv.category] = (cats[mv.category]||0)+1);
    rec.categories = cats;
  }
  index.push(rec);
  console.log(`${base.padEnd(16)} -> ${domain.padEnd(38)} fn=${ast.functions.length} type=${ast.types.length} glob=${ast.globals.length}${rec.moves!=null?` moves=${rec.moves}`:''}`);
}
fs.writeFileSync(path.join(outDir, '_index.json'), JSON.stringify(index, null, 1));
console.log(`\nwrote AST + catalog to ${outDir}/`);
