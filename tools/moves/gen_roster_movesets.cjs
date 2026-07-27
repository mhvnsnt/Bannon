#!/usr/bin/env node
/*
 * gen_roster_movesets.cjs — a real, individual move set for every character on the roster.
 *
 *   node tools/moves/gen_roster_movesets.cjs
 *   node tools/moves/gen_roster_movesets.cjs --who KAGE --explain
 *
 * The owner: "now that we have over 120 characters, over 71 fighting styles, multiple archetypes,
 * gimmicks, traits, and sub traits, we can build full movesets for all characters".
 *
 * WHY THIS IS GENERATED AND NOT AUTHORED: 125 characters x 439 slots is 54,875 assignments. Nobody
 * is filling that in by hand, and a roster where everyone shares one default move set is exactly
 * what makes a game feel like it has one wrestler in it wearing different colours.
 *
 * WHAT MAKES IT NOT RANDOM — and this is the whole point:
 *
 *   1. STYLE COMES FROM WHO THEY ARE. Every character carries a `label` and a `bio` written by the
 *      owner: "Karate · Shadow", "Capoeira · Wind", "Southpaw · Ice", "Corporate technician — every
 *      hold is a contract clause". Those are matched against the 71 fighting styles' own ids,
 *      labels and preferred move kinds. KAGE resolves to KARATE because his label says karate, not
 *      because a die came up karate. Only when the text says nothing does the archetype decide.
 *
 *   2. THE STYLE'S BIAS PICKS THE MOVES. Each style carries an 8-axis bias (power, speed, technique,
 *      resilience, showmanship, aerial, submission, striking). A slot's candidates are scored
 *      against that bias plus the style's preferred kinds, so a Luchador's standing offence fills
 *      with different captures than a Sumo's — from the same pool, by weight, not by hand.
 *
 *   3. IT IS DETERMINISTIC. The PRNG is seeded from the character's name, so BANNON's move set is
 *      identical every time this runs. Regenerating never reshuffles the roster, and a diff shows
 *      only what actually changed.
 *
 *   4. IT NEVER OVERWRITES THE PLAYER. This produces DEFAULTS. The in-game editor writes to
 *      localStorage `bannon_moveset_slots` and that always wins — this is what a character has
 *      before anyone touches them, which today is nothing.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const HTML = path.join(REPO, 'BANNON_v150.html');
const MOVES = path.join(REPO, 'assets', 'moves');
const OUT = path.join(MOVES, 'roster_movesets.json');

const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const WHO = flag('who', null);
const EXPLAIN = argv.includes('--explain');

// ── the roster ───────────────────────────────────────────────────────────────────────────────────
// Two registries, both in the HTML: the CHAR_META literal and 105 _addChar() calls made later. They
// are parsed rather than imported because the game is one file and there is nothing to require.
function readRoster(){
  const src = fs.readFileSync(HTML, 'utf8');
  const out = {};
  const meta = src.match(/const CHAR_META\s*=\s*(\{[\s\S]*?\n\};)/);
  if (meta){
    const o = eval('(' + meta[1].replace(/;\s*$/, '') + ')');
    for (const k in o) out[k] = o[k];
  }
  // _addChar('KEY', { ...meta... }, 'ATTIRE', 'HAIR', {body})
  const re = /_addChar\(\s*'([A-Z0-9_]+)'\s*,\s*(\{[\s\S]*?\})\s*,\s*'/g;
  let m;
  while ((m = re.exec(src)) !== null){
    if (out[m[1]]) continue;
    try{ out[m[1]] = eval('(' + m[2] + ')'); }catch(e){ /* a malformed literal is not worth dying over */ }
  }
  return out;
}

