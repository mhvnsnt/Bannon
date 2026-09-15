#!/usr/bin/env node
/* AUTHORED REFERENCE MOVES — three moves keyed by hand from video the owner supplied.
 *
 *   node tools/moves/author_reference_moves.cjs
 *
 * The references are banked in docs/reference/ as contact sheets so the poses below can be checked
 * against what they were derived from:
 *   ref_strong_strike_combo.png   overhand right -> forearm -> drive into a clinch, ONE motion
 *   ref_sto.png                   step in, arm across the chest, reap the leg, drive them back down
 *   ref_swanton.png               run-up, gather, launch, tuck, full front rotation, land back-first
 *
 * WHY THESE ARE HAND-KEYED AND NOT GENERATED: the parametric shapes in gen_procedural_clips.cjs give
 * a legible generic strike/slam/dive. These three are specific moves with specific timing, and the
 * strike combo in particular does something the generator has no concept of — it lands SEVERAL hits
 * inside one animation and finishes in a grapple.
 *
 * THE CORRECTION THIS CARRIES (owner, from the reference): a WWE "strong strike combo" is not a
 * combo STRING driven by repeated presses. It is ONE move whose animation contains multiple contact
 * frames, and a strike-based grapple ends that motion in a clinch. BANNON_COMBO chains separate
 * moves per input — that is the other, also-real system. This adds the missing one: `hits[]` on a
 * single move, each with its own phase, limb and power.
 */
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, '..', '..', 'assets', 'moves');

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
const P = d => { const o = {}; for (const k in N) o[k] = N[k].slice();
  for (const j in d) if (o[j]) { o[j][0]+=d[j][0]||0; o[j][1]+=d[j][1]||0; o[j][2]+=d[j][2]||0; } return o; };

const CLIPS = {};

// ── 1. STRONG STRIKE COMBO ──────────────────────────────────────────────────────────────────────
// Reference row 1: right hand cocked high behind the ear, then thrown overhand across.
// Row 1 end / row 2: a short forearm on the same side as he steps in.
// Rows 2-3: the arm goes OVER the shoulder and he drives forward into a clinch — the strike does not
// recover to guard, it becomes the grapple. Three contacts, one continuous motion.
CLIPS.BANNON_STRONG_STRIKE_COMBO = { dur: 1.55, keys: [
  { t:0.00, pose:P({ haR:[0.02,0.12,0], haL:[0.04,0.10,0], chest:[0.03,0,-0.02] }) },
  // cock: right hand HIGH and behind, torso coils away, weight to the back foot
  { t:0.13, pose:P({ haR:[-0.18,0.26,-0.14], elR:[-0.12,0.20,-0.16], clavR:[-0.04,0.04,-0.05],
                     chest:[-0.05,0.02,-0.09], spineMid:[-0.04,0,-0.07], pelvis:[-0.04,-0.01,-0.06], ftR:[-0.05,0,0] }) },
  // HIT 1 — overhand right, hips through, arm across and slightly down
  { t:0.26, pose:P({ haR:[0.34,0.10,0.14], elR:[0.20,0.12,0.04], clavR:[0.05,0.01,0.05],
                     chest:[0.12,0.01,0.10], spineMid:[0.08,0,0.08], pelvis:[0.07,-0.02,0.09],
                     head:[0.07,0.02,0.03], ftL:[0.06,0,0] }) },
  // recoil short — he does NOT reset to guard, the elbow stays in close
  { t:0.36, pose:P({ haR:[0.16,0.14,0.08], elR:[0.12,0.10,0.02], chest:[0.08,0,0.06], pelvis:[0.05,-0.02,0.05] }) },
  // HIT 2 — short forearm, same side, stepping IN so the range closes
  { t:0.46, pose:P({ haR:[0.26,0.16,0.02], elR:[0.24,0.14,-0.02], clavR:[0.05,0.03,0.01],
                     chest:[0.14,0.02,0.04], pelvis:[0.10,-0.02,0.03], ftL:[0.12,0,0], ftR:[0.04,0,0] }) },
  // the arm rises OVER the shoulder — the transition out of striking and into the clinch
  { t:0.60, pose:P({ haR:[0.20,0.30,0.16], elR:[0.20,0.20,0.08], clavR:[0.03,0.06,0.04],
                     haL:[0.16,0.16,0.10], chest:[0.12,0.04,0.05], pelvis:[0.12,-0.02,0.03], ftL:[0.16,0,0] }) },
  // HIT 3 — collar tie lands, both hands on him, chest to chest
  { t:0.72, pose:P({ haR:[0.24,0.26,0.20], haL:[0.24,0.20,0.06], elR:[0.22,0.18,0.14], elL:[0.20,0.14,0.06],
                     chest:[0.16,0.02,0.02], spineMid:[0.11,0,0.02], pelvis:[0.15,-0.03,0.01],
                     head:[0.14,0,0.02], ftL:[0.20,0,0], ftR:[0.08,0,0] }) },
  // DRIVE — legs churn, he walks the man backward. This is the beat that makes it a grapple.
  { t:0.88, pose:P({ haR:[0.26,0.24,0.20], haL:[0.26,0.18,0.06], chest:[0.20,0,0.01],
                     pelvis:[0.20,-0.05,0], knL:[0.10,-0.04,0], knR:[0.06,-0.02,0],
                     ftL:[0.26,0,0], ftR:[0.14,0,0], head:[0.18,-0.02,0] }) },
  { t:1.00, pose:P({ haR:[0.24,0.22,0.18], haL:[0.24,0.16,0.06], chest:[0.18,0,0], pelvis:[0.18,-0.04,0] }) }
]};

