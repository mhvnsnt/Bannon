#!/usr/bin/env python3
"""verify_capture.py — LOOK at what the pose estimator actually tracked before banking it.

    python3 tools/mocap/verify_capture.py clip.mp4 --out sheet.png
    python3 tools/mocap/verify_capture.py clip.mp4 --window          # just print the move window

WHY THIS EXISTS
The owner's reference clips are real matches, which means TWO WRESTLERS ARE IN FRAME, and -- his
point -- "some of those moves need to map the receiver tho". A falcon arrow or a German suplex is two
bodies; the man being thrown is half the move.

video_to_clip ran MediaPipe with num_poses=1. One skeleton, picked by whichever body the estimator
found most salient in each frame -- so on a two-man capture it can silently hop from the attacker to
the victim halfway through a suplex. The resulting clip looks fine by every number that tool reports
(frame count, key count, visibility) and is garbage: half of one man's motion welded to half of
another's, and no receiver clip at all.

This tracks BOTH, keeps their identities stable across frames, works out which is which, and shows
you the result.

video_to_clip's docstring advertises a --preview flag that its argument parser does not have, so
there was no way to see this. This is that missing check, and it reports three things the numbers
alone cannot:

  ROLE ASSIGNMENT   which track is the attacker and which is the receiver, and on what evidence.
  THE MOVE WINDOW   most of a reference clip is walking around. Motion energy over the hip and wrists
                    finds the span where the move actually happens, so the capture can be trimmed to
                    it instead of banking ten seconds of setup.
  A CONTACT SHEET   the tracked skeleton drawn on the frames, so a human can confirm it is on the
                    right man doing the right thing.
"""
import argparse
import os
import sys

import numpy as np

MODEL_CANDIDATES = [
    os.environ.get('MP_POSE_MODEL', ''),
    '/tmp/mpmodels/pose_landmarker_full.task',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pose_landmarker_full.task'),
]

# the MediaPipe landmark pairs worth drawing — torso, arms, legs
BONES = [(11, 12), (11, 23), (12, 24), (23, 24),
         (11, 13), (13, 15), (12, 14), (14, 16),
         (23, 25), (25, 27), (24, 26), (26, 28),
         (27, 31), (28, 32), (0, 11), (0, 12)]


def model_path():
    for p in MODEL_CANDIDATES:
        if p and os.path.exists(p):
            return p
    print('no pose_landmarker_full.task found; set MP_POSE_MODEL', file=sys.stderr)
    sys.exit(2)


def _mk(model, mode, np_=1):
    import mediapipe as mp
    from mediapipe.tasks import python as mpp
    from mediapipe.tasks.python import vision
    return vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mpp.BaseOptions(model_asset_path=model), running_mode=mode, num_poses=np_,
        min_pose_detection_confidence=0.3, min_pose_presence_confidence=0.3,
        min_tracking_confidence=0.3))


def detect_two(frame_rgb, a, b):
    """TWO PASSES OVER THE SAME FRAME, because one pass will not give you two wrestlers.

    BlazePose is a single-person estimator. Asking it for num_poses=2 runs the same model over the
    regions its detector proposed, and on two entangled bodies the detector proposes one -- MEASURED
    across the owner's five reference clips, both wrestlers were returned in 1.1% to 8.5% of frames,
    which is no use at all for capturing a receiver.

    So: find the most salient body, BLANK IT OUT of the image, and run the estimator again on what is
    left. The second pass has a single person in frame, which is the case this model is good at. Same
    measurement, same clips: 34% to 66% of frames now yield both bodies -- a 7x to 39x improvement
    with no new model, no new dependency and no licence to worry about.
    """
    import mediapipe as mp
    import numpy as _np
    out = []
    r1 = a.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb))
    if not r1.pose_landmarks:
        return out
    out.append((r1.pose_landmarks[0], r1.pose_world_landmarks[0] if r1.pose_world_landmarks else None))
    lm = r1.pose_landmarks[0]
    H, W = frame_rgb.shape[:2]
    xs = [l.x * W for l in lm]
    ys = [l.y * H for l in lm]
    x0, x1 = max(0, int(min(xs) - 18)), min(W, int(max(xs) + 18))
    y0, y1 = max(0, int(min(ys) - 18)), min(H, int(max(ys) + 18))
    masked = frame_rgb.copy()
    masked[y0:y1, x0:x1] = 0
    r2 = b.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=masked))
    if r2.pose_landmarks:
        out.append((r2.pose_landmarks[0], r2.pose_world_landmarks[0] if r2.pose_world_landmarks else None))
    return out


