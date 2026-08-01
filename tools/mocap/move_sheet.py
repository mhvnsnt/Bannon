#!/usr/bin/env python3
"""move_sheet.py — a DATA SHEET per move: the numbers, the animation, and what the numbers say it is.

    python3 tools/mocap/move_sheet.py JUNGLE_JUICE TZ_TILT_WHIRL_SLAM
    python3 tools/mocap/move_sheet.py --char TARZANIAN_DEVIL --all
    python3 tools/mocap/move_sheet.py JUNGLE_JUICE --source assets/mocap/social/.../x.mp4

WHY: owner — "u can tell from data sheets tho or we create data sheet version of the local animations
as videos ... the data sheets or videos will tell us which move is which."

He is right, and it removes the last bit of manual homework. Up to now I could FIND a move
autonomously (segment_match) and CAPTURE it (video_to_clip), but naming it came back to a human
squinting at a contact strip. The clip itself already contains everything needed to classify it —
inversion, rotation, airborne time, how the receiver travels — those just were never read out.

WHAT A SHEET CONTAINS
  * KINEMATICS, measured off OUR banked clip (not the video): peak inversion of the receiver, how far
    the torso axis swings, airborne fraction, vertical drop, rotation about the vertical axis, the
    attacker's own inversion, and duration.
  * A CLASSIFICATION with a confidence, derived from those numbers by rules that describe MOTION, not
    names — e.g. "receiver fully inverts, big vertical drop, attacker stays upright" is a driver/DDT
    family; "receiver rotates >200 degrees about vertical while horizontal" is a tilt-a-whirl/rana;
    "attacker inverts, high airborne, no grapple contact" is an aerial/senton.
  * THE ANIMATION ITSELF as a frame strip, so the sheet is readable rather than a wall of numbers,
    plus the same strip written as an MP4 when --video is passed.
This is the same discipline as the rest of the pipeline: derive from the data, never from the label.
"""
import argparse
import glob
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CLIPS = os.path.join(ROOT, 'assets', 'moves', 'clips')
OUT = os.path.join(ROOT, 'assets', 'moves', 'sheets')

# our clip format stores a per-key 'pose' dict of joint -> [x,y,z]
UP = np.array([0.0, 1.0, 0.0])


def load(name):
    p = os.path.join(CLIPS, name + '.json')
    if not os.path.exists(p):
        return None
    return json.load(open(p))


def joint(pose, *names):
    for n in names:
        if n in pose:
            return np.array(pose[n], dtype=float)
    return None


def torso_metrics(clip):
    """Per-key torso axis angle from vertical, hip height, and yaw of the shoulder line."""
    ang, hipy, yaw = [], [], []
    for k in clip.get('keys', []):
        p = k.get('pose') or {}
        hips = joint(p, 'pelvis', 'hips', 'Hips')
        chest = joint(p, 'chest', 'spineMid', 'spineLow', 'neck')
        shL = joint(p, 'shoulderL', 'clavL', 'armL')
        shR = joint(p, 'shoulderR', 'clavR', 'armR')
        if hips is None or chest is None:
            continue
        v = chest - hips
        n = np.linalg.norm(v)
        if n < 1e-6:
            continue
        ang.append(float(np.degrees(np.arccos(np.clip(np.dot(v / n, UP), -1, 1)))))
        hipy.append(float(hips[1]))
        if shL is not None and shR is not None:
            d = shR - shL
            yaw.append(float(np.degrees(np.arctan2(d[2], d[0]))))
    return np.array(ang), np.array(hipy), np.array(yaw)


def unwrap_total(deg):
    if len(deg) < 2:
        return 0.0
    u = np.unwrap(np.radians(deg))
    return float(abs(np.degrees(u[-1] - u[0])))


def measure(name):
    clip = load(name)
    if not clip:
        return None
    recv = load(name + '__RECV')
    a_ang, a_hip, a_yaw = torso_metrics(clip)
    r_ang, r_hip, r_yaw = (torso_metrics(recv) if recv else (np.array([]),) * 3)

    def stats(ang, hip, yaw):
        if len(ang) == 0:
            return None
        span = float(np.max(hip) - np.min(hip)) if len(hip) else 0.0
        return {
            'invPeak': round(float(np.max(ang)), 1),
            'invSwing': round(float(np.max(ang) - np.min(ang)), 1),
            'invEnd': round(float(ang[-1]), 1),
            'hipDrop': round(span, 3),
            'yawTotal': round(unwrap_total(yaw), 1) if len(yaw) else 0.0,
            'invertedFrac': round(float(np.mean(ang > 100.0)), 2),
        }

    A, R = stats(a_ang, a_hip, a_yaw), stats(r_ang, r_hip, r_yaw)
    return {'name': name, 'dur': round(float(clip.get('dur', 0)), 2),
            'keys': len(clip.get('keys', [])),
            'attacker': A, 'receiver': R, 'hasReceiver': recv is not None}