// ── 2. STO ──────────────────────────────────────────────────────────────────────────────────────
// Reference: he closes, lays the arm ACROSS the chest/throat, reaps the near leg behind, and falls
// with him so the drive is body weight rather than arm strength.
CLIPS.BANNON_STO = { dur: 1.25, keys: [
  { t:0.00, pose:P({ haR:[0.04,0.10,0], haL:[0.04,0.10,0] }) },
  // step in and post the lead foot outside his
  { t:0.16, pose:P({ ftL:[0.18,0,0.06], pelvis:[0.10,-0.03,0.02], chest:[0.10,0,0.03],
                     haR:[0.20,0.14,0.08], haL:[0.14,0.08,0.04] }) },
  // arm ACROSS the chest — the defining frame
  { t:0.32, pose:P({ haR:[0.30,0.16,0.22], elR:[0.24,0.12,0.14], clavR:[0.04,0.03,0.06],
                     chest:[0.14,0.01,0.08], pelvis:[0.14,-0.04,0.04], ftL:[0.22,0,0.08] }) },
  // reap: the far leg sweeps behind his, hips turn in
  { t:0.48, pose:P({ haR:[0.30,0.14,0.24], ftR:[0.24,0.10,0.20], knR:[0.16,0.06,0.16],
                     hipR:[0.06,-0.02,0.06], pelvis:[0.14,-0.06,0.08], chest:[0.12,0,0.12] }) },
  // both go over — he rides the man down rather than throwing him
  { t:0.66, pose:P({ haR:[0.22,-0.10,0.26], chest:[0.10,-0.34,0.16], spineMid:[0.06,-0.26,0.12],
                     head:[0.08,-0.40,0.14], pelvis:[0.06,-0.30,0.10],
                     knL:[0.06,-0.18,0.06], knR:[0.14,-0.14,0.14], ftR:[0.20,-0.02,0.18] }) },
  // IMPACT — flat, driving through
  { t:0.80, pose:P({ haR:[0.18,-0.34,0.24], chest:[0.06,-0.62,0.12], spineMid:[0.03,-0.52,0.09],
                     head:[0.04,-0.70,0.10], pelvis:[0.02,-0.58,0.06],
                     knL:[0.04,-0.34,0.04], knR:[0.10,-0.30,0.10], ftL:[0.02,-0.02,0.02], ftR:[0.12,-0.02,0.14] }) },
  { t:1.00, pose:P({ chest:[0.04,-0.60,0.10], pelvis:[0,-0.58,0.04], head:[0.02,-0.68,0.08] }) }
]};

