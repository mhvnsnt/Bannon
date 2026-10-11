#!/usr/bin/env python3
"""preview.py — render stick-figure verification strips for procedural moves.

Uses forward kinematics on the real GLB skeleton (no guessing about what a
move looks like). Each PNG = 5 frames across the clip: start, 25%, 50%, 75%,
end. Review these before shipping a move into the game.
"""
import argparse, os, struct, sys, json

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.fk import Skeleton  # noqa: E402
from motion.procedural_moves import bake_move, B, MOVES, FPS  # noqa: E402

SEGMENTS = [
    ("H", "S"), ("S", "S1"), ("S1", "S2"), ("S2", "N"), ("N", "Hd"),
    ("S2", "RSh"), ("RSh", "RA"), ("RA", "RFA"), ("RFA", "RH"),
    ("S2", "LSh"), ("LSh", "LA"), ("LA", "LFA"), ("LFA", "LH"),
    ("H", "RUL"), ("RUL", "RL"), ("RL", "RF"), ("RF", "RT"),
    ("H", "LUL"), ("LUL", "LL"), ("LL", "LF"), ("LF", "LT"),
]

def load_skeleton(glb_path):
    with open(glb_path, "rb") as f:
        assert f.read(4) == b"glTF"
        f.read(8)
        jl = struct.unpack("<I", f.read(4))[0]
        f.read(4)
        js = json.loads(f.read(jl))
    return Skeleton(js["nodes"])

def pose_at(sk, baked, frame):
    name2idx = sk.name2idx
    brot = {}
    for alias, quats in baked.items():
        if alias.startswith("_") or alias in ("dur", "loop", "desc"):
            continue
        full = B[alias]
        if full in name2idx:
            brot[name2idx[full]] = np.asarray(quats[frame])
    root_off = None
    if "_root" in baked:
        root_off = np.asarray(baked["_root"][frame])
    return sk.fk(bone_rotations=brot, root_offset=root_off)

def render_move(sk, move_name, out_png, frames=5):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d import Axes3D  # noqa: F401

    baked = bake_move(move_name)
    n = len(next(v for k, v in baked.items()
                   if not k.startswith("_") and k not in ("dur", "loop", "desc")))
    idxs = [int(round(i * (n - 1) / (frames - 1))) for i in range(frames)]
    fig = plt.figure(figsize=(4 * frames, 4.4))
    for col, fi in enumerate(idxs):
        ax = fig.add_subplot(1, frames, col + 1, projection="3d")
        P, _ = pose_at(sk, baked, fi)
        idx = sk.name2idx
        for a, b in SEGMENTS:
            if B[a] in idx and B[b] in idx:
                p0, p1 = P[idx[B[a]]], P[idx[B[b]]]
                ax.plot([p0[0], p1[0]], [p0[2], p1[2]], [p0[1], p1[1]], "b-", lw=2)
        # head dot
        if B["Hd"] in idx:
            h = P[idx[B["Hd"]]]
            ax.scatter([h[0]], [h[2]], [h[1]], c="r", s=40)
        ax.set_xlim(-0.6, 0.6); ax.set_ylim(-0.6, 0.6); ax.set_zlim(-0.4, 1.0)
        ax.view_init(elev=12, azim=-65)
        ax.set_title(f"t={fi / FPS:.2f}s")
        ax.set_box_aspect((1, 1, 1.4))
    fig.suptitle(f"{move_name} — {MOVES[move_name]['desc']}", fontsize=13)
    fig.tight_layout()
    fig.savefig(out_png, dpi=90)
    plt.close(fig)
    return out_png

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--move")
    ap.add_argument("--on", required=True, help="GLB whose skeleton to pose")
    ap.add_argument("--out")
    ap.add_argument("--outdir")
    ap.add_argument("--all", action="store_true")
    a = ap.parse_args()
    sk = load_skeleton(a.on)
    if a.all:
        os.makedirs(a.outdir, exist_ok=True)
        for m in sorted(MOVES):
            p = os.path.join(a.outdir, f"preview_{m}.png")
            render_move(sk, m, p)
            print("rendered", m)
        return
    render_move(sk, a.move, a.out)
    print("wrote", a.out)

if __name__ == "__main__":
    main()
