#!/usr/bin/env node
/* MOVE VARIANTS — Swanton Bomb 1/2/3, Powerbomb 1/2/3, Snap Suplex, Butterfly DDT...
 *
 *   node tools/moves/gen_move_variants.cjs
 *
 * WWE 2K does not have "a powerbomb". It has a powerbomb FAMILY — numbered variations plus named
 * ones (kneeling, gutwrench, sitout) — and every game ADDS to that library, never replaces what is
 * already there. BANNON had 1 powerbomb, 3 suplexes, 1 DDT and ZERO swantons or shooting stars.
 *
 * ADDITIVE IS THE HARD RULE HERE. Nothing this writes may overwrite an existing move or clip. A move
 * name that already exists is skipped, always — so a hand-authored move (STRONG STRIKE COMBO, STO,
 * SWANTON BOMB from the video reference) or a real motion capture keeps its place and the generated
 * variants stack around it. Re-running only ever adds.
 *
 * Each variant is a real distinct animation, not a renamed one: the family gives the shape, and the
 * variant's parameters change launch height, rotation, drop depth, tuck, tempo and impact so a
 * Snap Suplex is genuinely faster and shallower than a Vertical Suplex.
 */
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, '..', '..', 'assets', 'moves');
const HTML = path.join(__dirname, '..', '..', 'BANNON_v150.html');

const N = {
  pelvis:[0,0.90,0], chest:[0.06,1.28,0], head:[0.05,1.64,0],
  shL:[0.02,1.34,0.21], haL:[0.30,1.34,0.12], shR:[0.02,1.34,-0.21], haR:[0.26,1.42,-0.10],
  hipL:[0,0.82,0.13], ftL:[0.05,0.05,0.15], hipR:[0,0.82,-0.13], ftR:[0.05,0.05,-0.15],
  elL:[0.14,1.024,0.232], elR:[0.14,0.968,-0.232], knL:[0.04,0.46,0.16], knR:[0.04,0.46,-0.16],
  clavL:[0.02,1.33,0.13], clavR:[0.02,1.33,-0.13], spineLow:[0,1.04,0], spineMid:[0.03,1.20,0]
};
const P = d => { const o={}; for(const k in N) o[k]=N[k].slice();
  for(const j in d) if(o[j]){ o[j][0]+=d[j][0]||0; o[j][1]+=d[j][1]||0; o[j][2]+=d[j][2]||0; } return o; };

// ── FAMILY SHAPES. v = the variant's parameters. ────────────────────────────────────────────────

