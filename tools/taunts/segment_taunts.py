#!/usr/bin/env python3
"""
segment_taunts.py — find taunt sections in a pose .npz by motion signature.

Usage:
  python3 segment_taunts.py poses/hardy_entrance.npz --out poses/hardy_entrance.seg.npz

Signatures (computed from MediaPipe world landmarks, y-up meters):
  crucifix   : both arms abducted >50deg and lateral for >=1.0s
  finger_guns: both elbows flexed <110deg, wrists above elbows, hands near
               chest/face height, for >=1.0s
  head_snap  : head angular velocity spike (hair-whip base)

Writes segments: list of (name, start_frame, end_frame, score). Also dumps
per-frame features for inspection.
"""
import argparse, os
import numpy as np

NOSE, L_SH, R_SH = 0, 11, 12
L_EL, R_EL, L_WR, R_WR = 13, 14, 15, 16
L_HIP, R_HIP = 23, 24

def ang(a, b):
    a = a / (np.linalg.norm(a, axis=-1, keepdims=True) + 1e-9)
    b = b / (np.linalg.norm(b, axis=-1, keepdims=True) + 1e-9)
    d = np.clip((a * b).sum(-1), -1, 1)
    return np.degrees(np.arccos(d))

def features(P):
    """P: (N,33,4) -> dict of (N,) feature arrays."""
    n = P.shape[0]
    out = {}
    def ok(*idx):
        return ~np.isnan(P[:, idx, 0]).any(axis=1) if isinstance(idx, tuple) else ~np.isnan(P[:, idx, 0])
    # arm abduction: angle(upper_arm, torso_down) per side
    for s, sh, el, hip in (("l", L_SH, L_EL, L_HIP), ("r", R_SH, R_EL, R_HIP)):
        ua = P[:, el, :3] - P[:, sh, :3]
        td = P[:, hip, :3] - P[:, sh, :3]
        out[f"abd_{s}"] = np.where(ok(sh, el, hip), ang(ua, td), np.nan)
        # lateral-ness: |arm . shoulder_axis|
        sax = P[:, R_SH, :3] - P[:, L_SH, :3]
        sax = sax / (np.linalg.norm(sax, axis=1, keepdims=True) + 1e-9)
        ua_n = ua / (np.linalg.norm(ua, axis=1, keepdims=True) + 1e-9)
        out[f"lat_{s}"] = np.where(ok(sh, el), np.abs((ua_n * sax).sum(1)), np.nan)
        # elbow flexion
        fa = P[:, el, :3] - P[:, [L_WR if s == "l" else R_WR][0], :3]
        out[f"elb_{s}"] = np.where(ok(sh, el), ang(ua, fa), np.nan)
        # wrist above elbow (y-up world)
        wr = P[:, L_WR if s == "l" else R_WR, :3]
        out[f"wr_up_{s}"] = np.where(ok(el), (P[:, el, 1] - wr[:, 1]), np.nan)
    # head angular velocity: nose relative to neck midpoint
    neck = (P[:, L_SH, :3] + P[:, R_SH, :3]) / 2
    hv = P[:, NOSE, :3] - neck
    hv_n = hv / (np.linalg.norm(hv, axis=1, keepdims=True) + 1e-9)
    d = np.clip((hv_n[:-1] * hv_n[1:]).sum(1), -1, 1)
    out["head_omega"] = np.concatenate([[0], np.degrees(np.arccos(d))])
    out["head_omega"] = np.where(ok(NOSE, L_SH, R_SH), out["head_omega"], np.nan)
    return out

def runs(mask, min_len):
    segs = []
    i = 0
    n = len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            if j - i >= min_len:
                segs.append((i, j))
            i = j
        else:
            i += 1
    return segs

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("npz")
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=float, default=10.0)
    args = ap.parse_args()
    d = np.load(args.npz)
    P = d["poses"].copy()
    # MediaPipe Tasks world landmarks are y-DOWN; negate to y-up (verified 2026-10-09).
    P[:, :, 1] *= -1.0
    t = d["t"]
    F = features(P)
    fps = float(d["sample_fps"]) if "sample_fps" in d else args.fps
    min_len = int(fps * 1.0)

    segs = []
    # crucifix: both abducted>50, lateral>0.6
    m = (~np.isnan(F["abd_l"]) & ~np.isnan(F["abd_r"])
         & (F["abd_l"] > 50) & (F["abd_r"] > 50)
         & (F["lat_l"] > 0.6) & (F["lat_r"] > 0.6))
    for a, b in runs(m, min_len):
        score = float(np.nanmean(F["abd_l"][a:b] + F["abd_r"][a:b]) / 2)
        segs.append(("crucifix", a, b, score))
    # finger guns: elbows bent, wrists above elbows
    m = (~np.isnan(F["elb_l"]) & ~np.isnan(F["elb_r"])
         & (F["elb_l"] < 115) & (F["elb_r"] < 115)
         & (F["wr_up_l"] > 0.02) & (F["wr_up_r"] > 0.02)
         & (F["abd_l"] < 70) & (F["abd_r"] < 70))
    for a, b in runs(m, min_len):
        score = float(np.nanmean(115 - (F["elb_l"][a:b] + F["elb_r"][a:b]) / 2))
        segs.append(("finger_guns", a, b, score))
    # head snap: omega spikes
    om = F["head_omega"]
    thr = np.nanpercentile(om, 92) if np.isfinite(om).sum() > 10 else 30
    m = ~np.isnan(om) & (om > max(thr, 25))
    for a, b in runs(m, 3):
        pad = int(fps * 0.8)
        a2, b2 = max(0, a - pad), min(len(om), b + pad)
        score = float(np.nanmax(om[a:b]))
        segs.append(("head_snap", a2, b2, score))

    print(f"{args.npz}: {len(segs)} candidate segments")
    for name, a, b, s in sorted(segs, key=lambda x: x[1]):
        print(f"  {name:12s} frames {a:5d}-{b:5d}  t={t[a]:6.1f}-{t[b]:6.1f}s  score={s:.1f}")
    # feature summary for threshold tuning
    for k in ("abd_l", "abd_r", "elb_l", "elb_r", "head_omega"):
        v = F[k]
        v = v[np.isfinite(v)]
        if len(v):
            print(f"  feat {k:10s} p50={np.percentile(v,50):6.1f} p90={np.percentile(v,90):6.1f} max={v.max():6.1f}")
    np.savez_compressed(args.out, segments=np.array(
        [(n, a, b, s) for n, a, b, s in segs],
        dtype=[("name", "U16"), ("a", int), ("b", int), ("score", float)]),
        **{k: v for k, v in F.items()})
    print(f"saved {args.out}")

if __name__ == "__main__":
    main()
