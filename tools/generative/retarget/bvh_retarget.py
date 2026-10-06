#!/usr/bin/env python3
"""bvh_retarget.py — retarget BVH motion capture onto the Bannon 58-bone skeleton.

Why BVH: thousands of free motion captures exist in BVH (CMU database — free for
research/commercial use per its license, Mixamo's free packs, many itch.io /
GitHub releases). This maps their joints onto mixamorig: bones and bakes a glTF
animation into any Bannon character GLB. Pure stdlib + numpy.

Usage:
  python3 bvh_retarget.py --bvh walk.bvh --on ../../out/STICKUP_repaired.glb \\
      --out proof/STICKUP_walk_bvh.glb --name WALK
  python3 bvh_retarget.py --synthetic-test --on ../../out/STICKUP_repaired.glb \\
      --out proof/SYNTH_BVH.glb

Bone map lives in mixamo_map.json (lowercased BVH name -> mixamorig: bone).
Unmapped joints are ignored (their children still retarget).
"""
import argparse, json, math, os, struct, sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.quat import euler_to_quat, quat_mul, quat_normalize  # noqa: E402
from common import glb_anim  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


class Joint:
    def __init__(self, name):
        self.name = name
        self.offset = np.zeros(3)
        self.channels = []      # e.g. ['Xposition','Yposition','Zposition','Zrotation','Xrotation','Yrotation']
        self.children = []
        self.parent = None


def parse_bvh(text):
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    it = iter(lines)
    root = None
    stack = []
    joints_order = []  # motion-data order
    n_frames = 0
    frame_time = 1 / 30
    motion_data = []

    def expect(tok):
        ln = next(it)
        assert ln.startswith(tok), f"expected {tok}, got {ln}"
        return ln

    for ln in it:
        if ln == "HIERARCHY":
            continue
        parts = ln.split()
        if parts[0] in ("ROOT", "JOINT"):
            j = Joint(" ".join(parts[1:]))
            if stack:
                j.parent = stack[-1]
                stack[-1].children.append(j)
            else:
                root = j
            stack.append(j)
            joints_order.append(j)
        elif parts[0] == "End":
            # "End Site" line: next lines are { OFFSET x y z }
            j = Joint(stack[-1].name + "_end")
            j.parent = stack[-1]
            stack[-1].children.append(j)
            expect("{")
            off = expect("OFFSET").split()
            j.offset = np.array([float(off[1]), float(off[2]), float(off[3])])
            expect("}")
        elif parts[0] == "{":
            continue
        elif parts[0] == "}":
            stack.pop()
        elif parts[0] == "OFFSET":
            stack[-1].offset = np.array([float(parts[1]), float(parts[2]), float(parts[3])])
        elif parts[0] == "CHANNELS":
            stack[-1].channels = parts[2:]
        elif parts[0] == "MOTION":
            break
    # motion section
    for ln in it:
        if ln.startswith("Frames:"):
            n_frames = int(ln.split()[1])
        elif ln.startswith("Frame Time:"):
            frame_time = float(ln.split()[2])
        else:
            vals = [float(x) for x in ln.split()]
            if vals:
                motion_data.append(vals)
    return root, joints_order, motion_data, frame_time


def _euler_to_quat_bvh(rx, ry, rz, order):
    """BVH channel order like ['Zrotation','Xrotation','Yrotation'] -> quat.
    Applies rotations in listed order (intrinsic)."""
    q = np.array([0.0, 0.0, 0.0, 1.0])
    ang = {"Xrotation": rx, "Yrotation": ry, "Zrotation": rz}
    for ch in order:
        ax = ch[0].lower()
        a = math.radians(ang[ch])
        c, s = math.cos(a / 2), math.sin(a / 2)
        qi = {"x": (s, 0, 0, c), "y": (0, s, 0, c), "z": (0, 0, s, c)}[ax]
        qi = np.array(qi)
        # intrinsic: q = q * qi
        q = quat_mul(q, qi)
    return q


