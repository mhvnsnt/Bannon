#!/usr/bin/env python3
"""harvest.py — stop farming clips one at a time.

THE OWNER'S PROBLEM, in his words: "farming and editing these clips for each move and multiple
positions and variations and locomotion etc and get ups and zoning and climbing and stuff gonna be
tedious". He is right. One video per move, hand-trimmed, hand-named, hand-mapped does not scale to a
2K-sized moveset. This tool attacks it three ways.

  --segment   ONE long video -> MANY clips. Finds where each move starts and ends by motion energy
              (a move begins and ends near-still), cuts them apart, classifies each one by what the
              body actually did, names it, and writes it. A ten-minute reel becomes fifty clips in one
              command with no trimming by hand.

  --variants  ONE capture -> a FAMILY. Mirror, retime, amplitude-scale and splice. This is how a
              retail wrestling game ships forty powerbombs without forty capture sessions: the
              variants are DERIVED. "snap suplex" is a suplex with a different timing curve.
              "kneeling powerbomb" is a powerbomb with the lift amplitude cut. Left and right versions
              are free. Nothing here needs a camera.

  --plan      What you should NOT capture at all, and why. Locomotion, get-ups, climbing and zoning
              transitions are STATE MACHINES with procedural pose math in this engine already — the
              walk cycle computes 36 distinct leg poses per stride today. Capturing those is work
              spent replacing something that already exists.

WHAT IT DOES NOT PRETEND TO BE: the actual 2026 answer to "generate a move from a description" is a
motion diffusion model (MoMask / MDM / MotionGPT). Those need a GPU and 1-2 GB of weights, and their
output is a SMPL skeleton that still needs retargeting to our rig. This tool is deliberately the part
that runs on any machine with no model download beyond the 9 MB pose estimator, and it is designed so
a diffusion backend can be dropped in behind the same clip writer later: everything below emits the
engine's own clip format, so the SOURCE of a clip is already an implementation detail.

USAGE
  python3 tools/mocap/harvest.py reel.mp4 --segment
  python3 tools/mocap/harvest.py reel.mp4 --segment --prefix STRIKE --min-len 0.6 --max-clips 60
  python3 tools/mocap/harvest.py --variants POWERBOMB
  python3 tools/mocap/harvest.py --variants POWERBOMB --family "SITOUT,KNEELING,RUNNING,SNAP"
  python3 tools/mocap/harvest.py --variants-all           # derive families for every captured clip
  python3 tools/mocap/harvest.py --plan
"""
import argparse
import json
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
CLIPS = os.path.join(REPO, 'assets', 'moves', 'clips')
sys.path.insert(0, HERE)


# ══════════════════════════════════════════════════════════════════════════════════════════════════
# SEGMENT: one video, many clips
# ══════════════════════════════════════════════════════════════════════════════════════════════════
def landmark_track(path, stride=1):
    """Every frame's 33 world landmarks. One pass, kept in memory — a 10 minute clip at 30 fps is
    18,000 frames x 33 x 3 floats = 7 MB, which is nothing."""
    import cv2
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision
    import video_to_clip as v2c

    model = v2c.find_model()
    if not model:
        print('pose model missing — see tools/mocap/video_to_clip.py for the one-line fetch', file=sys.stderr)
        return None, None, None

    lm = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=model),
        running_mode=vision.RunningMode.VIDEO, num_poses=1,
        min_pose_detection_confidence=0.5, min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5, output_segmentation_masks=False))

    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print('cannot open', path, file=sys.stderr)
        return None, None, None
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frames, times, conf = [], [], []
    i = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        if stride > 1 and (i % stride):
            i += 1
            continue
        t = i / fps
        i += 1
        rgb = cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)
        res = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(t * 1000))
        if not res.pose_world_landmarks:
            continue
        p = res.pose_world_landmarks[0]
        w = np.array([[q.x, q.y, q.z] for q in p], dtype=float)
        w[:, 1] *= -1.0
        w[:, 2] *= -1.0
        frames.append(w)
        times.append(t)
        conf.append(float(np.mean([getattr(q, 'visibility', 1.0) for q in p])))
    cap.release()
    lm.close()
    return frames, np.array(times), np.array(conf)


