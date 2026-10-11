"""Repaint v3: minimal, smooth, from ORIGINAL.
Only reduces Arm weight on verts that are clearly wrong (>0.05m from bone
with Arm>0.3). Uses WIDE smooth falloffs. Then blurs the Arm vertex groups
to eliminate discontinuities. Gives remainder to Spine2 (chest).
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
# make mesh the active object for vertex_group ops
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)

def bone(short):
    for b in arm.data.bones:
        if b.name.split(":")[-1] == short: return b
    return None

def vg_index(name_short):
    for vg in mesh.vertex_groups:
        if vg.name.split(":")[-1] == name_short: return vg.index
    return None

gi_chest = vg_index("Spine2")
mw = mesh.matrix_world
stats = {"reduced": 0}

for SIDE in ("Left", "Right"):
    ab = bone(f"{SIDE}Arm")
    jh = arm.matrix_world @ ab.head_local
    jt = arm.matrix_world @ ab.tail_local
    seg = jt - jh
    seg_len2 = seg.length_squared
    gi_arm = vg_index(f"{SIDE}Arm")

    for v in mesh.data.vertices:
        cur = {g.group: g.weight for g in v.groups}
        w_arm = cur.get(gi_arm, 0.0)
        if w_arm < 0.3:
            continue
        wp = mw @ v.co
        pa = wp - jh
        t = pa.dot(seg) / seg_len2
        tc = max(0.0, min(1.0, t))
        dseg = (wp - (jh + tc * seg)).length
        if dseg < 0.05:
            continue  # on the arm, leave alone
        # wide smooth falloff
        f_radial = 1.0 - smoothstep(0.03, 0.12, dseg)
        f_axial = smoothstep(-0.08, 0.25, t)
        target = f_radial * f_axial
        if target >= w_arm - 0.01:
            continue
        cut = w_arm - target
        stats["reduced"] += 1
        new_w = dict(cur)
        new_w[gi_arm] = target
        new_w[gi_chest] = new_w.get(gi_chest, 0.0) + cut
        tot = sum(new_w.values())
        for vg in mesh.vertex_groups:
            vg.remove([v.index])
        for gi, w in new_w.items():
            if w > 0.0005:
                mesh.vertex_groups[gi].add([v.index], w / tot, 'REPLACE')

print(f"v3 carve stats: {stats}")

# blur the Arm vertex groups to kill discontinuities
# (vertex_group_smooth needs weight-paint context in headless)
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
for SIDE in ("Left", "Right"):
    vgi = vg_index(f"{SIDE}Arm")
    mesh.vertex_groups.active_index = vgi
    for _ in range(4):
        bpy.ops.object.vertex_group_smooth(factor=0.5, repeat=1, expand=0.3)
    print(f"  smoothed {SIDE}Arm group")
bpy.ops.object.mode_set(mode='OBJECT')

# verify
for SIDE in ("Left", "Right"):
    ab = bone(f"{SIDE}Arm")
    jh = arm.matrix_world @ ab.head_local
    jt = arm.matrix_world @ ab.tail_local
    gi_arm = vg_index(f"{SIDE}Arm")
    bad = 0
    for v in mesh.data.vertices:
        wp = mw @ v.co
        pa = wp - jh
        seg = jt - jh
        t = pa.dot(seg) / seg.length_squared
        tc = max(0.0, min(1.0, t))
        dseg = (wp - (jh + tc * seg)).length
        if dseg > 0.08:
            for g in v.groups:
                if g.group == gi_arm and g.weight > 0.5:
                    bad += 1
                    break
    print(f"  {SIDE}: verts >0.08 from bone with Arm>0.5: {bad}")

bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB')
print(f"exported {DST}")
import os; print(f"size: {os.path.getsize(DST)} bytes")
