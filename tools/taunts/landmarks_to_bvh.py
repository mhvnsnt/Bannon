#!/usr/bin/env python3
"""
landmarks_to_bvh.py — MediaPipe 33-landmark sequences (.npz) -> BVH.

Usage:
  python3 landmarks_to_bvh.py poses/segment.npz --out clips/finger_guns_hardy.bvh \
      --name finger_guns_hardy

Pipeline: joint positions from landmarks -> per-bone swing quaternions
(shortest-arc, hierarchical) -> Euler ZXY -> BVH. Positions smoothed with a
small Gaussian; NaN gaps linearly interpolated. Output is METRIC (meters),
root motion relative to frame 0. Rotations are what the retarget consumes.
"""
import argparse, os, sys
import numpy as np

# MediaPipe landmark indices
NOSE, L_EAR, R_EAR = 0, 7, 8
L_SH, R_SH = 11, 12
L_EL, R_EL = 13, 14
L_WR, R_WR = 15, 16
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANK, R_ANK = 27, 28

# BVH hierarchy: name -> (joint_landmark_fn, parent)
# joint positions computed per frame from landmarks dict
JOINTS = [
    # name, parent, position source
    ("Hips", None, "hips"),
    ("Spine", "Hips", "spine"),
    ("Spine1", "Spine", "spine1"),
    ("Neck", "Spine1", "neck"),
    ("Head", "Neck", "head"),
    ("HeadEnd", "Head", "head_end"),
    ("LeftShoulder", "Spine1", "l_sh"),
    ("LeftArm", "LeftShoulder", "l_el"),
    ("LeftForeArm", "LeftArm", "l_wr"),
    ("LeftHand", "LeftForeArm", "l_hand"),
    ("LeftHandEnd", "LeftHand", "l_hand_end"),
    ("RightShoulder", "Spine1", "r_sh"),
    ("RightArm", "RightShoulder", "r_el"),
    ("RightForeArm", "RightArm", "r_wr"),
    ("RightHand", "RightForeArm", "r_hand"),
    ("RightHandEnd", "RightHand", "r_hand_end"),
    ("LeftUpLeg", "Hips", "l_hip"),
    ("LeftLeg", "LeftUpLeg", "l_knee"),
    ("LeftFoot", "LeftLeg", "l_ank"),
    ("LeftFootEnd", "LeftFoot", "l_foot_end"),
    ("RightUpLeg", "Hips", "r_hip"),
    ("RightLeg", "RightUpLeg", "r_knee"),
    ("RightFoot", "RightLeg", "r_ank"),
    ("RightFootEnd", "RightFoot", "r_foot_end"),
]

def joint_positions(lm):
    """lm: (33,4) world landmarks -> dict of joint positions."""
    mid = lambda a, b: (lm[a, :3] + lm[b, :3]) / 2
    hips = mid(L_HIP, R_HIP)
    sh = mid(L_SH, R_SH)
    up = np.array([0.0, 1.0, 0.0])
    nose = lm[NOSE, :3]
    # Anchor the spine to the SHOULDER line (not the hips): goes DOWN from the
    # shoulders toward the hips. This keeps the clavicle directions lateral even
    # when the hips are offset/turned (perspective, stance).
    to_hips = hips - sh
    P = {
        "hips": hips,
        "spine": sh + to_hips * 0.55,
        "spine1": sh + to_hips * 0.25,
        "neck": sh + up * 0.04,
        "head": mid(L_EAR, R_EAR),
        "head_end": nose + up * 0.06,
        "l_sh": lm[L_SH, :3], "l_el": lm[L_EL, :3], "l_wr": lm[L_WR, :3],
        "l_hand": lm[L_WR, :3],
        "r_sh": lm[R_SH, :3], "r_el": lm[R_EL, :3], "r_wr": lm[R_WR, :3],
        "r_hand": lm[R_WR, :3],
        "l_hip": lm[L_HIP, :3], "l_knee": lm[L_KNEE, :3], "l_ank": lm[L_ANK, :3],
        "r_hip": lm[R_HIP, :3], "r_knee": lm[R_KNEE, :3], "r_ank": lm[R_ANK, :3],
    }
    # hand ends extend along forearm direction
    for s in ("l", "r"):
        fa = P[f"{s}_wr"] - P[f"{s}_el"]
        n = np.linalg.norm(fa)
        P[f"{s}_hand_end"] = P[f"{s}_wr"] + (fa / n * 0.18 if n > 1e-6 else up * 0.18)
        P[f"{s}_foot_end"] = P[f"{s}_ank"] + np.array([0.0, -0.06, 0.10])
    return P