def motion_energy(frames):
    """Per-frame speed of the whole body. A move is a HUMP in this: still, burst, still."""
    e = np.zeros(len(frames))
    for i in range(1, len(frames)):
        e[i] = float(np.mean(np.linalg.norm(frames[i] - frames[i - 1], axis=1)))
    # a light blur so a single dropped frame does not read as a boundary
    if len(e) > 5:
        k = np.ones(5) / 5.0
        e = np.convolve(np.pad(e, (2, 2), mode='edge'), k, mode='same')[2:-2]
    return e


def segment(times, energy, min_len, max_len, quiet_frac=0.35):
    """Cut at the quiet troughs between bursts.

    The threshold is RELATIVE to this video's own energy distribution, not absolute — a reel of slow
    grapples and a reel of fast strikes have completely different absolute speeds, and a fixed
    threshold would find every move in one and none in the other.
    """
    if len(energy) < 8:
        return []
    hi = float(np.percentile(energy, 75))
    lo = float(np.percentile(energy, 25))
    if hi - lo < 1e-6:
        return []
    thr = lo + (hi - lo) * quiet_frac

    active = energy > thr
    runs, start = [], None
    for i, a in enumerate(active):
        if a and start is None:
            start = i
        elif not a and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(active) - 1))

    out = []
    for (a, b) in runs:
        # widen slightly into the quiet on both sides: a move's anticipation and its settle are part
        # of the move, and cutting them off is what makes a clip look like it starts mid-air
        a = max(0, a - 3)
        b = min(len(times) - 1, b + 4)
        dur = times[b] - times[a]
        if dur < min_len:
            continue
        if dur > max_len:
            # one long run is usually several moves run together; split it at its own quietest points
            span = b - a
            parts = int(math.ceil(dur / max_len))
            step = span // parts
            for k in range(parts):
                aa = a + k * step
                bb = min(b, aa + step)
                if times[bb] - times[aa] >= min_len:
                    out.append((aa, bb))
            continue
        out.append((a, b))
    return out


def classify(frames, times, a, b):
    """What did the body DO? Named from the motion, never from a filename.

    Deliberately the same axes the combat mapper already uses — limb, height, trajectory — so a
    harvested clip drops into the existing move tables without a second vocabulary.
    """
    import video_to_clip as v2c
    seq = frames[a:b + 1]
    if len(seq) < 3:
        return None
    pts0 = v2c.derive_points(seq[0])
    h = float(np.linalg.norm(pts0['head'] - pts0['pelvis'])) or 1.0

    pel = np.array([v2c.derive_points(f)['pelvis'] for f in seq])
    head = np.array([v2c.derive_points(f)['head'] for f in seq])
    lwr = np.array([v2c.derive_points(f)['l_wr'] for f in seq])
    rwr = np.array([v2c.derive_points(f)['r_wr'] for f in seq])
    lank = np.array([v2c.derive_points(f)['l_ank'] for f in seq])
    rank = np.array([v2c.derive_points(f)['r_ank'] for f in seq])

    # how much did each limb travel, normalised by the performer's own height
    d = lambda arr: float(np.sum(np.linalg.norm(np.diff(arr, axis=0), axis=1))) / h
    arm = max(d(lwr), d(rwr))
    leg = max(d(lank), d(rank))
    limb = 'ARM' if arm > leg * 1.25 else ('LEG' if leg > arm * 1.25 else 'BODY')

    # vertical excursion of the hips — a lift, a drop, or level
    pelY = pel[:, 1] / h
    rise = float(np.max(pelY) - pelY[0])
    fall = float(pelY[0] - np.min(pelY))
    if rise > 0.22:
        vert = 'LIFT'
    elif fall > 0.22:
        vert = 'DROP'
    else:
        vert = 'LEVEL'

    # where the working hand ends up relative to the head/chest — the height read
    wr = lwr if d(lwr) >= d(rwr) else rwr
    endY = float((wr[-1][1] - pel[-1][1]) / h)
    height = 'HIGH' if endY > 0.55 else ('LOW' if endY < 0.15 else 'MID')

    # did the body TURN? a spin reads completely differently from a straight-line move
    fwd = np.array([v2c.derive_points(f)['l_sh'] - v2c.derive_points(f)['r_sh'] for f in seq])
    fwd = fwd / (np.linalg.norm(fwd, axis=1, keepdims=True) + 1e-9)
    turn = float(np.degrees(math.acos(max(-1.0, min(1.0, float(np.dot(fwd[0], fwd[-1])))))))

    kind = 'STRIKE'
    if vert == 'LIFT':
        kind = 'LIFT'
    elif vert == 'DROP' and limb == 'BODY':
        kind = 'SLAM'
    elif limb == 'LEG' and height != 'LOW':
        kind = 'KICK'
    elif turn > 70:
        kind = 'SPIN'

    return {'kind': kind, 'limb': limb, 'height': height, 'vert': vert,
            'turn': round(turn, 1), 'armTravel': round(arm, 3), 'legTravel': round(leg, 3),
            'dur': round(float(times[b] - times[a]), 3)}


