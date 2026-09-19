#!/usr/bin/env node
/* PROCEDURAL CLIP SYNTHESIS — fill moveset slots that have no motion capture, from pose math.
 *
 *   node tools/moves/gen_procedural_clips.cjs
 *
 * THE IDEA, and it is MDickie's own: animation does not have to live in an asset file. MDickie's
 * games have no mocap at all — every move is pose math in Blitz3D game code. That is exactly why
 * MDickie could ship hundreds of moves as one person. The same route is open to us and it costs no
 * downloads, no licences and no gigabytes.
 *
 * It is also how Overgrowth animates its whole combat system: a handful of authored KEY POSES per
 * move, with physics and IK doing everything between them. BANNON is already built for this:
 *   * STUDIO clips are ALREADY a keyed-pose format — {keys:[{t, pose{joint:[x,y,z]}}], dur} — so a
 *     synthesised clip is indistinguishable downstream from a baked capture.
 *   * Fighter._twoBoneIK already solves elbows and knees analytically from hand/foot targets, so a
 *     pose only has to say where the END EFFECTOR goes.
 *   * Spring3 (critically-damped PD per joint) already interpolates between poses and absorbs
 *     impact, so the in-between frames are physical rather than lerped.
 * So the pose math below writes 5-7 keys per move and the engine supplies the rest.
 *
 * These are NOT a replacement for capture where capture exists — the auto-mapper's real clips always
 * win. This fills the slots that have nothing, so no position in the game animates as a T-pose or
 * falls back to a generic idle.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const M = path.join(ROOT, 'assets', 'moves');
const rd = f => JSON.parse(fs.readFileSync(path.join(M, f), 'utf8'));

const schema = rd('moveset_schema.json');
const capPos = {};
(rd('fbx_move_map.json').clips || []).forEach(c => { if (c.pos) capPos[c.pos] = (capPos[c.pos] || 0) + 1; });

// The engine's own rest pose — the space every key is written in (must match NEUTRAL in the HTML).
const N = {
  pelvis:[0,0.90,0], chest:[0.06,1.28,0], head:[0.05,1.64,0],
  shL:[0.02,1.34,0.21], haL:[0.30,1.34,0.12],
  shR:[0.02,1.34,-0.21], haR:[0.26,1.42,-0.10],
  hipL:[0,0.82,0.13], ftL:[0.05,0.05,0.15],
  hipR:[0,0.82,-0.13], ftR:[0.05,0.05,-0.15],
  elL:[0.14,1.024,0.232], elR:[0.14,0.968,-0.232],
  knL:[0.04,0.46,0.16], knR:[0.04,0.46,-0.16],
  clavL:[0.02,1.33,0.13], clavR:[0.02,1.33,-0.13],
  spineLow:[0,1.04,0], spineMid:[0.03,1.20,0]
};
const base = () => { const o = {}; for (const k in N) o[k] = N[k].slice(); return o; };
const add = (p, j, d) => { if (p[j]) { p[j][0]+=d[0]||0; p[j][1]+=d[1]||0; p[j][2]+=d[2]||0; } };
// whole-body rotation about Y, so one arc definition serves left and right and any facing
const spin = (p, a) => { const c=Math.cos(a), s=Math.sin(a);
  for (const j in p){ const x=p[j][0], z=p[j][2]; p[j][0]=x*c - z*s; p[j][2]=x*s + z*c; } return p; };

// ── the shapes. Each returns [{t,pose}] in NEUTRAL space. ───────────────────────────────────────

// STRIKE: guard -> coil -> contact -> follow-through -> recover. `hand` picks the limb, `hi` the
// target height, `arc` how much the shot travels laterally (a hook vs a straight).
function strike(hand, hi, arc, reach){
  const H = hand==='L' ? 'haL':'haR', OFF = hand==='L' ? 'haR':'haL';
  const dir = hand==='L' ? 1 : -1;
  const K = [];
  const guard = base(); add(guard,H,[0.02,0.10,0]); add(guard,OFF,[0.02,0.10,0]); K.push({t:0, pose:guard});
  const coil = base();                                    // weight to the rear foot, torso coils back
  add(coil,H,[-0.14,0.08,dir*0.05]); add(coil,'chest',[-0.04,0,dir*0.06]);
  add(coil,'spineMid',[-0.03,0,dir*0.05]); add(coil,'pelvis',[-0.03,-0.02,dir*0.04]);
  add(coil,'ftR',[-0.04,0,0]); K.push({t:0.22, pose:coil});
  const hit = base();                                     // hips drive through, hand extends
  add(hit,H,[reach, hi, -dir*arc]); add(hit,OFF,[0.04,0.12,0]);
  add(hit,'chest',[0.10,hi*0.25,-dir*0.08]); add(hit,'spineMid',[0.07,0,-dir*0.06]);
  add(hit,'pelvis',[0.06,-0.02,-dir*0.07]); add(hit,'head',[0.05,hi*0.15,0]);
  add(hit,'ftL',[0.05,0,0]); K.push({t:0.46, pose:hit});
  const thru = base();                                    // past the target, not stopping on it
  add(thru,H,[reach*0.72, hi*0.6, -dir*(arc+0.06)]);
  add(thru,'chest',[0.07,0,-dir*0.10]); add(thru,'pelvis',[0.04,-0.03,-dir*0.09]);
  K.push({t:0.62, pose:thru});
  const rec = base(); add(rec,H,[0.02,0.08,0]); add(rec,OFF,[0.02,0.10,0]);
  add(rec,'pelvis',[0,-0.01,0]); K.push({t:1.0, pose:rec});
  return K;
}

// GRAPPLE / SLAM: tie-up -> load -> lift -> apex -> drive -> impact. The pelvis carries the arc,
// which is what sells weight.
function slam(height, drive){
  const K = [];
  const tie = base(); add(tie,'haL',[0.16,0.06,0.04]); add(tie,'haR',[0.16,0.06,-0.04]);
  add(tie,'chest',[0.05,0,0]); K.push({t:0, pose:tie});
  const load = base(); add(load,'pelvis',[0,-0.10,0]); add(load,'knL',[0,-0.08,0]); add(load,'knR',[0,-0.08,0]);
  add(load,'haL',[0.18,0.02,0.05]); add(load,'haR',[0.18,0.02,-0.05]); add(load,'chest',[0.08,-0.05,0]);
  K.push({t:0.2, pose:load});
  const lift = base(); add(lift,'pelvis',[0,0.06,0]); add(lift,'chest',[-0.04,0.06,0]);
  add(lift,'haL',[0.10,height,0.10]); add(lift,'haR',[0.10,height,-0.10]);
  add(lift,'spineMid',[-0.05,0.04,0]); add(lift,'head',[-0.05,0.04,0]);
  K.push({t:0.44, pose:lift});
  const apex = base(); add(apex,'pelvis',[0,0.08,0]); add(apex,'chest',[-0.06,0.08,0]);
  add(apex,'haL',[0.06,height+0.10,0.12]); add(apex,'haR',[0.06,height+0.10,-0.12]);
  K.push({t:0.58, pose:apex});
  const down = base(); add(down,'pelvis',[0.04,-0.14,0]); add(down,'chest',[0.14,-0.10,0]);
  add(down,'haL',[0.24,-drive,0.10]); add(down,'haR',[0.24,-drive,-0.10]);
  add(down,'knL',[0.02,-0.10,0]); add(down,'knR',[0.02,-0.10,0]); add(down,'head',[0.12,-0.10,0]);
  K.push({t:0.78, pose:down});
  const set = base(); add(set,'pelvis',[0,-0.04,0]); K.push({t:1.0, pose:set});
  return K;
}

// DIVE: crouch -> launch -> flight -> extend -> land. `arc` is launch height, `tuck` the flight shape.
function dive(arc, tuck){
  const K = [];
  const crouch = base(); add(crouch,'pelvis',[0,-0.16,0]); add(crouch,'knL',[0.06,-0.12,0]);
  add(crouch,'knR',[0.06,-0.12,0]); add(crouch,'chest',[0.10,-0.10,0]);
  add(crouch,'haL',[-0.10,-0.10,0.06]); add(crouch,'haR',[-0.10,-0.10,-0.06]);
  K.push({t:0, pose:crouch});
  const launch = base(); add(launch,'pelvis',[0.10,0.14,0]); add(launch,'ftL',[-0.10,0.14,0]);
  add(launch,'ftR',[-0.10,0.10,0]); add(launch,'haL',[0.16,0.20,0.10]); add(launch,'haR',[0.16,0.20,-0.10]);
  add(launch,'chest',[0.12,0.10,0]); K.push({t:0.22, pose:launch});
  const flight = base(); add(flight,'pelvis',[0.16,arc,0]); add(flight,'chest',[0.20,arc*0.9,0]);
  add(flight,'head',[0.20,arc*0.8,0]); add(flight,'knL',[0.10,arc-tuck,0]); add(flight,'knR',[0.10,arc-tuck,0]);
  add(flight,'ftL',[-0.06,arc-tuck*1.4,0]); add(flight,'ftR',[-0.06,arc-tuck*1.4,0]);
  add(flight,'haL',[0.26,arc+0.06,0.16]); add(flight,'haR',[0.26,arc+0.06,-0.16]);
  K.push({t:0.5, pose:flight});
  const extend = base(); add(extend,'pelvis',[0.22,arc*0.55,0]); add(extend,'chest',[0.28,arc*0.5,0]);
  add(extend,'haL',[0.34,arc*0.4,0.18]); add(extend,'haR',[0.34,arc*0.4,-0.18]);
  add(extend,'ftL',[-0.14,arc*0.3,0]); add(extend,'ftR',[-0.14,arc*0.3,0]);
  K.push({t:0.72, pose:extend});
  const land = base(); add(land,'pelvis',[0.10,-0.18,0]); add(land,'chest',[0.18,-0.14,0]);
  add(land,'knL',[0.08,-0.12,0]); add(land,'knR',[0.08,-0.12,0]);
  K.push({t:1.0, pose:land});
  return K;
}

// SUBMISSION / HOLD: sink in and crank. Slow, and it LOOPS rather than resolving.
function hold(crank){
  const K = [];
  const set = base(); add(set,'pelvis',[0,-0.14,0]); add(set,'chest',[0.10,-0.10,0]);
  add(set,'haL',[0.22,-0.14,0.08]); add(set,'haR',[0.22,-0.14,-0.08]);
  add(set,'knL',[0.04,-0.16,0.04]); add(set,'knR',[0.04,-0.16,-0.04]); K.push({t:0, pose:set});
  const pull = base(); add(pull,'pelvis',[-0.04,-0.12,0]); add(pull,'chest',[-0.02,-0.06,0]);
  add(pull,'haL',[0.10,-0.06+crank,0.10]); add(pull,'haR',[0.10,-0.06+crank,-0.10]);
  add(pull,'spineMid',[-0.05,0,0]); add(pull,'head',[-0.06,0.02,0]);
  add(pull,'knL',[0.04,-0.16,0.04]); add(pull,'knR',[0.04,-0.16,-0.04]); K.push({t:0.5, pose:pull});
  K.push({t:1.0, pose:JSON.parse(JSON.stringify(set))});   // loops
  return K;
}

// TAUNT / STANCE / MOVEMENT: readable body language, no contact.
function gesture(up, open){
  const K = [];
  const a = base(); K.push({t:0, pose:a});
  const b = base(); add(b,'haL',[0.06,up,open]); add(b,'haR',[0.06,up,-open]);
  add(b,'chest',[-0.05,0.04,0]); add(b,'head',[-0.06,0.05,0]); add(b,'pelvis',[-0.02,0.01,0]);
  K.push({t:0.42, pose:b});
  const c = base(); add(c,'haL',[0.04,up*0.7,open*0.8]); add(c,'haR',[0.04,up*0.7,-open*0.8]);
  add(c,'chest',[-0.03,0.02,0]); K.push({t:0.72, pose:c});
  K.push({t:1.0, pose:base()});
  return K;
}

// ── choose a shape per slot, varying it by POSITION so a corner strike is not a standing strike ──
function synth(slot, idx){
  const k = slot.kind, p = String(slot.pos || '');
  const hand = idx % 2 ? 'L' : 'R';
  const low  = /GROUND|SEATED|KNEEL/.test(p);
  const high = /TOP|SPRING|MIDDLE_ROPE|APRON|DIVE|LEDGE/.test(p);
  const corner = /CORNER|TREE_OF_WOE/.test(p);

  if (k==='dive')                      return { keys: dive(high?0.42:0.30, 0.12), dur: 1.05 };
  if (k==='submission'||k==='rest_hold') return { keys: hold(k==='rest_hold'?0.05:0.12), dur: k==='rest_hold'?2.4:1.6 };
  if (k==='taunt')                     return { keys: gesture(0.22, 0.16), dur: 1.5 };
  if (k==='stance'||k==='locomotion')  return { keys: gesture(0.04, 0.05), dur: 2.0 };
  if (k==='movement')                  return { keys: gesture(0.10, 0.10), dur: 1.2 };
  if (k==='pin'||k==='carry_pin')      return { keys: hold(0.04), dur: 1.4 };
  if (k==='carry')                     return { keys: slam(0.30, 0.10), dur: 1.3 };
  if (k==='carry_finish'||k==='carry_env'||k==='grapple'||k==='tag'||
      k==='table'||k==='ladder'||k==='rumble'||k==='weapon_grapple')
    return { keys: slam(low?0.14:0.34, low?0.20:0.34), dur: low?1.1:1.35 };
  if (k==='reversal')                  return { keys: strike(hand, 0.04, 0.16, 0.16), dur: 0.6 };
  if (k==='limb')                      return { keys: hold(0.10), dur: 1.2 };
  if (k==='comeback'||k==='freeze')    return { keys: gesture(0.26, 0.20), dur: 1.3 };
  if (k==='rebound')                   return { keys: strike(hand, 0.06, 0.10, 0.30), dur: 0.75 };
  // strikes and everything else: height + arc + reach vary by where you are standing
  const hi   = low ? -0.28 : corner ? 0.02 : high ? 0.10 : 0.06;
  const arc  = (idx % 3 === 0) ? 0.20 : (idx % 3 === 1) ? 0.06 : 0.13;   // hook / straight / mid
  const reach= corner ? 0.18 : low ? 0.20 : 0.26;
  return { keys: strike(hand, hi, arc, reach), dur: 0.72 };
}

// ── generate for every slot with NO capture at its position ─────────────────────────────────────
const out = {}; let made = 0, skipped = 0, i = 0;
const perCat = {};
schema.cats.forEach(c => {
  c.groups.forEach(g => g.slots.forEach(s => {
    if (s.pos && capPos[s.pos]) { skipped++; return; }      // a real capture exists — it wins
    const clip = synth(s, i++);
    out['PROC_' + s.id] = { dur: clip.dur, keys: clip.keys, _slot: s.id, _kind: s.kind, _pos: s.pos };
    made++; perCat[c.label] = (perCat[c.label] || 0) + 1;
  }));
});

fs.writeFileSync(path.join(M, 'procedural_clips.json'), JSON.stringify({
  _note:'AUTO-GENERATED by tools/moves/gen_procedural_clips.cjs — keyed poses for moveset slots that have NO motion capture. Same STUDIO format as a baked capture, so studioApplyClipPose plays them identically; Fighter._twoBoneIK solves elbows/knees from the end-effector targets and Spring3 supplies physical in-betweens. A real capture ALWAYS wins over these.',
  generated:new Date().toISOString().slice(0,10), clips:made, clipsSkippedBecauseCaptureExists:skipped,
  map:out
}, null, 0));

console.log('slots with a real capture (left alone) : ' + skipped);
console.log('slots given a procedural clip          : ' + made);
Object.entries(perCat).forEach(([k,v]) => console.log('    ' + k.padEnd(26) + v));
const kb = fs.statSync(path.join(M,'procedural_clips.json')).size/1024;
console.log('wrote assets/moves/procedural_clips.json  (' + kb.toFixed(0) + ' KB, vs ~' + (made*0.4).toFixed(0) + ' MB if these were captures)');
