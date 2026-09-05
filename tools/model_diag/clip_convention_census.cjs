#!/usr/bin/env node
/* clip_convention_census.cjs — CLIP TRUTH. Which rotation contract is each capture authored under?
 *
 *   node tools/model_diag/clip_convention_census.cjs [--json] [--gate] [--list <VERDICT>]
 *
 * OWNER: "The clip library contains at least two rotation conventions, but the runtime assumes
 * exactly one." Confirmed by controlled comparison in the live engine — same clip, same phase, same
 * rest pose, thigh direction (dirY -1 = straight down):
 *
 *     GEN_WALK_FWD    rest*clip -0.975 DOWN     as absolute +0.999 up
 *     ZONE_PULLUP_A   rest*clip -0.977 DOWN     as absolute +1.000 up
 *     BOX_IDLE        rest*clip +0.890 UP       as absolute -0.939 DOWN
 *     COMBO_PUNCH     rest*clip +0.754 UP       as absolute -0.787 DOWN
 *     BODY_JAB_CROSS  rest*clip +0.553 UP       as absolute -0.595 DOWN
 *
 * THE FEATURE IS RIG-FREE, WHICH IS WHY THIS CAN RUN OFFLINE OVER THE WHOLE LIBRARY.
 * A track authored as an OFFSET FROM REST passes CLOSE TO IDENTITY somewhere in its cycle — that is
 * what "no rotation relative to rest" means. A track authored as an ABSOLUTE local rotation carries
 * the rig's rest rotation baked in (a Mixamo thigh sits ~169 degrees from its parent) and can never
 * approach identity. So the MINIMUM angle-to-identity over the whole clip separates them.
 *
 * MEASURED SEPARATION, on the clips whose behaviour was verified in-engine:
 *     OFFSET    GEN_RUN_FWD 2.3   GEN_WALK_FWD 3.3   ZONE_PULLUP_A 6.8      degrees
 *     ABSOLUTE  DROP_KICK_1 127.8  BOXING 144.5  BODY_JAB_CROSS 148.1
 *               COMBO_PUNCH 161.8  BOX_IDLE 165.0
 * Nothing lands between 6.8 and 127.8, so the threshold sits in a gap 120 degrees wide instead of
 * being tuned to a frame. A SINGLE-PHASE reading was tried first and misclassified BODY_JAB_CROSS on
 * a 7-degree margin; the minimum over the clip is what fixed it.
 *
 * PER TRACK, NOT PER CLIP. A capture whose hips are absolute and whose arms are offset is a real
 * possibility and nothing has ruled it out, so every informative bone votes and disagreement is
 * reported as MIXED rather than being forced into one reading.
 *
 * ONLY BONES WITH A LARGE REST ROTATION CAN DISCRIMINATE. A spine bone sits near identity at rest,
 * so its track is near identity under BOTH conventions and carries no information. The limb roots
 * (thigh, upper arm) are the informative ones; forearms and shins are excluded because their rest
 * rotation is small (the knee measured 0.307 rad against the thigh's 2.949).
 *
 * UNKNOWN IS NOT A PASS and MIXED IS NOT A PASS. Neither is auto-converted; both are listed so the
 * import-time normaliser can deal with them deliberately.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.dirname(path.dirname(__dirname));
const CLIPS = path.join(ROOT, 'assets', 'moves', 'clips');
const argv = process.argv.slice(2);
const has = f => argv.indexOf('--' + f) >= 0;
const str = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 ? argv[i+1] : d; };

// THE TWO HYPOTHESES, EACH TESTED AGAINST THE BONE'S OWN BIND ROTATION.
// Owner: "Which mathematical interpretation reconstructs a plausible pose relative to this bone's
// actual bind basis?" — not "does this bone look like the thigh did?"
//     OFFSET    final = B * Q   -> the bone is at rest when Q is near IDENTITY
//     ABSOLUTE  final = Q       -> the bone is at rest when Q is near B
// So per track, over the whole clip, measure the angle of Q to identity and to B and take the
// MEDIAN of each. The smaller median names the hypothesis under which this track spends most of its
// time near the bone's rest orientation, which is what an animation of a standing human does.
//
// MEDIAN, NOT MINIMUM. My first feature was the MINIMUM angle to identity, and it is confounded:
// in a capoeira au the thigh genuinely REACHES the orientation identity represents (the leg goes
// over the head), so an ABSOLUTE track dips near identity once and votes OFFSET. Every remaining
// MIXED verdict in that run was an acrobatic clip doing exactly that. A median cannot be moved by a
// handful of frames.
//
// INFORMATIVE BONES, CHOSEN BY MEASURING THE RIG, NOT BY ANATOMY INTUITION.
// `render_truth.cjs --restcensus` reads every bone's rest rotation off userData.restQuat:
//     LeftUpLeg 168.7   RightUpLeg 168.2   LeftShoulder 117.3   RightShoulder 116.4
//     LeftFoot 94.4     RightFoot 73.6     LeftArm 31.2   RightArm 31.2   LeftForeArm 31.5
//     LeftLeg 23.5      RightLeg 20.4      Spine 5.8      Hips 0   Spine2 0   Head 0
// A bone whose rest rotation is NEAR IDENTITY sits near identity under BOTH hypotheses, so the two
// medians are equal and it carries no information. Only a bone whose rest rotation is large can
// separate them, and the separation it can offer IS its rest angle.
// MY FIRST VERSION INCLUDED THE UPPER ARMS on the assumption that "the upper arm is like the thigh".
// It is 31.2 degrees, not 169 — so an offset arm track trivially exceeded a 60-degree bar during a
// punch while an absolute arm track sat only 31 degrees from identity at rest, and the arm voted at
// random. That one assumption manufactured 530 MIXED verdicts out of 973 clips, which read as a real
// per-track convention split and was not one. RETRACTED, and the reason the bones are measured now.
const BONES = ['leftupleg', 'rightupleg', 'leftshoulder', 'rightshoulder'];
// Measured off the live rig, x/y/z/w. Provenance: dist/playtest/render/rig_rest.json.
const BIND = {
  leftupleg:     [ 0.992405,  0.051955,  0.051955, 0.098659],
  rightupleg:    [-0.992861, -0.042368, -0.042368, 0.103140],
  leftshoulder:  [ 0.849396, -0.085360,  0.020150, 0.520417],
  rightshoulder: [-0.845337,  0.020151, -0.085360, 0.526985]
};
const BONE_REST_DEG = { leftupleg:168.7, rightupleg:168.2, leftshoulder:117.3, rightshoulder:116.4 };
// A track only votes if the two hypotheses are far enough apart on this bone to be distinguishable
// at all, and if this clip's own medians actually separate. Both are read, never assumed.
const MIN_MARGIN_DEG = 25;

function load(p){
  if (p.endsWith('.jgz')) return JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString('utf8'));
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Quaternion of an XYZ Euler, and the angle between two quaternions in degrees.
function quatOfEuler(rx, ry, rz){
  const cx = Math.cos(rx/2), sx = Math.sin(rx/2);
  const cy = Math.cos(ry/2), sy = Math.sin(ry/2);
  const cz = Math.cos(rz/2), sz = Math.sin(rz/2);
  return [ sx*cy*cz + cx*sy*sz,
           cx*sy*cz - sx*cy*sz,
           cx*cy*sz + sx*sy*cz,
           cx*cy*cz - sx*sy*sz ];
}
function angBetween(a, b){
  const d = Math.abs(a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3]);
  return 2*Math.acos(Math.min(1, d)) * 180/Math.PI;
}
const IDENT = [0, 0, 0, 1];
function median(a){ const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length/2)]; }

function classify(clip){
  const keys = clip.keys || [];
  const names = {};
  for (const k of keys){
    const bn = k && k.bones; if (!bn) continue;
    for (const raw in bn){
      const nk = String(raw).toLowerCase().replace(/[^a-z]/g, '');
      for (const want of BONES)
        if (!names[want] && nk.indexOf(want) >= 0 && nk.indexOf('fore') < 0) names[want] = raw;
    }
  }
  const ev = {}; let abs = 0, off = 0;
  for (const want in names){
    const name = names[want], B = BIND[want];
    if (!B) continue;
    const dI = [], dB = [];
    for (const k of keys){
      const t = k.bones && k.bones[name]; if (!t) continue;
      const q = quatOfEuler(t.rx || 0, t.ry || 0, t.rz || 0);
      dI.push(angBetween(q, IDENT));
      dB.push(angBetween(q, B));
    }
    if (!dI.length) continue;
    const medI = median(dI), medB = median(dB);
    const margin = Math.abs(medI - medB);
    const vote = margin < MIN_MARGIN_DEG ? 'UNRESOLVED' : (medB < medI ? 'ABSOLUTE' : 'OFFSET');
    ev[want] = { restDeg:BONE_REST_DEG[want], samples:dI.length,
                 medToIdentity:+medI.toFixed(1), medToBind:+medB.toFixed(1),
                 marginDeg:+margin.toFixed(1), vote };
    if (vote === 'ABSOLUTE') abs++; else if (vote === 'OFFSET') off++;
  }
  let verdict = 'UNKNOWN';
  if (abs && off) verdict = 'MIXED';
  else if (abs) verdict = 'ABSOLUTE';
  else if (off) verdict = 'OFFSET';
  // CONFIDENCE IS THE SMALLEST MARGIN ANY VOTING TRACK OFFERED, normalised by the largest margin a
  // bone of this rig could ever give. Not a number invented to look precise.
  let conf = 0;
  const margins = Object.values(ev).filter(e => e.vote !== 'UNRESOLVED').map(e => e.marginDeg);
  if (margins.length && verdict !== 'MIXED') conf = Math.min(1, Math.min(...margins) / 120);
  return { verdict, confidence:+conf.toFixed(2), evidence:ev,
           informativeTracks:Object.keys(ev).length,
           votingTracks:margins.length, totalKeys:keys.length, dur:clip.dur || 0 };
}

const files = fs.existsSync(CLIPS)
  ? fs.readdirSync(CLIPS).filter(f => f.endsWith('.json') || f.endsWith('.jgz')).sort()
  : [];
const out = {};
const buckets = { OFFSET:[], ABSOLUTE:[], MIXED:[], UNKNOWN:[] };
const errs = [];
for (const f of files){
  let c; try{ c = load(path.join(CLIPS, f)); }catch(e){ errs.push([f, String(e.message).slice(0,60)]); continue; }
  const name = f.replace(/\.(json|jgz)$/, '');
  const r = classify(c);
  out[name] = r;
  buckets[r.verdict].push(name);
}

if (has('json')){ console.log(JSON.stringify(out, null, 1)); process.exit(0); }

const want = str('list', null);
if (want && buckets[want]){ buckets[want].forEach(n => console.log(n)); process.exit(0); }

console.log('\n===== CLIP TRUTH: ROTATION CONVENTION CENSUS =====');
console.log('  ' + files.length + ' capture(s) in assets/moves/clips');
console.log('  informative bones (rest rotation): ' + BONES.map(b => b + ' ' + BONE_REST_DEG[b] + 'deg').join(', '));
console.log('  per track: median angle of the clip rotation to IDENTITY (offset hypothesis) vs to the');
console.log('  bone BIND rotation (absolute hypothesis). Smaller median wins; margin < ' + MIN_MARGIN_DEG + ' deg = UNRESOLVED.');
for (const k of ['OFFSET','ABSOLUTE','MIXED','UNKNOWN'])
  console.log('   ' + k.padEnd(11) + String(buckets[k].length).padStart(5) +
              (k === 'UNKNOWN' ? '   (no informative bone track — cannot be classified, NOT a pass)' :
               k === 'MIXED'   ? '   (tracks disagree — must NOT be forced into one reading)' : ''));
if (errs.length) console.log('   UNREADABLE  ' + String(errs.length).padStart(4));

for (const k of ['ABSOLUTE','MIXED']){
  if (!buckets[k].length) continue;
  console.log('\n  ' + k + ' — evidence (min angle to identity, per informative track):');
  for (const n of buckets[k].slice(0, 12)){
    const r = out[n];
    console.log('   ' + n.slice(0,34).padEnd(35) + 'conf ' + r.confidence.toFixed(2) + '   ' +
      Object.entries(r.evidence).map(([b, e]) => b + ' I' + e.medToIdentity + '/B' + e.medToBind + ' ' + e.vote.slice(0,3)).join('  '));
  }
  if (buckets[k].length > 12) console.log('   ... and ' + (buckets[k].length - 12) + ' more (--list ' + k + ')');
}

// A LOW-CONFIDENCE CALL IS THE ONE THAT WILL BE WRONG. Surfaced rather than averaged away.
const shaky = Object.entries(out).filter(([, r]) => r.verdict !== 'UNKNOWN' && r.confidence < 0.25);
if (shaky.length){
  console.log('\n  LOW CONFIDENCE (within 15 deg of the threshold — treat as unresolved):');
  for (const [n, r] of shaky.slice(0, 12))
    console.log('   ' + n.slice(0,34).padEnd(35) + r.verdict.padEnd(9) + 'conf ' + r.confidence.toFixed(2) +
      '   ' + Object.entries(r.evidence).map(([b, e]) => b + ' margin ' + e.marginDeg).join('  '));
  if (shaky.length > 12) console.log('   ... and ' + (shaky.length - 12) + ' more');
}

fs.mkdirSync(path.join(ROOT, 'dist', 'playtest'), { recursive:true });
fs.writeFileSync(path.join(ROOT, 'dist', 'playtest', 'clip_conventions.json'),
  JSON.stringify({ threshold:CONV_DEG, bones:BONES, counts:Object.fromEntries(
    Object.entries(buckets).map(([k, v]) => [k, v.length])), clips:out }, null, 1));
console.log('\n  report -> dist/playtest/clip_conventions.json');
if (has('gate')) process.exitCode = (buckets.MIXED.length || errs.length) ? 1 : 0;