def write_clip(key, clip, extra=None):
    os.makedirs(CLIPS, exist_ok=True)
    text = json.dumps(clip)
    with open(os.path.join(CLIPS, key + '.json'), 'w') as fh:
        fh.write(text)
    idx_p = os.path.join(CLIPS, 'index.json')
    idx = {}
    if os.path.exists(idx_p):
        try:
            idx = json.load(open(idx_p))
        except Exception:
            idx = {}
    e = {'file': key + '.json', 'bytes': len(text), 'dur': clip.get('dur'),
         'keys': len(clip.get('keys', []))}
    if extra:
        e.update(extra)
    idx[key] = e
    with open(idx_p, 'w') as fh:
        json.dump(idx, fh, indent=1)
    return len(text)


def do_segment(path, args):
    import video_to_clip as v2c
    print('reading %s' % os.path.basename(path))
    frames, times, conf = landmark_track(path, args.stride)
    if not frames:
        print('  no detectable person in this video')
        return 1
    print('  %d frames with a person, %.1fs of usable footage, mean visibility %.2f'
          % (len(frames), times[-1] - times[0] if len(times) > 1 else 0, float(np.mean(conf))))

    energy = motion_energy(frames)
    segs = segment(times, energy, args.min_len, args.max_len)
    print('  %d move-shaped segment(s) found' % len(segs))
    if not segs:
        print('  (nothing crossed the motion threshold — try --min-len lower, or the subject barely moved)')
        return 1

    written, rejected = 0, 0
    counts = {}
    for (a, b) in segs[:args.max_clips]:
        cls = classify(frames, times, a, b)
        if not cls:
            continue
        seq = frames[a:b + 1]
        cseq = conf[a:b + 1]
        if float(np.mean(cseq)) < args.min_conf:
            rejected += 1
            continue
        clip = v2c_clip_from_frames(seq, float(times[b] - times[a]), args.keys)
        if clip is None:
            rejected += 1
            continue
        # NAME IT FROM WHAT IT IS. A counter per class keeps names stable and collision-free, and the
        # class tags are the same axes the combat mapper matches on.
        stem = args.prefix or cls['kind']
        counts[stem] = counts.get(stem, 0) + 1
        key = ('%s_%s_%s_%02d' % (stem, cls['limb'], cls['height'], counts[stem]))
        key = key.upper().replace(' ', '_')
        n = write_clip(key, clip, {'src': os.path.basename(path), 'via': 'harvest/segment',
                                   'class': cls, 't0': round(float(times[a]), 2)})
        written += 1
        print('    %-34s %5.2fs  %-6s %-4s %-4s %-5s turn %5.1f  %.0f KB'
              % (key, cls['dur'], cls['kind'], cls['limb'], cls['height'], cls['vert'],
                 cls['turn'], n / 1024))

    print('\n  %d clip(s) written, %d rejected on confidence' % (written, rejected))
    if written:
        print('  they are live immediately — loadClipFor reads assets/moves/clips/<KEY>.json')
        print('  next: node tools/mocap/map_combat_moves.cjs   (bind them to the combat tables)')
    return 0 if written else 1


