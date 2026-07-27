#!/usr/bin/env python3
"""classify_by_motion.py — what a capture IS, measured from its frames. No names. No labels.

    python3 tools/moves/classify_by_motion.py                 # report
    python3 tools/moves/classify_by_motion.py --write         # bank assets/moves/motion_profile.json
    python3 tools/moves/classify_by_motion.py --check CrotchChop

OWNER LAW, PERMANENT: "It should map by mocap frames so it can see the moves ... no more guesses."

THE CASE THAT PROVES IT: `CrotchChop` is recorded in fbx_move_map.json as cat:'strike',
engine:'STRIKE_PUNCH', pos:'STANDING_FRONT'. It is a DX taunt. Every filter built on that metadata
let it through, and in a live match FIRE JAB played it. The frames say what the label cannot: both
hands stay at pelvis height, there is no forward extension past the chest, and nothing travels.

So nothing here reads a name or a category. Every number comes out of the joint positions:

  reachHand   how far the hands get IN FRONT of the chest, in body heights. A punch extends; a
              taunt does not.
  handHeight  where the hands live relative to the shoulders. Chops and taunts sit low.
  footHeight  how high a foot gets. Kicks and knees lift; punches do not.
  kneeRise    knee above hip -- separates a knee strike from a kick.
  hipDrop     how far the pelvis falls. Dives, drops and drivers fall; strikes do not.
  hipRise     how far it climbs. Lifts and aerials climb.
  travel      how far the body moves over the clip. Running and charging move; stationary work does not.
  spin        cumulative rotation of the shoulder line. Spinning strikes rotate.
  symmetry    do BOTH hands move together (a chop, a double axe, a taunt) or one lead (a punch)?

The verdict is derived from those numbers with explicit thresholds, so it can be argued with and
re-tuned against real clips rather than believed.
"""
import argparse
import json
import math
import os
import sys

import numpy as np

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CLIPS = os.path.join(REPO, 'assets', 'moves', 'clips')
OUT = os.path.join(REPO, 'assets', 'moves', 'motion_profile.json')


def frames(clip):
    """Per-key joint dict -> arrays we can measure."""
    ks = clip.get('keys') or []
    out = []
    for k in ks:
        p = k.get('pose') or {}
        if 'pelvis' in p and 'chest' in p:
            out.append({j: np.array(v, dtype=float) for j, v in p.items()})
    return out