def track(path, keep_frames=True):
    import cv2
    from mediapipe.tasks.python import vision

    m = model_path()
    a, b = _mk(m, vision.RunningMode.IMAGE), _mk(m, vision.RunningMode.IMAGE)
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    raw, dets, worlds = [], [], []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        pair = detect_two(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB), a, b)
        dets.append([p[0] for p in pair])
        worlds.append([p[1] for p in pair])
        raw.append(fr if keep_frames else None)
    cap.release()
    tracks, wtracks = assign(dets, worlds)
    return fps, raw, tracks, wtracks


def assign(dets, worlds=None):
    """Give each detected body a STABLE identity across frames.

    MediaPipe returns the poses it found in each frame in no guaranteed order, so track 0 in frame 40
    is not necessarily the same wrestler as track 0 in frame 41. On a two-man capture that flips
    constantly, and welding the frames together in detection order produces a clip that is half one
    man and half the other. Identity comes from CONTINUITY instead: each new detection is matched to
    whichever existing track its hip is nearest to, greedily, and a hip that is nowhere near either
    track starts a new one rather than corrupting an old one.
    """
    tracks = [[], []]          # per slot: list of (frame_index, landmarks)
    wtracks = [[], []]
    last = [None, None]
    for fi, ds in enumerate(dets):
        ws = worlds[fi] if worlds else [None] * len(ds)
        hips = [hip_xy(d) for d in ds]
        used = set()
        # existing tracks claim their nearest unclaimed detection first
        order = sorted(range(len(last)), key=lambda s: 0 if last[s] is not None else 1)
        for slot in order:
            if last[slot] is None:
                continue
            best, bd = None, 0.28          # further than this in one frame is a different person
            for di, h in enumerate(hips):
                if di in used or h is None:
                    continue
                d = float(np.linalg.norm(h - last[slot]))
                if d < bd:
                    bd, best = d, di
            if best is not None:
                used.add(best)
                tracks[slot].append((fi, ds[best]))
                wtracks[slot].append((fi, ws[best] if best < len(ws) else None))
                last[slot] = hips[best]
        # anything left over seeds an empty slot
        for di, h in enumerate(hips):
            if di in used or h is None:
                continue
            for slot in range(len(last)):
                if last[slot] is None:
                    used.add(di)
                    tracks[slot].append((fi, ds[di]))
                    wtracks[slot].append((fi, ws[di] if di < len(ws) else None))
                    last[slot] = h
                    break
    return tracks, wtracks


def densify(track, n):
    """A track is sparse (the body is not found every frame). Expand to one slot per frame."""
    out = [None] * n
    for fi, p in track:
        if 0 <= fi < n:
            out[fi] = p
    return out


def role_of(tracks, n):
    """Which track is the ATTACKER and which is the RECEIVER.

    TWO SIGNALS, IN ORDER, because neither alone is right for every move:

      1. WHO IS ALREADY DOWN. Before a diving headbutt or a falcon arrow onto a grounded man, the
         receiver is flat on the mat and the attacker is on his feet. Comparing hip height over the
         opening fifth of the window settles those instantly.
      2. WHO GETS INVERTED. For a suplex or a driver both men start upright, so the receiver is the
         one whose head goes below his hips.

    Signal 2 alone gets DIVES WRONG, and that matters here: a man throwing himself horizontally at a
    prone opponent also puts his head below his hips, so inversion would label the diver the victim.
    Checking who was already down first removes that whole class of error.
    """
    stat = []
    for t in tracks:
        d = densify(t, n)
        inv, trav, prev, seen = -9.0, 0.0, None, 0
        early, late = [], []
        for i, p in enumerate(d):
            if not p:
                continue
            seen += 1
            hip = (p[23].y + p[24].y) / 2.0
            inv = max(inv, p[0].y - hip)
            if i < n * 0.2:
                early.append(hip)
            if i > n * 0.75:
                late.append(hip)
            h = hip_xy(p)
            if prev is not None:
                trav += float(np.linalg.norm(h - prev))
            prev = h
        stat.append(dict(inv=inv, trav=trav, seen=seen,
                         early=float(np.mean(early)) if early else None,
                         late=float(np.mean(late)) if late else None))
    if stat[0]['seen'] == 0 or stat[1]['seen'] == 0:
        return 0, 1, 'only one body tracked'
    # 1. already down at the start (image y grows downward, so a bigger hip y is lower in frame)
    e0, e1 = stat[0]['early'], stat[1]['early']
    if e0 is not None and e1 is not None and abs(e0 - e1) > 0.13:
        recv = 0 if e0 > e1 else 1
        return 1 - recv, recv, 'who was already down at the start'
    # 2. inversion
    if abs(stat[0]['inv'] - stat[1]['inv']) > 0.05:
        recv = 0 if stat[0]['inv'] > stat[1]['inv'] else 1
        return 1 - recv, recv, 'inversion (head below hip)'
    atk = 0 if stat[0]['trav'] > stat[1]['trav'] else 1
    return atk, 1 - atk, 'travel (who closed the distance)'