// AERIAL: gather -> launch -> rotate -> extend -> impact. rot = how much rotation, tuck = how tight.
function aerial(v){
  const A=v.arc, T=v.tuck, R=v.rot;
  return { dur:v.dur, keys:[
    { t:0.00, pose:P({ pelvis:[0,-0.08,0], knL:[0.04,-0.08,0], knR:[0.04,-0.08,0] }) },
    { t:0.14, pose:P({ pelvis:[0,-0.24,0], knL:[0.10,-0.20,0], knR:[0.10,-0.20,0],
                       haL:[-0.12,0.12,0.12], haR:[-0.12,0.12,-0.12], chest:[0.08,-0.14,0] }) },
    { t:0.28, pose:P({ pelvis:[0.06,A*0.62,0], chest:[0.08,A*0.56,0], head:[0.08,A*0.60,0],
                       haL:[0.04,A*0.95,0.16], haR:[0.04,A*0.95,-0.16],
                       ftL:[-0.12,A*0.55,0], ftR:[-0.12,A*0.48,0] }) },
    { t:0.44, pose:P({ pelvis:[0.12,A,0], chest:[0.14+R*0.10,A*0.82,0], head:[0.20+R*0.14,A*0.42,0],
                       knL:[0.24*T,A*0.90,0.06], knR:[0.24*T,A*0.90,-0.06],
                       ftL:[0.20*T,A*0.52,0.06], ftR:[0.20*T,A*0.52,-0.06],
                       haL:[0.22,A*0.56,0.16], haR:[0.22,A*0.56,-0.16] }) },
    { t:0.58, pose:P({ pelvis:[0.16,A*1.16,0], chest:[0.14,A*1.05,0], head:[0.10,A*0.58*(1-R*0.5),0],
                       knL:[0.18,A*1.66*R,0.06], knR:[0.18,A*1.66*R,-0.06],
                       ftL:[0.12,A*1.96*R,0.06], ftR:[0.12,A*1.96*R,-0.06],
                       haL:[0.14,A*0.64,0.20], haR:[0.14,A*0.64,-0.20] }) },
    { t:0.74, pose:P({ pelvis:[0.20,A*0.72,0], chest:[0.16,A*0.56,0], head:[0.10,A*0.30,0],
                       knL:[0.38,A*0.82,0.06], knR:[0.38,A*0.82,-0.06],
                       ftL:[0.46,A*0.40,0.06], ftR:[0.46,A*0.40,-0.06] }) },
    { t:0.88, pose:P({ pelvis:[0.16,-0.60,0], chest:[0.22,-0.56,0], spineMid:[0.20,-0.54,0],
                       head:[0.26,-0.54,0], knL:[0.34,-0.40,0.10], knR:[0.34,-0.40,-0.10],
                       ftL:[0.42,-0.02,0.12], ftR:[0.42,-0.02,-0.12],
                       haL:[0.12,-0.58,0.28], haR:[0.12,-0.58,-0.28] }) },
    { t:1.00, pose:P({ pelvis:[0.14,-0.58,0], chest:[0.20,-0.54,0], head:[0.24,-0.52,0] }) }
  ]};
}

// LIFT-AND-DROP: powerbombs, slams, piledrivers. lift = how high, drop = how hard, sit = sitout.
function liftDrop(v){
  const L=v.lift, D=v.drop, S=v.sit||0;
  return { dur:v.dur, keys:[
    { t:0.00, pose:P({ haL:[0.16,0.06,0.04], haR:[0.16,0.06,-0.04], chest:[0.05,0,0] }) },
    { t:0.16, pose:P({ pelvis:[0,-0.16,0], knL:[0.06,-0.14,0], knR:[0.06,-0.14,0],
                       haL:[0.20,-0.02,0.06], haR:[0.20,-0.02,-0.06], chest:[0.10,-0.10,0], head:[0.10,-0.10,0] }) },
    { t:0.34, pose:P({ pelvis:[0,0.04,0], chest:[-0.04,0.06,0], spineMid:[-0.04,0.05,0],
                       haL:[0.10,L*0.55,0.10], haR:[0.10,L*0.55,-0.10], head:[-0.05,0.05,0] }) },
    { t:0.50, pose:P({ pelvis:[0,0.09,0], chest:[-0.07,0.10,0], head:[-0.08,0.09,0],
                       haL:[0.04,L,0.12], haR:[0.04,L,-0.12], elL:[0.06,L*0.7,0.12], elR:[0.06,L*0.7,-0.12] }) },
    { t:0.64, pose:P({ pelvis:[0.02,0.10,0], chest:[-0.05,0.11,0],
                       haL:[0.02,L*1.08,0.12], haR:[0.02,L*1.08,-0.12], head:[-0.06,0.10,0] }) },
    { t:0.82, pose:P({ pelvis:[0.04,-0.12-S*0.30,0], chest:[0.16,-0.10-S*0.20,0], head:[0.16,-0.12-S*0.18,0],
                       haL:[0.26,-D,0.10], haR:[0.26,-D,-0.10],
                       knL:[0.04,-0.14-S*0.22,0.04], knR:[0.04,-0.14-S*0.22,-0.04] }) },
    { t:1.00, pose:P({ pelvis:[0.02,-0.06-S*0.26,0], chest:[0.10,-0.06-S*0.16,0],
                       haL:[0.18,-D*0.7,0.08], haR:[0.18,-D*0.7,-0.08] }) }
  ]};
}

