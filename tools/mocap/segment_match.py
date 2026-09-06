#!/usr/bin/env python3
"""segment_match.py — cut a whole match into individual MOVES, automatically.

    # find the moves, write a review sheet, capture nothing yet
    python3 tools/mocap/segment_match.py match.mp4 --char TARZANIAN_DEVIL

    # find them and capture every one straight into clips
    python3 tools/mocap/segment_match.py match.mp4 --char TARZANIAN_DEVIL --capture

    # name the ones you recognise off the review sheet, capture only those
    python3 tools/mocap/segment_match.py match.mp4 --char TARZANIAN_DEVIL \
        --capture --names "3=WILD_SWANTON,7=TILT_RANA_CROSSBODY,11=JUNGLE_JUICE"

    # target a specific wrestler in a multi-man match by his gear colour
    python3 tools/mocap/segment_match.py match.mp4 --char X --target-colour "#b8863b"

WHY THIS EXISTS. Owner: "upgrade the scraper to cut the match into moves segments and track the
wrestler and moves per ai intelligence ... cuts properly where moves begin and end".

A scraped match is 11 minutes long. video_to_clip wants ONE move. Until now the only way across that
gap was a human scrubbing a timeline and typing --start/--end for every spot, which is the actual
bottleneck on building a per-character moveset — a single match holds 30-50 usable moves.

HOW IT DECIDES WHERE A MOVE IS — and this is measured signal, not a fixed timer:
  * MOTION ENERGY (reused from harvest.py, not reimplemented): a move is a HUMP — quiet, burst,
    quiet. The threshold is RELATIVE to this video's own distribution, because a mat-based match and
    a highspot reel have completely different absolute speeds.
  * INVERSION: the receiver's shoulder-to-hip axis flipping past horizontal. This is what separates
    a real move from two men running the ropes, and it is the single strongest wrestling-specific
    cue there is — slams, suplexes, ranas and drivers all inevert somebody.
  * AIRBORNE: hips rising well above their own running median, which catches dives and the swanton
    where nobody inverts much.
  * CONTACT: the two bodies closing to inside a torso-width, which rejects a lone wrestler climbing
    or posing.
A candidate needs the energy hump AND at least one of inversion / airborne / hard contact, which is
what stops it cutting on every walk across the ring.

IT ALWAYS PRODUCES A REVIEW SHEET. Owner LAW is SEE IT before banking: every candidate gets a
6-frame strip written to a contact sheet with its index and timestamps, so a human can name the ones
worth keeping in one look instead of scrubbing. Autonomous capture is available (--capture with no
--names) and is honest about being unlabelled: clips land as <CHAR>_SEG04 etc, to be renamed once
looked at. Nothing is deleted — low-scoring candidates are still written to the JSON and flagged.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)

import verify_capture as VC          # the proven multi-person tracker
import harvest                        # motion_energy + relative-threshold segmentation


def to_xy(pose):
    """VC tracks hold landmark objects (.x/.y), not arrays. Convert ONCE, here, so every signal
    below is plain numpy. Doing this per-signal is how the first version threw
    'float() argument must be ... not _LM'."""
    if pose is None:
        return None
    return np.array([[p.x, p.y] for p in pose], dtype=float)


def torso_axis(frame):
    """Angle of the shoulder->hip axis from vertical, in degrees. 0 upright, 180 fully inverted."""
    sh = (frame[11] + frame[12]) / 2.0
    hp = (frame[23] + frame[24]) / 2.0
    v = sh - hp
    n = float(np.linalg.norm(v[:2]))
    if n < 1e-6:
        return 0.0
    # image y grows downward, so an upright body has shoulders ABOVE hips => v[1] negative
    return float(np.degrees(np.arccos(max(-1.0, min(1.0, -v[1] / n)))))


def hip_height(frame):
    return float((frame[23][1] + frame[24][1]) / 2.0)


def body_scale(frame):
    sh = (frame[11] + frame[12]) / 2.0
    hp = (frame[23] + frame[24]) / 2.0
    return max(1e-6, float(np.linalg.norm(sh - hp)))


def analyse_signals(dense, n):
    """Per-frame inversion / height / scale for one densified track."""
    inv = np.zeros(n); hip = np.zeros(n); sc = np.ones(n)
    for i in range(n):
        f = dense[i]
        if f is None:
            inv[i] = inv[i - 1] if i else 0.0
            hip[i] = hip[i - 1] if i else 0.0
            sc[i] = sc[i - 1] if i else 1.0
            continue
        inv[i] = torso_axis(f); hip[i] = hip_height(f); sc[i] = body_scale(f)
    return inv, hip, sc


def smooth(a, k=7):
    if len(a) < k + 2:
        return a
    ker = np.ones(k) / float(k)
    return np.convolve(np.pad(a, (k // 2, k // 2), mode='edge'), ker, mode='same')[k // 2:-(k // 2)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('--char', required=True)
    ap.add_argument('--capture', action='store_true')
    ap.add_argument('--names', default='', help='"3=WILD_SWANTON,7=TILT_RANA" — index=CLIP_NAME')
    ap.add_argument('--min-len', type=float, default=0.9, help='shortest move, seconds')
    ap.add_argument('--max-len', type=float, default=6.0)
    ap.add_argument('--pad', type=float, default=0.45, help='seconds kept either side of the burst')
    ap.add_argument('--people', type=int, default=2)
    ap.add_argument('--max-segments', type=int, default=60)
    ap.add_argument('--out', default=None)
    a = ap.parse_args()

    char = ''.join(c if c.isalnum() else '_' for c in a.char).upper().strip('_')
    outdir = a.out or os.path.join(ROOT, 'assets', 'mocap', 'segments', char)
    os.makedirs(outdir, exist_ok=True)

    print('tracking %s ...' % os.path.basename(a.video))
    fps, raw, tracks, wtracks = VC.track(a.video, keep_frames=False, people=a.people)
    n = max(len(t) for t in tracks) if tracks else 0
    if not tracks or n < 10:
        print('no usable tracks'); sys.exit(1)
    print('  %d track(s), %d frames, %.2f fps' % (len(tracks), n, fps))

    dense = [[to_xy(f) for f in VC.densify(t, n)] for t in tracks]
    # ENERGY off the best-covered body (the camera follows the action, so that is the working pair)
    order = sorted(range(len(dense)), key=lambda i: -sum(1 for f in dense[i] if f is not None))
    main_i = order[0]
    ref = next((f for f in dense[main_i] if f is not None), None)
    if ref is None:
        print('main track has no usable frames'); sys.exit(1)
    last = ref
    seq = []
    for f in dense[main_i]:
        if f is not None:
            last = f
        seq.append(last)            # hold the last good pose rather than injecting zeros, which
    seq = np.array(seq, dtype=float)  # would read as a huge false motion spike on every gap
    energy = smooth(harvest.motion_energy(seq))

    inv = [None] * len(dense); hip = [None] * len(dense); sc = [None] * len(dense)
    for i in range(len(dense)):
        inv[i], hip[i], sc[i] = analyse_signals(dense[i], n)
        inv[i] = smooth(inv[i]); hip[i] = smooth(hip[i])

    # relative thresholds, same philosophy as harvest.segment
    thr_e = np.percentile(energy, 25) + (np.percentile(energy, 80) - np.percentile(energy, 25)) * 0.35
    active = energy > thr_e
    runs, start = [], None
    for i, act in enumerate(active):
        if act and start is None:
            start = i
        elif not act and start is not None:
            runs.append((start, i)); start = None
    if start is not None:
        runs.append((start, len(active)))

    minf, maxf = int(a.min_len * fps), int(a.max_len * fps)
    padf = int(a.pad * fps)
    cands = []
    for (s, e) in runs:
        if e - s < minf:
            continue
        for cs in range(s, e, maxf):
            ce = min(cs + maxf, e)
            if ce - cs < minf:
                continue
            s2, e2 = max(0, cs - padf), min(n - 1, ce + padf)
            # wrestling-specific evidence inside the window
            invmax = max(float(np.max(v[s2:e2])) for v in inv)
            invswing = max(float(np.max(v[s2:e2]) - np.min(v[s2:e2])) for v in inv)
            rise = 0.0
            for h, k in zip(hip, sc):
                med = float(np.median(h)) or 1.0
                rise = max(rise, float((med - np.min(h[s2:e2])) / max(np.median(k), 1e-6)))
            contact = 0.0
            if len(dense) > 1:
                d = []
                for i in range(s2, e2):
                    f0, f1 = dense[0][i], dense[1][i]
                    if f0 is None or f1 is None:
                        continue
                    c0 = (f0[23] + f0[24]) / 2.0; c1 = (f1[23] + f1[24]) / 2.0
                    d.append(float(np.linalg.norm(c0 - c1)) / max(body_scale(f0), 1e-6))
                if d:
                    contact = 1.0 if min(d) < 2.2 else 0.0
            inverted = invmax > 105.0 or invswing > 55.0
            airborne = rise > 0.55
            score = (float(np.mean(energy[s2:e2])) / max(thr_e, 1e-9)) \
                    + (1.2 if inverted else 0) + (0.9 if airborne else 0) + (0.5 * contact)
            cands.append({
                'start': round(s2 / fps, 2), 'end': round(e2 / fps, 2),
                'dur': round((e2 - s2) / fps, 2),
                'inverted': bool(inverted), 'airborne': bool(airborne),
                'contact': bool(contact), 'invMax': round(invmax, 1),
                'invSwing': round(invswing, 1), 'rise': round(rise, 2),
                'score': round(score, 2),
                # a move needs the energy hump AND a wrestling cue; the rest are kept but flagged
                'isMove': bool(inverted or airborne or (contact and invswing > 30)),
            })

    cands.sort(key=lambda c: -c['score'])
    cands = cands[:a.max_segments]
    cands.sort(key=lambda c: c['start'])
    for i, c in enumerate(cands):
        c['idx'] = i

    moves = [c for c in cands if c['isMove']]
    print('  %d candidate window(s), %d look like MOVES' % (len(cands), len(moves)))
    for c in cands:
        print('   %2d  %6.2f-%6.2f  %.1fs  score %-5.2f %s%s%s%s'
              % (c['idx'], c['start'], c['end'], c['dur'], c['score'],
                 'INV ' if c['inverted'] else '', 'AIR ' if c['airborne'] else '',
                 'CON ' if c['contact'] else '', '' if c['isMove'] else '(low)'))

    man = {'video': os.path.abspath(a.video), 'char': char, 'fps': fps,
           'frames': n, 'segments': cands}
    mp = os.path.join(outdir, os.path.splitext(os.path.basename(a.video))[0] + '.segments.json')
    json.dump(man, open(mp, 'w'), indent=1)
    print('\nsegments -> %s' % mp)

    # ---- REVIEW SHEET: owner LAW is look at it before banking ----
    try:
        import cv2
        cap = cv2.VideoCapture(a.video)
        strips = []
        for c in cands[:24]:
            fr6 = []
            for t in np.linspace(c['start'], c['end'], 6):
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * fps))
                ok, fr = cap.read()
                if not ok:
                    continue
                fr = cv2.resize(fr, (240, int(fr.shape[0] * 240.0 / fr.shape[1])))
                fr6.append(fr)
            if len(fr6) < 6:
                continue
            h = min(f.shape[0] for f in fr6)
            strip = np.hstack([f[:h] for f in fr6])
            cv2.putText(strip, '#%d  %.1f-%.1fs  %s' % (c['idx'], c['start'], c['end'],
                        ('MOVE' if c['isMove'] else 'low')),
                        (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            strips.append(strip)
        cap.release()
        if strips:
            w = min(s.shape[1] for s in strips)
            sheet = np.vstack([s[:, :w] for s in strips])
            sp = os.path.join(outdir, os.path.splitext(os.path.basename(a.video))[0] + '.review.jpg')
            cv2.imwrite(sp, sheet)
            print('review sheet -> %s   (LOOK AT THIS, then name the ones worth keeping)' % sp)
    except Exception as e:
        print('review sheet skipped: %s' % str(e)[:90])

    # ---- capture ----
    if not a.capture:
        print('\n--capture to cut these into clips. --names "IDX=NAME,..." to label them.')
        return
    names = {}
    for pair in filter(None, a.names.split(',')):
        if '=' in pair:
            k, v = pair.split('=', 1)
            names[int(k.strip())] = ''.join(ch if ch.isalnum() else '_' for ch in v).upper().strip('_')
    todo = [c for c in cands if (c['idx'] in names) or (c['isMove'] and not names)]
    print('\ncapturing %d segment(s)...' % len(todo))
    for c in todo:
        nm = names.get(c['idx']) or ('%s_SEG%02d' % (char, c['idx']))
        cmd = [sys.executable, os.path.join(HERE, 'video_to_clip.py'), a.video,
               '--name', nm, '--two', '--start', str(c['start']), '--end', str(c['end'])]
        p = subprocess.run(cmd, capture_output=True, text=True)
        ok = 'banked' in (p.stdout or '')
        print('  #%-2d %-34s %s' % (c['idx'], nm, 'OK' if ok else 'FAILED'))
        for l in [x for x in (p.stdout or '').splitlines() if 'banked' in x or 'ERROR' in x][:2]:
            print('      ' + l.strip()[:120])
    print('\nRENDER what you kept:  python3 tools/mocap/render_clip.py <NAME>')


if __name__ == '__main__':
    main()