def v2c_clip_from_frames(seq, dur, nkeys):
    """Reuse video_to_clip's retarget on an already-extracted landmark sequence."""
    import video_to_clip as v2c
    if len(seq) < 3:
        return None
    seq = v2c.smooth(list(seq), 5)
    rest_pts = v2c.derive_points(np.mean(np.stack(seq[:max(1, min(5, len(seq)))]), axis=0))
    rest_dirs = {}
    for name, parent, fallback in v2c.BONES:
        s = v2c.SEGMENTS.get(name)
        if not s:
            rest_dirs[name] = fallback
            continue
        a, b = rest_pts.get(s[0]), rest_pts.get(s[1])
        if a is None or b is None:
            rest_dirs[name] = fallback
            continue
        d = b - a
        n = np.linalg.norm(d)
        rest_dirs[name] = (d / n) if n > 1e-6 else np.array(fallback, dtype=float)

    keys = []
    dur = max(0.2, dur)
    for k in range(nkeys):
        u = k / (nkeys - 1) if nkeys > 1 else 0.0
        fi = u * (len(seq) - 1)
        i0 = int(math.floor(fi)); i1 = min(len(seq) - 1, i0 + 1); al = fi - i0
        w = seq[i0] * (1 - al) + seq[i1] * al
        pts = v2c.derive_points(w)
        h = np.linalg.norm(pts['head'] - pts['pelvis'])
        s = (0.80 / h) if h > 1e-6 else 1.0
        pose = {}
        for jn, pk in v2c.POSE_JOINTS.items():
            p = pts.get(pk)
            if p is None:
                continue
            q = (p - pts['pelvis']) * s
            pose[jn] = [round(float(q[0]), 4), round(float(q[1]), 4), round(float(q[2]), 4)]
        keys.append({'t': round(u * dur, 4), 'pose': pose,
                     'bones': v2c.build_frame(pts, rest_dirs)})
    bones = set()
    for k in keys:
        bones.update(k.get('bones', {}).keys())
    if len(bones) < 10:
        return None
    return {'dur': round(dur, 4), 'keys': keys}


# ══════════════════════════════════════════════════════════════════════════════════════════════════
# VARIANTS: one capture, a family — no camera involved
# ══════════════════════════════════════════════════════════════════════════════════════════════════
MIRROR_JOINT = {'shL': 'shR', 'elL': 'elR', 'haL': 'haR', 'hipL': 'hipR', 'knL': 'knR',
                'ftL': 'ftR', 'clavL': 'clavR'}
MIRROR_JOINT.update({v: k for k, v in list(MIRROR_JOINT.items())})


def mirror_bone_name(n):
    if 'Left' in n:
        return n.replace('Left', 'Right')
    if 'Right' in n:
        return n.replace('Right', 'Left')
    return n


def var_mirror(clip):
    """Left-handed version. Free, exact, and doubles every capture.

    Mirroring across the sagittal plane means negating X on positions, and negating the Y and Z
    components of a rotation (an XYZ Euler mirrored in X keeps rx and flips ry, rz).
    """
    out = {'dur': clip['dur'], 'keys': []}
    for k in clip['keys']:
        nk = {'t': k['t']}
        if 'pose' in k:
            p = {}
            for j, v in k['pose'].items():
                tj = MIRROR_JOINT.get(j, j)
                p[tj] = [round(-v[0], 4), v[1], v[2]]
            nk['pose'] = p
        if 'bones' in k:
            bb = {}
            for b, r in k['bones'].items():
                nb = dict(r)
                if 'ry' in nb:
                    nb['ry'] = round(-nb['ry'], 4)
                if 'rz' in nb:
                    nb['rz'] = round(-nb['rz'], 4)
                if 'tx' in nb:
                    nb['tx'] = round(-nb['tx'], 4)
                bb[mirror_bone_name(b)] = nb
            nk['bones'] = bb
        out['keys'].append(nk)
    return out


