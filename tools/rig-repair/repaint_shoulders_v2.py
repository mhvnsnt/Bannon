"""Repaint v2: aggressive carve-away of bad Arm weights using bone-segment coords.
For each vert with Arm weight > 0.1:
  t = axial position along arm bone (0=joint/shoulder, 1=elbow)
  dseg = radial distance from arm bone segment
  target_arm = smoothstep(-0.05,0.15,t) * (1 - smoothstep(0.03,0.08,dseg))
  If target < current: reduce Arm to target, give remainder to Shoulder/Chest by position.
Leaves good weights alone. Never increases Arm weight.
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

for sname in ("LeftShoulder", "RightShoulder", "Spine2"):
    if vg_index(sname) is None:
        mesh.vertex_groups.new(name=f"mixamorig:{sname}")

stats = {"reduced": 0, "max_cut": 0.0}
mw = mesh.matrix_world

for SIDE in ("Left", "Right"):
    ab = bone(f"{SIDE}Arm")
    jh = arm.matrix_world @ ab.head_local
    jt = arm.matrix_world @ ab.tail_local
    seg = jt - jh
    seg_len2 = seg.length_squared
    seg_len = math.sqrt(seg_len2)
    gi_arm = vg_index(f"{SIDE}Arm")
    gi_sh = vg_index(f"{SIDE}Shoulder")
    gi_chest = vg_index("Spine2")

    for v in mesh.data.vertices:
        cur = {g.group: g.weight for g in v.groups}
        w_arm = cur.get(gi_arm, 0.0)
        if w_arm < 0.1:
            continue
        wp = mw @ v.co
        # axial t and radial dseg
        pa = wp - jh
        t = pa.dot(seg) / seg_len2  # 0=joint, 1=elbow
        closest = jh + t * seg
        # clamp t for distance calc but keep raw t for logic
        tc = max(0.0, min(1.0, t))
        dseg = (wp - (jh + tc * seg)).length

        f_axial = smoothstep(-0.05, 0.15, t)
        f_radial = 1.0 - smoothstep(0.03, 0.08, dseg)
        target = f_axial * f_radial
        # never increase; only carve
        if target >= w_arm - 0.01:
            continue
        cut = w_arm - target
        stats["reduced"] += 1
        stats["max_cut"] = max(stats["max_cut"], cut)

        # redistribute cut to Shoulder/Chest by axial position
        # above joint -> more clavicle; along arm -> more chest (armpit)
        if t < 0.05:
            sh_frac, ch_frac = 0.65, 0.35
        else:
            sh_frac, ch_frac = 0.35, 0.65
        new_w = dict(cur)
        new_w[gi_arm] = target
        new_w[gi_sh] = new_w.get(gi_sh, 0.0) + cut * sh_frac
        new_w[gi_chest] = new_w.get(gi_chest, 0.0) + cut * ch_frac
        tot = sum(new_w.values())
        for vg in mesh.vertex_groups:
            vg.remove([v.index])
        for gi, w in new_w.items():
            if w > 0.0005:
                mesh.vertex_groups[gi].add([v.index], w / tot, 'REPLACE')

print(f"v2 repaint stats: {stats}")

# verify rigid verts near segment
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
        if dseg > 0.06:  # off the arm
            for g in v.groups:
                if g.group == gi_arm and g.weight > 0.5:
                    bad += 1
                    break
    print(f"  {SIDE}: verts >0.06 from bone with Arm>0.5: {bad}")

bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB')
print(f"exported {DST}")
import os; print(f"size: {os.path.getsize(DST)} bytes")