// ARC-OVER: suplexes. bridge = how far he arches back, snap = tempo of the throw.
function suplex(v){
  const B=v.bridge, S=v.snap;
  return { dur:v.dur, keys:[
    { t:0.00, pose:P({ haL:[0.18,0.08,0.05], haR:[0.18,0.08,-0.05], chest:[0.06,0,0] }) },
    { t:0.18, pose:P({ pelvis:[0.04,-0.18,0], knL:[0.08,-0.16,0], knR:[0.08,-0.16,0],
                       haL:[0.24,0.02,0.06], haR:[0.24,0.02,-0.06], chest:[0.14,-0.12,0], head:[0.14,-0.12,0] }) },
    { t:0.34*S, pose:P({ pelvis:[0,0.06,0], chest:[-0.06,0.10,0], haL:[0.14,0.42,0.10], haR:[0.14,0.42,-0.10],
                         head:[-0.08,0.10,0], spineMid:[-0.05,0.08,0] }) },
    // the arch — this is the frame that separates a vertical from a snap
    { t:0.52*S, pose:P({ pelvis:[-0.06,0.10,0], chest:[-0.20*B,0.16,0], spineMid:[-0.16*B,0.13,0],
                         head:[-0.28*B,0.14,0], haL:[-0.06,0.60,0.12], haR:[-0.06,0.60,-0.12],
                         knL:[0.02,-0.04,0], knR:[0.02,-0.04,0] }) },
    { t:0.70*S, pose:P({ pelvis:[-0.10,-0.10,0], chest:[-0.28*B,-0.16,0], head:[-0.36*B,-0.24,0],
                         haL:[-0.14,0.26,0.14], haR:[-0.14,0.26,-0.14] }) },
    { t:0.86, pose:P({ pelvis:[-0.08,-0.48,0], chest:[-0.16,-0.56,0], spineMid:[-0.13,-0.52,0],
                       head:[-0.20,-0.60,0], haL:[-0.10,-0.40,0.16], haR:[-0.10,-0.40,-0.16],
                       knL:[0.10,-0.30,0.06], knR:[0.10,-0.30,-0.06] }) },
    { t:1.00, pose:P({ pelvis:[-0.06,-0.52,0], chest:[-0.12,-0.58,0], head:[-0.16,-0.62,0] }) }
  ]};
}

// DRIVE-DOWN: DDTs, cutters, neckbreakers. hook = arm position, spin = tornado-style rotation.
function driveDown(v){
  const H=v.hook, SP=v.spin||0;
  return { dur:v.dur, keys:[
    { t:0.00, pose:P({ haL:[0.16,0.10,0.04], haR:[0.16,0.10,-0.04] }) },
    { t:0.18, pose:P({ haR:[0.26,0.20+H,0.14], elR:[0.22,0.16,0.10], chest:[0.10,0.02,0.05+SP*0.10],
                       pelvis:[0.08,-0.02,0.03+SP*0.08], ftL:[0.14,0,0.04] }) },
    { t:0.36, pose:P({ haR:[0.28,0.22+H,0.20], haL:[0.20,0.14,0.10], chest:[0.12,0.01,0.08+SP*0.18],
                       spineMid:[0.09,0,0.06+SP*0.14], pelvis:[0.10,-0.03,0.05+SP*0.14],
                       head:[0.12,0.02,0.04] }) },
    { t:0.54, pose:P({ haR:[0.24,0.10+H,0.22], chest:[0.10,-0.14,0.10+SP*0.20], head:[0.10,-0.18,0.06],
                       pelvis:[0.06,-0.18,0.06+SP*0.16], knL:[0.06,-0.16,0.04], knR:[0.06,-0.16,-0.04] }) },
    // the spike — both drop, the head drives into the mat
    { t:0.74, pose:P({ haR:[0.16,-0.30,0.20], chest:[0.04,-0.52,0.06], spineMid:[0.02,-0.44,0.05],
                       head:[0.02,-0.62,0.04], pelvis:[0,-0.46,0.04],
                       knL:[0.02,-0.34,0.04], knR:[0.02,-0.34,-0.04] }) },
    { t:0.88, pose:P({ haR:[0.12,-0.44,0.16], chest:[0.02,-0.62,0.04], head:[0,-0.72,0.02], pelvis:[0,-0.58,0.02] }) },
    { t:1.00, pose:P({ chest:[0.02,-0.60,0.03], head:[0,-0.70,0.02], pelvis:[0,-0.56,0.02] }) }
  ]};
}

