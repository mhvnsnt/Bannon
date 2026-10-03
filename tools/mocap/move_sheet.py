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


# WHAT THE CLIP FORMAT ACTUALLY IS — measured, after the first version of this file reported
# "vertical drop 0.000" for every move in the bank and a rana that rotated 480 degrees.
#   * A clip key's `pose` is a dict of 20 joints, and every position is PELVIS-RELATIVE:
#     pelvis is literally [0,0,0] in every key of every clip. So absolute hip height, and therefore
#     any "how far did the body fall" measured off the hips, is IDENTICALLY ZERO and always was.
#     Nothing in the numbers said so — they just looked plausible and were meaningless.
#   * The joints are named shL/shR and clavL/clavR — not shoulderL. The old lookup fell through to
#     clavL, so the yaw was the clavicle line, then np.unwrap ACCUMULATED per-frame tracking noise
#     into a total that only ever grows. 480 and 558 degrees are noise sums, not rotations.
# Everything below measures things that exist in a pelvis-relative clip.
JOINT_ALIASES = {
    'hips':   ('pelvis', 'hips', 'Hips'),
    'chest':  ('chest', 'spineMid', 'spineLow', 'neck'),
    'head':   ('head', 'neck'),
    'shL':    ('shL', 'shoulderL', 'clavL'),
    'shR':    ('shR', 'shoulderR', 'clavR'),
    'ftL':    ('ftL', 'footL', 'ankL'),
    'ftR':    ('ftR', 'footR', 'ankR'),
}


# ── FORWARD KINEMATICS FOR THE BONES-ONLY CLIPS ────────────────────────────────────────────────
# MEASURED: of the 973 banked clips, 673 carry a 20-joint `pose` AND bone rotations, and 298 carry
# ONLY bone rotations — every FBX-baked import (DOUBLESUPLEX, ALTERNATINGFOREARMS, the whole MDickie
# and Mixamo half). Those have no joint positions to measure, so the first version of this tool
# reported all-zeros and "no usable torso track" for a third of the library.
# A rotation track plus a REST SKELETON is enough to recover positions, and we ship the skeleton:
# assets/models/BANNON_rigged.glb is the proven 28-joint reference rig. Load its hierarchy once,
# apply the clip's per-bone Euler on top of each bone's rest orientation, walk the tree, and the
# result is the same pelvis-relative joint set the other 673 clips store directly.
REF_GLB = os.path.join(ROOT, 'assets', 'models', 'BANNON_rigged.glb')
_REF = None


def _norm(n):
    return ''.join(ch for ch in str(n).lower() if ch.isalnum())


def load_ref_skeleton(path=REF_GLB):
    """Minimal GLB reader: joint names, parents, rest translation + rotation. No dependencies."""
    global _REF
    if _REF is not None:
        return _REF
    if not os.path.exists(path):
        _REF = False
        return _REF
    import struct
    raw = open(path, 'rb').read()
    if raw[:4] != b'glTF':
        _REF = False
        return _REF
    jlen = struct.unpack('<I', raw[12:16])[0]
    gl = json.loads(raw[20:20 + jlen])
    nodes = gl.get('nodes', [])
    skins = gl.get('skins', [])
    if not skins:
        _REF = False
        return _REF
    joints = skins[0]['joints']
    parent = {}
    for i, nd in enumerate(nodes):
        for c in nd.get('children', []) or []:
            parent[c] = i
    idx = {j: k for k, j in enumerate(joints)}
    ref = []
    for j in joints:
        nd = nodes[j]
        t = nd.get('translation', [0.0, 0.0, 0.0])
        r = nd.get('rotation', [0.0, 0.0, 0.0, 1.0])          # xyzw
        p = parent.get(j)
        ref.append({'name': nd.get('name', ''), 'norm': _norm(nd.get('name', '')),
                    't': np.array(t, dtype=float), 'r': np.array(r, dtype=float),
                    'parent': idx.get(p, -1) if p is not None else -1})
    _REF = ref
    return _REF


