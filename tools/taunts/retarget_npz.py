#!/usr/bin/env blender -b -P
"""
retarget_npz.py — DIRECT retarget: MediaPipe landmark NPZ -> Stick-Up mixamorig rig.

Bypasses BVH entirely. For each frame, builds each bone's desired WORLD
orientation from the landmarks (pose_orient.py, no hierarchical chaining),
then sets the target pose bone via:
    q_basis = (parent_posed @ rest_local)^-1 @ P_desired
Top-down order. Rotations keyframed (QUATERNION). Root motion scaled.

Usage:
  blender -b -P retarget_npz.py -- --npz poses/seg_crucifix_hardy.npz \
      --glb assets/models/STICKUP_repaired.glb --out clips/crucifix_hardy.glb

Prints PEAK_DELTA per arm (rotation-from-rest, degrees) for the safe-envelope check.
"""
import argparse, math, os, sys

def parse_cli():
    ap = argparse.ArgumentParser()
    ap.add_argument("--npz", required=True)
    ap.add_argument("--glb", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=15)
    ap.add_argument("--root-scale", type=float, default=1.08)
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    return ap.parse_args(argv)

import bpy
from mathutils import Matrix, Quaternion, Vector
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from pose_orient import joint_positions, world_orientations, smooth_orientations

# source bone -> target mixamorig bone(s)
BONE_MAP = {
    "Hips": ["mixamorig:Hips"],
    "Spine": ["mixamorig:Spine"],
    "Spine1": ["mixamorig:Spine1", "mixamorig:Spine2"],
    "Neck": ["mixamorig:Neck"],
    "Head": ["mixamorig:Head"],
    "LeftArm": ["mixamorig:LeftArm"],
    "LeftForeArm": ["mixamorig:LeftForeArm"],
    "LeftHand": ["mixamorig:LeftHand"],
    "RightArm": ["mixamorig:RightArm"],
    "RightForeArm": ["mixamorig:RightForeArm"],
    "RightHand": ["mixamorig:RightHand"],
    "LeftUpLeg": ["mixamorig:LeftUpLeg"],
    "LeftLeg": ["mixamorig:LeftLeg"],
    "LeftFoot": ["mixamorig:LeftFoot"],
    "RightUpLeg": ["mixamorig:RightUpLeg"],
    "RightLeg": ["mixamorig:RightLeg"],
    "RightFoot": ["mixamorig:RightFoot"],
}

def mat3_to_quat(M):
    return Matrix((tuple(M[0]), tuple(M[1]), tuple(M[2]))).to_quaternion()