// ── THE FAMILIES ────────────────────────────────────────────────────────────────────────────────
const FAMILIES = [
  { fam:'SWANTON BOMB', shape:aerial, cat:'DIVE', limb:'BODY', traj:'FLYING', height:'HIGH',
    style:'HIGH FLYER', follow:'KNOCKDOWN', pos:'TURNBUCKLE_TOP', basePower:104, sell:0.26, variants:[
    { n:1, arc:0.44, tuck:1.00, rot:1.00, dur:1.40, power:104 },
    { n:2, arc:0.52, tuck:0.82, rot:1.15, dur:1.50, power:112 },   // higher, looser tuck
    { n:3, arc:0.38, tuck:1.20, rot:0.88, dur:1.24, power:98  }    // compact and quick
  ]},
  { fam:'SHOOTING STAR PRESS', shape:aerial, cat:'DIVE', limb:'BODY', traj:'FLYING', height:'HIGH',
    style:'HIGH FLYER', follow:'KNOCKDOWN', pos:'TURNBUCKLE_TOP', basePower:112, sell:0.32, variants:[
    { n:1, arc:0.50, tuck:1.10, rot:-1.05, dur:1.52, power:112 },  // negative rot = backflip
    { n:2, arc:0.58, tuck:0.95, rot:-1.22, dur:1.62, power:120 },
    { n:3, arc:0.44, tuck:1.25, rot:-0.92, dur:1.38, power:106 }
  ]},
  { fam:'MOONSAULT', shape:aerial, cat:'DIVE', limb:'BODY', traj:'FLYING', height:'HIGH',
    style:'LUCHA', follow:'KNOCKDOWN', pos:'TURNBUCKLE_TOP', basePower:106, sell:0.24, variants:[
    { n:1, arc:0.48, tuck:1.05, rot:-0.98, dur:1.46, power:106 },
    { n:2, arc:0.54, tuck:0.90, rot:-1.10, dur:1.56, power:114 }
  ]},
  { fam:'SENTON BOMB', shape:aerial, cat:'DIVE', limb:'BODY', traj:'FLYING', height:'HIGH',
    style:'HIGH FLYER', follow:'KNOCKDOWN', pos:'TURNBUCKLE_TOP', basePower:102, sell:0.28, variants:[
    { n:1, arc:0.42, tuck:1.15, rot:0.95, dur:1.36, power:102 },
    { n:2, arc:0.50, tuck:1.00, rot:1.08, dur:1.46, power:110 }
  ]},
  { fam:'FROG SPLASH', shape:aerial, cat:'DIVE', limb:'BODY', traj:'FLYING', height:'HIGH',
    style:'HIGH FLYER', follow:'KNOCKDOWN', pos:'TURNBUCKLE_TOP', basePower:100, sell:0.20, variants:[
    { n:1, arc:0.46, tuck:0.70, rot:0.40, dur:1.34, power:100 },
    { n:2, arc:0.54, tuck:0.60, rot:0.34, dur:1.44, power:108 }
  ]},

  { fam:'POWERBOMB', shape:liftDrop, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:98, variants:[
    { n:1, lift:0.46, drop:0.52, dur:1.42, power:98  },
    { n:2, lift:0.54, drop:0.60, dur:1.54, power:106 },
    { n:3, lift:0.42, drop:0.48, dur:1.30, power:92  }
  ]},
  { fam:'KNEELING POWERBOMB', shape:liftDrop, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:102, variants:[
    { n:0, lift:0.44, drop:0.62, sit:0.85, dur:1.48, power:102 }
  ]},
  { fam:'SITOUT POWERBOMB', shape:liftDrop, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:106, variants:[
    { n:0, lift:0.50, drop:0.58, sit:1.00, dur:1.52, power:106 }
  ]},
  { fam:'GUTWRENCH POWERBOMB', shape:liftDrop, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'MID',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:100, variants:[
    { n:0, lift:0.38, drop:0.56, dur:1.56, power:100 }             // lower lift, longer grind
  ]},
  { fam:'SCOOP SLAM', shape:liftDrop, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'MID',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:76, variants:[
    { n:1, lift:0.34, drop:0.44, dur:1.18, power:76 },
    { n:2, lift:0.40, drop:0.48, dur:1.26, power:82 }
  ]},
  { fam:'SIDE SLAM', shape:liftDrop, cat:'GRAPPLE', limb:'BODY', traj:'HOOK', height:'MID',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:84, variants:[
    { n:0, lift:0.32, drop:0.52, dur:1.20, power:84 }
  ]},
  { fam:'PILEDRIVER', shape:liftDrop, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:110, variants:[
    { n:1, lift:0.52, drop:0.66, dur:1.50, power:110 },
    { n:2, lift:0.58, drop:0.72, sit:0.60, dur:1.60, power:118 }
  ]},

  { fam:'SUPLEX', shape:suplex, cat:'GRAPPLE', limb:'BODY', traj:'OVERHAND', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:88, variants:[
    { n:1, bridge:1.00, snap:1.00, dur:1.46, power:88 },
    { n:2, bridge:1.15, snap:1.00, dur:1.56, power:94 },
    { n:3, bridge:0.88, snap:0.90, dur:1.36, power:84 }
  ]},
  { fam:'SNAP SUPLEX', shape:suplex, cat:'GRAPPLE', limb:'BODY', traj:'OVERHAND', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:86, variants:[
    { n:0, bridge:0.80, snap:0.62, dur:1.04, power:86 }            // fast and shallow — the snap
  ]},
  { fam:'VERTICAL SUPLEX', shape:suplex, cat:'GRAPPLE', limb:'BODY', traj:'OVERHAND', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:92, variants:[
    { n:0, bridge:1.25, snap:1.35, dur:1.86, power:92 }            // the long hold at the top
  ]},
  { fam:'DRAGON SUPLEX', shape:suplex, cat:'GRAPPLE', limb:'BODY', traj:'OVERHAND', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_REAR', basePower:100, variants:[
    { n:0, bridge:1.30, snap:0.92, dur:1.52, power:100 }
  ]},
  { fam:'BELLY-TO-BELLY SUPLEX', shape:suplex, cat:'GRAPPLE', limb:'BODY', traj:'OVERHAND', height:'MID',
    style:'POWER', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:90, variants:[
    { n:1, bridge:0.72, snap:0.80, dur:1.24, power:90 },
    { n:2, bridge:0.80, snap:0.86, dur:1.32, power:96 }
  ]},

  { fam:'DDT', shape:driveDown, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:90, variants:[
    { n:1, hook:0.00, dur:1.16, power:90 },
    { n:2, hook:0.08, dur:1.24, power:96 },
    { n:3, hook:-0.06, dur:1.06, power:86 }
  ]},
  { fam:'BUTTERFLY DDT', shape:driveDown, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:96, variants:[
    { n:0, hook:0.14, dur:1.34, power:96 }                          // arms trapped, longer set-up
  ]},
  { fam:'SNAP DDT', shape:driveDown, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:88, variants:[
    { n:0, hook:-0.04, dur:0.92, power:88 }
  ]},
  { fam:'TORNADO DDT', shape:driveDown, cat:'GRAPPLE', limb:'BODY', traj:'SPINNING', height:'HIGH',
    style:'LUCHA', follow:'KNOCKDOWN', pos:'CORNER_FRONT', basePower:102, variants:[
    { n:0, hook:0.06, spin:1.0, dur:1.38, power:102 }
  ]},
  { fam:'SPIKE DDT', shape:driveDown, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'HARDCORE', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:106, variants:[
    { n:0, hook:0.10, dur:1.20, power:106 }
  ]},
  { fam:'NECKBREAKER', shape:driveDown, cat:'GRAPPLE', limb:'BODY', traj:'HOOK', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:84, variants:[
    { n:1, hook:0.04, dur:1.10, power:84 },
    { n:2, hook:0.10, spin:0.6, dur:1.22, power:90 }
  ]},
  { fam:'CUTTER', shape:driveDown, cat:'GRAPPLE', limb:'BODY', traj:'STRAIGHT', height:'HIGH',
    style:'TECHNICAL', follow:'KNOCKDOWN', pos:'STANDING_FRONT', basePower:98, variants:[
    { n:1, hook:0.02, dur:0.98, power:98 },
    { n:2, hook:0.08, spin:0.4, dur:1.10, power:104 }
  ]}
];