// ── deterministic PRNG, seeded per character ─────────────────────────────────────────────────────
function seedOf(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngFor(s){ let x = seedOf(s) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

// ── style resolution ─────────────────────────────────────────────────────────────────────────────
// archetype is the floor; the label and bio are what actually decide.
const ARCH_STYLE = {
  powerhouse:'POWERHOUSE', technician:'TECHNICIAN', highFlyer:'HIGH_FLYER',
  brawler:'BRAWLER', freeAgent:'ATHLETE', enigma:'TRICKSTER'
};
// hand-written hints for words the style table cannot match on its own
const HINTS = [
  [/karate|kata|dojo/i,'KARATE'], [/capoeira|ginga/i,'CAPOEIRA'], [/muay|thai|clinch/i,'MUAY_THAI'],
  [/boxer|boxing|southpaw|jab|pugil/i,'BOXER'], [/kick\s*box/i,'KICKBOXER'], [/taekwondo/i,'TAEKWONDO'],
  [/kung\s*fu|wushu/i,'KUNG_FU'], [/judo/i,'JUDO'], [/sambo/i,'SAMBO'], [/jiu[-\s]?jitsu|bjj/i,'BJJ'],
  [/lucha|luchador|mask/i,'LUCHADOR'], [/cruiser/i,'CRUISERWEIGHT'], [/high[-\s]?fl|aerial|top rope|gravity/i,'HIGH_FLYER'],
  [/sumo/i,'SUMO'], [/giant|colossus|titan|quake|tower/i,'GIANT'], [/monster|beast|nightmare/i,'MONSTER'],
  [/feral|animal|savage|rabid/i,'FERAL'], [/undead|grave|tomb|death.?man|reaper/i,'UNDEAD'],
  [/occult|ritual|demon|cult/i,'OCCULTIST'], [/preacher|messiah|saint|prophet/i,'CULT_LEADER'],
  [/hardcore|deathmatch|barbed|tubes/i,'HARDCORE'], [/garbage|trash/i,'GARBAGE'],
  [/street|hood|corner|avenger|robb/i,'STREET'], [/prison|convict|yard|inmate/i,'PRISON'],
  [/biker|rider|chopper/i,'BIKER'], [/cowboy|ranch|rodeo/i,'COWBOY'], [/lumber|timber|axe/i,'LUMBERJACK'],
  [/bouncer|security|enforcer/i,'ENFORCER'], [/broker|corporate|contract|executive|chairman|suit/i,'RING_GENERAL'],
  [/veteran|grizzled|old\s*school|legend/i,'VETERAN'], [/rookie|prospect|debut/i,'ROOKIE'],
  [/prodigy|phenom|generational/i,'PRODIGY'], [/showman|entertainer|spotlight|charisma/i,'SHOWMAN'],
  [/rockstar|rock\s*star|guitar|band/i,'ROCKSTAR'], [/dancer|dance/i,'DANCER'], [/comedy|comedian|clown|joke/i,'COMEDIAN'],
  [/trick|illusion|phantom|shadow|ghost/i,'TRICKSTER'], [/cheat|dirty|crooked|steal|thief/i,'CHEATER'],
  [/coward|chicken|runs|scared/i,'COWARD'], [/strongman|iron|steel|anvil/i,'STRONGMAN'],
  [/submission|stretch|tap|hold|contain/i,'SUB_SPEC'], [/catch\s*wrestl|shoot/i,'SHOOTER'],
  [/amateur|collegiate|olympic|freestyle/i,'AMATEUR'], [/greco/i,'GRECO'], [/mma|cage|octagon/i,'MMA'],
  [/strong\s*style|puro/i,'STRONG_STYLE'], [/king.?s road/i,'KINGS_ROAD'], [/queen|regal|royal|throne/i,'SHOWMAN'],
  [/technic|surgical|precise|clinical/i,'TECHNICIAN'], [/grappl|mat\b/i,'GRAPPLER'],
  [/brawl|slug|bar\s*room/i,'BRAWLER'], [/power\s*house|bulldozer/i,'POWERHOUSE'],
  [/acrobat|tumbl|flip|wire|tightrope/i,'ACROBAT'], [/daredevil|reckless|no net/i,'DAREDEVIL'],
  [/weapon|chair|kendo|armed/i,'SPECIALIST'], [/body\s*build|physique|posed/i,'BODYBUILDER'],
  [/athlete|athletic|sport/i,'ATHLETE']
];
function resolveStyle(key, meta, styles){
  const text = [meta.label || '', meta.bio || '', key.replace(/_/g, ' ')].join(' ');
  for (const [re, id] of HINTS) if (re.test(text) && styles.some(s => s.id === id)) return { id, via:'label/bio' };
  // second pass: the style table's own labels
  for (const s of styles){
    const word = s.label.split(/[^A-Za-z]/)[0];
    if (word.length > 4 && new RegExp('\\b' + word, 'i').test(text)) return { id:s.id, via:'style label' };
  }
  const a = ARCH_STYLE[meta.archetype] || 'ATHLETE';
  return { id: styles.some(s => s.id === a) ? a : 'ATHLETE', via:'archetype ' + (meta.archetype || '?') };
}

// ── the clip pool ────────────────────────────────────────────────────────────────────────────────
function clipPool(){
  const byPos = {}, all = [];
  const add = (clip, pos, cat, style) => {
    if (!clip) return;
    const rec = { clip, pos: pos || null, cat: cat || null, style: style || [] };
    all.push(rec);
    (byPos[rec.pos || '_ANY'] = byPos[rec.pos || '_ANY'] || []).push(rec);
  };
  try{
    const f = JSON.parse(fs.readFileSync(path.join(MOVES, 'fbx_move_map.json'), 'utf8'));
    (f.clips || []).forEach(c => add(c.clip, c.pos, c.cat, c.style));
  }catch(e){}
  try{
    const c = JSON.parse(fs.readFileSync(path.join(MOVES, 'combat_clip_map.json'), 'utf8'));
    for (const move in (c.map || {})){
      const v = c.map[move];
      add(typeof v === 'string' ? v : (v && v.clip), (v && v.pos) || null, (v && v.kind) || null, []);
    }
  }catch(e){}
  return { byPos, all };
}

// how well does a capture suit a slot, for a fighter with this bias?
const KIND_AXIS = {
  strike:'str', combo:'spd', combo_ender:'pow', grapple:'tec', carry:'pow', submission:'sub',
  dive:'air', rollup:'spd', pin:'tec', taunt:'sho', getup:'spd', locomotion:'spd', stance:'res',
  reaction:'res', evade:'spd', reversal:'tec', chain:'tec', breaker:'tec', tag:'sho',
  rumble:'res', cage:'pow', ladder:'air', table:'pow', deathmatch:'res', illegal:'sho',
  weapon_strike:'str', weapon_grapple:'pow', rest_hold:'tec', signature:'sho', finisher:'pow'
};
function scoreClip(rec, slot, style, rnd){
  let s = 1;
  if (slot.pos && rec.pos === slot.pos) s += 4;                 // right position is worth most
  const axis = KIND_AXIS[slot.kind];
  if (axis) s += (style.bias[axis] || 5) * 0.32;                // the fighter's own leaning
  if (style.prefers.indexOf(slot.kind) >= 0) s += 3.2;          // this style reaches for this kind
  if (rec.cat && slot.kind && String(rec.cat).toLowerCase().indexOf(String(slot.kind).toLowerCase()) >= 0) s += 1.6;
  return s + rnd() * 2.4;                                       // jitter so two same-style fighters differ
}

// ── build ────────────────────────────────────────────────────────────────────────────────────────
const schema = JSON.parse(fs.readFileSync(path.join(MOVES, 'moveset_schema.json'), 'utf8'));
const pins   = JSON.parse(fs.readFileSync(path.join(MOVES, 'pin_moves.json'), 'utf8'));
const roster = readRoster();
const pool   = clipPool();
const styles = schema.styles || [];
const allSlots = [];
(schema.cats || []).forEach(c => c.groups.forEach(g => g.slots.forEach(s => allSlots.push(s))));

if (!pool.all.length){ console.error('no clips in the pool — run the mocap mappers first'); process.exit(1); }

const out = {};
const styleTally = {};
let assigned = 0;

const names = Object.keys(roster).filter(k => !WHO || k === WHO).sort();
for (const key of names){
  const meta = roster[key];
  const rnd = rngFor(key);
  const st = resolveStyle(key, meta, styles);
  const style = styles.filter(s => s.id === st.id)[0] || styles[0];
  styleTally[style.id] = (styleTally[style.id] || 0) + 1;

  const rec = { _style: style.id, _styleVia: st.via, _archetype: meta.archetype || null };

  for (const slot of allSlots){
    if (slot.kind === 'ai_slider' || slot.kind === 'ai_sequence') continue;
    // PINS are their own catalogue, not the clip pool
    if (slot.kind === 'pin' || slot.kind === 'rollup' || slot.kind === 'pin_cocky' || slot.kind === 'pin_illegal'){
      const want = (pins.pins || []).filter(p => p.id === slot.id);
      // an illegal pin is only carried by someone the writing says would carry one
      if (want.length){
        const p = want[0];
        const dirty = /cheat|dirty|crook|steal|thief|coward|heel/i.test((meta.label || '') + (meta.bio || ''));
        if (p.illegal && !dirty) continue;
        if (p.cocky && style.bias.sho < 6) continue;
        // roll-ups favour the quick and the technical; a giant is not hitting a La Magistral
        if (p.entry === 'ROLLUP' && (style.bias.spd + style.bias.tec) < 10 && rnd() > 0.18) continue;
        rec[slot.id] = p.id; assigned++;
      }
      continue;
    }
    const cands = (slot.pos && pool.byPos[slot.pos] && pool.byPos[slot.pos].length)
      ? pool.byPos[slot.pos] : pool.all;
    if (!cands.length) continue;
    const n = Math.max(1, Math.min(slot.pick || 1, cands.length));
    const scored = cands.map(c => [scoreClip(c, slot, style, rnd), c]).sort((a, b) => b[0] - a[0]);
    // a slot holds `pick` moves by default; the first is the one the engine reaches for
    const chosen = scored.slice(0, n).map(x => x[1].clip);
    rec[slot.id] = chosen.length === 1 ? chosen[0] : chosen;
    assigned += chosen.length;
  }

  // bases and personality come straight off the style row
  rec._stance = style.stance;
  rec._gait = style.locomotion;
  // paybacks: one major and one minor, chosen by what the fighter is
  const majors = (schema.paybacks || []).filter(p => p.tier === 'major');
  const minors = (schema.paybacks || []).filter(p => p.tier === 'minor');
  if (majors.length) rec._pbMajor = majors[Math.floor(rnd() * majors.length)].id;
  if (minors.length) rec._pbMinor = minors[Math.floor(rnd() * minors.length)].id;

  out[key] = rec;

  if (EXPLAIN && WHO){
    console.log(key + '  style=' + style.id + '  (' + st.via + ')  stance=' + style.stance + '/' + style.locomotion);
    console.log('  bias', JSON.stringify(style.bias));
    console.log('  slots filled: ' + Object.keys(rec).filter(k => k[0] !== '_').length);
    ['ST_F_LIGHT','ST_F_HGRAP','DV_TR_H','SUB_STAND','PN_RR_SCHOOLBOY','FIN_RING'].forEach(id => {
      if (rec[id]) console.log('    ' + id.padEnd(18) + ' -> ' + JSON.stringify(rec[id]).slice(0, 90));
    });
  }
}

if (!WHO){
  fs.writeFileSync(OUT, JSON.stringify({
    _note:'AUTO-GENERATED by tools/moves/gen_roster_movesets.cjs — the DEFAULT move set for every ' +
          'character. The in-game editor writes localStorage bannon_moveset_slots and ALWAYS wins ' +
          'over this; regenerate freely, it can never overwrite a player edit.',
    generated:new Date().toISOString().slice(0,10),
    characters:Object.keys(out).length,
    slotsPerCharacter:allSlots.length,
    assignments:assigned,
    styleDistribution:Object.keys(styleTally).sort((a,b)=>styleTally[b]-styleTally[a])
      .reduce((o,k)=>{ o[k]=styleTally[k]; return o; },{}),
    sets:out
  }));
}

console.log('characters        : ' + Object.keys(out).length);
console.log('slots each        : ' + allSlots.length);
console.log('assignments       : ' + assigned);
console.log('distinct styles   : ' + Object.keys(styleTally).length + ' of ' + styles.length + ' used');
const top = Object.keys(styleTally).sort((a,b)=>styleTally[b]-styleTally[a]).slice(0,10);
console.log('most common       : ' + top.map(k=>k+' x'+styleTally[k]).join(', '));
const byLabel = Object.keys(styleTally).filter(k => styleTally[k] === 1).length;
console.log('one-of-a-kind     : ' + byLabel + ' styles held by exactly one wrestler');
if (!WHO) console.log('wrote assets/moves/roster_movesets.json');