def retarget(root, joints_order, motion_data, frame_time, sk_name2idx, bone_map):
    """Returns (tracks, fps). tracks: list of glb_anim track dicts."""
    # map BVH joint -> bannon node idx
    j2node = {}
    for j in joints_order:
        key = j.name.lower().replace("mixamorig:", "").replace(":", "")
        full = bone_map.get(key)
        if full and full in sk_name2idx:
            j2node[j] = sk_name2idx[full]
    # channel offsets per joint
    offsets, cursor = {}, 0
    for j in joints_order:
        offsets[j] = cursor
        cursor += len(j.channels)
    fps = 1.0 / frame_time if frame_time > 0 else 30.0
    n = len(motion_data)
    times = [i * frame_time for i in range(n)]
    per_node_rots = {nd: [] for nd in set(j2node.values())}
    root_traj = []
    # scale: BVH units -> skeleton units via hips height ratio
    bvh_hip_h = abs(root.offset[1]) or 1.0
    from motion.procedural_moves import B as BMAP
    scale = 1.0
    # estimate from target skeleton: hips world y at rest
    # (passed in via sk_name2idx only; do a light-touch scale = 0.01 if BVH looks cm-scale)
    if bvh_hip_h > 10:  # assume centimeters
        scale = 0.01
    for fr in motion_data:
        for j, nd in j2node.items():
            off = offsets[j]
            ch = j.channels
            rx = ry = rz = 0.0
            order = []
            for k, c in enumerate(ch):
                if c.endswith("rotation"):
                    order.append(c)
                    if c[0] == "X": rx = fr[off + k]
                    elif c[0] == "Y": ry = fr[off + k]
                    else: rz = fr[off + k]
            q = _euler_to_quat_bvh(rx, ry, rz, order) if order else np.array([0, 0, 0, 1.0])
            per_node_rots[nd].append(tuple(float(v) for v in quat_normalize(q)))
        # root translation from ROOT joint position channels
        off = offsets[root]
        px = py = pz = 0.0
        for k, c in enumerate(root.channels):
            if c == "Xposition": px = fr[off + k] * scale
            elif c == "Yposition": py = fr[off + k] * scale
            elif c == "Zposition": pz = fr[off + k] * scale
        root_traj.append((px, py, pz))
    # root motion as offsets relative to first frame
    r0 = root_traj[0]
    root_traj = [tuple((p[i] - r0[i]) for i in range(3)) for p in root_traj]
    tracks = []
    for nd, quats in per_node_rots.items():
        tracks.append({"node": nd, "path": "rotation", "times": times,
                       "values": quats})
    return tracks, root_traj, fps


SYNTH_BVH = """HIERARCHY
ROOT Hips
{
    OFFSET 0.0 95.0 0.0
    CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
    JOINT Spine
    {
        OFFSET 0.0 10.0 0.0
        CHANNELS 3 Zrotation Xrotation Yrotation
        JOINT RightArm
        {
            OFFSET 0.0 8.0 -20.0
            CHANNELS 3 Zrotation Xrotation Yrotation
            End Site
            {
                OFFSET 0.0 -25.0 0.0
            }
        }
    }
}
MOTION
Frames: 3
Frame Time: 0.0333333
0.0 95.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
0.0 95.0 5.0 0.0 0.0 10.0 0.0 -10.0 0.0 0.0 0.0 45.0
0.0 95.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0
"""


def main():
    ap = argparse.ArgumentParser(description="BVH -> Bannon GLB animation")
    ap.add_argument("--bvh")
    ap.add_argument("--on", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default="BVH")
    ap.add_argument("--synthetic-test", action="store_true")
    ap.add_argument("--map", default=os.path.join(HERE, "mixamo_map.json"))
    a = ap.parse_args()

    text = SYNTH_BVH if a.synthetic_test else open(a.bvh).read()
    root, joints, data, ft = parse_bvh(text)
    print(f"BVH: {len(joints)} joints, {len(data)} frames @ {1/ft:.1f}fps")

    with open(a.on, "rb") as f:
        assert f.read(4) == b"glTF"
        f.read(8)
        jl = struct.unpack("<I", f.read(4))[0]
        f.read(4)
        js = json.loads(f.read(jl))
    name2idx = {nd.get("name", ""): i for i, nd in enumerate(js["nodes"])}
    bone_map = json.load(open(a.map))

    tracks, root_traj, fps = retarget(root, joints, data, ft, name2idx, bone_map)
    from motion.procedural_moves import B as BMAP
    if root_traj and BMAP["H"] in name2idx:
        tracks.append({"node": name2idx[BMAP["H"]], "path": "translation",
                       "times": [i * ft for i in range(len(data))],
                       "values": [tuple(float(v) for v in p) for p in root_traj]})
        js2, bin_data = glb_anim.read_glb(a.on)
        glb_anim.add_animation(js2, bin_data, f"BVH_{a.name}", tracks,
                               compose_translation=name2idx[BMAP["H"]])
    else:
        js2, bin_data = glb_anim.read_glb(a.on)
        glb_anim.add_animation(js2, bin_data, f"BVH_{a.name}", tracks)
    problems = glb_anim.validate_animation(js2, len(js2["animations"]) - 1)
    glb_anim.write_glb(a.out, js2, bin_data)
    print(f"wrote {a.out} ({len(tracks)} tracks)" +
          (f" VALIDATE PROBLEMS: {problems}" if problems else " — structure valid"))


if __name__ == "__main__":
    main()