def resample(clip, curve, dur_scale=1.0):
    """Retime along `curve`, a function mapping output phase 0..1 to input phase 0..1.

    THIS is what separates a "suplex" from a "snap suplex" — identical pose path, different timing.
    An ease-in curve holds the setup and then rips through the delivery; that reads as snap.
    """
    keys = clip['keys']
    dur = clip['dur'] * dur_scale
    n = len(keys)
    out = {'dur': round(dur, 4), 'keys': []}
    for i in range(n):
        u = i / (n - 1) if n > 1 else 0.0
        src = max(0.0, min(1.0, curve(u))) * (n - 1)
        i0 = int(math.floor(src)); i1 = min(n - 1, i0 + 1); a = src - i0
        k0, k1 = keys[i0], keys[i1]
        nk = {'t': round(u * dur, 4)}
        if 'pose' in k0:
            p = {}
            for j, v in k0['pose'].items():
                w = (k1.get('pose', {}) or {}).get(j, v)
                p[j] = [round(v[x] * (1 - a) + w[x] * a, 4) for x in range(3)]
            nk['pose'] = p
        if 'bones' in k0:
            bb = {}
            for b, r in k0['bones'].items():
                s = (k1.get('bones', {}) or {}).get(b, r)
                m = {}
                for f in ('rx', 'ry', 'rz', 'tx', 'ty', 'tz'):
                    if f in r or f in s:
                        m[f] = round(r.get(f, 0) * (1 - a) + s.get(f, 0) * a, 4)
                if m:
                    bb[b] = m
            nk['bones'] = bb
        out['keys'].append(nk)
    return out


def var_amplitude(clip, scale, joints=None):
    """Scale how FAR the move goes without changing its timing.

    A kneeling powerbomb is a powerbomb whose lift amplitude is cut — the shape and the rhythm are the
    same, the height is not. Rotations scale toward rest; positions scale toward the pelvis.
    """
    out = {'dur': clip['dur'], 'keys': []}
    for k in clip['keys']:
        nk = {'t': k['t']}
        if 'pose' in k:
            p = {}
            for j, v in k['pose'].items():
                if joints and j not in joints:
                    p[j] = v
                    continue
                p[j] = [round(v[0], 4), round(v[1] * scale, 4), round(v[2], 4)]
            nk['pose'] = p
        if 'bones' in k:
            bb = {}
            for b, r in k['bones'].items():
                m = {}
                for f, val in r.items():
                    m[f] = round(val * scale, 4) if f in ('rx', 'ry', 'rz') else val
                bb[b] = m
            nk['bones'] = bb
        out['keys'].append(nk)
    return out


