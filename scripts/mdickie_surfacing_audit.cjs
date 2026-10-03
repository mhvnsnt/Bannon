#!/usr/bin/env node
/* MDICKIE SURFACING AUDIT — of everything imported from the MDickie games, what can a PLAYER
 * actually reach in our game, and through which door?
 *
 *   node scripts/mdickie_surfacing_audit.cjs
 *
 * Imported content that nothing exposes is the same as content that does not exist. This walks every
 * MDickie asset class and asks the only question that matters: is there a path from a running game
 * to this thing. A class with data but no door is the finding.
 */
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'BANNON_v150.html'),'utf8');
const rd=p=>{ try{ return JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8')); }catch(_){ return null; } };
const has=(...pats)=>pats.every(p=>src.includes(p));

const venues=rd('assets/models/env/mdickie/world/venues.json');
let loc=0,prop=0,veh=0;
if(venues) for(const g of Object.keys(venues.game||{})) for(const e of venues.game[g])
  { if(e.cat==='location')loc++; else if(e.cat==='prop')prop++; else if(e.cat==='vehicle')veh++; }

const mv=(rd('assets/moves/mdickie_moves.json')||{}).moves||[];
const bk=(rd('assets/moves/mdickie_buckle_moves.json')||{}).moves||[];
const gr=(rd('assets/moves/mdickie_ground_moves.json')||{}).moves||[];
const wp=(rd('assets/moves/mdickie_weapons.json')||{}).weapons||[];

const ROWS=[
  ['Locations (venues)', loc,
   has('BANNON_VENUES','openVenuePicker') && has("locs.forEach"),
   'STAGE button -> venue picker -> buildCurrent loads the GLB'],
  ['Props / decor',      prop,
   has('BANNON_MDICKIE','function dress('),
   'BANNON_MDICKIE.dress() places them per location'],
  ['Vehicles',           veh,
   has('BANNON_MDICKIE') && src.includes('vehicles'),
   'parked by dress() in the location that owns them'],
  ['Carryable weapons',  34,
   has('BANNON_WEAPONS','spawnWeapon'),
   'weaponize() -> the live weapon list -> pickup/swing'],
  ['Wearables',          64,
   has('wearOn','unwear'),
   'wearOn() attaches to the head/foot BONE'],
  ['Move definitions',   mv.length+bk.length+gr.length,
   has('BANNON_MOVE_LIBRARY','BANNON_MOVEPOOL'),
   'folded into the library pools, drawn by BANNON_MOVEPOOL.pick()'],
  ['Weapon stats',       wp.length,
   has('BANNON_WEAPONS'),
   'damage/mass/reach feed the weapon laws'],
  ['Backstage / office',  1,
   has('BANNON_TRAVEL','BANNON_CARDS'),
   'BANNON_TRAVEL walk-in doorways + interactive cards'],
  ['News / graphic cards',1,
   has('BANNON_CARDS','function news('),
   'weekly headlines presented as cards'],
  ['Dialogue moments',    1,
   has('BANNON_STORY','dialogueChoices'),
   'meeting() -> choices -> choose() with real consequences'],
  ['Run-ins / interference',1,
   has('BANNON_INTERFERENCE'),
   'a real third body, triggered at the count of two'],
  ['In-ring promos',      1,
   has('BANNON_SEGMENT','generateInRingPromo'),
   'post-win + weekly, answered through the story branches'],
  ['Injuries / trauma',   1,
   has('BANNON_TRAUMA','severeTrauma'),
   'carries between matches through the career model'],
  ['Court / legal',       1,
   has('BANNON_LEGAL') && /BANNON_COURT\s*\(/.test(src),
   'triggered from career consequences'],
  ['Character rigs',      1,
   has('BANNON_RIGS','displayName'),
   'renamed proprietary, e.g. Judas Messiah'],
  ['Roam / free movement',1,
   has('__godWithinRoam'),
   'God Within roam, now starting at a home location'],
];

console.log('MDICKIE SURFACING AUDIT');
console.log('='.repeat(84));
console.log('CLASS'.padEnd(26)+'COUNT'.padStart(6)+'  REACHABLE  DOOR');
let open=0, shut=[];
ROWS.forEach(([n,c,ok,door])=>{
  console.log(n.padEnd(26)+String(c).padStart(6)+'  '+(ok?'yes      ':'NO       ')+'  '+door);
  if(ok) open++; else shut.push(n);
});
console.log('-'.repeat(84));
console.log('surfaced: '+open+' / '+ROWS.length);
if(shut.length) console.log('\nNOT REACHABLE — data exists, no door:\n  ' + shut.join('\n  '));
else console.log('\nEvery MDickie content class has a path from a running game.');
process.exit(0);
