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
// An archetype is not a style, it is a FAMILY of them. Mapping each archetype to one style collapsed
// 105 characters onto six answers — 36 of the 71 styles went unused and sixteen wrestlers all came
// out TECHNICIAN. Each archetype now offers everything plausible for it, and the balancer below
// spreads the roster across the whole family instead of piling onto the first entry.
const ARCH_FAMILY = {
  powerhouse:['POWERHOUSE','GIANT','STRONGMAN','BRUISER','MONSTER','BEAST','SUMO','BODYBUILDER',
              'ENFORCER','LUMBERJACK','GRECO','KINGS_ROAD','STRONG_STYLE','UNDEAD','KYOKUSHIN'],
  technician:['TECHNICIAN','GRAPPLER','MAT_TECH','CATCH','SHOOTER','AMATEUR','FREESTYLE','JUDO',
              'SAMBO','BJJ','SUB_SPEC','LUTA_LIVRE','RING_GENERAL','VETERAN','MMA','JUNIOR'],
  highFlyer: ['HIGH_FLYER','LUCHADOR','CRUISERWEIGHT','JUNIOR','DAREDEVIL','ACROBAT','WUSHU',
              'TAEKWONDO','CAPOEIRA','KUNG_FU','DANCER','PRODIGY'],
  brawler:   ['BRAWLER','STREET','BARROOM','PRISON','BIKER','HARDCORE','GARBAGE','DEATHMATCH',
              'BOXER','MUAY_THAI','KICKBOXER','SAVATE','STRIKER','COWBOY','BOUNCER','SPECIALIST'],
  freeAgent: ['ATHLETE','PRODIGY','ROOKIE','STRIKER','MMA','SHOWMAN','ENTERTAINER','KARATE',
              'RING_GENERAL','JUNIOR','TECHNICIAN','HIGH_FLYER'],
  enigma:    ['TRICKSTER','CHEATER','COWARD','OCCULTIST','CULT_LEADER','UNDEAD','MONSTER','FERAL',
              'COMEDIAN','ROCKSTAR','SHOWMAN','DANCER']
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
  // No hint in the writing. Take the LEAST-USED style from this archetype's family so the roster
  // spreads across all 71 instead of stacking on whichever one happens to be first.
  const fam = (ARCH_FAMILY[meta.archetype] || ARCH_FAMILY.freeAgent)
    .filter(id => styles.some(s => s.id === id));
  if (!fam.length) return { id:'ATHLETE', via:'fallback' };
  let best = fam[0], bestN = Infinity;
  for (const id of fam){
    const n = USED[id] || 0;
    if (n < bestN){ bestN = n; best = id; }
  }
  return { id:best, via:'archetype spread · ' + (meta.archetype || '?') };
}
// running tally the spreader reads. Declared here so resolveStyle can see it.
const USED = {};

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

  // ── TAG IS ITS OWN POOL, AND IT IS SUBTRACTED FROM EVERY OTHER ONE ─────────────────────────────
  // Owner: "DOUBLESUPLEX and ASSISTEDDIVSENTON sound like tag moves and there's probably others u
  // should have put in the tag category". He was right, and the cause was that TAG slots drew from
  // pool.byPos[slot.pos] like everything else — so a Standing Double Team resolved to whatever
  // singles capture happened to score highest at STANDING_FRONT, which is how "Heavy Weapon Swing"
  // ended up as a tag move. Meanwhile the eight genuine two-attacker captures were used for nothing.
  //
  // tag_moves.json is produced by tools/moves/classify_tag_moves.cjs, which counts BODY skeleton
  // roots in each baked clip rather than reading its name. That distinction matters both ways:
  // HAMMERLOCKDDT looks like a crowd at 519 bones but has only two bodies, and STRONGZERO is a real
  // three-man capture with neither "double" nor "assist" anywhere in its name.
  // NORMALISE BEFORE COMPARING. The baked clip index keys these captures as DOUBLESUPLEX while
  // fbx_move_map.json carries the same capture as "DoubleSuplex" and other sources space them out.
  // A literal string compare silently matched nothing, so the subtraction below did nothing at all.
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let tagSet = {};
  const tagPool = [];
  try{
    const t = JSON.parse(fs.readFileSync(path.join(MOVES, 'tag_moves.json'), 'utf8'));
    (t.tag || []).forEach(entry => {
      (entry.clips || []).forEach(c => {
        tagSet[norm(c)] = entry.base;
        tagPool.push({ clip:c, base:entry.base, bodies:entry.bodies, pos:null, cat:'tag', style:[] });
      });
      tagSet[norm(entry.base)] = entry.base;
    });
  }catch(e){}
  // a two-attacker capture must NOT be reachable from a singles slot — a lone wrestler cannot
  // perform a move that needs a partner, and leaving them in the general pool is how the mistake
  // would come straight back.
  const isTag = c => !!tagSet[norm(c)];
  const solo = all.filter(r => !isTag(r.clip));
  const soloByPos = {};
  Object.keys(byPos).forEach(k => {
    const keep = byPos[k].filter(r => !isTag(r.clip));
    if (keep.length) soloByPos[k] = keep;
  });

  return { byPos: soloByPos, all: solo, tagPool, isTag, tagBases: Object.keys(tagSet).length };
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
  USED[style.id] = (USED[style.id] || 0) + 1;

  const rec = { _style: style.id, _styleVia: st.via, _archetype: meta.archetype || null };

  // ── WHICH GET-UPS, REACTIONS AND EXITS DOES THIS FIGHTER EVEN OWN? ──────────────────────────
  // Owner: "get ups and other positions and things from Movesets ... they are deep, for every
  // module". He is right and filling every base slot for everyone was the lazy read: if all 120
  // wrestlers own the kip-up, the handspring AND the zombie sit-up, then how a man stands back up
  // says nothing about him. A kip-up is an athlete's move. A rope-assisted get-up is what a
  // veteran does because he is hurt. A sit-up straight from flat on his back belongs to something
  // that should not be getting up at all.
  //
  // So base-category slots are OWNED conditionally, tested against the fighter's own bias. Nobody
  // ends up with none — BS_GU_BASE and the standard reactions are unconditional — but which of the
  // dramatic ones you carry is now a statement about the character.
  const B = style.bias;
  const OWNS = {
    BS_GU_KIP:      B.spd >= 7 && B.air >= 5,          // kip-up: fast and athletic
    BS_GU_HAND:     B.air >= 7 && B.spd >= 7,          // handspring: genuinely acrobatic
    BS_GU_ZOMBIE:   B.res >= 8 && B.spd <= 5,          // sit straight up: unkillable and unhurried
    BS_GU_ROPE:     B.spd <= 6 || B.res <= 6,          // haul yourself up on the ropes
    BS_GU_CORNER:   B.res <= 7,
    BS_GU_SLOW:     B.spd <= 6 || B.pow >= 8,          // big or slow men get up slowly
    BS_GU_KNEE:     true,
    BS_GU_ROLL:     B.spd >= 6,
    BS_GU_INSTANT:  B.spd >= 8 && B.res >= 6,          // straight back to his feet
    BS_GU_BASE:     true,
    BS_SELL_KO:     true, BS_SELL_L: true, BS_SELL_H: true, BS_SELL_STUN: true,
    BS_BLOCK:       true,
    BS_DODGE:       B.spd >= 6,
    BS_CRAWL:       B.res >= 7,
    BS_ROLL_IN:     B.spd >= 5,
    BS_SLIDE_OUT:   B.spd >= 6,
    BS_CLIMB:       B.air >= 4,
    BS_APRON_UP:    true,
    BS_HURT_WALK:   true, BS_BACK: true, BS_STRAFE: true, BS_SPRINT: B.spd >= 5,
    BS_IDLE_G:      true, BS_IDLE_W: true, BS_IDLE_H: true, BS_IDLE_T: B.sho >= 5,
    BS_WIN:         true, BS_LOSE: true, BS_CELEBRATE: B.sho >= 5,
    // taunts scale with showmanship — a shooter does not do six of them
    TC_TOP:  B.air >= 5, TC_MID: B.air >= 4, TC_AP_IN: B.sho >= 5, TC_AP_OUT: B.sho >= 6,
    TO_TOP:  B.air >= 5, TO_MID: B.air >= 4, TO_AP_IN: B.sho >= 5, TO_AP_OUT: B.sho >= 6,
    TW_TOP_R: B.air >= 6, TW_TOP_S: B.air >= 7, TW_MID: B.air >= 5,
    TS_MOCK: B.sho >= 6,
    // and the aerial/elevated modules are not for everyone either
    DV_TH_SUICIDE: B.air >= 6, DV_TH_TOPE: B.air >= 7, DV_TH_TOPCON: B.air >= 8,
    SB_WALL: B.air >= 7, SB_BARR: B.air >= 7,
    EL_LD_DIVE: B.air >= 6, EL_RF_THRU: B.res >= 8,
    MT_DM_TUBES: /HARDCORE|DEATHMATCH|GARBAGE/.test(style.id),
    MT_DM_BARBED: /HARDCORE|DEATHMATCH|GARBAGE/.test(style.id),
    MT_DM_THUMB: /HARDCORE|DEATHMATCH|GARBAGE/.test(style.id),
    MT_DM_PANE: /HARDCORE|DEATHMATCH|GARBAGE/.test(style.id),
    OA_LOWBLOW: B.sho <= 7 && /CHEAT|COWARD|TRICK|STREET|PRISON|HARDCORE/.test(style.id),
    OA_EYE:  /CHEAT|COWARD|TRICK|STREET|PRISON|FERAL|MONSTER/.test(style.id),
    OA_BITE: /FERAL|MONSTER|BEAST|UNDEAD|PRISON/.test(style.id),
    OA_REF:  /CHEAT|COWARD|MONSTER|PRISON/.test(style.id),
    SUB_REST: B.tec >= 7 || B.res >= 8,
    ST_F_CHAIN: B.tec >= 7, ST_F_STRUGGLE: B.tec >= 6, PM_LOCKUP: B.tec >= 6
  };
  var ownedBase = 0, skippedBase = 0;

  for (const slot of allSlots){
    if (slot.kind === 'ai_slider' || slot.kind === 'ai_sequence') continue;
    if (Object.prototype.hasOwnProperty.call(OWNS, slot.id)){
      if (!OWNS[slot.id]){ skippedBase++; continue; }
      ownedBase++;
    }
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
    // A COMBAT SLOT CANNOT HOLD A DEATH ANIMATION. The category is already on every clip in
    // fbx_move_map and the filler ignored it, so slots were scored purely on style fit and position.
    // MEASURED on BANNON: 19 of 281 combat fills were non-combat captures -- "Death From Back
    // Headshot" in a STRIKE slot, "Zombie Dying" and "CemeteryDrive" in GRAPPLE slots, "falling idle"
    // and "idle (3)" in strike and carry slots. In a real match that was the single most-played
    // capture in the game: 41 of 79 poses across a button-mashing run were DEATH_FROM_BACK_HEADSHOT.
    // A strike that plays a dying animation is exactly the limp marionette flop the owner keeps
    // reporting, and it is why the fix has never stuck -- the clips WERE firing, they were just the
    // wrong clips.
    const COMBAT_KINDS = { strike:1, combo:1, combo_ender:1, grapple:1, carry:1, dive:1,
                           submission:1, chain:1, breaker:1, rollup:1 };
    const okFor = (slot, rec) => {
      if (!COMBAT_KINDS[slot.kind]) return true;            // stances, taunts, get-ups keep their own
      const cat = String(rec.cat || '').toLowerCase();
      if (cat && /knockdown|locomotion|taunt|style_stance|character_rig|reaction|misc/.test(cat)) return false;
      // backstop for clips with no category recorded
      return !/death|dying|zombie|coffin|cemetery|corpse|\bidle\b|falling|sit|walk|run cycle/i.test(rec.clip || '');
    };
    // a TAG slot can only be filled by a capture that has two attackers in it
    let cands = (slot.kind === 'tag')
      ? (pool.tagPool && pool.tagPool.length ? pool.tagPool : [])
      : ((slot.pos && pool.byPos[slot.pos] && pool.byPos[slot.pos].length)
          ? pool.byPos[slot.pos] : pool.all);
    if (COMBAT_KINDS[slot.kind]){
      const clean = cands.filter(c => okFor(slot, c));
      // fall back to the whole pool's clean half rather than to junk if this position has none
      cands = clean.length ? clean : pool.all.filter(c => okFor(slot, c));
    }
    if (!cands.length) continue;
    const n = Math.max(1, Math.min(slot.pick || 1, cands.length));
    const scored = cands.map(c => [scoreClip(c, slot, style, rnd), c]).sort((a, b) => b[0] - a[0]);
    // a slot holds `pick` moves by default; the first is the one the engine reaches for
    const chosen = scored.slice(0, n).map(x => x[1].clip);
    rec[slot.id] = chosen.length === 1 ? chosen[0] : chosen;
    assigned += chosen.length;
  }

  // BASES ARE PER-CHARACTER, NOT PER-STYLE. Reading them straight off the style row meant every
  // fighter sharing a style stood the same, walked the same and taunted the same — which is most of
  // what makes a roster feel like one wrestler in different colours. The style sets the FAMILY; the
  // character's own seed picks within it, so two TECHNICIANs read as two different men.
  var STANCE_NEAR = {
    BALANCED:['BALANCED','BLADED','CROUCH','POSED'], WIDE:['WIDE','SUMO','TOWERING','HUNCHED'],
    CROUCH:['CROUCH','JUDO','BALANCED','MMA'], BLADED:['BLADED','BOXING','MMA','KARATE'],
    BOXING:['BOXING','BLADED','MMA'], THAI:['THAI','MUAY','BLADED','MMA'],
    KARATE:['KARATE','KUNGFU','BLADED'], KUNGFU:['KUNGFU','KARATE','CAPOEIRA'],
    CAPOEIRA:['CAPOEIRA','KUNGFU','LUCHA'], LUCHA:['LUCHA','LIGHT','CAPOEIRA'],
    LIGHT:['LIGHT','LUCHA','BLADED'], HUNCHED:['HUNCHED','WIDE','STREET'],
    TOWERING:['TOWERING','WIDE','HUNCHED'], POSED:['POSED','BALANCED','STREET'],
    STREET:['STREET','HUNCHED','WIDE'], SUMO:['SUMO','WIDE'], JUDO:['JUDO','CROUCH'],
    MMA:['MMA','BLADED','CROUCH'], GOOFY:['GOOFY','POSED','STREET']
  };
  var GAIT_NEAR = {
    NORMAL:['NORMAL','LIGHT','DELIBERATE'], HEAVY:['HEAVY','LUMBER','STALK'],
    LUMBER:['LUMBER','HEAVY','STALK'], STALK:['STALK','PROWL','LUMBER'],
    PROWL:['PROWL','STALK','LIGHT'], LIGHT:['LIGHT','BOUNCE','NORMAL'],
    BOUNCE:['BOUNCE','LIGHT','SPRING'], SPRING:['SPRING','BOUNCE','LIGHT'],
    STRUT:['STRUT','SWAGGER','POSED'], SWAGGER:['SWAGGER','STRUT','HEAVY'],
    DELIBERATE:['DELIBERATE','NORMAL','STALK'], GINGA:['GINGA','SPRING','BOUNCE'],
    SCURRY:['SCURRY','LIGHT','BOUNCE']
  };
  var sPool = STANCE_NEAR[style.stance] || [style.stance];
  var gPool = GAIT_NEAR[style.locomotion] || [style.locomotion];
  rec._stance = sPool[Math.floor(rnd() * sPool.length)];
  rec._gait   = gPool[Math.floor(rnd() * gPool.length)];
  // an injured walk and a run style of their own, drawn from the same family
  rec._gaitRun  = gPool[Math.floor(rnd() * gPool.length)];
  rec._gaitHurt = (GAIT_NEAR.DELIBERATE)[Math.floor(rnd() * 3)];
  // SIGNATURE TAUNT — showmanship decides how many they carry, the seed decides which
  rec._taunts = Math.max(1, Math.round(1 + style.bias.sho * 0.45));
  // paybacks: one major and one minor, chosen by what the fighter is
  // PAYBACKS, AND THE VARIANT IS THE CHARACTER. Picking a random major off a flat list gave a
  // luchador the Fireball and a technician Soul Siphon. A payback has to fit the man, and then the
  // VARIANT has to fit him too — which of the seven mists, which of the twenty-nine freezes, which
  // of the thirty comeback chains. That is the whole of what the owner asked for.
  const majors = (schema.paybacks || []).filter(p => p.tier === 'major');
  const minors = (schema.paybacks || []).filter(p => p.tier === 'minor');
  const dirty  = /cheat|dirty|crook|steal|thief|coward|heel|prison|street|hardcore|garbage/i
                   .test((meta.label||'') + (meta.bio||'') + style.id);
  const eerie  = /UNDEAD|OCCULT|CULT|MONSTER|FERAL|TRICKSTER/.test(style.id);
  const showy  = B.sho >= 7;
  // which majors is this fighter even plausible for?
  const majorFit = majors.filter(p => {
    if (p.id === 'PB_FIREBALL' || p.id === 'PB_POWDER' || p.id === 'PB_PUNCH' || p.id === 'PB_REFBUMP') return dirty;
    if (p.id === 'PB_MIST')    return dirty || eerie;
    if (p.id === 'PB_SIPHON')  return eerie;
    if (p.id === 'PB_BLACKOUT')return eerie || showy;
    if (p.id === 'PB_THIEF')   return B.tec >= 7 || /TRICK|CHEAT|PRODIGY/.test(style.id);
    if (p.id === 'PB_SPIRIT')  return B.str >= 7 || B.pow >= 8;
    if (p.id === 'PB_RUNIN')   return dirty || /CULT|SHOWMAN|ENTERTAINER/.test(style.id);
    return true;                                   // Comeback / Second Wind / Resiliency suit anyone
  });
  const majPool = majorFit.length ? majorFit : majors;
  const maj = majPool[Math.floor(rnd() * majPool.length)];
  if (maj){
    rec._pbMajor = maj.id;
    // now the PERFORMANCE. Comeback chains match the fighter's archetype, freezes match his temper,
    // mists and kip-ups match what his body can actually do.
    let vs = (maj.variants || []).slice();
    if (maj.id === 'PB_COMEBACK'){
      const want = eerie ? 'undead' : dirty ? 'dirty' : showy ? 'show'
                 : B.air >= 7 ? 'aerial' : B.tec >= 8 ? 'tech'
                 : B.pow >= 8 ? 'power' : 'strike';
      const chains = (schema.comebacks || []);
      const fit = chains.filter(c => c.arch === want);
      const chosen = (fit.length ? fit : chains)[Math.floor(rnd() * (fit.length ? fit.length : chains.length))];
      if (chosen) rec._pbMajorV = chosen.id;
    } else if (maj.id === 'PB_SECOND_WIND'){
      const ok = vs.filter(v => v.req === 'any'
        || (v.req === 'agility'    && B.spd >= 7)
        || (v.req === 'aerial'     && B.air >= 7)
        || (v.req === 'resilience' && B.res >= 8));
      const pick2 = (ok.length ? ok : vs);
      rec._pbMajorV = pick2[Math.floor(rnd() * pick2.length)].id;
    } else if (maj.id === 'PB_FREEZE'){
      // a shooter does not do an air-guitar freeze, and a showman does not do a benediction
      const tag = eerie ? /UNHINGED|CROSS|KNEEL|MASK|TONGUE|LEVITATE|SITUP|GRIN/
                : showy ? /CALL|SALUTE|CONDUCT|POSE|GUITAR|KISS|SNAP|BECKON/
                : dirty ? /LAUGH|WHISPER|CHOP|GRIN|SLAP|KISS/
                : B.res >= 8 ? /NOSELL|SHAKE|HEADTILT|STANDUP|STARE|CHEST|TAPE|VEST/
                : /STARE|NOD|BECKON|TAPE|SLAP|CHEST/;
      const ok = vs.filter(v => tag.test(v.id));
      const pick3 = (ok.length ? ok : vs);
      rec._pbMajorV = pick3[Math.floor(rnd() * pick3.length)].id;
    } else if (vs.length){
      rec._pbMajorV = vs[Math.floor(rnd() * vs.length)].id;
    }
  }
  // minors follow the body: a giant does not get Slippery, a cruiserweight does not get Beast
  const minorFit = minors.filter(p => {
    if (p.id === 'PB_BEAST')     return B.pow >= 8;
    if (p.id === 'PB_HIGH_RISK') return B.air >= 6;
    if (p.id === 'PB_SUB_HUNTER')return B.sub >= 7;
    if (p.id === 'PB_SLIPPERY')  return B.spd >= 6;
    if (p.id === 'PB_TECHNICAL') return B.tec >= 7;
    if (p.id === 'PB_DIRTY' || p.id === 'PB_BULLY') return dirty;
    if (p.id === 'PB_HATED')     return dirty || eerie;
    if (p.id === 'PB_CROWD' || p.id === 'PB_PAPARAZZI') return showy;
    if (p.id === 'PB_RAGE' || p.id === 'PB_FORTIFY') return B.res >= 7;
    return true;
  });
  const mpool = minorFit.length ? minorFit : minors;
  rec._pbMinor = mpool[Math.floor(rnd() * mpool.length)].id;

  rec._ownedConditional = ownedBase; rec._skippedConditional = skippedBase;
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
if (!WHO){
  var gk = ['BS_GU_KIP','BS_GU_HAND','BS_GU_ZOMBIE','BS_GU_ROPE','BS_GU_INSTANT','BS_GU_SLOW'];
  console.log('get-up ownership  : ' + gk.map(function(g){
    return g.replace('BS_GU_','') + ' ' + Object.keys(out).filter(function(k){ return out[k][g]; }).length;
  }).join(', ') + '   (of ' + Object.keys(out).length + ')');
  var sigs = new Set(Object.keys(out).map(function(k){
    return gk.map(function(g){ return out[k][g] ? 1 : 0; }).join('') + out[k]._stance + out[k]._gait;
  }));
  console.log('get-up signatures : ' + sigs.size + ' distinct across the roster');
  var majs = {}, vars_ = {};
  Object.keys(out).forEach(function(k){ majs[out[k]._pbMajor] = (majs[out[k]._pbMajor]||0)+1;
    if (out[k]._pbMajorV) vars_[out[k]._pbMajorV] = 1; });
  console.log('payback spread    : ' + Object.keys(majs).length + ' distinct majors, ' +
    Object.keys(vars_).length + ' distinct performances in use across the roster');
  console.log('  ' + Object.keys(majs).sort(function(a,b){return majs[b]-majs[a];})
    .slice(0,8).map(function(k){ return k.replace('PB_','')+' x'+majs[k]; }).join(', '));
}
if (!WHO) console.log('wrote assets/moves/roster_movesets.json');