def quat_shortest_arc(a, b):
    """Quaternion rotating unit vector a to unit vector b (shortest arc)."""
    a = a / (np.linalg.norm(a) + 1e-9)
    b = b / (np.linalg.norm(b) + 1e-9)
    d = np.dot(a, b)
    if d > 0.999999:
        return np.array([1.0, 0, 0, 0])
    if d < -0.999999:
        # pick orthogonal axis
        ax = np.array([1.0, 0, 0]) if abs(a[0]) < 0.9 else np.array([0, 1.0, 0])
        o = ax - a * np.dot(ax, a)
        o = o / (np.linalg.norm(o) + 1e-9)
        return np.array([0.0, *o])
    c = np.cross(a, b)
    w = 1.0 + d
    q = np.array([w, *c])
    return q / (np.linalg.norm(q) + 1e-9)

def quat_mul(q1, q2):
    w1, x1, y1, z1 = q1
    w2, x2, y2, z2 = q2
    return np.array([
        w1*w2 - x1*x2 - y1*y2 - z1*z2,
        w1*x2 + x1*w2 + y1*z2 - z1*y2,
        w1*y2 - x1*z2 + y1*w2 + z1*x2,
        w1*z2 + x1*y2 - y1*x2 + z1*w2])

def quat_conj(q):
    return np.array([q[0], -q[1], -q[2], -q[3]])

def quat_rot(q, v):
    return quat_mul(quat_mul(q, np.array([0.0, *v])), quat_conj(q))[1:]

def quat_to_euler_zxy(q):
    """-> (z, x, y) degrees, BVH channel order."""
    w, x, y, z = q
    # ZXY intrinsic
    sx = 2 * (w*x - y*z)
    cx = 1 - 2 * (x*x + y*y)
    sy = 2 * (w*y + x*z)
    cy = 1 - 2 * (y*y + x*x)
    sz = 2 * (w*z - x*y)
    cz = 1 - 2 * (z*z + x*x)
    # clamp for asin
    t2 = 2 * (w*y - z*x)
    t2 = max(-1.0, min(1.0, t2))
    ex = np.arctan2(sx, cx)
    ey = np.arcsin(t2)
    ez = np.arctan2(sz, cz)
    return np.degrees([ez, ex, ey])