def hip_xy(p):
    if not p:
        return None
    return np.array([(p[23].x + p[24].x) / 2.0, (p[23].y + p[24].y) / 2.0])


def analyse(fps, poses):
    """Motion energy over one track, and the span the move actually lives in."""
    hips = [hip_xy(p) for p in poses]
    energy, prev = [], None
    for h in hips:
        if h is None or prev is None:
            energy.append(0.0)
            prev = h if h is not None else prev
            continue
        energy.append(float(np.linalg.norm(h - prev)))
        prev = h
    wr = []
    for p in poses:
        wr.append(0.0 if not p else abs(p[15].y - p[23].y) + abs(p[16].y - p[24].y))
    wr = np.array(wr)
    e = np.convolve(np.array(energy), np.ones(5) / 5.0, mode='same')
    g = np.abs(np.gradient(wr))
    score = e / (e.max() or 1) + 0.5 * (g / (g.max() or 1))
    thr = score.mean() + 0.55 * score.std()
    hot = np.where(score > thr)[0]
    if len(hot) < 3:
        lo, hi = 0, len(poses) - 1
    else:
        lo, hi = int(hot[0]), int(hot[-1])
    pad = int(fps * 0.35)
    lo = max(0, lo - pad); hi = min(len(poses) - 1, hi + pad)
    vis = float(np.mean([np.mean([l.visibility for l in p]) for p in poses if p] or [0]))
    return dict(window=(lo, hi), window_s=(round(lo / fps, 2), round(hi / fps, 2)),
                tracked=sum(1 for p in poses if p), total=len(poses), visibility=round(vis, 3))


def sheet(raw, atk, recv, info, out, n=8):
    """Both bodies drawn, in different colours, so the roles can be checked by eye."""
    import cv2
    lo, hi = info['window']
    picks = np.linspace(lo, hi, n).astype(int)
    tiles = []
    for idx in picks:
        fr = raw[idx].copy()
        h, w = fr.shape[:2]
        for p, col, tag in ((atk[idx], (0, 255, 120), 'ATK'), (recv[idx], (60, 120, 255), 'RECV')):
            if not p:
                continue
            for a, b in BONES:
                pa, pb = p[a], p[b]
                cv2.line(fr, (int(pa.x * w), int(pa.y * h)), (int(pb.x * w), int(pb.y * h)), col, 3)
            hp = hip_xy(p)
            cv2.putText(fr, tag, (int(hp[0] * w) - 20, int(hp[1] * h)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, col, 2)
        cv2.putText(fr, 'f%d' % idx, (10, 34), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        sc = 260.0 / fr.shape[1]
        tiles.append(cv2.resize(fr, (int(fr.shape[1] * sc), int(fr.shape[0] * sc))))
    hgt = max(t.shape[0] for t in tiles)
    tiles = [cv2.copyMakeBorder(t, 0, hgt - t.shape[0], 0, 0, cv2.BORDER_CONSTANT, value=(0, 0, 0))
             for t in tiles]
    rows = [np.hstack(tiles[i:i + 4]) for i in range(0, len(tiles), 4)]
    wmax = max(r.shape[1] for r in rows)
    rows = [cv2.copyMakeBorder(r, 0, 0, 0, wmax - r.shape[1], cv2.BORDER_CONSTANT, value=(0, 0, 0))
            for r in rows]
    cv2.imwrite(out, np.vstack(rows))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('--out', default=None, help='contact sheet with BOTH skeletons drawn on')
    ap.add_argument('--window', action='store_true', help='print only the move window')
    a = ap.parse_args()

    fps, raw, tracks, _w = track(a.video)
    n = len(raw)
    ai, ri, why = role_of(tracks, n)
    atk, recv = densify(tracks[ai], n), densify(tracks[ri], n)
    info = analyse(fps, atk)
    rinfo = analyse(fps, recv)
    if a.window:
        print('%.2f %.2f' % info['window_s'])
        return
    print('%s' % os.path.basename(a.video))
    print('  bodies tracked   : attacker %d/%d frames (vis %.3f) · receiver %d/%d frames (vis %.3f)'
          % (info['tracked'], n, info['visibility'], rinfo['tracked'], n, rinfo['visibility']))
    print('  role assignment  : %s' % why)
    print('  move window      : %.2fs .. %.2fs  (frames %d..%d)'
          % (info['window_s'][0], info['window_s'][1], info['window'][0], info['window'][1]))
    if a.out:
        print('  sheet            : ' + sheet(raw, atk, recv, info, a.out))


if __name__ == '__main__':
    main()