def profile(clip):
    F = frames(clip)
    if len(F) < 4:
        return None
    # body height from the rig itself, so every measure is in body units and clips compare
    h = []
    for f in F:
        if 'head' in f and 'ftL' in f:
            h.append(abs(f['head'][1] - f['ftL'][1]))
    H = float(np.median(h)) if h else 1.0
    if H < 1e-3:
        H = 1.0

    # ARM EXTENSION, NOT FORWARD REACH. Projecting the hand onto a facing derived from the shoulder
    # line was wrong, and the labelled calibration set proved it: GEN_JAB, a punch by construction,
    # measured reach -0.038 and GEN_CROSS -0.050 -- NEGATIVE forward reach on a straight punch. The
    # facing was inverted for a portion of the clips and the whole measure was noise.
    #
    # How far the hand is from its own SHOULDER needs no facing at all. A punch straightens the arm
    # toward its full shoulder-elbow-hand length; a guard, a chop or a taunt keeps it folded. Same
    # for the leg. Rotation-invariant, camera-invariant, and it cannot go negative.
    reach, hand_y, foot_y, knee_rise, spin, sym = [], [], [], [], [], []
    arm_ext, leg_ext = [], []
    hL, hR = [], []
    hip_y, pos = [], []
    prev_ax = None
    for f in F:
        pel, ch = f['pelvis'], f['chest']
        hip_y.append(pel[1])
        pos.append(np.array([pel[0], pel[2]]))
        # facing from the shoulder line, so "in front" means in front of THIS body
        if 'shL' in f and 'shR' in f:
            ax = f['shR'] - f['shL']
            fwd = np.array([-ax[2], 0.0, ax[0]])
            n = np.linalg.norm(fwd)
            fwd = fwd / n if n > 1e-6 else np.array([0.0, 0.0, 1.0])
            ang = math.atan2(ax[2], ax[0])
            if prev_ax is not None:
                d = ang - prev_ax
                while d > math.pi: d -= 2 * math.pi
                while d < -math.pi: d += 2 * math.pi
                spin.append(abs(d))
            prev_ax = ang
        else:
            fwd = np.array([0.0, 0.0, 1.0])
        for hnd, sh, el in (('haL', 'shL', 'elL'), ('haR', 'shR', 'elR')):
            if hnd in f:
                reach.append(float(np.dot(f[hnd] - ch, fwd)) / H)
                hand_y.append((f[hnd][1] - ch[1]) / H)
                (hL if hnd == 'haL' else hR).append((f[hnd][1] - ch[1]) / H)
            if hnd in f and sh in f and el in f:
                span = float(np.linalg.norm(f[hnd] - f[sh]))
                limb = (float(np.linalg.norm(f[el] - f[sh])) +
                        float(np.linalg.norm(f[hnd] - f[el])))
                if limb > 1e-6:
                    arm_ext.append(span / limb)      # 1.0 = arm perfectly straight
        for ft in ('ftL', 'ftR'):
            if ft in f:
                foot_y.append((f[ft][1] - pel[1]) / H)
        for kn, hp, ft in (('knL', 'hipL', 'ftL'), ('knR', 'hipR', 'ftR')):
            if kn in f and hp in f:
                knee_rise.append((f[kn][1] - f[hp][1]) / H)
            if kn in f and hp in f and ft in f:
                span = float(np.linalg.norm(f[ft] - f[hp]))
                limb = (float(np.linalg.norm(f[kn] - f[hp])) +
                        float(np.linalg.norm(f[ft] - f[kn])))
                if limb > 1e-6:
                    leg_ext.append(span / limb)
        if 'haL' in f and 'haR' in f:
            sym.append(float(np.dot(f['haL'] - ch, fwd) - np.dot(f['haR'] - ch, fwd)) / H)

    # ROOT MOTION IS STRIPPED. Every clip in this repo stores joints RELATIVE TO THE PELVIS -- the
    # pelvis itself is literally [0,0,0] in every key of every clip, captured and generated alike,
    # because the engine owns the root and the clip only supplies the pose. Measured on GEN_WALK_FWD
    # and on TIGER_FEINT_KICK: identical, all zeros.
    #
    # So body travel, hip drop and hip rise are STRUCTURALLY ZERO and always were. Three verdicts --
    # drop, lift and locomotion -- could never fire, which is most of why 336 clips came back
    # unknown. This is exactly the kind of thing that only shows up when you measure your own
    # measurements.
    #
    # The signals have to live in the pose itself:
    #   stride   the feet swapping fore and aft, repeatedly -- that IS walking, with or without a root
    #   fold     head-to-foot distance shrinking (a body dropping/folding) or growing (standing up)
    hip_y = np.array(hip_y)
    P = np.array(pos)
    travel = float(np.linalg.norm(P.max(0) - P.min(0))) / H if len(P) else 0.0
    stride, fold = 0.0, []
    try:
        sep = []
        for f in F:
            if 'ftL' in f and 'ftR' in f:
                sep.append(float(f['ftL'][2] - f['ftR'][2]) / H)
            if 'head' in f and 'ftL' in f and 'ftR' in f:
                lo = min(f['ftL'][1], f['ftR'][1])
                fold.append((f['head'][1] - lo) / H)
        if len(sep) > 4:
            sg = np.sign(np.array(sep))
            stride = float(np.sum(sg[1:] != sg[:-1]))     # fore/aft crossings = steps taken
    except Exception:
        pass
    fold = np.array(fold) if fold else np.array([1.0])
    return dict(
        handRise=round(max((max(x) - min(x)) for x in (hL, hR) if x) if (hL or hR) else 0.0, 3),
        armExtend=round(float(np.max(arm_ext)) if arm_ext else 0.0, 3),
        armExtendRest=round(float(np.median(arm_ext)) if arm_ext else 0.0, 3),
        legExtend=round(float(np.max(leg_ext)) if leg_ext else 0.0, 3),
        reachHand=round(float(np.max(reach)) if reach else 0.0, 3),
        handHeight=round(float(np.max(hand_y)) if hand_y else 0.0, 3),
        footHeight=round(float(np.max(foot_y)) if foot_y else 0.0, 3),
        kneeRise=round(float(np.max(knee_rise)) if knee_rise else -1.0, 3),
        hipDrop=round(float(hip_y[0] - hip_y.min()) / H, 3),
        hipRise=round(float(hip_y.max() - hip_y[0]) / H, 3),
        travel=round(travel, 3),
        stride=round(float(stride), 1),
        foldMin=round(float(fold.min()), 3),
        foldMax=round(float(fold.max()), 3),
        foldRange=round(float(fold.max() - fold.min()), 3),
        spin=round(float(np.sum(spin)) if spin else 0.0, 3),
        # near 0 = both hands do the same thing (chop, double axe, taunt); large = one hand leads
        symmetry=round(float(np.max(np.abs(sym))) if sym else 0.0, 3),
        keys=len(F))


