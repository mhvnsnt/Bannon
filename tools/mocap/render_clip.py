#!/usr/bin/env python3
"""render_clip.py — DRAW a banked clip so a human can see what it actually does.

    python3 tools/mocap/render_clip.py BRAINBUSTER_VERTICAL_SHEER --out sheet.png
    python3 tools/mocap/render_clip.py KEY --out sheet.png --frames 10 --view side

WHY: every clip in this repo has been judged by numbers -- key count, bone count, visibility,
coverage. Numbers cannot tell you whether a generated move looks like the move you asked for, and
for text-to-motion that is the ONLY question that matters. The owner asked to see frames of the
generated brainbuster; there was no way to produce them.

Draws the 20-joint pose skeleton straight from the clip JSON, so it renders anything the engine can
play -- video capture, text generation or a baked FBX -- with no engine, no GPU and no browser.
"""
import argparse
import json
import os
import sys

import numpy as np

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
CLIPS = os.path.join(REPO, 'assets', 'moves', 'clips')

# the engine's own joint chain
LINKS = [
    ('pelvis', 'spineLow'), ('spineLow', 'spineMid'), ('spineMid', 'chest'),
    ('chest', 'neck'), ('neck', 'head'),
    ('chest', 'clavL'), ('clavL', 'shL'), ('shL', 'elL'), ('elL', 'haL'),
    ('chest', 'clavR'), ('clavR', 'shR'), ('shR', 'elR'), ('elR', 'haR'),
    ('pelvis', 'hipL'), ('hipL', 'knL'), ('knL', 'ftL'),
    ('pelvis', 'hipR'), ('hipR', 'knR'), ('knR', 'ftR'),
]
LEFT = {'clavL', 'shL', 'elL', 'haL', 'hipL', 'knL', 'ftL'}


def load(key):
    p = key if os.path.exists(key) else os.path.join(CLIPS, key + '.json')
    if not os.path.exists(p):
        print('no such clip: ' + key, file=sys.stderr)
        sys.exit(2)
    return json.load(open(p))


def render(clip, out, n=8, view='front', size=260):
    import cv2
    keys = clip.get('keys') or []
    if not keys:
        print('clip has no keyframes', file=sys.stderr)
        sys.exit(2)
    picks = np.linspace(0, len(keys) - 1, min(n, len(keys))).astype(int)

    # one shared scale across every frame, or the body appears to grow and shrink
    allp = []
    for k in keys:
        for v in (k.get('pose') or {}).values():
            allp.append(v)
    A = np.array(allp, dtype=float)
    if not len(A):
        print('clip has no pose data', file=sys.stderr)
        sys.exit(2)
    lo, hi = A.min(0), A.max(0)
    span = float(max(hi[0] - lo[0], hi[1] - lo[1], 1e-3))
    cx, cy = (hi[0] + lo[0]) / 2.0, (hi[1] + lo[1]) / 2.0

    def project(p):
        # x/y is the front view, z/y the side view. Y is up in the clip, down on screen.
        a = p[0] if view == 'front' else p[2]
        b = p[1]
        u = int(size / 2 + (a - cx) / span * size * 0.78)
        v = int(size / 2 - (b - cy) / span * size * 0.78)
        return (u, v)

    tiles = []
    for idx in picks:
        k = keys[idx]
        pose = k.get('pose') or {}
        img = np.full((size, size, 3), 18, dtype=np.uint8)
        # ground line at the lowest foot across the whole clip, so the drop reads
        gy = int(size / 2 - (lo[1] - cy) / span * size * 0.78)
        cv2.line(img, (0, gy), (size, gy), (60, 60, 70), 1)
        for a, b in LINKS:
            if a not in pose or b not in pose:
                continue
            col = (90, 200, 255) if b in LEFT else (120, 255, 140)
            cv2.line(img, project(pose[a]), project(pose[b]), col, 2)
        for jn, p in pose.items():
            cv2.circle(img, project(p), 2, (200, 200, 200), -1)
        if 'head' in pose:
            cv2.circle(img, project(pose['head']), 6, (255, 220, 120), 1)
        cv2.putText(img, '%.2fs' % float(k.get('t', 0)), (6, 16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 200), 1)
        tiles.append(img)

    per = 4
    rows = [np.hstack(tiles[i:i + per]) for i in range(0, len(tiles), per)]
    w = max(r.shape[1] for r in rows)
    rows = [cv2.copyMakeBorder(r, 0, 0, 0, w - r.shape[1], cv2.BORDER_CONSTANT, value=(18, 18, 18))
            for r in rows]
    cv2.imwrite(out, np.vstack(rows))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('key')
    ap.add_argument('--out', required=True)
    ap.add_argument('--frames', type=int, default=8)
    ap.add_argument('--view', choices=['front', 'side'], default='front')
    a = ap.parse_args()
    c = load(a.key)
    print('%s  %.2fs  %d keys' % (a.key, c.get('dur', 0), len(c.get('keys') or [])))
    print('  -> ' + render(c, a.out, a.frames, a.view))


if __name__ == '__main__':
    main()