def var_splice(a, b, at=0.5):
    """Setup from A, delivery from B, cross-faded at the seam.

    This is how a RUNNING variant comes for free: take the run-up half of a running strike and the
    delivery half of the move you want delivered off it. The cross-fade window is what stops the seam
    reading as a pop.
    """
    n = min(len(a['keys']), len(b['keys']))
    if n < 4:
        return None
    dur = (a['dur'] + b['dur']) * 0.5
    out = {'dur': round(dur, 4), 'keys': []}
    fade = max(1, n // 6)
    cut = int(n * at)
    for i in range(n):
        ka, kb = a['keys'][int(i * (len(a['keys']) - 1) / (n - 1))], b['keys'][int(i * (len(b['keys']) - 1) / (n - 1))]
        if i < cut - fade:
            w = 0.0
        elif i > cut + fade:
            w = 1.0
        else:
            w = (i - (cut - fade)) / float(2 * fade)
        nk = {'t': round(i / (n - 1) * dur, 4)}
        pa, pb = ka.get('pose', {}), kb.get('pose', {})
        p = {}
        for j in set(list(pa.keys()) + list(pb.keys())):
            va, vb = pa.get(j), pb.get(j)
            if va is None:
                p[j] = vb
            elif vb is None:
                p[j] = va
            else:
                p[j] = [round(va[x] * (1 - w) + vb[x] * w, 4) for x in range(3)]
        nk['pose'] = p
        ba, bbn = ka.get('bones', {}), kb.get('bones', {})
        bb = {}
        for bn in set(list(ba.keys()) + list(bbn.keys())):
            ra, rb = ba.get(bn, {}), bbn.get(bn, {})
            m = {}
            for f in ('rx', 'ry', 'rz', 'tx', 'ty', 'tz'):
                if f in ra or f in rb:
                    m[f] = round(ra.get(f, 0) * (1 - w) + rb.get(f, 0) * w, 4)
            if m:
                bb[bn] = m
        nk['bones'] = bb
        out['keys'].append(nk)
    return out


# the families, as recipes rather than captures. Each entry is (suffix, builder).
EASE_SNAP = lambda u: u * u * (3 - 2 * u) ** 0.5 if u < 1 else 1.0
FAMILY = {
    'MIRROR':   lambda c, all_: var_mirror(c),
    'SNAP':     lambda c, all_: resample(c, lambda u: u ** 2.2, 0.72),
    'SLOW':     lambda c, all_: resample(c, lambda u: u ** 0.75, 1.35),
    'KNEELING': lambda c, all_: var_amplitude(c, 0.62),
    'SITOUT':   lambda c, all_: var_amplitude(resample(c, lambda u: u ** 1.4, 0.9), 0.80),
    'HARD':     lambda c, all_: var_amplitude(resample(c, lambda u: u ** 2.6, 0.62), 1.12),
    'DELAYED':  lambda c, all_: resample(c, lambda u: (u ** 3.0) if u < 0.8 else u, 1.5),
}


def load_clip(key):
    p = os.path.join(CLIPS, key + '.json')
    if not os.path.exists(p):
        return None
    try:
        return json.load(open(p))
    except Exception:
        return None


def do_variants(keys, family, args):
    made = 0
    skipped_same = 0
    for key in keys:
        base = load_clip(key)
        if not base:
            print('  no clip named %s' % key)
            continue
        print('%s  (%d keys, %.2fs)' % (key, len(base['keys']), base['dur']))
        for suf in family:
            fn = FAMILY.get(suf.upper())
            if not fn:
                print('    unknown variant %s — known: %s' % (suf, ', '.join(FAMILY)))
                continue
            nk = key + '_' + suf.upper()
            if os.path.exists(os.path.join(CLIPS, nk + '.json')) and not args.force:
                print('    %-32s exists (--force to rebuild)' % nk)
                continue
            try:
                v = fn(base, None)
            except Exception as e:
                print('    %-32s FAILED %s' % (nk, str(e)[:60]))
                continue
            if not v or not v.get('keys'):
                continue
            # THE TEST: keep it only if it reads as a different move. Reported either way so the
            # numbers are visible rather than a silent policy.
            mean_d, peak_d = divergence(base, v)
            dt = abs((v.get('dur') or 0) - (base.get('dur') or 0))
            distinct = (mean_d >= args.min_diff) or (peak_d >= args.min_diff * 3) or (dt >= 0.30)
            if not distinct and not args.keep_all:
                print('    %-32s SAME  mean %.3f peak %.3f dt %.2fs — not a new move'
                      % (nk, mean_d, peak_d, dt))
                skipped_same += 1
                continue
            n = write_clip(nk, v, {'derivedFrom': key, 'variant': suf.upper(),
                                   'via': 'harvest/variants', 'diffMean': round(mean_d, 4),
                                   'diffPeak': round(peak_d, 4), 'durDelta': round(dt, 3)})
            made += 1
            print('    %-32s %.2fs  mean %.3f peak %.3f dt %.2fs  %.0f KB'
                  % (nk, v['dur'], mean_d, peak_d, dt, n / 1024))
    print('\n%d variant(s) kept as distinct moves, %d dropped as visually identical' % (made, skipped_same))
    if made:
        print('divergence is measured at the same ABSOLUTE time, not the same phase — a retimed')
        print('variant has the same pose path and only differs in WHEN the body is where it is,')
        print('which is exactly what a viewer sees.')
    return 0 if made else 1




# ══════════════════════════════════════════════════════════════════════════════════════════════════
# DIVERGENCE — the owner's test: "especially if they actually look different"
# ══════════════════════════════════════════════════════════════════════════════════════════════════
def sample_pose(clip, t):
    """Pose at an ABSOLUTE time in seconds, clamped at the ends."""
    keys = clip.get('keys') or []
    if not keys:
        return {}
    if t <= keys[0]['t']:
        return keys[0].get('pose', {})
    if t >= keys[-1]['t']:
        return keys[-1].get('pose', {})
    for i in range(1, len(keys)):
        if keys[i]['t'] >= t:
            k0, k1 = keys[i - 1], keys[i]
            span = (k1['t'] - k0['t']) or 1e-6
            a = (t - k0['t']) / span
            p0, p1 = k0.get('pose', {}), k1.get('pose', {})
            out = {}
            for j in set(list(p0.keys()) + list(p1.keys())):
                v0, v1 = p0.get(j), p1.get(j)
                if v0 is None:
                    out[j] = v1
                elif v1 is None:
                    out[j] = v0
                else:
                    out[j] = [v0[x] * (1 - a) + v1[x] * a for x in range(3)]
            return out
    return keys[-1].get('pose', {})


def divergence(base, var):
    """How different does this READ on screen, in body-heights.

    Sampled at the same ABSOLUTE TIME, not the same normalised phase. That distinction is the whole
    point: a retimed variant (SNAP, HARD, SLOW) has an IDENTICAL pose path, so phase-aligned sampling
    would call it a duplicate. What a viewer actually sees is where the body is at a given moment, and
    on that measure a snap version diverges hard — it is already finishing while the base is still
    winding up.

    Returns (mean, peak) mean/peak per-joint displacement, in units where the rig is ~1.8 tall.
    """
    dur = max(base.get('dur', 1), var.get('dur', 1))
    N = 24
    means, peaks = [], []
    for i in range(N):
        t = dur * i / (N - 1)
        a, b = sample_pose(base, t), sample_pose(var, t)
        shared = [j for j in a if j in b]
        if not shared:
            continue
        d = [math.sqrt(sum((a[j][x] - b[j][x]) ** 2 for x in range(3))) for j in shared]
        means.append(sum(d) / len(d))
        peaks.append(max(d))
    if not means:
        return 0.0, 0.0
    return sum(means) / len(means), max(peaks)


# ══════════════════════════════════════════════════════════════════════════════════════════════════
def do_plan():
    print("""WHAT NOT TO CAPTURE, and what to do instead
===========================================================================
Capturing these is work spent replacing something this engine already has.

  LOCOMOTION      walk / run / turn / stop / strafe
                  ALREADY PROCEDURAL. Fighter.walkPhase drives a full stride with foot-plant IK —
                  measured 36 distinct leg poses over 50 frames, with the stride length scaling off
                  the same run multiplier as move2D. It was invisible only because the _nativePose
                  gate was switching skeletal animation off while walking, which is now fixed.
                  DO: tune LOCO.footPlant.stride and the gait rate per style. Do not capture.

  GET-UPS         face-up / face-down / rope-assisted / kip-up
                  STATE MACHINE with pose math (state 'getup'). A capture would have to match the
                  engine's own timing to the frame or the body teleports at the handoff.
                  DO: author 3-4 keyed poses per get-up in the move studio. Minutes, not a shoot.

  CLIMBING        turnbuckle mid / top / apron / perch
                  Fighter.startClimb already runs the tier machine ('mid' = second rope). The pose
                  at each tier is a HOLD, not a motion — one key each.

  ZONING          ring <-> apron <-> floor transitions
                  These are Y-baseline moves through ZONE_Y with smoothing, not animations. A clip
                  here would fight the interpolation that stops the waist-deep clipping.

  IDLES / STANCES per-style guard, breathing, weight shift
                  Procedural: GUARD_STYLES gait + the idle walkPhase weight shift. A captured idle
                  loop is 100 KB to replace two sine waves.

CAPTURE ONLY WHAT IS IRREDUCIBLE — the moves whose shape you cannot describe with a curve:
  * a signature finisher's exact arc          (F5, the powerbombs you sent)
  * a strong-strike combo's contact rhythm    (one animation, several contacts)
  * anything with a partner's weight in it    (lifts, carries, throws)

AND MULTIPLY IT:
  --segment    one reel -> many clips, cut and classified automatically
  --variants   one capture -> MIRROR / SNAP / SLOW / KNEELING / SITOUT / HARD / DELAYED
               a 12-move capture session becomes ~96 clips before anyone opens an editor
===========================================================================""")
    return 0


def main():
    ap = argparse.ArgumentParser(description='Harvest many clips from one video, and families from one clip.')
    ap.add_argument('videos', nargs='*')
    ap.add_argument('--segment', action='store_true', help='cut one video into many clips')
    ap.add_argument('--variants', help='derive a family from this clip key')
    ap.add_argument('--variants-all', action='store_true', help='derive families for every clip in the index')
    ap.add_argument('--family', default='MIRROR,SNAP,SLOW,KNEELING,SITOUT,HARD',
                    help='comma list: ' + ', '.join(FAMILY))
    ap.add_argument('--plan', action='store_true', help='what not to capture, and why')
    ap.add_argument('--prefix', help='name harvested clips with this stem instead of the detected kind')
    ap.add_argument('--min-len', type=float, default=0.45)
    ap.add_argument('--max-len', type=float, default=6.0)
    ap.add_argument('--min-conf', type=float, default=0.5)
    ap.add_argument('--max-clips', type=int, default=200)
    ap.add_argument('--keys', type=int, default=28)
    ap.add_argument('--stride', type=int, default=1, help='read every Nth frame (faster, coarser)')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--min-diff', type=float, default=0.06,
                    help='keep a variant only if it diverges this far from its base (body-height units)')
    ap.add_argument('--keep-all', action='store_true', help='bank every variant, even identical ones')
    args = ap.parse_args()

    if args.plan:
        return do_plan()

    fam = [s.strip() for s in args.family.split(',') if s.strip()]

    if args.variants_all:
        idx_p = os.path.join(CLIPS, 'index.json')
        if not os.path.exists(idx_p):
            print('no index.json — bake or capture something first', file=sys.stderr)
            return 2
        idx = json.load(open(idx_p))
        # only from ORIGINALS, never from a derived clip — deriving off a derivation compounds error
        # ONLY FROM REAL MOTION. A clip whose duration is a few hundredths of a second is a bind pose
        # or a rig file, not a capture — deriving a "snap" version of a static pose produces 90 KB of
        # nothing. Found this by shipping it: CH24_NONPBR / CH06_NONPBR / CH44_NONPBR are 0.03s.
        MIN_DUR = args.min_len
        keys, thin = [], []
        for k, v in idx.items():
            if isinstance(v, dict) and v.get('derivedFrom'):
                continue                      # never derive off a derivation — the error compounds
            d = (v or {}).get('dur')
            if d is None:
                c = load_clip(k)
                d = c.get('dur') if c else 0
            if (d or 0) < MIN_DUR:
                thin.append(k)
                continue
            keys.append(k)
        print('%d original clip(s) with real motion (>= %.2fs)' % (len(keys), MIN_DUR))
        if thin:
            print('%d skipped as static/rig files (under %.2fs): %s%s'
                  % (len(thin), MIN_DUR, ', '.join(thin[:6]), ' ...' if len(thin) > 6 else ''))
        return do_variants(keys, fam, args)

    if args.variants:
        return do_variants([args.variants.upper()], fam, args)

    if args.segment:
        if not args.videos:
            print('--segment needs a video', file=sys.stderr)
            return 2
        rc = 0
        for v in args.videos:
            rc |= do_segment(v, args)
        return rc

    ap.print_help()
    return 2


if __name__ == '__main__':
    sys.exit(main())
