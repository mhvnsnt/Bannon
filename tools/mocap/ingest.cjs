#!/usr/bin/env node
/* BANNON MOCAP INGEST — the whole clip -> move flow, one command.
 *
 *   node tools/mocap/ingest.cjs              # ingest, map, report
 *   node tools/mocap/ingest.cjs --dry        # show what WOULD happen, change nothing
 *   node tools/mocap/ingest.cjs --report     # just the coverage report
 *
 * DROP CLIPS IN  assets/mocap/  (or assets/mocap/drive/, or assets/mocap/open/ for BVH)
 * RUN THIS. Nothing else. The clip is playing on a move by the end of it.
 *
 * THE GAP THIS CLOSES: every mapper in the project keys off assets/moves/fbx_move_map.json, and
 * NOTHING ever added a clip to it. Drop fifty captures in and all fifty stay invisible — the file
 * sits on disk, no move ever references it, and it looks like the import "didn't work". This walks
 * the whole chain instead:
 *
 *   1. SCAN     every .fbx / .bvh / .glb under assets/mocap that the index has never seen
 *   2. CLASSIFY each one: category, ring position, engine key, fighting styles
 *   3. INDEX    append to fbx_move_map.json (the file the rest of the pipeline reads)
 *   4. MAP      re-run auto_map_moves (library moves) + map_combat_moves (the moves you throw)
 *   5. RETREAT  re-run gen_procedural_clips so pose-math clips step aside wherever a real capture
 *               now covers the position
 *   6. REPORT   what each clip became, and coverage before vs after
 *
 * Every step is idempotent — running it twice changes nothing the second time.
 */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const M = path.join(ROOT, 'assets', 'moves');
const MOCAP = path.join(ROOT, 'assets', 'mocap');
const IDX = path.join(M, 'fbx_move_map.json');
const DRY = process.argv.includes('--dry');
const REPORT_ONLY = process.argv.includes('--report');

const rd = p => JSON.parse(fs.readFileSync(p, 'utf8'));

// ── 1. SCAN ─────────────────────────────────────────────────────────────────────────────────────
function scan(dir, out) {
  out = out || [];
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scan(p, out);
    else if (/\.(fbx|bvh|glb)$/i.test(e.name)) {
      out.push({ name: e.name.replace(/\.[^.]+$/, ''), ext: path.extname(e.name).slice(1).toLowerCase(),
                 rel: path.relative(ROOT, p), size: fs.statSync(p).size });
    }
  }
  return out;
}

