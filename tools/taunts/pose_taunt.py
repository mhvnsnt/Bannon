#!/usr/bin/env blender -b -P
"""
pose_taunt.py — Hand-pose a taunt in Blender using video reference.

The desired bone directions are specified manually (from studying the video
reference frame), then converted to bone rotations via shortest-arc from rest.
This is rotoscoping: matching a real reference frame, not guessing.

Usage:
  blender -b -P pose_taunt.py -- --glb in.glb --out out.glb --pose crucifix \
      --hold 45 --fps 15
"""
import argparse, math, os, sys

def parse_cli():
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pose", required=True, choices=["crucifix", "finger_guns", "hair_whip"])
    ap.add_argument("--fps", type=int, default=15)
    ap.add_argument("--raise_frames", type=int, default=20, help="frames to go from rest to pose")
    ap.add_argument("--hold_frames", type=int, default=45, help="frames to hold the pose")
    ap.add_argument("--lower_frames", type=int, default=20, help="frames to return to rest")
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    return ap.parse_args(argv)

import bpy
from mathutils import Vector, Quaternion

# Desired bone DIRECTIONS in model space (z-up, anatomical left=+y).
# From studying Hardy reference frames (verify_c1.jpg etc.).
# "Left*" bones are at -y (anatomical right due to mirrored naming).
POSES = {
    "crucifix": {
        # arms spread wide, slightly above horizontal, elbows soft
        "mixamorig:LeftArm":  Vector((0.0, -0.94, 0.34)),   # out right, up
        "mixamorig:LeftForeArm": Vector((0.0, -0.97, 0.24)),
        "mixamorig:RightArm": Vector((0.0, 0.94, 0.34)),    # out left, up
        "mixamorig:RightForeArm": Vector((0.0, 0.97, 0.24)),
        "mixamorig:Head": Vector((0.15, 0.0, 0.99)),       # head tilted back
        "mixamorig:Spine1": Vector((-0.08, 0.0, 0.99)),     # chest up
    },
    "finger_guns": {
        # both arms extended forward at shoulder height, pointing (finger guns)
        "mixamorig:LeftArm": Vector((0.92, -0.28, 0.28)),
        "mixamorig:LeftForeArm": Vector((0.96, -0.20, 0.18)),
        "mixamorig:RightArm": Vector((0.92, 0.28, 0.28)),
        "mixamorig:RightForeArm": Vector((0.96, 0.20, 0.18)),
        "mixamorig:Head": Vector((0.05, 0.0, 1.0)),
    },
    "hair_whip": {
        # head snaps forward/down then back (hair whip) - pose is the snap
        "mixamorig:Head": Vector((0.55, 0.0, 0.84)),        # head thrown forward
        "mixamorig:Neck": Vector((0.35, 0.0, 0.94)),
        "mixamorig:Spine1": Vector((0.18, 0.0, 0.98)),
        "mixamorig:LeftArm": Vector((0.25, -0.85, 0.46)),   # arms slightly out
        "mixamorig:RightArm": Vector((0.25, 0.85, 0.46)),
    },
}

def shortest_arc(a, b):
    a = a.normalized(); b = b.normalized()
    d = max(-1.0, min(1.0, a.dot(b)))
    if d > 0.999999:
        return Quaternion()
    if d < -0.999999:
        ax = Vector((1,0,0)).cross(a)
        if ax.length < 1e-4: ax = Vector((0,0,1)).cross(a)
        return Quaternion(ax.normalized(), math.pi)
    c = a.cross(b)
    q = Quaternion((1.0+d, c.x, c.y, c.z)); q.normalize()
    return q

def main():
    a = parse_cli()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = a.fps
    n_raise, n_hold, n_lower = a.raise_frames, a.hold_frames, a.lower_frames
    N = n_raise + n_hold + n_lower
    sc.frame_start, sc.frame_end = 1, N

    bpy.ops.import_scene.gltf(filepath=a.glb)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    print(f"target: {arm.name}")

    desired = POSES[a.pose]
    # compute q_delta per bone (rotation from rest to desired)
    q_pose = {}
    peak = 0.0
    for dst, d_des in desired.items():
        if dst not in arm.pose.bones:
            print(f"  SKIP {dst}"); continue
        b = arm.data.bones[dst]
        R_rest = b.matrix_local.to_quaternion()
        rest_dir = R_rest @ Vector((0,1,0))
        qd = shortest_arc(rest_dir, d_des)
        q_pose[dst] = qd
        ang = 2.0*math.degrees(math.acos(max(-1,min(1,abs(qd.w)))))
        peak = max(peak, ang)
        print(f"  {dst}: {ang:.1f}deg from rest")

    # order bones top-down
    items = list(q_pose.items())
    def depth(bn):
        dd, b = 0, arm.data.bones[bn]
        while b.parent: dd+=1; b=b.parent
        return dd
    items.sort(key=lambda kv: depth(kv[0]))
    for dst, _ in items:
        arm.pose.bones[dst].rotation_mode = 'QUATERNION'

    # keyframes: 1=rest, raise->pose, hold, lower->rest
    f_pose = 1 + n_raise
    f_hold_end = f_pose + n_hold
    P_world = {}
    for f in range(1, N+1):
        sc.frame_set(f)
        # blend factor 0(rest)->1(pose)
        if f <= f_pose:
            t = (f-1)/max(1,n_raise)
        elif f <= f_hold_end:
            t = 1.0
        else:
            t = 1.0 - (f-f_hold_end)/max(1,n_lower)
        # smoothstep
        t = t*t*(3-2*t)
        P_world.clear()
        for dst, qd in items:
            pb = arm.pose.bones[dst]
            q = Quaternion(); q.identity()
            # slerp identity->qd by t
            q = q.slerp(qd, t)
            P_b = q @ arm.data.bones[dst].matrix_local.to_quaternion()
            P_world[dst] = P_b
            if pb.parent:
                Rpar_rest = arm.data.bones[pb.parent.name].matrix_local.to_quaternion()
                rest_rel = Rpar_rest.inverted() @ arm.data.bones[dst].matrix_local.to_quaternion()
                P_par = P_world.get(pb.parent.name, Rpar_rest)
            else:
                rest_rel = arm.data.bones[dst].matrix_local.to_quaternion().copy()
                P_par = Quaternion()
            q_basis = (P_par @ rest_rel).inverted() @ P_b
            pb.rotation_quaternion = q_basis.normalized()
            pb.keyframe_insert("rotation_quaternion", frame=f)
        bpy.context.view_layer.update()

    print(f"PEAK_DELTA {peak:.1f}deg")
    print("SAFE_ENVELOPE_15DEG:", "PASS" if peak <= 15.0 else "EXCEEDS - stage as needs-repaired-rig")
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=a.out, export_format='GLB',
                              export_animations=True, export_frame_range=True)
    print(f"wrote {a.out}")

main()