def _qmul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return np.array([aw*bx + ax*bw + ay*bz - az*by,
                     aw*by - ax*bz + ay*bw + az*bx,
                     aw*bz + ax*by - ay*bx + az*bw,
                     aw*bw - ax*bx - ay*by - az*bz])


def _qrot(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2.0 * np.cross(u, np.cross(u, v) + w * v)


def _euler_xyz_to_quat(rx, ry, rz):
    cx, sx = np.cos(rx/2), np.sin(rx/2)
    cy, sy = np.cos(ry/2), np.sin(ry/2)
    cz, sz = np.cos(rz/2), np.sin(rz/2)
    # three.js 'XYZ' order
    return np.array([sx*cy*cz + cx*sy*sz,
                     cx*sy*cz - sx*cy*sz,
                     cx*cy*sz + sx*sy*cz,
                     cx*cy*cz - sx*sy*sz])


# reference-rig bone -> the joint slot the rest of this tool speaks in
FK_SLOTS = {
    'mixamorighips': 'pelvis', 'mixamorigspine2': 'chest', 'mixamorigspine1': 'spineMid',
    'mixamorighead': 'head', 'mixamorigneck': 'neck',
    'mixamorigleftshoulder': 'shL', 'mixamorigrightshoulder': 'shR',
    'mixamorigleftfoot': 'ftL', 'mixamorigrightfoot': 'ftR',
}


# CROSS-RIG NAME MAP. The bones-only clips are NOT Mixamo — MEASURED, DOUBLESUPLEX's 871 tracks are
# an MDickie/Tripo `J_*` rig: J_Hips, J_Spine1, J_Spine2, J_Chest, J_Neck, J_Head, J_Clavicle_L,
# J_Shoulder_L, J_Elbow_L, J_Wrist_L, J_Thigh_L, J_Knee_L, J_Ankle_L. Feeding those names to a Mixamo
# reference skeleton matches nothing, so every key came back as the untouched rest pose and the sheet
# read "travel 0.00, turn 0" — which is exactly the same failure as the engine's clip-bone lookup:
# two rigs, two vocabularies, no translation layer. This is the translation layer.
ALT_BONE_NAMES = {
    'jhips': 'mixamorighips', 'root': 'mixamorighips',
    'jspine1': 'mixamorigspine', 'jspine2': 'mixamorigspine1', 'jchest': 'mixamorigspine2',
    'jneck': 'mixamorigneck', 'jhead': 'mixamorighead',
    'jclaviclel': 'mixamorigleftshoulder', 'jclavicler': 'mixamorigrightshoulder',
    'jshoulderl': 'mixamorigleftarm',      'jshoulderr': 'mixamorigrightarm',
    'jelbowl': 'mixamorigleftforearm',     'jelbowr': 'mixamorigrightforearm',
    'jwristl': 'mixamoriglefthand',        'jwristr': 'mixamorigrighthand',
    'jthighl': 'mixamorigleftupleg',       'jthighr': 'mixamorigrightupleg',
    'jkneel': 'mixamorigleftleg',          'jkneer': 'mixamorigrightleg',
    'janklel': 'mixamorigleftfoot',        'jankler': 'mixamorigrightfoot',
    # plain-named rigs (our own text-to-motion output, some Tripo autorigs)
    'hips': 'mixamorighips', 'spine': 'mixamorigspine', 'spine1': 'mixamorigspine1',
    'spine2': 'mixamorigspine2', 'neck': 'mixamorigneck', 'head': 'mixamorighead',
    'leftshoulder': 'mixamorigleftshoulder', 'rightshoulder': 'mixamorigrightshoulder',
    'leftarm': 'mixamorigleftarm', 'rightarm': 'mixamorigrightarm',
    'leftforearm': 'mixamorigleftforearm', 'rightforearm': 'mixamorigrightforearm',
    'leftupleg': 'mixamorigleftupleg', 'rightupleg': 'mixamorigrightupleg',
    'leftleg': 'mixamorigleftleg', 'rightleg': 'mixamorigrightleg',
    'leftfoot': 'mixamorigleftfoot', 'rightfoot': 'mixamorigrightfoot',
}


def fk_pose(bones):
    """One key's bone rotations -> a pelvis-relative joint dict, via the reference skeleton."""
    ref = load_ref_skeleton()
    if not ref:
        return None
    lut = {}
    for k, v in (bones or {}).items():
        nk = _norm(k)
        lut.setdefault(nk, v)
        alt = ALT_BONE_NAMES.get(nk)
        if alt:
            lut.setdefault(alt, v)
    world_q, world_p, out = [], [], {}
    for i, b in enumerate(ref):
        v = lut.get(b['norm'])
        lq = b['r']
        if v:
            lq = _qmul(lq, _euler_xyz_to_quat(float(v.get('rx', 0) or 0),
                                              float(v.get('ry', 0) or 0),
                                              float(v.get('rz', 0) or 0)))
        p = b['parent']
        if p < 0 or p >= i:
            wq, wp = lq, b['t'].copy()
        else:
            wq = _qmul(world_q[p], lq)
            wp = world_p[p] + _qrot(world_q[p], b['t'])
        world_q.append(wq); world_p.append(wp)
        slot = FK_SLOTS.get(b['norm'])
        if slot:
            out[slot] = wp
    if 'pelvis' not in out:
        return None
    o = out['pelvis'].copy()
    return {k: (v - o).tolist() for k, v in out.items()}


def series(clip):
    """Per-key measurements that are meaningful in a pelvis-relative clip."""
    inv, headY, stature, shdir = [], [], [], []
    for k in clip.get('keys', []):
        p = k.get('pose') or {}
        if not p:
            p = fk_pose(k.get('bones')) or {}
        hips  = joint(p, *JOINT_ALIASES['hips'])
        chest = joint(p, *JOINT_ALIASES['chest'])
        head  = joint(p, *JOINT_ALIASES['head'])
        shL   = joint(p, *JOINT_ALIASES['shL'])
        shR   = joint(p, *JOINT_ALIASES['shR'])
        ftL   = joint(p, *JOINT_ALIASES['ftL'])
        ftR   = joint(p, *JOINT_ALIASES['ftR'])
        if hips is None or chest is None:
            continue
        v = chest - hips
        n = np.linalg.norm(v)
        if n < 1e-6:
            continue
        # TORSO INVERSION — angle of the spine from straight up. 0 = upright, 180 = fully upside down.
        inv.append(float(np.degrees(np.arccos(np.clip(np.dot(v / n, UP), -1, 1)))))
        # HEAD HEIGHT relative to the pelvis. Negative means the head is genuinely BELOW the hips,
        # which is the unambiguous signature of a driver, a DDT, a piledriver or a powerbomb — and it
        # survives the pelvis-relative format intact, unlike hip height.
        headY.append(float(head[1]) if head is not None else float(chest[1]))
        # STATURE — head to lowest foot. A standing body is ~1.6-1.8 here; a folded or spiked one
        # collapses. The CHANGE in stature is how much the move compacts the body.
        if head is not None and (ftL is not None or ftR is not None):
            lo = min([f[1] for f in (ftL, ftR) if f is not None])
            stature.append(float(head[1] - lo))
        # SHOULDER LINE on the horizontal plane, kept as a VECTOR so rotation can be measured as a
        # real angle between two directions instead of a running sum of frame-to-frame noise.
        if shL is not None and shR is not None:
            d = shR - shL
            m = float(np.hypot(d[0], d[2]))
            if m > 1e-6:
                shdir.append((d[0] / m, d[2] / m))
    return (np.array(inv), np.array(headY), np.array(stature), np.array(shdir) if shdir else np.zeros((0, 2)))


def turn_metrics(shdir):
    """Net turn and largest turn, both as real angles in 0..180 — never an accumulating sum."""
    if len(shdir) < 2:
        return 0.0, 0.0
    def ang(a, b):
        d = float(np.clip(a[0]*b[0] + a[1]*b[1], -1, 1))
        return float(np.degrees(np.arccos(d)))
    net = ang(shdir[0], shdir[-1])
    widest = max(ang(shdir[0], s) for s in shdir)
    return net, widest


def measure(name):
    clip = load(name)
    if not clip:
        return None
    recv = load(name + '__RECV')

    def stats(c):
        if not c:
            return None
        inv, headY, stature, shdir = series(c)
        if len(inv) == 0:
            return None
        net, widest = turn_metrics(shdir)
        st0 = float(np.median(stature[:max(1, len(stature)//4)])) if len(stature) else 0.0
        stmin = float(np.min(stature)) if len(stature) else 0.0
        return {
            'invPeak':      round(float(np.max(inv)), 1),
            'invSwing':     round(float(np.max(inv) - np.min(inv)), 1),
            'invEnd':       round(float(inv[-1]), 1),
            'invertedFrac': round(float(np.mean(inv > 100.0)), 2),
            'headMin':      round(float(np.min(headY)), 3),   # < 0 => head below the hips
            'headTravel':   round(float(np.max(headY) - np.min(headY)), 3),
            'headBelowFrac':round(float(np.mean(headY < 0.0)), 2),
            'statureStart': round(st0, 3),
            'statureMin':   round(stmin, 3),
            # FOLD is clamped to 0..1. Stature goes NEGATIVE when the head passes below the feet,
            # and 1 - min/start then reads as "187% folded", which is not a fold at all — it is an
            # inversion. Report that separately as headBelowFeetFrac instead of letting it inflate
            # the fold number into nonsense.
            'compaction':   round(max(0.0, min(1.0, float(1.0 - (stmin / st0)))) if st0 > 0.01 else 0.0, 2),
            'headBelowFeetFrac': round(float(np.mean(stature < 0.0)) if len(stature) else 0.0, 2),
            'turnNet':      round(net, 1),
            'turnWidest':   round(widest, 1),
        }

    A, R = stats(clip), stats(recv)
    return {'name': name, 'dur': round(float(clip.get('dur', 0)), 2),
            'keys': len(clip.get('keys', [])),
            'attacker': A, 'receiver': R, 'hasReceiver': recv is not None}


def classify(m):
    """Rules over MOTION, never over the name. Returns (family, confidence, why).

    Every threshold below is on a quantity that actually varies in a pelvis-relative clip. The
    previous version keyed on hip drop (identically 0 for every clip in the bank) and an accumulated
    yaw (noise), so it called a sit-out impaler DDT and a kick the same thing with 0.85 confidence.
    A confident wrong answer is worse than no answer, so `unclassified` is a real outcome here.
    """
    if not m:
        return ('unknown', 0.0, 'no clip')
    A, R = m.get('attacker'), m.get('receiver')
    why = []
    V = R or A                      # the body being thrown, when we have its track
    if not V:
        return ('unknown', 0.0, 'no usable torso track')

    inv    = V['invPeak']
    frac   = V['invertedFrac']
    headMin= V['headMin']
    travel = V['headTravel']
    below  = V['headBelowFrac']
    comp   = V['compaction']
    net    = V['turnNet']
    widest = V['turnWidest']
    aInv   = (A or {}).get('invPeak', 0.0)
    aBelow = (A or {}).get('headBelowFrac', 0.0)
    dur    = m['dur'] or 0

    score, reason = {}, {}
    def put(k, v, txt):
        if v > score.get(k, 0): score[k] = v; reason[k] = txt

    # DRIVER / DDT / PILEDRIVER — the receiver's head ends up BELOW their own hips and travels a long
    # way to get there. That is the one thing this family always does and nothing else does.
    if below > 0.15 and travel > 0.8 and inv > 100:
        put('driver / DDT / piledriver family', 0.6 + min(0.3, below),
            'receiver head goes %.2f BELOW the hips for %.0f%% of the move, travelling %.2f, torso to %.0f deg'
            % (abs(headMin), 100*below, travel, inv))

    # SUPLEX / SLAM — a big inversion and a lot of head travel, but the head does not finish under the
    # hips: the body is thrown over and lands flat rather than spiked.
    if inv > 95 and travel > 0.7 and below <= 0.15:
        put('suplex / slam family', 0.55 + min(0.25, travel/4),
            'receiver torso reaches %.0f deg and the head travels %.2f, but never ends below the hips' % (inv, travel))

    # TILT-A-WHIRL / RANA — a real horizontal TURN of the shoulder line while inverted. Measured as an
    # angle between directions, so it cannot be inflated by tracking noise the way a running sum was.
    if widest > 100 and inv > 70:
        put('tilt-a-whirl / rana family', 0.5 + min(0.3, (widest-100)/200.0),
            'receiver shoulder line turns %.0f deg (net %.0f) while the torso is at %.0f deg' % (widest, net, inv))

    # FOLD / POWERBOMB / CRADLE — the body COMPACTS hard: head to feet collapses toward the hips.
    if comp > 0.45 and inv > 45:
        put('powerbomb / fold / cradle family', 0.5 + min(0.25, comp-0.45),
            'receiver folds %.0f%% (head-to-foot %.2f -> %.2f)' % (100*comp, V['statureStart'], V['statureMin']))

    # AERIAL — the ATTACKER is the one going upside down and the receiver is not being turned over.
    if aInv > 100 and (R is None or R['invPeak'] < 70):
        put('aerial / senton / swanton family', 0.55 + min(0.3, (aInv-100)/140.0),
            'the ATTACKER inverts to %.0f deg (head below hips %.0f%% of the move) while the receiver stays flat'
            % (aInv, 100*aBelow))

    # STRIKE — nothing inverts, nothing folds, nothing turns much.
    if inv < 55 and comp < 0.35 and widest < 90:
        put('strike / kick family', 0.45 + (0.1 if dur < 2.0 else 0),
            'nothing inverts (%.0f deg), nothing folds (%.0f%%), no real turn (%.0f deg) — reads as a strike'
            % (inv, 100*comp, widest))

    if not score:
        return ('unclassified', 0.2,
                'inv %.0f  headBelow %.0f%%  travel %.2f  fold %.0f%%  turn %.0f  — no rule fits, needs an eye'
                % (inv, 100*below, travel, 100*comp, widest))
    fam = max(score, key=score.get)
    # If the top two are within a whisker, say so rather than pretending to be sure.
    ranked = sorted(score.items(), key=lambda kv: -kv[1])
    txt = reason[fam]
    if len(ranked) > 1 and (ranked[0][1] - ranked[1][1]) < 0.08:
        txt += '   [close call vs %s]' % ranked[1][0]
    return (fam, round(min(0.95, score[fam]), 2), txt)


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
                  '' if m['hasReceiver'] else '   (single body — no receiver track)'))
            who = 'receiver' if m['receiver'] else 'attacker'
            print('  %-9s torso inversion peak %5.1f deg (upright=0, upside down=180), inverted %.0f%% of the move'
                  % (who, V.get('invPeak', 0), 100 * V.get('invertedFrac', 0)))
            print('              head vs hips: lowest %+.2f, travel %.2f, spent %.0f%% BELOW the hips'
                  % (V.get('headMin', 0), V.get('headTravel', 0), 100 * V.get('headBelowFrac', 0)))
            print('              body fold %.0f%% (head-to-foot %.2f -> %.2f), shoulder turn %.0f deg (net %.0f)'
                  % (100 * V.get('compaction', 0), V.get('statureStart', 0), V.get('statureMin', 0),
                     V.get('turnWidest', 0), V.get('turnNet', 0)))
            if m['attacker'] and m['receiver']:
                A = m['attacker']
                print('  attacker    inversion %5.1f deg, head below hips %.0f%%, fold %.0f%%'
                      % (A['invPeak'], 100 * A['headBelowFrac'], 100 * A['compaction']))
            print('  READS AS    %s   (confidence %.2f)' % (fam, conf))
            print('  because     %s' % why)
            if m['strip']:
                print('  animation   %s' % m['strip'])

    jp = os.path.join(OUT, 'sheets.json')
    json.dump(rows, open(jp, 'w'), indent=1)
    print('\n%d sheet(s) -> %s' % (len(rows), OUT))


if __name__ == '__main__':
    main()