// ── 3. SWANTON BOMB ─────────────────────────────────────────────────────────────────────────────
// Reference: gather with the arms, drive the knees, fold forward into a full front rotation, extend
// late, land back-first and flat.
CLIPS.BANNON_SWANTON = { dur: 1.45, keys: [
  { t:0.00, pose:P({ pelvis:[0,-0.06,0], knL:[0.04,-0.06,0], knR:[0.04,-0.06,0] }) },
  // gather — arms come up and back, deep knee bend
  { t:0.14, pose:P({ pelvis:[0,-0.22,0], knL:[0.10,-0.18,0], knR:[0.10,-0.18,0],
                     haL:[-0.14,0.10,0.12], haR:[-0.14,0.10,-0.12], chest:[0.10,-0.14,0], head:[0.10,-0.12,0] }) },
  // launch — full extension, arms overhead, feet leaving
  { t:0.28, pose:P({ pelvis:[0.08,0.30,0], chest:[0.10,0.26,0], head:[0.10,0.28,0],
                     haL:[0.06,0.46,0.16], haR:[0.06,0.46,-0.16], elL:[0.04,0.32,0.14], elR:[0.04,0.32,-0.14],
                     ftL:[-0.12,0.26,0], ftR:[-0.12,0.22,0], knL:[-0.04,0.30,0], knR:[-0.04,0.26,0] }) },
  // tuck — the fold. Knees to chest, head down, this is what starts the rotation.
  { t:0.44, pose:P({ pelvis:[0.14,0.52,0], chest:[0.24,0.40,0], head:[0.30,0.20,0],
                     knL:[0.30,0.44,0.06], knR:[0.30,0.44,-0.06], ftL:[0.26,0.24,0.06], ftR:[0.26,0.24,-0.06],
                     haL:[0.30,0.26,0.16], haR:[0.30,0.26,-0.16], elL:[0.28,0.32,0.12], elR:[0.28,0.32,-0.12] }) },
  // inverted — legs above the head, mid-rotation
  { t:0.58, pose:P({ pelvis:[0.20,0.60,0], chest:[0.22,0.54,0], head:[0.16,0.30,0],
                     knL:[0.24,0.86,0.06], knR:[0.24,0.86,-0.06], ftL:[0.18,1.02,0.06], ftR:[0.18,1.02,-0.06],
                     haL:[0.18,0.34,0.18], haR:[0.18,0.34,-0.18] }) },
  // opening out — legs come down in front, back rotates toward the mat
  { t:0.72, pose:P({ pelvis:[0.24,0.40,0], chest:[0.18,0.30,0], head:[0.12,0.16,0],
                     knL:[0.44,0.44,0.06], knR:[0.44,0.44,-0.06], ftL:[0.52,0.22,0.06], ftR:[0.52,0.22,-0.06],
                     haL:[0.10,0.30,0.22], haR:[0.10,0.30,-0.22] }) },
  // IMPACT — flat on the back, arms spread, the whole length lands at once
  { t:0.86, pose:P({ pelvis:[0.20,-0.62,0], chest:[0.26,-0.58,0], spineMid:[0.24,-0.56,0],
                     head:[0.30,-0.56,0], knL:[0.40,-0.42,0.10], knR:[0.40,-0.42,-0.10],
                     ftL:[0.48,-0.02,0.12], ftR:[0.48,-0.02,-0.12],
                     haL:[0.16,-0.60,0.30], haR:[0.16,-0.60,-0.30], elL:[0.20,-0.58,0.26], elR:[0.20,-0.58,-0.26] }) },
  { t:1.00, pose:P({ pelvis:[0.18,-0.60,0], chest:[0.24,-0.56,0], head:[0.28,-0.54,0],
                     haL:[0.14,-0.58,0.28], haR:[0.14,-0.58,-0.28] }) }
]};


// ── 4. TWIST OF FATE (Matt-Hardy style) ─────────────────────────────────────────────────────────
// Reference ref_twist_of_fate.png: he takes the head in both hands, TURNS his back through the hold
// spinning the opponent with him, then drops straight down driving the face into the mat. The spin
// is what separates it from a plain front DDT — the rotation carries the opponent round.
CLIPS.BANNON_TWIST_OF_FATE = { dur: 1.10, keys: [
  { t:0.00, pose:P({ haL:[0.16,0.10,0.04], haR:[0.16,0.10,-0.04] }) },
  // both hands to the head
  { t:0.16, pose:P({ haL:[0.28,0.22,0.10], haR:[0.28,0.22,-0.10], elL:[0.22,0.18,0.08], elR:[0.22,0.18,-0.08],
                     chest:[0.12,0.02,0], pelvis:[0.08,-0.02,0], ftL:[0.12,0,0] }) },
  // the TURN — he rotates under, hips lead, shoulders follow, the opponent comes round with him
  { t:0.34, pose:P({ haL:[0.22,0.20,0.24], haR:[0.22,0.20,0.04], chest:[0.08,0.01,0.20],
                     spineMid:[0.06,0,0.16], pelvis:[0.06,-0.03,0.22], head:[0.06,0.02,0.14],
                     ftL:[0.10,0,0.14], ftR:[0.04,0,0.10] }) },
  { t:0.50, pose:P({ haL:[0.14,0.14,0.30], haR:[0.14,0.14,0.10], chest:[0.02,-0.06,0.28],
                     pelvis:[0.02,-0.08,0.30], head:[0,-0.02,0.20], knL:[0.04,-0.10,0.10] }) },
  // DROP — straight down, no arc, the face goes into the mat
  { t:0.70, pose:P({ haL:[0.08,-0.26,0.26], haR:[0.08,-0.26,0.08], chest:[0,-0.46,0.20],
                     spineMid:[0,-0.40,0.17], head:[0,-0.56,0.14], pelvis:[0,-0.44,0.20],
                     knL:[0.02,-0.32,0.10], knR:[0.02,-0.32,0.02] }) },
  { t:0.86, pose:P({ haL:[0.06,-0.42,0.22], haR:[0.06,-0.42,0.06], chest:[0,-0.60,0.16],
                     head:[0,-0.72,0.10], pelvis:[0,-0.56,0.16] }) },
  { t:1.00, pose:P({ chest:[0,-0.58,0.15], head:[0,-0.70,0.10], pelvis:[0,-0.54,0.15] }) }
]};

