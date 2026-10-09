"""Repaint v5: deltoid reweight. The deltoid (shoulder cap) is weighted to the
clavicle (Shoulder bone), but the pipeline fixes the clavicle at rest. When the
arm raises, the clavicle-weighted deltoid stays put while the arm-weighted arm
moves -> shear/webbing. Fix: transfer deltoid weights from Shoulder to Arm.
For verts with Shoulder weight > 0.2 in the deltoid region (within 0.12 of joint,
lateral/outer side), move 60% of Shoulder weight to Arm. Then smooth.
"""
import bpy, sys, math

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC = argv[0] if len(argv) > 0 else "/home/hatch/workspace/bannon-video-pipe/repo/assets/models/STICKUP_repaired.glb"
DST = argv[1] if len(argv) > 1 else "/home/hatch/workspace/bannon-video-pipe/repo/assets/models/STICKUP_v3.glb"

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=SRC)
arm_obj = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
arm_obj.location=(0,0,0); arm_obj.rotation_euler=(0,0,0)
mesh = max((o for o in bpy.context.scene.objects if o.type == 'MESH'),
           key=lambda o: len(o.data.vertices))
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)

def bone(short):
    for b in arm_obj.data.bones:
        if b.name.split(":")[-1] == short: return b
    return None

def vg_index(name_short):
    for vg in mesh.vertex_groups:
        if vg.name.split(":")[-1] == name_short: return vg.index
    return None

mw = mesh.matrix_world
stats = {"moved": 0}

for SIDE in ("Left", "Right"):
    ab = bone(f"{SIDE}Arm")
    jh = arm_obj.matrix_world @ ab.head_local
    gi_arm = vg_index(f"{SIDE}Arm")
    gi_sh = vg_index(f"{SIDE}Shoulder")
    # lateral direction: for Left arm (-Y side), lateral is -Y; for Right (+Y), +Y
    lat_sign = -1 if SIDE == "Left" else 1

    for v in mesh.data.vertices:
        cur = {g.group: g.weight for g in v.groups}
        w_sh = cur.get(gi_sh, 0.0)
        if w_sh < 0.2:
            continue
        wp = mw @ v.co
        d = (wp - jh).length
        if d > 0.12:
            continue
        # lateral check: vert should be on the outer side (away from body center)
        # body center is at y~0, so for Left (y<0), lateral means y < joint_y
        jy = jh.y
        if SIDE == "Left" and wp.y > jy + 0.02:
            continue  # medial, not deltoid
        if SIDE == "Right" and wp.y < jy - 0.02:
            continue
        # transfer 60% of shoulder weight to arm
        move = w_sh * 0.6
        stats["moved"] += 1
        new_w = dict(cur)
        new_w[gi_sh] = w_sh - move
        new_w[gi_arm] = new_w.get(gi_arm, 0.0) + move
        tot = sum(new_w.values())
        for vg in mesh.vertex_groups:
            vg.remove([v.index])
        for gi, w in new_w.items():
            if w > 0.0005:
                mesh.vertex_groups[gi].add([v.index], w / tot, 'REPLACE')

print(f"v5 deltoid reweight: {stats}")

# smooth the affected groups
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
for sname in ("LeftArm", "RightArm", "LeftShoulder", "RightShoulder"):
    vgi = vg_index(sname)
    mesh.vertex_groups.active_index = vgi
    for _ in range(3):
        bpy.ops.object.vertex_group_smooth(factor=0.5, repeat=1, expand=0.3)
    print(f"  smoothed {sname}")
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB')
print(f"exported {DST}")
import os; print(f"size: {os.path.getsize(DST)} bytes")
