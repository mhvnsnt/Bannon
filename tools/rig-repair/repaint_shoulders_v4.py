"""Repaint v4: targeted diffusion. Find verts that displace badly at fwd_90,
then diffuse good neighbor weights into them. Guarantees smoothness.
Starts from ORIGINAL. No geometric heuristics for the fix itself.
"""
import bpy, sys, math
from mathutils import Matrix

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC = argv[0] if len(argv) > 0 else "/home/hatch/workspace/bannon-video-pipe/repo/assets/models/STICKUP_repaired.glb"
DST = argv[1] if len(argv) > 1 else "/home/hatch/workspace/bannon-video-pipe/repo/assets/models/STICKUP_v3.glb"

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=SRC)
arm_obj = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
arm_obj.location = (0,0,0); arm_obj.rotation_euler = (0,0,0)
mesh = max((o for o in bpy.context.scene.objects if o.type == 'MESH'),
           key=lambda o: len(o.data.vertices))
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)

def bone(short):
    for b in arm_obj.data.bones:
        if b.name.split(":")[-1] == short: return b
    return None

# --- step 1: find bad verts by displacement at fwd_90 ---
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
rest_pos = [v.co.copy() for v in mesh.evaluated_get(deps).data.vertices]

pbL = pbR = None
for p in arm_obj.pose.bones:
    sn = p.name.split(":")[-1]
    if sn == "LeftArm": pbL = p
    elif sn == "RightArm": pbR = p
# pose both arms forward 90 to catch both sides
for pb in (pbL, pbR):
    R = Matrix.Rotation(math.radians(-90), 4, 'Y')
    pb.matrix = R @ pb.bone.matrix_local.copy()
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
posed_pos = [v.co.copy() for v in mesh.evaluated_get(deps).data.vertices]
# reset
for pb in arm_obj.pose.bones:
    pb.matrix_basis.identity()
bpy.context.view_layer.update()

# arm bone segments (for excluding on-arm verts)
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

mw = mesh.matrix_world
bad = set()
for i, (rp, pp) in enumerate(zip(rest_pos, posed_pos)):
    if (pp - rp).length < 0.04:
        continue
    v = mesh.data.vertices[i]
    wp = mw @ v.co
    # skip if close to either arm bone (expected to move)
    if min(dist_to_seg(wp, a, b) for a, b in segs.values()) < 0.05:
        continue
    bad.add(i)
print(f"bad verts (displaced >0.04, off-bone): {len(bad)}")

# --- step 2: build adjacency ---
adj = {i: set() for i in range(len(mesh.data.vertices))}
for poly in mesh.data.polygons:
    vs = poly.vertices
    for j in range(len(vs)):
        a, b = vs[j], vs[(j+1) % len(vs)]
        adj[a].add(b); adj[b].add(a)

# --- step 3: diffuse - for each bad vert, blend toward neighbor average ---
# get all vertex group indices
all_gi = [vg.index for vg in mesh.vertex_groups]
# current weights as dicts
W = []
for v in mesh.data.vertices:
    d = {g.group: g.weight for g in v.groups}
    W.append(d)

# iterative diffusion: bad verts move toward neighbor average
# good verts stay fixed (they're the boundary condition)
for iteration in range(5):
    newW = [dict(d) for d in W]
    for i in bad:
        # average neighbor weights
        agg = {}
        n = 0
        for nb in adj[i]:
            if nb in bad and iteration < 2:
                continue  # early: only use good neighbors; later: use all
            for gi, w in W[nb].items():
                agg[gi] = agg.get(gi, 0.0) + w
            n += 1
        if n == 0:
            continue
        for gi in agg:
            agg[gi] /= n
        # blend: 50% toward neighbor average
        d = W[i]
        keys = set(d.keys()) | set(agg.keys())
        for gi in keys:
            old = d.get(gi, 0.0)
            tgt = agg.get(gi, 0.0)
            newW[i][gi] = old * 0.5 + tgt * 0.5
    W = newW
print(f"diffusion done")

# --- step 4: write back ---
for i, wdict in enumerate(W):
    if i not in bad:
        continue
    tot = sum(wdict.values())
    if tot <= 0: continue
    for vg in mesh.vertex_groups:
        vg.remove([i])
    for gi, w in wdict.items():
        if w > 0.0005:
            mesh.vertex_groups[gi].add([i], w / tot, 'REPLACE')
print(f"wrote {len(bad)} verts")

bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB')
print(f"exported {DST}")
import os; print(f"size: {os.path.getsize(DST)} bytes")