def verdict(p):
    """Thresholds CALIBRATED against a labelled set, not invented.

    The calibration set is generated by MoMask from explicit prompts, so every clip's true class is
    known by construction -- GEN_JAB is a jab because that is what was asked for. Measuring those
    gives the real separation between classes instead of numbers I made up:

        GEN_JAB      armExtend 0.93  legExtend 0.79  kneeRise -0.18
        GEN_CROSS    armExtend 0.95  legExtend 0.80  kneeRise -0.21
        GEN_KNEE     armExtend 0.72  legExtend 0.71  kneeRise  0.37   footY 0.75
        GEN_TAUNT    (arms up, no extension toward a target)

    A punch straightens the arm past ~0.88 of its own length. A guard or a chop never does.
    """
    if not p:
        return 'unknown', 'too few keyframes to measure'
    ae, le, kr, fy = p['armExtend'], p['legExtend'], p['kneeRise'], p['footHeight']
    # order matters: the biggest, least ambiguous body signals first
    # the body FOLDING or RISING, measured head-to-foot, because the root is not in the data
    if p['foldMin'] < 0.55 and p['foldRange'] > 0.30:
        return ('getup' if p['foldMax'] - p['foldMin'] > 0.45 and p['stride'] < 6 else 'drop'), \
               'body folds to %.2f of standing height and back (range %.2f)' % (p['foldMin'], p['foldRange'])
    if p['stride'] >= 4:
        return 'locomotion', '%d fore/aft foot crossings -- a stride cycle' % int(p['stride'])
    if kr > 0.10:
        return 'knee', 'knee drives %.2f above the hip' % kr
    if fy > 0.55 and le > 0.80:
        return 'kick', 'foot %.2f above the hip with the leg %.0f%% extended' % (fy, le * 100)
    if ae > 0.88:
        kind = 'punch' if abs(p['symmetry']) > 0.10 else 'twohand'
        return kind, 'arm reaches %.0f%% of its own length' % (ae * 100)
    # BENT-ARM STRIKES. An uppercut does not straighten -- GEN_UPPERCUT, an uppercut by construction,
    # tops out at 73% extension, LOWER than the guard clips. Extension alone would call it a gesture.
    # What it does instead is DRIVE THE HAND UP: handRise is how far the hand climbs relative to the
    # chest over the clip, and on the labelled set the uppercut leads every other punch on it.
    if p['handRise'] > 0.30 and ae > 0.60:
        return 'punch', 'bent arm drives the hand up %.2f body heights' % p['handRise']
    if p['spin'] > 4.0:
        return 'spin', 'shoulder line rotates %.1f rad' % p['spin']
    if ae < 0.80 and fy < 0.25 and kr < -0.05 and p['hipDrop'] < 0.12 and p['travel'] < 0.35:
        return 'gesture', 'arm never extends past %.0f%%, nothing lifts or travels' % (ae * 100)
    return 'other', 'no dominant signal'


# what a combat slot is ALLOWED to draw, by measured verdict
ALLOW = {
    'strike':      {'punch', 'twohand', 'kick', 'knee', 'spin'},
    'combo':       {'punch', 'twohand', 'kick', 'knee', 'spin'},
    'combo_ender': {'punch', 'twohand', 'kick', 'knee', 'spin', 'drop'},
    'grapple':     {'lift', 'drop', 'twohand', 'spin'},
    'carry':       {'lift'},
    'dive':        {'drop', 'lift'},
    'submission':  {'drop', 'twohand', 'other'},
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--check', default=None)
    a = ap.parse_args()

    idx = json.load(open(os.path.join(CLIPS, 'index.json')))
    prof, counts = {}, {}
    for name, e in idx.items():
        f = e.get('file') if isinstance(e, dict) else None
        if not f:
            continue
        try:
            c = json.load(open(os.path.join(CLIPS, f)))
        except Exception:
            continue
        p = profile(c)
        v, why = verdict(p)
        prof[name] = dict(p or {}, verdict=v, why=why)
        counts[v] = counts.get(v, 0) + 1

    if a.check:
        k = a.check
        hit = prof.get(k) or next((v for kk, v in prof.items()
                                   if kk.upper().replace('_', '') == k.upper().replace('_', '')), None)
        print(json.dumps(hit, indent=1) if hit else 'no such clip')
        return

    print('MEASURED %d clips. Nothing below reads a name or a metadata category.' % len(prof))
    print('=' * 74)
    for v in sorted(counts, key=lambda x: -counts[x]):
        print('  %-11s %4d' % (v, counts[v]))
    print('')
    print('CLIPS LABELLED cat:strike THAT DO NOT MEASURE AS ONE:')
    try:
        fbx = json.load(open(os.path.join(REPO, 'assets', 'moves', 'fbx_move_map.json')))
        lab = {c['clip']: c.get('cat') for c in fbx.get('clips', [])}
    except Exception:
        lab = {}
    norm = lambda s: ''.join(ch for ch in str(s).upper() if ch.isalnum())
    byn = {norm(k): k for k in prof}
    bad = 0
    for clip, cat in lab.items():
        if cat != 'strike':
            continue
        k = byn.get(norm(clip))
        if not k:
            continue
        v = prof[k]['verdict']
        if v not in ('punch', 'twohand', 'kick', 'knee', 'spin'):
            bad += 1
            if bad <= 12:
                print('  %-26s labelled strike, measures %-11s %s' % (clip, v, prof[k]['why']))
    print('  ... %d total mislabelled' % bad)

    if a.write:
        json.dump({'_note': 'MEASURED from clip frames by tools/moves/classify_by_motion.py. '
                            'Owner law: no guesses. Metadata categories are NOT used.',
                   'clips': prof, 'allow': {k: sorted(v) for k, v in ALLOW.items()}},
                  open(OUT, 'w'), indent=1)
        print('\nwrote ' + os.path.relpath(OUT, REPO))


if __name__ == '__main__':
    main()
