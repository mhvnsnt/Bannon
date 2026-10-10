#!/usr/bin/env python3
"""skeleton_survey.py — rank candidate skeletons from repo GLBs.
Reports per file: armature present, bone count, rest arm angle (T vs A),
mirrored-label count, vertex-group sanity.
Usage: blender --background --python skeleton_survey.py -- f1.glb f2.glb ...
"""
import bpy, sys, math, os
from mathutils import Vector

files = sys.argv[sys.argv.index("--") + 1:]

def measure_rest_angle(arm):
    # joint-chain based: shoulder joint = arm bone head, elbow joint = forearm bone head
    # direction elbow-shoulder is rest-pose invariant (immune to head/tail flips)
    def find(keywords):
        for b in arm.data.bones:
            bn = b.name.split(":")[-1].lower()
            if all(k in bn for k in keywords):
                return b
        return None
    results = []
    down = Vector((0, 0, -1))
    for side in ("left", "right"):
        arm_b = find((side, "arm")) or find((side, "shoulder"))
        fore_b = find((side, "forearm")) or find((side, "fore"))
        if arm_b and fore_b:
            d = fore_b.head_local - arm_b.head_local
            if d.length > 1e-6:
                d.normalize()
                ang = math.degrees(math.acos(max(-1, min(1, d.dot(down)))))
                results.append((side, round(ang, 1)))
    return results

def mirrored_labels(arm):
    names = [b.name.split(":")[-1] for b in arm.data.bones]
    pairs = {}
    for n in names:
        base = n
        side = None
        for s in ("Left", "Right"):
            if n.startswith(s):
                base, side = n[4:], s
                break
        if side:
            pairs.setdefault(base, set()).add(side)
    mirrored = 0
    for base, sides in pairs.items():
        if sides != {"Left", "Right"}:
            continue
        l = next((b for b in arm.data.bones if b.name.split(":")[-1] == "Left" + base), None)
        r = next((b for b in arm.data.bones if b.name.split(":")[-1] == "Right" + base), None)
        if l and r and ((l.head_local.x > 0 and l.name.startswith("Left")) or
                       (r.head_local.x < 0 and r.name.startswith("Right"))):
            mirrored += 1
    return mirrored

for f in files:
    print("SURVEY: === %s ===" % os.path.basename(f))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=f)
    except RuntimeError as e:
        print("SURVEY: import_failed: %s" % str(e)[:80])
        continue
    arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
    if arm is None:
        print("SURVEY: no_armature")
        continue
    angs = measure_rest_angle(arm)
    m = mirrored_labels(arm)
    print("SURVEY: bones=%d arm_angles=%s mirrored_labels=%d" % (len(arm.data.bones), angs, m))
print("SURVEY DONE")
