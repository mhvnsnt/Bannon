"""Hand-repaint shoulder weights on STICKUP_repaired.glb -> STICKUP_v3.glb.

Tech-artist fix for the auto-weight webbing: armpit/shoulder-cap verts bound
~100% to the Arm bone with no falloff. Repaints a smooth clavicle->arm
gradient using a cone-shaped blend boundary around the shoulder joint.

For each vertex near the shoulder joint:
  s = axial distance along arm bone from joint (can be negative)
  r = radial distance from arm bone axis
  d_blend = s - 0.6*r          (cone opens toward the body)
  target_arm = smoothstep(-0.03, 0.08, d_blend)
  remainder -> Shoulder (clavicle) / Spine2 (chest) by position
ForeArm/Hand/finger weights untouched. Everything outside 0.18m untouched.
"""
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC = argv[0] if len(argv) > 0 else "/home/hatch/workspace/bannon-video-pipe/repo/assets/models/STICKUP_repaired.glb"
DST = argv[1] if len(argv) > 1 else "/home/hatch/workspace/bannon-video-pipe/repo/assets/models/STICKUP_v3.glb"

def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
mesh = max((o for o in bpy.context.scene.objects if o.type == 'MESH'),
           key=lambda o: len(o.data.vertices))

def bone(short):
    for b in arm.data.bones:
        if b.name.split(":")[-1] == short: return b
    return None

def vg_index(name_short):
    for vg in mesh.vertex_groups:
        if vg.name.split(":")[-1] == name_short: return vg.index
    return None

# ensure Shoulder/Spine2 groups exist
for sname in ("LeftShoulder", "RightShoulder", "Spine2"):
    if vg_index(sname) is None:
        mesh.vertex_groups.new(name=f"mixamorig:{sname}")

R_REPAIR = 0.18
stats = {"touched": 0, "max_arm_before": 0.0}

for SIDE in ("Left", "Right"):
    arm_b = bone(f"{SIDE}Arm")
    jp = arm.matrix_world @ arm_b.head_local
    axis = (arm_b.tail_local - arm_b.head_local).normalized()
    # armature at origin so local==world for the axis
    gi_arm = vg_index(f"{SIDE}Arm")
    gi_sh = vg_index(f"{SIDE}Shoulder")
    gi_chest = vg_index("Spine2")
    gi_fore = vg_index(f"{SIDE}ForeArm")
    mw = mesh.matrix_world

    for v in mesh.data.vertices:
        wp = mw @ v.co
        dv = wp - jp
        dist = dv.length
        if dist > R_REPAIR or dist < 1e-6:
            continue
        # current weights
        cur = {g.group: g.weight for g in v.groups}
        w_arm = cur.get(gi_arm, 0.0)
        if w_arm < 0.05:
            continue  # already fine
        stats["max_arm_before"] = max(stats["max_arm_before"], w_arm)

        s = dv.dot(axis)
        r = (dv - s * axis).length
        d_blend = s - 0.6 * r
        target_arm = smoothstep(-0.03, 0.08, d_blend)

        # preserve forearm weight (elbow-side verts)
        w_fore = cur.get(gi_fore, 0.0)

        # remainder distribution: above joint -> clavicle; below/inward -> chest
        rem = 1.0 - target_arm - w_fore
        if rem < 0:
            # forearm dominates here; scale arm target down
            target_arm = max(0.0, 1.0 - w_fore)
            rem = 1.0 - target_arm - w_fore
        if s < 0.02:
            w_sh, w_chest = rem * 0.6, rem * 0.4
        else:
            w_sh, w_chest = rem * 0.3, rem * 0.7

        # keep other (finger/hand/etc) weights, drop old arm/shoulder/chest
        keep = {}
        for gi, w in cur.items():
            if gi in (gi_arm, gi_sh, gi_chest):
                continue
            keep[gi] = w
        # rebuild
        new_w = dict(keep)
        if target_arm > 0.001: new_w[gi_arm] = target_arm
        if w_sh > 0.001: new_w[gi_sh] = w_sh
        if w_chest > 0.001: new_w[gi_chest] = w_chest
        # normalize
        tot = sum(new_w.values())
        if tot <= 0:
            continue
        # clear and rewrite this vertex's groups
        # (bpy: remove from all groups then add)
        for vg in mesh.vertex_groups:
            vg.remove([v.index])
        for gi, w in new_w.items():
            if w > 0.0005:
                mesh.vertex_groups[gi].add([v.index], w / tot, 'REPLACE')
        stats["touched"] += 1

print(f"repaint stats: {stats}")

# verify: re-scan for rigid arm verts near joints
for SIDE in ("Left", "Right"):
    arm_b = bone(f"{SIDE}Arm")
    jp = arm.matrix_world @ arm_b.head_local
    gi_arm = vg_index(f"{SIDE}Arm")
    mw = mesh.matrix_world
    rigid = 0
    worst = 0.0
    for v in mesh.data.vertices:
        if (mw @ v.co - jp).length > 0.15: continue
        for g in v.groups:
            if g.group == gi_arm:
                worst = max(worst, g.weight)
                if g.weight >= 0.9 and len(v.groups) == 1:
                    rigid += 1
    print(f"  {SIDE}: rigid single-bone Arm verts within 0.15: {rigid}, max Arm weight: {worst:.2f}")

# export
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB')
print(f"exported {DST}")
import os; print(f"size: {os.path.getsize(DST)} bytes")