// ── 2. CLASSIFY ─────────────────────────────────────────────────────────────────────────────────
// Filename is the only signal available without parsing every file, and in practice mocap packs are
// named for what they are. Ordered most-specific first: a "Corner Dropkick" is a corner move, not a
// generic kick, so whichever rule matches first wins.
const RULES = [
  // [regex, cat, pos, engine]
  [/\b(idle|stance|ready|guard|breath)\b/i,                 'style_stance','LOCOMOTION','IDLE'],
  [/\b(walk|run|jog|sprint|strafe|sneak|step|turn)\b/i,     'locomotion','LOCOMOTION','LOCO'],
  [/\b(get(ting)?.?up|stand.?up|standup|stand.?to|kip.?up|recover|rise|revive)\b/i, 'getup','GROUND_TO_STANDING_WAKEUP','GETUP'],
  [/\b(taunt|pose|celebrat|gloat|crowd|dance|twerk)\b/i,    'taunt','TAUNT','TAUNT'],
  [/\b(block|parry|dodge|evade|duck|esquiva|counter)\b/i,   'defense','STANDING_FRONT','DEFEND'],
  [/\b(hit|react|sell|flinch|stagger|recoil)\b/i,           'reaction','STANDING_FRONT','SELL'],
  [/\b(death|dying|defeat|ko|knock.?out|collapse|fall)\b/i, 'knockdown','GROUNDED_HEAD_UP','KO'],
  [/\b(springboard|vault|cartwheel|handspring)\b/i,         'aerial_transition','SPRINGBOARD','SPRINGBOARD'],
  [/\b(climb|rope.?walk|turnbuckle.?climb)\b/i,             'rope_transition','TURNBUCKLE_TOP','CLIMB'],
  [/\b(whip|irish)\b/i,                                     'irish_whip','IRISH_WHIP','WHIP'],
  [/\b(apron)\b/i,                                          'strike','APRON','STRIKE_KICK'],
  [/\b(corner|buckle)\b/i,                                  'strike','CORNER_FRONT','STRIKE_PUNCH'],
  [/\b(top.?rope|diving|senton|moonsault|splash|swanton|450|shooting.?star|frog)\b/i,
                                                            'dive','TURNBUCKLE_TOP','DIVE'],
  [/\b(middle.?rope|second.?rope)\b/i,                      'dive','MIDDLE_ROPE','DIVE'],
  [/\b(submission|lock|hold|clutch|stretch|sharpshooter|crossface|armbar|choke)\b/i,
                                                            'submission','GROUNDED_HEAD_UP','SUBMIT'],
  [/\b(pin|cover|cradle|rollup|crucifix)\b/i,               'grapple','GROUNDED_HEAD_UP','PIN'],
  [/\b(ground|mount|stomp|floor)\b/i,                       'strike','GROUNDED_HEAD_UP','STRIKE_GROUND'],
  [/\b(suplex|slam|bomb|driver|ddt|piledriver|neckbreaker|cutter|throw|toss|rana|takedown|carry|press)\b/i,
                                                            'grapple','STANDING_FRONT','GRAPPLE'],
  [/\b(rear|behind|back.?grapple|german)\b/i,               'grapple','STANDING_REAR','GRAPPLE'],
  [/\b(running|lariat|clothesline|shoulder.?block|spear)\b/i,'strike','RUNNING','STRIKE_RUN'],
  [/\b(kick|superkick|roundhouse|teep|knee|armada|queshada|meia.?lua|rasteira|martelo|chapa|bencao)\b/i,
                                                            'strike','STANDING_FRONT','STRIKE_KICK'],
  [/\b(punch|jab|cross|hook|uppercut|elbow|forearm|chop|headbutt|strike|boxing|fist)\b/i,
                                                            'strike','STANDING_FRONT','STRIKE_PUNCH'],
  [/\b(weapon|chair|bat|ladder|table|kendo)\b/i,            'weapon','STANDING_FRONT','WEAPON'],
];
// a rig, not an action — these must never be offered as a move
const RIG = /^(X ?Bot|Y ?Bot|.*_?nonPBR|.*IKRig.*|passive_marker.*|arcee.*|crash_dummy)$/i;
const STYLE_HINT = [
  [/capoeira|ginga|armada|au\b|queshada/i, ['lucha','highFlyer']],
  [/boxing|jab|cross|hook|uppercut/i,      ['striker','brawler']],
  [/karate|kata|shoto/i,                   ['striker','technical']],
  [/suplex|german|powerbomb|press/i,       ['powerhouse','technical']],
  [/moonsault|senton|splash|450|rana/i,    ['highFlyer','lucha']],
  [/submission|lock|clutch|armbar/i,       ['technical']],
];

function classify(name) {
  if (RIG.test(name)) return { cat: 'character_rig', pos: null, engine: null, style: [], usable: false };
  for (const [re, cat, pos, engine] of RULES) {
    if (re.test(name)) {
      const style = [];
      for (const [sre, ss] of STYLE_HINT) if (sre.test(name)) ss.forEach(s => style.indexOf(s) < 0 && style.push(s));
      return { cat, pos, engine, style };
    }
  }
  return { cat: 'misc', pos: 'STANDING_FRONT', engine: 'STRIKE_PUNCH', style: [] };   // usable default
}