// ── existing names — NEVER overwrite one ────────────────────────────────────────────────────────
const taken = new Set();
{ const s=fs.readFileSync(HTML,'utf8');
  const re=/\{\s*"?name"?\s*:\s*["']([^"']+)["']\s*,\s*"?cat"?\s*:/g; let m;
  while((m=re.exec(s))) taken.add(m[1].toUpperCase()); }
for (const f of ['authored_clips.json','move_variants.json']) {
  try { (JSON.parse(fs.readFileSync(path.join(M,f),'utf8')).moves||[]).forEach(x=>taken.add(String(x.name).toUpperCase())); } catch(_){}
}

const CLIPS={}, MOVES=[]; let skipped=[];
FAMILIES.forEach(F=>{
  F.variants.forEach(v=>{
    const name = v.n ? (F.fam + ' ' + v.n) : F.fam;
    if (taken.has(name.toUpperCase())) { skipped.push(name); return; }   // ADDITIVE: never replace
    const key = 'VAR_' + name.replace(/[^A-Z0-9]+/gi,'_').toUpperCase();
    const c = F.shape(v);
    CLIPS[key] = c;
    const mv = { name, cat:F.cat, limb:F.limb, traj:F.traj, height:F.height,
                 power:v.power||F.basePower, speed:Math.round(100/ (c.dur*1.6)),
                 style:F.style, follow:F.follow, range:'SHORT', pos:F.pos,
                 clip:key, family:F.fam, variant:v.n||1, tag:['variant',F.fam.toLowerCase()] };
    if (F.sell) mv.sell = F.sell;
    // aerials and drives land one big contact; the lift families get a set-up contact too
    mv.hits = (F.shape===liftDrop || F.shape===suplex)
      ? [ {t:0.16, limb:'BODY', power:Math.round((v.power||F.basePower)*0.18), type:'strike'},
          {t:0.82, limb:'BODY', power:v.power||F.basePower, type:'slam'} ]
      : [ {t:(F.shape===aerial?0.88:0.74), limb:'BODY', power:v.power||F.basePower, type:'slam'} ];
    mv.endsIn='GROUNDED';
    MOVES.push(mv);
    taken.add(name.toUpperCase());
  });
});

fs.writeFileSync(path.join(M,'move_variants.json'), JSON.stringify({
  _note:'AUTO-GENERATED by tools/moves/gen_move_variants.cjs — numbered move-family variants, WWE-2K style. ADDITIVE ONLY: a name that already exists is skipped, so hand-authored moves and real captures always keep their place. Re-running only ever adds.',
  generated:new Date().toISOString().slice(0,10), families:FAMILIES.length, moves:MOVES.length,
  clips:CLIPS, moves_list:MOVES
}, null, 0));

const byFam={}; MOVES.forEach(m=>{ (byFam[m.family]=byFam[m.family]||[]).push(m.name); });
console.log('families : ' + FAMILIES.length);
console.log('variants generated : ' + MOVES.length);
Object.entries(byFam).forEach(([f,l])=>console.log('    ' + f.padEnd(26) + l.length + '   ' + l.join(', ')));
if (skipped.length) console.log('\nSKIPPED (already exist — additive rule): ' + skipped.join(', '));
console.log('\nwrote assets/moves/move_variants.json  (' + (fs.statSync(path.join(M,'move_variants.json')).size/1024).toFixed(0) + ' KB)');
