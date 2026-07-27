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

    reach, hand_y, foot_y, knee_rise, spin, sym = [], [], [], [], [], []
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
        for hnd in ('haL', 'haR'):
            if hnd in f:
                reach.append(float(np.dot(f[hnd] - ch, fwd)) / H)
                hand_y.append((f[hnd][1] - ch[1]) / H)
        for ft in ('ftL', 'ftR'):
            if ft in f:
                foot_y.append((f[ft][1] - pel[1]) / H)
        for kn, hp in (('knL', 'hipL'), ('knR', 'hipR')):
            if kn in f and hp in f:
                knee_rise.append((f[kn][1] - f[hp][1]) / H)
        if 'haL' in f and 'haR' in f:
            sym.append(float(np.dot(f['haL'] - ch, fwd) - np.dot(f['haR'] - ch, fwd)) / H)

    hip_y = np.array(hip_y)
    P = np.array(pos)
    travel = float(np.linalg.norm(P.max(0) - P.min(0))) / H if len(P) else 0.0
    return dict(
        reachHand=round(float(np.max(reach)) if reach else 0.0, 3),
        handHeight=round(float(np.max(hand_y)) if hand_y else 0.0, 3),
        footHeight=round(float(np.max(foot_y)) if foot_y else 0.0, 3),
        kneeRise=round(float(np.max(knee_rise)) if knee_rise else -1.0, 3),
        hipDrop=round(float(hip_y[0] - hip_y.min()) / H, 3),
        hipRise=round(float(hip_y.max() - hip_y[0]) / H, 3),
        travel=round(travel, 3),
        spin=round(float(np.sum(spin)) if spin else 0.0, 3),
        # near 0 = both hands do the same thing (chop, double axe, taunt); large = one hand leads
        symmetry=round(float(np.max(np.abs(sym))) if sym else 0.0, 3),
        keys=len(F))


def verdict(p):
    """Thresholds, stated out loud so they can be argued with."""
    if not p:
        return 'unknown', 'too few keyframes to measure'
    r, hy, fy, kr = p['reachHand'], p['handHeight'], p['footHeight'], p['kneeRise']
    # a strike must PUT SOMETHING OUT THERE. This alone is what CrotchChop fails.
    if r < 0.18 and fy < 0.25 and kr < -0.05 and p['hipDrop'] < 0.12 and p['travel'] < 0.35:
        return 'gesture', 'nothing extends, nothing lifts, nothing travels (reach %.2f)' % r
    if p['hipDrop'] > 0.45 and p['hipRise'] < 0.15:
        return 'drop', 'pelvis falls %.2f body heights' % p['hipDrop']
    if p['hipRise'] > 0.35:
        return 'lift', 'pelvis climbs %.2f' % p['hipRise']
    if fy > 0.55:
        return 'kick', 'foot reaches %.2f above the hip' % fy
    if kr > 0.10:
        return 'knee', 'knee rises %.2f above the hip' % kr
    if r > 0.30 and abs(p['symmetry']) > 0.12:
        return 'punch', 'one hand extends %.2f in front, asymmetric' % r
    if r > 0.30:
        return 'twohand', 'both hands extend %.2f together' % r
    if p['travel'] > 0.9:
        return 'locomotion', 'body travels %.2f body heights' % p['travel']
    if p['spin'] > 4.0:
        return 'spin', 'shoulder line rotates %.1f rad' % p['spin']
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