def gaussian_smooth(P_seq, sigma=1.5, radius=4):
    """P_seq: (N, J, 3) with NaNs -> smoothed, NaN gaps interpolated first."""
    N, J, _ = P_seq.shape
    out = P_seq.copy()
    for j in range(J):
        for c in range(3):
            v = out[:, j, c]
            good = ~np.isnan(v)
            if good.sum() < 2:
                continue
            v = np.interp(np.arange(N), np.arange(N)[good], v[good])
            k = np.arange(-radius, radius + 1)
            w = np.exp(-0.5 * (k / sigma) ** 2)
            w /= w.sum()
            out[:, j, c] = np.convolve(v, w, mode="same")
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("npz")
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default="clip")
    args = ap.parse_args()

    d = np.load(args.npz)
    poses = d["poses"]          # (N, 33, 4)
    # MediaPipe Tasks world landmarks use y-DOWN (image convention), not y-up:
    # verified 2026-10-09 (nose y < shoulder y on upright standing subject).
    # Negate to y-up for all downstream math.
    poses = poses.copy()
    poses[:, :, 1] *= -1.0
    t = d["t"]
    fps = float(d["sample_fps"]) if "sample_fps" in d else 10.0
    N = poses.shape[0]
    print(f"{args.npz}: {N} frames @ {fps}fps")

    names = [j[0] for j in JOINTS]
    jidx = {n: i for i, n in enumerate(names)}
    pos_seq = np.full((N, len(names), 3), np.nan)
    for f in range(N):
        if np.isnan(poses[f]).all():
            continue
        try:
            P = joint_positions(poses[f])
        except Exception:
            continue
        for n, i in jidx.items():
            src = [j[2] for j in JOINTS if j[0] == n][0]
            pos_seq[f, i] = P[src]
    good_frames = int((~np.isnan(pos_seq[:, 0, 0])).sum())
    print(f"  frames with hips: {good_frames}/{N}")
    if good_frames < 8:
        sys.exit("too few usable frames")

    # scale to ~1.8m using median leg+torso length
    heights = []
    for f in range(N):
        if np.isnan(pos_seq[f, jidx["Head"], 0]) or np.isnan(pos_seq[f, jidx["LeftFoot"], 0]):
            continue
        heights.append(np.linalg.norm(pos_seq[f, jidx["Head"]] - pos_seq[f, jidx["LeftFoot"]]))
    scale = 1.70 / (np.median(heights) if heights else 1.0)
    print(f"  scale: {scale:.3f}")
    pos_seq *= scale

    pos_seq = gaussian_smooth(pos_seq)

    # rest pose: T-pose from median bone lengths
    bone_len = {}
    children = {}
    for n, p, _ in JOINTS:
        if p:
            children.setdefault(p, []).append(n)
    for n, p, _ in JOINTS:
        if not p:
            continue
        ds = []
        for f in range(N):
            a, b = pos_seq[f, jidx[p]], pos_seq[f, jidx[n]]
            if not (np.isnan(a).any() or np.isnan(b).any()):
                ds.append(np.linalg.norm(b - a))
        bone_len[(p, n)] = float(np.median(ds)) if ds else 0.1

    # T-pose rest directions (parent-local == world, root identity).
    # NOTE (verified 2026-10-09): MediaPipe world landmarks put the subject's
    # LEFT at +x (left-handed-ish). Match it: left arm -> +x, right arm -> -x.
    rest_dir = {}
    for (p, n) in bone_len:
        if "Shoulder" in n and "Arm" not in n:  # clavicle stubs
            rest_dir[(p, n)] = np.array([1.0, 0.15, 0]) if "Left" in n else np.array([-1.0, 0.15, 0])
        elif "Left" in n and ("Arm" in n or "Hand" in n or "Shoulder" in p):
            rest_dir[(p, n)] = np.array([1.0, 0, 0])
        elif "Right" in n and ("Arm" in n or "Hand" in n or "Shoulder" in p):
            rest_dir[(p, n)] = np.array([-1.0, 0, 0])
        elif "UpLeg" in n or "Leg" in n or "Foot" in n:
            rest_dir[(p, n)] = np.array([0, -1.0, 0])
        else:  # spine chain, neck, head
            rest_dir[(p, n)] = np.array([0, 1.0, 0])
        rest_dir[(p, n)] = rest_dir[(p, n)] / np.linalg.norm(rest_dir[(p, n)])
    # clavicle direction fix: LeftShoulder/RightShoulder are the clavicles
    rest_dir[("Spine1", "LeftShoulder")] = np.array([1.0, 0.1, 0]); rest_dir[("Spine1", "LeftShoulder")] /= np.linalg.norm(rest_dir[("Spine1", "LeftShoulder")])
    rest_dir[("Spine1", "RightShoulder")] = np.array([-1.0, 0.1, 0]); rest_dir[("Spine1", "RightShoulder")] /= np.linalg.norm(rest_dir[("Spine1", "RightShoulder")])
    rest_dir[("LeftShoulder", "LeftArm")] = np.array([1.0, 0, 0])
    rest_dir[("RightShoulder", "RightArm")] = np.array([-1.0, 0, 0])

    # rest offsets
    rest_off = {}
    for (p, n), L in bone_len.items():
        rest_off[(p, n)] = rest_dir[(p, n)] * L

    # per-frame rotations, hierarchical
    eulers = np.zeros((N, len(names), 3))  # (z,x,y) deg
    root_pos = np.zeros((N, 3))
    order = ["Hips", "Spine", "Spine1", "Neck", "Head", "HeadEnd",
             "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand", "LeftHandEnd",
             "RightShoulder", "RightArm", "RightForeArm", "RightHand", "RightHandEnd",
             "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftFootEnd",
             "RightUpLeg", "RightLeg", "RightFoot", "RightFootEnd"]
    parent = {n: p for n, p, _ in JOINTS}
    for f in range(N):
        if np.isnan(pos_seq[f, jidx["Hips"], 0]):
            if f > 0:
                eulers[f] = eulers[f-1]; root_pos[f] = root_pos[f-1]
            continue
        Q = {}
        # root orientation: yaw from shoulder line, keep upright
        sh = pos_seq[f, jidx["LeftShoulder"]] - pos_seq[f, jidx["RightShoulder"]]
        sh = sh / (np.linalg.norm(sh) + 1e-9)
        # yaw = atan2 of shoulder axis in XZ plane; rest faces +Z? use identity-ish
        yaw = np.arctan2(sh[0], sh[2])  # 0 when shoulders along X
        cy, sy = np.cos(yaw/2), np.sin(yaw/2)
        Q["Hips"] = np.array([cy, 0, sy, 0])
        eulers[f, jidx["Hips"]] = quat_to_euler_zxy(Q["Hips"])
        root_pos[f] = pos_seq[f, jidx["Hips"]] - pos_seq[0, jidx["Hips"]]
        for n in order[1:]:
            p = parent[n]
            a = pos_seq[f, jidx[p]]; b = pos_seq[f, jidx[n]]
            if np.isnan(a).any() or np.isnan(b).any():
                ql = np.array([1.0, 0, 0, 0])
            else:
                d_obs_world = b - a
                if np.linalg.norm(d_obs_world) < 1e-6:
                    ql = np.array([1.0, 0, 0, 0])
                else:
                    # observed dir in parent-local frame
                    o_local = quat_rot(quat_conj(Q[p]), d_obs_world)
                    ql = quat_shortest_arc(rest_dir[(p, n)], o_local)
            Q[n] = quat_mul(Q[p], ql)
            eulers[f, jidx[n]] = quat_to_euler_zxy(ql)

    # write BVH
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w") as fh:
        fh.write("HIERARCHY\n")
        def emit(n, depth):
            ind = "  " * depth
            p = parent[n]
            off = rest_off[(p, n)] if p else np.array([0, 0, 0])
            kids = children.get(n, [])
            tag = "ROOT" if p is None else ("JOINT" if kids else "End Site")
            if p is None:
                fh.write(f"{ind}ROOT {n}\n{ind}{{\n")
                fh.write(f"{ind}  OFFSET {off[0]:.4f} {off[1]:.4f} {off[2]:.4f}\n")
                fh.write(f"{ind}  CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation\n")
            elif kids:
                fh.write(f"{ind}JOINT {n}\n{ind}{{\n")
                fh.write(f"{ind}  OFFSET {off[0]:.4f} {off[1]:.4f} {off[2]:.4f}\n")
                fh.write(f"{ind}  CHANNELS 3 Zrotation Xrotation Yrotation\n")
            else:
                fh.write(f"{ind}End Site\n{ind}{{\n")
                fh.write(f"{ind}  OFFSET {off[0]:.4f} {off[1]:.4f} {off[2]:.4f}\n{ind}}}\n")
                return
            for k in kids:
                emit(k, depth + 1)
            fh.write(f"{ind}}}\n")
        emit("Hips", 0)
        fh.write("MOTION\n")
        fh.write(f"Frames: {N}\n")
        fh.write(f"Frame Time: {1.0/fps:.6f}\n")
        motion_joints = [n for n in order[1:] if not n.endswith("End")]
        for f in range(N):
            vals = [f"{root_pos[f,0]:.4f}", f"{root_pos[f,1]:.4f}", f"{root_pos[f,2]:.4f}"]
            vals += [f"{v:.3f}" for v in eulers[f, jidx["Hips"]]]
            for n in motion_joints:
                vals += [f"{v:.3f}" for v in eulers[f, jidx[n]]]
            fh.write(" ".join(vals) + "\n")
    print(f"wrote {args.out} ({N} frames)")

if __name__ == "__main__":
    main()
