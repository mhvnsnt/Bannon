#!/usr/bin/env node
/* Transform the MDickie move VOCABULARY (tools/bbparse/out/moves_catalog.json, 191 anim sequences ->
 * ~70 distinct move `group`s) into proprietary BANNON move-library entries routed through OUR physics
 * (resolveGrapPos -> GRAPPLE_POSITIONS/DIVE_TYPES/sub/strike). We take WHICH moves exist, NOT MDickie's
 * canned animations (physics-first veto). Output: assets/moves/mdickie_moves.json, loaded by
 * BANNON_MOVE_LIBRARY. Names are proprietary (no trademarks). */
'use strict';
const fs = require('fs');
const cat = require('./out/moves_catalog.json');

// group -> [proprietaryName, engineMapping]. mapping: {pos|dive|sub|kind, mode?, deliver?, from?, style[]}
const MAP = {
  // --- SLAMS / SUPLEXES ---
  'bodyslam':               ['Body Toll',            {pos:'SIDE_SLAM',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse','brawler']}],
  'side slam':              ['Lateral Collapse',      {pos:'SIDE_SLAM',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse','brawler']}],
  'jumping bodyslam':       ['Leaping Body Toll',    {pos:'SIDE_SLAM',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  'suplex':                 ['Vertical Verdict',     {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['technical','powerhouse']}],
  'snap suplex':            ['Snap Verdict',         {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['technical']}],
  'stalling suplex':        ['Suspended Verdict',    {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['powerhouse','technical']}],
  'suplex drop':            ['Dropping Verdict',     {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['technical']}],
  'gutwrench suplex':       ['Gutwrench Verdict',    {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['powerhouse','technical']}],
  'belly-to-belly suplex':  ['Overhand Collapse',    {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['powerhouse']}],
  'belly-to-belly slam':    ['Overhand Slam',        {pos:'SIDE_SLAM',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['powerhouse']}],
  'northern lights suplex': ['Aurora Bridge',        {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'bridge',from:'STANDING_FRONT',style:['technical']}],
  'german suplex':          ['Deadlift German',      {pos:'BACK_SUPLEX',mode:'rear',deliver:'toss',from:'STANDING_REAR',style:['powerhouse','technical']}],
  'back suplex':            ['Rear Skyfall',         {pos:'BACK_SUPLEX',mode:'rear',deliver:'toss',from:'STANDING_REAR',style:['technical']}],
  'full nelson suplex':     ['Dragon Collapse',      {pos:'BACK_SUPLEX',mode:'rear',deliver:'toss',from:'STANDING_REAR',style:['technical']}],
  // --- DRIVERS / SPIKES ---
  'brainbuster':            ['Cranium Driver',       {pos:'BRAINBUSTER',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['technical','striker']}],
  'stalling brainbuster':   ['Suspended Cranium',    {pos:'BRAINBUSTER',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['technical']}],
  'jackhammer':             ['Piston Slam',          {pos:'BRAINBUSTER',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  'piledriver':             ['Foundation Driver',    {pos:'CROSS_POWERBOMB',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['powerhouse','hardcore']}],
  'inverted piledriver':    ['Inverted Foundation',  {pos:'CROSS_POWERBOMB',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['powerhouse']}],
  'tombstone piledriver':   ['The Headstone',        {pos:'CROSS_POWERBOMB',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['powerhouse']}],
  'death valley driver':    ['Ravine Driver',        {pos:'FIREMANS_CARRY',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['powerhouse']}],
  // --- POWERBOMBS / PRESSES ---
  'powerbomb':              ['Broken Architect Bomb',{pos:'POWERBOMB',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  'sitting powerbomb':      ['Seated Collapse',      {pos:'POWERBOMB',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  'press slam':             ['Overhead Verdict',     {pos:'GORILLA_PRESS',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['powerhouse']}],
  'pumping press slam':     ['Piston Press',         {pos:'GORILLA_PRESS',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['powerhouse']}],
  'gorilla press slam':     ['Indefinite Suspension',{pos:'GORILLA_PRESS',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['powerhouse']}],
  'powerslam':             ['Running Powerslam',     {pos:'SIDE_SLAM',mode:'front',deliver:'slam',from:'ROPE_REBOUND',style:['powerhouse','brawler']}],
  'shoulder powerslam':     ['Shoulder Reckoning',   {pos:'FIREMANS_CARRY',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  'razor\'s edge':          ['Guillotine Verdict',   {pos:'CROSS_POWERBOMB',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  // --- BACKBREAKERS / SPINEBUSTERS ---
  'backbreaker':            ['Kidney Breaker',       {pos:'BACKBREAKER',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['technical','brawler']}],
  'side backbreaker':       ['Lateral Breaker',      {pos:'BACKBREAKER',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['technical']}],
  'shoulder breaker':       ['Shoulder Breaker',     {pos:'BACKBREAKER',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['technical']}],
  'spinebuster':            ['Deadlift Spinebuster', {pos:'SPINEBUSTER',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  // --- DDT / FACEBUSTER / CUTTER FAMILY ---
  'ddt':                    ['Spike Verdict',        {pos:'DDT',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['technical','striker']}],
  'reverse ddt':            ['Backspin Spike',       {pos:'REVERSE_DDT',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['technical','showman'],carry:false}],
  'tornado ddt':            ['Tornado Snap',         {pos:'DDT',mode:'front',deliver:'spike',from:'ROPE_REBOUND',style:['highFlyer','lucha']}],
  'underhook facebuster (pedigree)':['The Pedigree Clause',{pos:'DDT',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['technical','powerhouse']}],
  'x-factor':               ['The X-Verdict',        {pos:'DDT',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['highFlyer','striker'],carry:false}],
  'stunner':                ['The Reckoning Cutter', {pos:'REVERSE_DDT',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['striker','showman'],carry:false}],
  'rock bottom':            ['The Bottom Line',      {pos:'SIDE_SLAM',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse'],carry:false}],
  'bulldog':                ['Running Bulldog',      {pos:'REVERSE_DDT',mode:'front',deliver:'spike',from:'ROPE_REBOUND',style:['brawler','showman'],carry:false}],
  'neckbreaker':            ['Neck Verdict',         {pos:'REVERSE_DDT',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['technical'],carry:false}],
  'skull crushing finale':  ['Cranial Finale',       {pos:'SIDE_SLAM',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['technical'],carry:false}],
  // --- TOSS / TAKEDOWN / THROW ---
  'back body drop':         ['Skyward Toss',         {pos:'FALLAWAY_SLAM',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['powerhouse']}],
  'hip toss':               ['Hip Verdict',          {pos:'ATOMIC_DROP',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['oldSchool','technical']}],
  'atomic drop':            ['Atomic Verdict',       {pos:'ATOMIC_DROP',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['oldSchool']}],
  'inverted atomic drop':   ['Inverted Atomic',      {pos:'ATOMIC_DROP',mode:'rear',deliver:'drop',from:'STANDING_REAR',style:['oldSchool']}],
  'samoan drop':            ['Island Drop',          {pos:'FIREMANS_CARRY',mode:'front',deliver:'slam',from:'STANDING_FRONT',style:['powerhouse']}],
  'snapmare':               ['Snap Takedown',        {pos:'ATOMIC_DROP',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['technical'],carry:false}],
  'drop toe hold':          ['Toe-Hold Takedown',    {pos:'STANDARD',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['technical','mma'],carry:false}],
  'russian legsweep':       ['Sickle Sweep',         {pos:'REVERSE_DDT',mode:'rear',deliver:'spike',from:'STANDING_REAR',style:['technical'],carry:false}],
  'headlock takedown':      ['Headlock Takedown',    {pos:'STANDARD',mode:'front',deliver:'toss',from:'STANDING_FRONT',style:['oldSchool','technical']}],
  'throat toss':            ['Gooseneck Toss',       {pos:'CHOKESLAM',mode:'front',deliver:'choke',from:'STANDING_FRONT',style:['powerhouse']}],
  'choke slam':             ['Gooseneck Hoist',      {pos:'CHOKESLAM',mode:'front',deliver:'choke',from:'STANDING_FRONT',style:['powerhouse']}],
  // --- AERIAL / LUCHA ---
  'hurricanranna':          ['Comet Rana',           {dive:'CROSSBODY',from:'TOP_ROPE',style:['highFlyer','lucha']}],
  'flying head scissors':   ['Orbital Scissors',     {dive:'CROSSBODY',from:'SPRINGBOARD',style:['lucha','highFlyer']}],
  'leaping plancha':        ['Leaping Comet',        {dive:'CROSSBODY',from:'TOP_ROPE',style:['highFlyer','lucha']}],
  // --- STRIKES ---
  'spear':                  ['Scorpio Spear',        {kind:'strike',from:'ROPE_REBOUND',power:74,style:['powerhouse','brawler']}],
  'standing clothesline':   ['Scorpio Lariat',       {kind:'strike',from:'ROPE_REBOUND',power:66,style:['brawler','powerhouse']}],
  'headlock punch':         ['Headlock Hammer',      {kind:'strike',from:'STANDING_FRONT',power:34,style:['brawler']}],
  'go to sleep':            ['Lights Out Knee',      {pos:'FIREMANS_CARRY',mode:'front',deliver:'spike',from:'STANDING_FRONT',style:['striker','mma']}],
  // --- SUBMISSIONS ---
  'sleeper hold':           ['Silent Sleeper',       {sub:'REAR_NAKED',limb:'neck',from:'STANDING_REAR',style:['mma','striker']}],
  'headlock':               ['Vice Headlock',        {sub:'BRIDGING_CHINLOCK',limb:'neck',from:'GROUNDED_HEAD',style:['oldSchool','technical']}],
  'full nelson':            ['Nelson Vice',          {sub:'ARM_TRAP_CRANK',limb:'arm',from:'STANDING_REAR',style:['technical','powerhouse']}],
  'test of strength':       ['Test of Strength',     {sub:'ARM_TRAP_CRANK',limb:'arm',from:'STANDING_FRONT',style:['powerhouse','technical']}],
  'underhook suplex':       ['Underhook Verdict',    {pos:'VERTICAL_SUPLEX',mode:'front',deliver:'drop',from:'STANDING_FRONT',style:['technical']}],
  'reverse suplex':         ['Reverse Verdict',      {pos:'BACK_SUPLEX',mode:'rear',deliver:'toss',from:'STANDING_REAR',style:['technical']}],
  // --- PINS (route to the pin system, not grapples) ---
  'small package':          ['Small Package',        {kind:'pin',pin:'small_package',from:'GROUNDED_SIDE',style:['technical']}],
  'victory roll':           ['Victory Roll',         {kind:'pin',pin:'victory_roll',from:'STANDING_REAR',style:['highFlyer','technical']}],
  'roll-up pin':            ['Schoolboy Roll-Up',    {kind:'pin',pin:'rollup',from:'STANDING_REAR',style:['technical']}],
  'crucifix pin':           ['Crucifix Cradle',      {kind:'pin',pin:'crucifix',from:'GROUNDED_SIDE',style:['technical','highFlyer']}],
  // --- TRANSITIONS / POSITIONAL (zone actions, not damage moves) ---
  'irish whip':             ['Irish Whip',           {kind:'position',action:'whip',from:'STANDING_FRONT',style:[]}],
  'grappling':              ['Collar-and-Elbow',     {kind:'position',action:'lockup',from:'STANDING_FRONT',style:[]}],
  'force out of ring':      ['Toss From Ring',       {kind:'position',action:'force_out',from:'ROPE_REBOUND',style:[]}],
  'force into ring':        ['Roll Into Ring',       {kind:'position',action:'force_in',from:'APRON',style:[]}],
  'drag out from apron':    ['Apron Drag-Out',       {kind:'position',action:'drag_out',from:'APRON',style:[]}],
  'drag in from apron':     ['Apron Drag-In',        {kind:'position',action:'drag_in',from:'APRON',style:[]}],
  'drag down from platform':['Platform Drag-Down',   {kind:'position',action:'drag_down',from:'APRON',style:[]}]
};

const groups = [...new Set(cat.moves.map(m => m.group))];
const out = { _note:'MDickie Wrestling Empire move VOCABULARY -> proprietary BANNON entries routed through OUR physics via resolveGrapPos (no MDickie animations copied). Generated by tools/bbparse/gen_mdickie_moves.cjs from tools/bbparse/out/moves_catalog.json.', _source:'moves_catalog.json ('+cat.count+' anim sequences)', moves:[] };
const unmapped = [];
for (const g of groups) {
  const m = MAP[g];
  if (!m) { unmapped.push(g); continue; }
  const [name, spec] = m;
  out.moves.push(Object.assign({ name, mdickie:g }, spec));
}
fs.writeFileSync(__dirname + '/../../assets/moves/mdickie_moves.json', JSON.stringify(out, null, 1));
console.log('wrote assets/moves/mdickie_moves.json —', out.moves.length, 'moves mapped;', unmapped.length, 'unmapped:', unmapped.join(', ')||'(none)');