// ── 5. SWANTON 450 ──────────────────────────────────────────────────────────────────────────────
// Reference ref_swanton_450.png: a swanton launch that keeps rotating past the swanton's stop —
// through a 450 — and lands chest/front-first on a prone opponent rather than back-first. More
// rotation, later extension, and the attacker takes more of the landing.
CLIPS.BANNON_SWANTON_450 = { dur: 1.62, keys: [
  { t:0.00, pose:P({ pelvis:[0,-0.10,0], knL:[0.04,-0.10,0], knR:[0.04,-0.10,0] }) },
  { t:0.12, pose:P({ pelvis:[0,-0.26,0], knL:[0.12,-0.22,0], knR:[0.12,-0.22,0],
                     haL:[-0.14,0.12,0.12], haR:[-0.14,0.12,-0.12], chest:[0.10,-0.16,0] }) },
  { t:0.26, pose:P({ pelvis:[0.06,0.34,0], chest:[0.08,0.30,0], head:[0.08,0.32,0],
                     haL:[0.04,0.50,0.16], haR:[0.04,0.50,-0.16],
                     ftL:[-0.14,0.28,0], ftR:[-0.14,0.24,0] }) },
  // tuck HARDER than a swanton — this is what buys the extra rotation
  { t:0.40, pose:P({ pelvis:[0.12,0.58,0], chest:[0.28,0.44,0], head:[0.36,0.20,0],
                     knL:[0.38,0.50,0.06], knR:[0.38,0.50,-0.06], ftL:[0.34,0.28,0.06], ftR:[0.34,0.28,-0.06],
                     haL:[0.34,0.28,0.14], haR:[0.34,0.28,-0.14] }) },
  { t:0.52, pose:P({ pelvis:[0.18,0.66,0], chest:[0.24,0.60,0], head:[0.18,0.34,0],
                     knL:[0.28,0.96,0.06], knR:[0.28,0.96,-0.06], ftL:[0.20,1.12,0.06], ftR:[0.20,1.12,-0.06] }) },
  // past vertical and still going — the 450's extra quarter
  { t:0.64, pose:P({ pelvis:[0.24,0.58,0], chest:[0.14,0.66,0], head:[0.10,0.52,0],
                     knL:[0.44,0.72,0.06], knR:[0.44,0.72,-0.06], ftL:[0.54,0.86,0.06], ftR:[0.54,0.86,-0.06] }) },
  { t:0.76, pose:P({ pelvis:[0.28,0.34,0], chest:[0.30,0.22,0], head:[0.30,0.10,0],
                     knL:[0.50,0.34,0.08], knR:[0.50,0.34,-0.08], ftL:[0.58,0.16,0.08], ftR:[0.58,0.16,-0.08],
                     haL:[0.30,0.18,0.22], haR:[0.30,0.18,-0.22] }) },
  // IMPACT — chest/front first across the prone body, arms spread
  { t:0.90, pose:P({ pelvis:[0.22,-0.60,0], chest:[0.30,-0.62,0], spineMid:[0.27,-0.60,0],
                     head:[0.34,-0.58,0], knL:[0.44,-0.44,0.10], knR:[0.44,-0.44,-0.10],
                     ftL:[0.52,-0.04,0.12], ftR:[0.52,-0.04,-0.12],
                     haL:[0.22,-0.62,0.32], haR:[0.22,-0.62,-0.32] }) },
  { t:1.00, pose:P({ pelvis:[0.20,-0.58,0], chest:[0.28,-0.60,0], head:[0.32,-0.56,0],
                     haL:[0.20,-0.60,0.30], haR:[0.20,-0.60,-0.30] }) }
]};