def main():
    a = parse_cli()
    d = np.load(a.npz)
    P0 = d["poses"].copy()
    P0[:, :, 1] *= -1.0  # y-down -> y-up
    N = P0.shape[0]
    fps = float(d["sample_fps"]) if "sample_fps" in d else a.fps
    print(f"{a.npz}: {N} frames @ {fps}fps")

    # joint positions per frame, light smoothing
    names = ["hips","spine","spine1","neck","head","l_sh","l_el","l_wr",
             "r_sh","r_el","r_wr","l_hip","l_knee","l_ank",
             "r_hip","r_knee","r_ank","nose"]
    J = np.full((N, len(names), 3), np.nan)
    for f in range(N):
        if np.isnan(P0[f]).all():
            continue
        try:
            Pj = joint_positions(P0[f][:, :3])
        except Exception:
            continue
        for i, n in enumerate(names):
            J[f, i] = Pj[n]
    # interpolate NaNs + gaussian smooth
    for i in range(len(names)):
        for c in range(3):
            v = J[:, i, c]
            good = ~np.isnan(v)
            if good.sum() < 2:
                continue
            v = np.interp(np.arange(N), np.arange(N)[good], v[good])
            k = np.array([0.25, 0.5, 0.25])
            J[:, i, c] = np.convolve(v, k, mode="same")

    # world orientations per frame
    Qseq = []
    for f in range(N):
        lm = np.full((33, 3), np.nan)
        # rebuild minimal landmark array from smoothed joints for world_orientations
        # (world_orientations needs the raw 33; emulate via joint_positions on a proxy)
        # Simpler: call joint_positions-equivalent directly on smoothed J
        Pj = {n: J[f, i] for i, n in enumerate(names)}
        # need l_sh etc keys as world_orientations expects
        Pj2 = {"hips": Pj["hips"], "spine": Pj["spine"], "spine1": Pj["spine1"],
               "neck": Pj["neck"], "head": Pj["head"],
               "l_sh": Pj["l_sh"], "l_el": Pj["l_el"], "l_wr": Pj["l_wr"],
               "r_sh": Pj["r_sh"], "r_el": Pj["r_el"], "r_wr": Pj["r_wr"],
               "l_hip": Pj["l_hip"], "l_knee": Pj["l_knee"], "l_ank": Pj["l_ank"],
               "r_hip": Pj["r_hip"], "r_knee": Pj["r_knee"], "r_ank": Pj["r_ank"],
               "nose": Pj["nose"]}
        Qseq.append(world_orientations(Pj2))
    Qseq = smooth_orientations(Qseq)

    # root motion (smoothed hips, relative to frame 0, scaled)
    root = J[:, 0, :]
    root = root - root[0]
    root *= a.root_scale

    # --- Blender: load target ---
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = int(fps)
    sc.frame_start, sc.frame_end = 1, N
    bpy.ops.import_scene.gltf(filepath=a.glb)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    print(f"target armature: {arm.name}")

    # resolve + top-down order
    pairs = []
    for src, dsts in BONE_MAP.items():
        for dst in dsts:
            if dst in arm.data.bones:
                pairs.append((src, dst))
            else:
                print(f"  SKIP {dst} (not in rig)")
    def depth(bn):
        dd, b = 0, arm.data.bones[bn]
        while b.parent:
            dd += 1; b = b.parent
        return dd
    pairs.sort(key=lambda p: depth(p[1]))
    for _, dst in pairs:
        arm.pose.bones[dst].rotation_mode = 'QUATERNION'

    # rest world orientations + rest bone directions (bone Y axis in world)
    R_rest, rest_dir_w = {}, {}
    Y = Vector((0, 1, 0))
    for _, dst in pairs:
        b = arm.data.bones[dst]
        R_rest[dst] = b.matrix_local.to_quaternion()
        rest_dir_w[dst] = R_rest[dst] @ Y

    # reference yaw from frame 0 (for relative root yaw)
    sh0 = J[0, 5] - J[0, 8]  # l_sh - r_sh
    yaw0 = math.atan2(sh0[0], sh0[2])

    peak = {"Left": 0.0, "Right": 0.0}
    # source direction joints per target bone.
    # NOTE: the GLB's left/right NAMING is mirrored vs anatomy (verified
    # 2026-10-09: "LeftArm" bone sits at -y = anatomical right). MediaPipe
    # lm 11/13/15 = subject's anatomical left, so drive the "Right*" bones.
    SRC_DIR = {
        "mixamorig:Hips": None,
        "mixamorig:Spine": ("spine", "spine1"),
        "mixamorig:Spine1": ("spine1", "neck"),
        "mixamorig:Spine2": ("spine1", "neck"),
        "mixamorig:Neck": ("neck", "head"),
        "mixamorig:Head": ("neck", "nose"),
        "mixamorig:LeftArm": ("r_sh", "r_el"),
        "mixamorig:LeftForeArm": ("r_el", "r_wr"),
        "mixamorig:LeftHand": ("r_el", "r_wr"),
        "mixamorig:LeftUpLeg": ("r_hip", "r_knee"),
        "mixamorig:LeftLeg": ("r_knee", "r_ank"),
        "mixamorig:LeftFoot": ("r_knee", "r_ank"),
        "mixamorig:RightArm": ("l_sh", "l_el"),
        "mixamorig:RightForeArm": ("l_el", "l_wr"),
        "mixamorig:RightHand": ("l_el", "l_wr"),
        "mixamorig:RightUpLeg": ("l_hip", "l_knee"),
        "mixamorig:RightLeg": ("l_knee", "l_ank"),
        "mixamorig:RightFoot": ("l_knee", "l_ank"),
    }
    JIDX = {n: i for i, n in enumerate(names)}

    # MediaPipe (y-up, +x=subject's anatomical RIGHT) -> Model (z-up).
    # Model bone NAMED "LeftArm" sits at -y = anatomical RIGHT (naming is
    # mirrored). R maps MP anatomical-right (+x) -> model -y, so driving the
    # "Left*" bones with MP right-side landmarks lands on the correct side.
    R_MP2M = np.array([[0, 0, -1],
                       [-1, 0, 0],
                       [0, 1, 0]], dtype=float)

    def mp_dir(a, b):
        """Observed bone direction mapped into model space (Vector)."""
        d = J[f, JIDX[b]] - J[f, JIDX[a]]
        dm = R_MP2M @ d
        return Vector(dm)

    def shortest_arc_quat(a, b):
        a = a.normalized(); b = b.normalized()
        d = max(-1.0, min(1.0, a.dot(b)))
        if d > 0.999999:
            return Quaternion()
        if d < -0.999999:
            # 180 deg: pick orthogonal axis
            ax = Vector((1, 0, 0)).cross(a)
            if ax.length < 1e-4:
                ax = Vector((0, 0, 1)).cross(a)
            return Quaternion(ax.normalized(), math.pi)
        return _arc(a, b, d)

    def _arc(a, b, d):
        # quaternion (w,x,y,z) from cross/dot
        c = a.cross(b)
        q = Quaternion((1.0 + d, c.x, c.y, c.z))
        q.normalize()
        return q

    for f in range(N):
        sc.frame_set(f + 1)
        P_world = {}  # posed world orientation per target bone
        for src, dst in pairs:
            pb = arm.pose.bones[dst]
            b = arm.data.bones[dst]
            spec = SRC_DIR[dst]
            if spec is None:
                # Hips: relative yaw from frame 0, around model's up (+z)
                sh = J[f, JIDX["l_sh"]] - J[f, JIDX["r_sh"]]
                yaw = math.atan2(sh[0], sh[2]) - yaw0
                q_delta = Quaternion(Vector((0, 0, 1)), yaw)
            else:
                d_obs = mp_dir(spec[0], spec[1])
                if d_obs.length < 1e-6 or any(math.isnan(x) for x in d_obs):
                    q_delta = Quaternion()  # keep rest
                else:
                    q_delta = shortest_arc_quat(rest_dir_w[dst], d_obs)
            P_b = q_delta @ R_rest[dst]
            P_world[dst] = P_b
            # basis: want (P_parent @ rest_rel) @ q_basis = P_b
            # where rest_rel = parent_rest^-1 @ bone_rest
            if pb.parent:
                Rpar_rest = arm.data.bones[pb.parent.name].matrix_local.to_quaternion()
                rest_rel = Rpar_rest.inverted() @ R_rest[dst]
                if pb.parent.name in P_world:
                    P_par = P_world[pb.parent.name]
                else:
                    P_par = Rpar_rest  # parent not posed
            else:
                rest_rel = R_rest[dst].copy()
                P_par = Quaternion()  # identity
            q_basis = (P_par @ rest_rel).inverted() @ P_b
            pb.rotation_quaternion = q_basis.normalized()
            pb.keyframe_insert("rotation_quaternion", frame=f + 1)
            if "Arm" in dst and "ForeArm" not in dst:
                w = abs(pb.rotation_quaternion.w)
                ang = 2.0 * math.degrees(math.acos(max(-1.0, min(1.0, w))))
                side = "Left" if "Left" in dst else "Right"
                peak[side] = max(peak[side], ang)
            if dst == "mixamorig:Hips":
                Rr = R_rest[dst]
                # root delta mapped into model space
                rd = R_MP2M @ root[f]
                pb.location = Rr.inverted() @ Vector(rd)
                pb.keyframe_insert("location", frame=f + 1)
        bpy.context.view_layer.update()
        if (f + 1) % 30 == 0:
            print(f"  frame {f+1}/{N}", flush=True)

    print(f"PEAK_DELTA Left={peak['Left']:.1f}deg Right={peak['Right']:.1f}deg")
    print("SAFE_ENVELOPE_15DEG:",
          "PASS" if max(peak.values()) <= 15.0 else "EXCEEDS - stage as needs-repaired-rig")

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=a.out, export_format='GLB',
                              export_animations=True, export_frame_range=True)
    print(f"wrote {a.out}")

main()