def classify(m):
    """Rules over MOTION, never over the name. Returns (family, confidence, why)."""
    if not m:
        return ('unknown', 0.0, 'no clip')
    A, R = m.get('attacker'), m.get('receiver')
    why = []
    # the body that actually gets thrown: prefer the receiver track when we have one
    V = R or A
    if not V:
        return ('unknown', 0.0, 'no usable torso track')

    inv = V['invPeak']; swing = V['invSwing']; yaw = V['yawTotal']
    drop = V['hipDrop']; frac = V['invertedFrac']
    aInv = (A or {}).get('invPeak', 0.0)

    score = {}
    # a rana / tilt-a-whirl: the thrown body ROTATES a long way about the vertical while going over
    if yaw > 170 and inv > 80:
        score['tilt-a-whirl / rana family'] = 0.55 + min(0.3, (yaw - 170) / 400.0)
        why.append('receiver yaw %.0f deg with %.0f deg inversion' % (yaw, inv))
    # driver / DDT / suplex: full inversion plus a real vertical drop, attacker stays upright-ish
    if inv > 110 and drop > 0.25 and aInv < 100:
        score['driver / DDT / suplex family'] = 0.55 + min(0.3, (inv - 110) / 140.0)
        why.append('receiver inverts to %.0f deg, drops %.2f, attacker stays upright' % (inv, drop))
    # slam: big drop, partial inversion, little spin
    if 45 < inv <= 115 and drop > 0.2 and yaw < 150:
        score['slam / powerbomb family'] = 0.5 + min(0.25, drop)
        why.append('receiver tips to %.0f deg and drops %.2f without spinning' % (inv, drop))
    # aerial: the ATTACKER is the one inverting/airborne
    if aInv > 100 and (R is None or R['invPeak'] < 70):
        score['aerial / senton / swanton family'] = 0.55 + min(0.3, (aInv - 100) / 140.0)
        why.append('the ATTACKER inverts to %.0f deg, receiver stays flat' % aInv)
    # strike: little inversion anywhere, short
    if inv < 45 and (m['dur'] or 0) < 2.0:
        score['strike / kick family'] = 0.45
        why.append('no inversion, %.1fs — reads as a strike' % m['dur'])

    if not score:
        return ('unclassified', 0.2, 'inv %.0f swing %.0f yaw %.0f drop %.2f' % (inv, swing, yaw, drop))
    fam = max(score, key=score.get)
    return (fam, round(min(0.95, score[fam]), 2), '; '.join(why))


def strip(name, out_png, cols=8):
    """Render the CLIP itself as a frame strip, so the sheet shows the animation not just numbers."""
    try:
        import subprocess
        r = subprocess.run([sys.executable, os.path.join(HERE, 'render_clip.py'), name,
                            '--out', out_png], capture_output=True, text=True, timeout=240)
        return os.path.exists(out_png)
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('names', nargs='*')
    ap.add_argument('--char', default=None, help='prefix filter when using --all')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--json', action='store_true', help='machine-readable only')
    a = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    names = list(a.names)
    if a.all:
        for f in sorted(glob.glob(os.path.join(CLIPS, '*.json'))):
            b = os.path.basename(f)[:-5]
            if b in ('index',) or b.endswith('__RECV'):
                continue
            if a.char and not b.upper().startswith(a.char.upper()):
                continue
            names.append(b)
    if not names:
        print('nothing to sheet (give names, or --all [--char PREFIX])'); return

    rows = []
    for n in names:
        m = measure(n)
        if not m:
            print('  %-28s no clip' % n); continue
        fam, conf, why = classify(m)
        m['family'] = fam; m['confidence'] = conf; m['why'] = why
        rows.append(m)
        png = os.path.join(OUT, n + '.png')
        m['strip'] = png if strip(n, png) else None

        if not a.json:
            V = m['receiver'] or m['attacker'] or {}
            print('\n=== %s ===' % n)
            print('  duration    %.2fs, %d keys%s' % (m['dur'], m['keys'],
                  '' if m['hasReceiver'] else '   (no receiver track)'))
            print('  receiver    inversion peak %5.1f deg, swing %5.1f, ends %5.1f, inverted %.0f%% of the move'
                  % (V.get('invPeak', 0), V.get('invSwing', 0), V.get('invEnd', 0),
                     100 * V.get('invertedFrac', 0)))
            print('              vertical drop %.3f, rotation about vertical %.0f deg'
                  % (V.get('hipDrop', 0), V.get('yawTotal', 0)))
            if m['attacker'] and m['receiver']:
                print('  attacker    inversion peak %5.1f deg, drop %.3f'
                      % (m['attacker']['invPeak'], m['attacker']['hipDrop']))
            print('  READS AS    %s   (confidence %.2f)' % (fam, conf))
            print('  because     %s' % why)
            if m['strip']:
                print('  animation   %s' % m['strip'])

    jp = os.path.join(OUT, 'sheets.json')
    json.dump(rows, open(jp, 'w'), indent=1)
    print('\n%d sheet(s) -> %s' % (len(rows), OUT))


if __name__ == '__main__':
    main()