// ── coverage, for the before/after that makes this legible ──────────────────────────────────────
function coverage() {
  const schema = rd(path.join(M, 'moveset_schema.json'));
  const capPos = {};
  (rd(IDX).clips || []).forEach(c => { if (c.pos) capPos[c.pos] = (capPos[c.pos] || 0) + 1; });
  let picks = 0, cap = 0;
  schema.cats.forEach(c => c.groups.forEach(g => g.slots.forEach(s => {
    picks += s.pick; if (s.pos && capPos[s.pos]) cap += s.pick;
  })));
  let combat = 0;
  try { combat = Object.keys(rd(path.join(M, 'combat_clip_map.json')).map || {}).length; } catch (_) {}
  return { picks, cap, proc: picks - cap, positions: Object.keys(capPos).length, combat,
           clips: (rd(IDX).clips || []).length };
}

const before = coverage();
if (REPORT_ONLY) {
  console.log('BANNON MOCAP COVERAGE');
  console.log('  clips indexed          : ' + before.clips);
  console.log('  ring positions covered : ' + before.positions);
  console.log('  moveset picks on capture: ' + before.cap + ' / ' + before.picks);
  console.log('  combat moves mapped    : ' + before.combat);
  process.exit(0);
}

// ── run ─────────────────────────────────────────────────────────────────────────────────────────
const idx = rd(IDX);
const known = new Set((idx.clips || []).map(c => c.clip));
const found = scan(MOCAP);
const fresh = found.filter(f => !known.has(f.name));

console.log('BANNON MOCAP INGEST' + (DRY ? '   (dry run — nothing will be written)' : ''));
console.log('='.repeat(74));
console.log('clips on disk : ' + found.length + '   already indexed : ' + known.size + '   NEW : ' + fresh.length);

if (!fresh.length) {
  console.log('\nNothing new to ingest. Drop .fbx / .bvh / .glb into assets/mocap/ and run again.');
  process.exit(0);
}

console.log('\nCLASSIFYING');
const added = [];
const byCat = {};
for (const f of fresh) {
  const c = classify(f.name);
  byCat[c.cat] = (byCat[c.cat] || 0) + 1;
  added.push(Object.assign({ clip: f.name }, c, { _src: f.rel, _fmt: f.ext }));
  console.log('  ' + f.name.slice(0, 34).padEnd(36) + (c.cat || '').padEnd(19) + (c.pos || '—'));
}
console.log('\n  by category: ' + Object.entries(byCat).map(([k, v]) => k + ' ' + v).join(', '));

if (DRY) { console.log('\n(dry run — index not written, mappers not run)'); process.exit(0); }

idx.clips = (idx.clips || []).concat(added);
idx.counts = idx.counts || {};
idx.counts.total = idx.clips.length;
fs.writeFileSync(IDX, JSON.stringify(idx, null, 1));
console.log('\nindexed -> assets/moves/fbx_move_map.json  (' + idx.clips.length + ' clips)');

function run(script, label) {
  process.stdout.write('  ' + label.padEnd(40));
  try {
    const out = cp.execSync('node ' + JSON.stringify(path.join(ROOT, script)), { encoding: 'utf8', cwd: ROOT });
    const last = out.trim().split('\n').filter(l => l.trim()).pop() || 'ok';
    console.log('ok   ' + last.slice(0, 60));
  } catch (e) { console.log('FAILED  ' + String(e.message).split('\n')[0].slice(0, 60)); }
}
console.log('\nMAPPING');
run('tools/mocap/auto_map_moves.cjs',     'library moves  -> clips');
run('tools/mocap/map_combat_moves.cjs',   'combat moves   -> clips');
run('tools/moves/gen_procedural_clips.cjs','pose-math clips step aside');

const after = coverage();
console.log('\nCOVERAGE');
console.log('                            before   after');
console.log('  clips indexed          ' + String(before.clips).padStart(8) + String(after.clips).padStart(8));
console.log('  ring positions covered ' + String(before.positions).padStart(8) + String(after.positions).padStart(8));
console.log('  picks on real capture  ' + String(before.cap).padStart(8) + String(after.cap).padStart(8) + '   of ' + after.picks);
console.log('  picks on pose math     ' + String(before.proc).padStart(8) + String(after.proc).padStart(8));
console.log('  combat moves mapped    ' + String(before.combat).padStart(8) + String(after.combat).padStart(8));
console.log('\nDone. The new clips are live: mirror the HTML (cp BANNON_v150.html index.html public/index.html) and they play.');
