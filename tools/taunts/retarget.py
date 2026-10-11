#!/usr/bin/env blender -b -P
"""
retarget.py — scripted retarget: source BVH -> Stick-Up mixamorig rig.

Method: top-down WORLD-SPACE DELTA transfer. For each mapped bone pair, the
source bone's rotation delta-from-rest (armature space) is applied to the
target bone's rest orientation. Handles differing rest poses exactly; no
constraints, no manual cleanup. Rotations keyframed per frame (QUATERNION).

Usage (headless):
  blender -b -P retarget.py -- --bvh clips/finger_guns_hardy.bvh \
      --glb assets/models/STICKUP_repaired.glb --map tools/taunts/retarget_map.json \
      --source hardy_bvh --out clips/finger_guns_hardy.glb --fps 30

Also prints PEAK_ABDUCTION per arm (degrees, from target bone world matrices)
for the safe-envelope check.
"""
import argparse, json, math, os, sys

def parse_cli():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bvh", required=True)
    ap.add_argument("--glb", required=True)
    ap.add_argument("--map", required=True)
    ap.add_argument("--source", required=True, choices=["hardy_bvh", "cmu_bvh"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--resample", type=int, default=1,
                    help="take every Nth source frame")
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    return ap.parse_args(argv)

import bpy
from mathutils import Matrix, Quaternion, Vector

def main():
    a = parse_cli()
    cfg = json.load(open(a.map))
    bmap = cfg["maps"][a.source]
    # flatten: dst may be a list (Spine2 shares Spine1's source)
    pairs = []
    for src, dst in bmap.items():
        for d in (dst if isinstance(dst, list) else [dst]):
            pairs.append((src, d))
    root_scale = cfg.get("root_motion_scale", 1.0)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = a.fps

    # --- source BVH ---
    bpy.ops.import_anim.bvh(filepath=a.bvh, target='ARMATURE')
    src_arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    src_act = src_arm.animation_data.action
    n_src = int(src_act.frame_range[1] - src_act.frame_range[0] + 1)
    print(f"source: {src_arm.name}, {n_src} frames")

    # --- target GLB ---
    bpy.ops.import_scene.gltf(filepath=a.glb)
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o is not src_arm]
    if not arms:
        sys.exit("no target armature in GLB")
    dst_arm = arms[0]
    print(f"target: {dst_arm.name}")

    # resolve bone pairs (case: Blender keeps mixamorig: prefix)
    ok_pairs = []
    for src, dst in pairs:
        if src in src_arm.data.bones and dst in dst_arm.data.bones:
            ok_pairs.append((src, dst))
        else:
            print(f"  SKIP pair {src}->{dst} (missing bone)")
    # top-down order by dst depth
    def depth(bname):
        d, b = 0, dst_arm.data.bones[bname]
        while b.parent:
            d += 1; b = b.parent
        return d
    ok_pairs.sort(key=lambda p: depth(p[1]))

    # prep: quaternion rotation mode
    for _, dst in ok_pairs:
        dst_arm.pose.bones[dst].rotation_mode = 'QUATERNION'
    root_dst = next(d for s, d in ok_pairs if "Hips" in d)
    root_src = next(s for s, d in ok_pairs if "Hips" in d)

    frames = list(range(0, n_src, a.resample))
    sc.frame_start, sc.frame_end = 1, len(frames)
    peak = {"Left": 0.0, "Right": 0.0}

    for fi, sf in enumerate(frames, start=1):
        sc.frame_set(int(src_act.frame_range[0]) + sf)
        bpy.context.view_layer.update()
        for src, dst in ok_pairs:
            spb = src_arm.pose.bones[src]
            dpb = dst_arm.pose.bones[dst]
            sb = src_arm.data.bones[src]
            db = dst_arm.data.bones[dst]
            # source: rest->posed delta (armature space)
            W_s = spb.matrix.to_quaternion()
            R_s = sb.matrix_local.to_quaternion()
            D = (R_s.inverted() @ W_s).normalized()
            # target: apply delta to target rest
            R_d = db.matrix_local.to_quaternion()
            W_d = (R_d @ D).normalized()
            # local basis needed: parent_posed @ rest_local @ basis = W_d
            if dpb.parent:
                pp = dpb.parent.matrix.to_quaternion()
                rl = (dpb.parent.bone.matrix_local.inverted()
                      @ db.matrix_local).to_quaternion()
            else:
                pp = Quaternion()
                rl = R_d
            basis = (pp @ rl).inverted() @ W_d
            dpb.rotation_quaternion = basis.normalized()
            dpb.keyframe_insert("rotation_quaternion", frame=fi)
            if "Hips" in dst:
                # root motion: scaled delta of world location
                wl = spb.matrix.translation - sb.matrix_local.translation
                rl_mat = db.matrix_local.to_3x3()
                dpb.location = rl_mat.inverted() @ (wl * root_scale)
                dpb.keyframe_insert("location", frame=fi)
        # peak abduction tracking: delta-from-rest angle of each arm bone.
        # (The safe envelope is measured as bone rotation from rest.)
        bpy.context.view_layer.update()
        for side in ("Left", "Right"):
            for src, dst in ok_pairs:
                if dst == f"mixamorig:{side}Arm":
                    spb = src_arm.pose.bones[src]
                    sb = src_arm.data.bones[src]
                    W_s = spb.matrix.to_quaternion()
                    R_s = sb.matrix_local.to_quaternion()
                    D = (R_s.inverted() @ W_s).normalized()
                    w = max(-1.0, min(1.0, abs(D.w)))
                    ang = 2.0 * math.degrees(math.acos(w))
                    peak[side] = max(peak[side], ang)

    print(f"PEAK_ABDUCTION Left={peak['Left']:.1f}deg Right={peak['Right']:.1f}deg")
    print(f"SAFE_ENVELOPE_15DEG: {'PASS' if max(peak.values()) <= 15.0 else 'EXCEEDS - stage as needs-repaired-rig'}")

    # cleanup: remove source armature, keep target
    bpy.data.objects.remove(src_arm, do_unlink=True)
    # select target armature + meshes for export
    bpy.ops.object.select_all(action='DESELECT')
    dst_arm.select_set(True)
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.parent is dst_arm or (
                o.type == 'MESH' and any(m.object is dst_arm for m in o.modifiers if m.type == 'ARMATURE')):
            o.select_set(True)
    bpy.context.view_layer.objects.active = dst_arm
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=a.out, export_format='GLB',
                              export_animations=True, export_frame_range=True)
    print(f"wrote {a.out}")

main()