// ── the MOVE records: multi-hit timing, and what each contact is ────────────────────────────────
const MOVES = [
  { name:'STRONG STRIKE COMBO', cat:'STRIKE', limb:'RIGHT CROSS', traj:'OVERHAND', height:'HIGH',
    power:74, speed:46, style:'BRAWLER', follow:'GRAPPLE', range:'MID',
    clip:'BANNON_STRONG_STRIKE_COMBO', tag:['combo','multi-hit','strike-grapple','signature-feel'],
    // THREE contacts inside ONE animation, then it ENDS IN A CLINCH rather than resetting to guard
    hits:[ { t:0.26, limb:'RIGHT CROSS', power:74, type:'strike' },
           { t:0.46, limb:'ELBOW',       power:46, type:'strike' },
           { t:0.72, limb:'CLINCH',      power:28, type:'grapple' } ],
    endsIn:'CLINCH' },
  { name:'STO', cat:'GRAPPLE', limb:'RIGHT CROSS', traj:'STRAIGHT', height:'HIGH',
    power:82, speed:54, style:'MMA', follow:'KNOCKDOWN', range:'SHORT',
    clip:'BANNON_STO', tag:['takedown','strike-grapple','sweep'],
    hits:[ { t:0.32, limb:'FOREARM', power:30, type:'strike' },
           { t:0.80, limb:'BODY',    power:82, type:'slam'  } ],
    endsIn:'GROUNDED' },
  { name:'TWIST OF FATE', cat:'GRAPPLE', limb:'BODY', traj:'SPINNING', height:'HIGH',
    power:96, speed:62, style:'TECHNICAL', follow:'KNOCKDOWN', range:'SHORT',
    clip:'BANNON_TWIST_OF_FATE', tag:['cutter','spin','signature-feel'],
    hits:[ { t:0.16, limb:'FOREARM', power:22, type:'strike' },
           { t:0.70, limb:'BODY',    power:96, type:'slam'  } ],
    endsIn:'GROUNDED' },
  { name:'SWANTON 450', cat:'DIVE', limb:'BODY', traj:'FLYING', height:'HIGH',
    power:118, speed:36, style:'HIGH FLYER', follow:'KNOCKDOWN', range:'LONG',
    clip:'BANNON_SWANTON_450', tag:['dive','top-rope','450','signature-feel','sell'],
    hits:[ { t:0.90, limb:'BODY', power:118, type:'slam' } ],
    // more rotation means a worse landing for the man throwing it
    sell:0.42, endsIn:'GROUNDED' },
  { name:'SWANTON BOMB', cat:'DIVE', limb:'BODY', traj:'FLYING', height:'HIGH',
    power:108, speed:40, style:'HIGH FLYER', follow:'KNOCKDOWN', range:'LONG',
    clip:'BANNON_SWANTON', tag:['dive','top-rope','signature-feel','sell'],
    hits:[ { t:0.86, limb:'BODY', power:108, type:'slam' } ],
    // the attacker eats part of his own landing — the reference lands him flat on his back too
    sell:0.30, endsIn:'GROUNDED' }
];

fs.writeFileSync(path.join(M, 'authored_clips.json'), JSON.stringify({
  _note:'Hand-keyed from video reference the owner supplied (contact sheets in docs/reference/). Multi-hit: a single animation containing several contacts, which is how a WWE strong strike / strike-grapple actually works — not a combo string driven by repeated presses.',
  generated:new Date().toISOString().slice(0,10),
  clips:CLIPS, moves:MOVES
}, null, 1));

console.log('authored moves:');
MOVES.forEach(m => console.log('  ' + m.name.padEnd(22) + m.cat.padEnd(9) +
  CLIPS[m.clip].keys.length + ' keys  ' + CLIPS[m.clip].dur + 's  ' +
  m.hits.length + ' hit' + (m.hits.length>1?'s':'') + ' at ' + m.hits.map(h=>h.t).join('/') +
  (m.endsIn ? '  -> ' + m.endsIn : '')));
console.log('wrote assets/moves/authored_clips.json');
