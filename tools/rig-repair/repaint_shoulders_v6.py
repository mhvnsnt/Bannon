"""Repaint v6 (final automated attempt): combined approach.
1. Mild deltoid: transfer 25% of Shoulder->Arm in deltoid region (not 60%).
2. Aggressive diffusion: threshold 0.02, 10 iterations, from ORIGINAL.
3. Smooth all affected groups.
If this doesn't achieve zero webbing at 90, the model needs manual sculpting.
"""
import bpy, sys, math
from mathutils import Matrix

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

# --- step 1: mild deltoid (25%, not 60%) ---
for SIDE in ("Left", "Right"):
    ab = bone(f"{SIDE}Arm")
    jh = arm_obj.matrix_world @ ab.head_local
    gi_arm = vg_index(f"{SIDE}Arm"); gi_sh = vg_index(f"{SIDE}Shoulder")
    jy = jh.y
    for v in mesh.data.vertices:
        cur = {g.group: g.weight for g in v.groups}
        w_sh = cur.get(gi_sh, 0.0)
        if w_sh < 0.25: continue
        wp = mw @ v.co
        if (wp - jh).length > 0.10: continue
        if SIDE == "Left" and wp.y > jy + 0.02: continue
        if SIDE == "Right" and wp.y < jy - 0.02: continue
        move = w_sh * 0.25
        new_w = dict(cur); new_w[gi_sh] = w_sh - move
        new_w[gi_arm] = new_w.get(gi_arm, 0.0) + move
        tot = sum(new_w.values())
        for vg in mesh.vertex_groups: vg.remove([v.index])
        for gi, w in new_w.items():
            if w > 0.0005: mesh.vertex_groups[gi].add([v.index], w/tot, 'REPLACE')
print("step 1 (mild deltoid) done")

# --- step 2: find bad verts at fwd_90 AND lat_90 ---
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
rest_pos = [v.co.copy() for v in mesh.evaluated_get(deps).data.vertices]
pbL = pbR = None
for p in arm_obj.pose.bones:
    sn = p.name.split(":")[-1]
    if sn == "LeftArm": pbL = p
    elif sn == "RightArm": pbR = p
# pose both arms: forward 90 on left, lateral 90 on right (catch both)
R1 = Matrix.Rotation(math.radians(-90), 4, 'Y')
R2 = Matrix.Rotation(math.radians(-90), 4, 'X')  # right arm lateral (mirror)
pbL.matrix = R1 @ pbL.bone.matrix_local.copy()
# for right arm lateral: arm at +Y side, lateral is +Y direction
# rotation around X by +90: (0,0,-1) -> (0,1,0)? R_x(90): y'=-z=1, z'=y=0 -> (0,1,0) yes
R2 = Matrix.Rotation(math.radians(90), 4, 'X')
pbR.matrix = R2 @ pbR.bone.matrix_local.copy()
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
posed_pos = [v.co.copy() for v in mesh.evaluated_get(deps).data.vertices]
for pb in arm_obj.pose.bones: pb.matrix_basis.identity()
bpy.context.view_layer.update()

segs = {}
for SIDE, pb in (("Left", pbL), ("Right", pbR)):
    ab = bone(f"{SIDE}Arm")
    jh = arm_obj.matrix_world @ ab.head_local
    jt = arm_obj.matrix_world @ ab.tail_local
    segs[SIDE] = (jh, jt)
def dist_to_seg(p, a, b):
    pa, ba = p - a, b - a
    t = max(0, min(1, pa.dot(ba) / ba.length_squared))
    return (pa - t * ba).length

bad = set()
for i, (rp, pp) in enumerate(zip(rest_pos, posed_pos)):
    if (pp - rp).length < 0.02: continue
    v = mesh.data.vertices[i]; wp = mw @ v.co
    if min(dist_to_seg(wp, a, b) for a, b in segs.values()) < 0.05: continue
    bad.add(i)
print(f"bad verts: {len(bad)}")

# --- step 3: aggressive diffusion ---
adj = {i: set() for i in range(len(mesh.data.vertices))}
for poly in mesh.data.polygons:
    vs = poly.vertices
    for j in range(len(vs)):
        a, b = vs[j], vs[(j+1) % len(vs)]
        adj[a].add(b); adj[b].add(a)
W = [{g.group: g.weight for g in v.groups} for v in mesh.data.vertices]
for iteration in range(10):
    newW = [dict(d) for d in W]
    for i in bad:
        agg = {}; n = 0
        for nb in adj[i]:
            if nb in bad and iteration < 4: continue
            for gi, w in W[nb].items(): agg[gi] = agg.get(gi, 0.0) + w
            n += 1
        if n == 0: continue
        for gi in agg: agg[gi] /= n
        d = W[i]; keys = set(d.keys()) | set(agg.keys())
        for gi in keys:
            newW[i][gi] = d.get(gi, 0.0) * 0.4 + agg.get(gi, 0.0) * 0.6
    W = newW
print("diffusion done")
for i in bad:
    wdict = W[i]; tot = sum(wdict.values())
    if tot <= 0: continue
    for vg in mesh.vertex_groups: vg.remove([i])
    for gi, w in wdict.items():
        if w > 0.0005: mesh.vertex_groups[gi].add([i], w/tot, 'REPLACE')
print(f"wrote {len(bad)} verts")

# --- step 4: smooth ---
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
for sname in ("LeftArm", "RightArm", "LeftShoulder", "RightShoulder"):
    vgi = vg_index(sname); mesh.vertex_groups.active_index = vgi
    for _ in range(4):
        bpy.ops.object.vertex_group_smooth(factor=0.5, repeat=1, expand=0.3)
bpy.ops.object.mode_set(mode='OBJECT')
print("smoothing done")

bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB')
print(f"exported {DST}")
import os; print(f"size: {os.path.getsize(DST)} bytes")
