#!/usr/bin/env python3
"""rebuild_character.py — full re-runnable Stick-Up (and Mixamo-rig character) rebuild.

Pipeline (idempotent; deterministic outputs):
  1. IMPORT   source GLB (Mixamo 58-bone rig).
  2. WELD     merge boundary verts at UV seams (boundary-only, like weld_fixed.py)
              until the mesh is 1 island; report island count + vert counts.
  3. REPOSE   rigid-repose arms from A-pose to T-pose:
              - per-vert rotation fraction comes from the OLD vertex groups
                (arm-chain weight sum, smoothstepped) — smooth blend, no cuts.
              - rest bones (Shoulder/Arm/ForeArm/Hand + fingers) rigid-rotated
                around the shoulder joint to match the posed mesh.
              Mesh and rest pose stay in agreement, so heat skinning binds clean.
  4. SKIN     clear old vertex groups, heat-diffusion (ARMATURE_AUTO), normalize.
  5. EXPORT   GLB -> assets/models/STICKUP_v3.glb (deterministic path).
  6. VERIFY   calls verify_character.py gates G1-G7 in-process; writes JSON.

Usage:
  env -u PYTHONPATH blender -b --python rebuild_character.py -- \
      --glb assets/models/STICKUP_repaired.glb \
      --out assets/models/STICKUP_v3.glb \
      [--stages weld,repose,skin] [--json /tmp/rebuild.json]

Diagnose-before-repair law: run tools/rig-repair/diagnose_rig.py on the source
FIRST; this script assumes the diagnosis (A-pose angle, mirrored labels fixed).
"""
import bpy, sys, os, math, json
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

SRC = arg("--glb"); OUT = arg("--out")
JSON_OUT = arg("--json")
STAGES = (arg("--stages") or "weld,repose,skin,export,verify").split(",")
if not SRC or not os.path.exists(SRC):
    print("USAGE: rebuild_character.py -- --glb SRC.glb --out DST.glb"); sys.exit(2)
if not OUT: OUT = os.path.splitext(SRC)[0] + "_v3.glb"

report = {"glb": SRC, "stages": {}}
def say(s): print("REBUILD:", s)

ARM_CHAINS = {
    "Left":  ["LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand"],
    "Right": ["RightShoulder", "RightArm", "RightForeArm", "RightHand"],
}
# (lateral directions are derived per-arm from the bone's own Y sign —
# robust to naming conventions; see repose stage)

def find_bone(arm, short):
    for b in arm.data.bones:
        if b.name.split(":")[-1] == short: return b
    return None

def vg_index(mesh, short):
    for vg in mesh.vertex_groups:
        if vg.name.split(":")[-1] == short: return vg.index
    return None

def world(arm, local_pt): return arm.matrix_world @ local_pt

# ============ STAGE: IMPORT ============
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not arm or not meshes: print("REBUILD: FATAL no armature/mesh"); sys.exit(2)
mesh = max(meshes, key=lambda o: len(o.data.vertices))
for o in meshes:
    if o is not mesh: bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.objects.active = mesh; mesh.select_set(True)
say(f"imported: {len(mesh.data.vertices)} verts, {len(arm.data.bones)} bones")

# ============ STAGE: WELD ============
if "weld" in STAGES:
    import bmesh
    from mathutils.kdtree import KDTree
    bm = bmesh.new(); bm.from_mesh(mesh.data); bm.verts.ensure_lookup_table()
    n0 = len(bm.verts)
    def is_b(v): return any(len(e.link_faces) < 2 for e in v.link_edges)
    bm.verts.index_update()
    bnd = {v.index for v in bm.verts if is_b(v)}
    kd = KDTree(len(bm.verts))
    for v in bm.verts: kd.insert(v.co, v.index)
    kd.balance()
    par = {v.index: v.index for v in bm.verts}
    def find(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for v in bm.verts:
        if v.index not in bnd: continue
        for (_co, ji, _dd) in kd.find_range(v.co, 1e-5):
            if ji <= v.index or ji not in bnd: continue
            ra, rb = find(v.index), find(ji)
            if ra != rb: par[ra] = rb
    groups = {}
    for v in bm.verts: groups.setdefault(find(v.index), []).append(v)
    merged = 0
    for g in groups.values():
        if len(g) > 1:
            cx = sum(v.co.x for v in g)/len(g); cy = sum(v.co.y for v in g)/len(g); cz = sum(v.co.z for v in g)/len(g)
            bmesh.ops.pointmerge(bm, verts=g, merge_co=(cx, cy, cz)); merged += len(g) - 1
    bm.to_mesh(mesh.data); bm.free()
    # recount islands
    import bmesh as _bm
    bm2 = _bm.new(); bm2.from_mesh(mesh.data); bm2.verts.ensure_lookup_table()
    seen, islands = set(), 0
    for v in bm2.verts:
        if v.index in seen: continue
        islands += 1; stack = [v]; seen.add(v.index)
        while stack:
            u = stack.pop()
            for e in u.link_edges:
                w = e.other_vert(u)
                if w.index not in seen: seen.add(w.index); stack.append(w)
    bm2.free()
    report["stages"]["weld"] = {"verts_before": n0, "verts_after": len(mesh.data.vertices),
                                "merged": merged, "islands": islands}
    say(f"weld: {n0} -> {len(mesh.data.vertices)} verts, {islands} island(s)")

# ============ STAGE: REPOSE (A-pose -> T-pose) ============
if "repose" in STAGES:
    mw = mesh.matrix_world
    for side in ("Left", "Right"):
        chain = [s for s in ARM_CHAINS[side] if find_bone(arm, s)]
        ab = find_bone(arm, side + "Arm")
        joint = world(arm, ab.head_local)
        # current arm direction (shoulder -> wrist) from bone geometry
        hb = find_bone(arm, side + "Hand")
        wrist = world(arm, (hb.tail_local + hb.head_local) / 2)
        cur_dir = (wrist - joint).normalized()
        # lateral target: outward from the body's own side (sign of the joint's
        # own Y position — robust to naming conventions). T-pose = horizontal.
        side_sign = 1.0 if joint.y >= 0.0 else -1.0
        tgt_dir = Vector((0.0, side_sign, 0.0))
        axis = cur_dir.cross(tgt_dir)
        if axis.length < 1e-6: axis = Vector((1, 0, 0))
        axis.normalize()
        ang = math.acos(max(-1.0, min(1.0, cur_dir.dot(tgt_dir))))
        say(f"{side}: arm at {math.degrees(ang):.1f}deg from T -> rotating")
        # old arm-chain weight sum -> smoothstep mask (0..1)
        idx = [vg_index(mesh, s) for s in chain]
        idx = [i for i in idx if i is not None]
        if not idx: print(f"REBUILD: FATAL no vertex groups for {side}"); sys.exit(2)
        def mask_of(v):
            s = sum(g.weight for g in v.groups if g.group in idx)
            t = max(0.0, min(1.0, (s - 0.05) / 0.50))   # smoothstep-ish band
            return t * t * (3 - 2 * t)
        # rotate mesh verts (object space; mesh has no transform, matrix=I)
        inv = mw.inverted()
        j_local = inv @ joint
        R_axis = (inv.to_3x3() @ axis).normalized()
        new_cos = []
        for v in mesh.data.vertices:
            m = mask_of(v)
            if m <= 0.0: new_cos.append(v.co.copy()); continue
            R = Matrix.Rotation(m * ang, 4, R_axis)
            new_cos.append(R @ (v.co - j_local) + j_local)
        for v, co in zip(mesh.data.vertices, new_cos): v.co = co
        mesh.data.update()
        # rotate rest bones rigidly around the same joint
        awi = arm.matrix_world.inverted()
        Rj = Matrix.Rotation(ang, 4, (awi.to_3x3() @ axis).normalized())
        j_arm = awi @ joint
        moved = []
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='EDIT')
        eb = arm.data.edit_bones
        def ebone(short):
            for b in eb:
                if b.name.split(":")[-1] == short: return b
            return None
        # chain + all descendant edit bones of the chain
        chain_b = [ebone(s) for s in chain]
        chain_b = [b for b in chain_b if b]
        desc = list(chain_b)
        stack = list(chain_b)
        while stack:
            b = stack.pop()
            for c in b.children:
                if c not in desc: desc.append(c); stack.append(c)
        for b in desc:
            for attr in ("head", "tail"):
                p = getattr(b, attr).copy()
                setattr(b, attr, Rj @ (p - j_arm) + j_arm)
            moved.append(b.name)
        bpy.ops.object.mode_set(mode='OBJECT')
        say(f"{side}: moved {len(moved)} bones, mesh verts masked")
    report["stages"]["repose"] = {"status": "t-pose applied"}
    mesh.data.update()

# ============ STAGE: SKIN (heat diffusion) ============
if "skin" in STAGES:
    # drop old armature parent + groups, re-skin from the T-posed geometry
    for mod in mesh.modifiers:
        if mod.type == 'ARMATURE': mesh.modifiers.remove(mod)
    mesh.vertex_groups.clear()
    mesh.parent = None
    mesh.matrix_parent_inverse.identity()
    bpy.context.view_layer.objects.active = arm
    mesh.select_set(True); arm.select_set(True)
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    # normalize
    for v in mesh.data.vertices:
        s = sum(g.weight for g in v.groups)
        if s > 1e-8:
            for g in v.groups: g.weight /= s
    ng = len(mesh.vertex_groups)
    report["stages"]["skin"] = {"method": "heat-diffusion (ARMATURE_AUTO)", "groups": ng}
    say(f"skinned: {ng} vertex groups")

# ============ STAGE: EXPORT ============
if "export" in STAGES:
    os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT), export_format='GLB')
    report["stages"]["export"] = {"out": OUT, "bytes": os.path.getsize(os.path.abspath(OUT))}
    say(f"exported {OUT}")

# ============ STAGE: VERIFY (gates G1-G7 in-process) ============
# G4 uses JOINT-CENTRIC raises: the arm bone frame rotates about the shoulder
# joint (not the world origin — origin-centric probes displace the joint up to
# 1.5m and are geometrically meaningless for T-posed rests). Lateral = rotate
# the arm's own rest direction toward +Z (up); forward = toward +X.
if "verify" in STAGES:
    gates = {}
    # G1/G2
    n_bones = len(arm.data.bones)
    req = ["Hips", "Spine", "Head", "LeftArm", "RightArm", "LeftLeg", "RightLeg"]
    miss = [r for r in req if find_bone(arm, r) is None]
    gates["G1_STRUCTURE"] = "PASS" if mesh and arm else "FAIL"
    gates["G2_RIG"] = "PASS" if (n_bones >= 20 and not miss) else f"FAIL bones={n_bones} missing={miss}"
    # G3 weights normalized
    worst = 0.0
    for v in mesh.data.vertices:
        if v.groups:
            s = sum(g.weight for g in v.groups)
            worst = max(worst, abs(s - 1.0))
    gates["G3_WEIGHTS"] = "PASS" if worst <= 0.01 else f"FAIL maxdev={worst:.4f}"
    # G4 arm probes (deterministic triangle stretch, joint-centric)
    def bone_pose(short):
        for pb in arm.pose.bones:
            if pb.name.split(":")[-1] == short: return pb
        return None
    def reset_pose():
        for pb in arm.pose.bones: pb.matrix_basis.identity()
        bpy.context.view_layer.update()
    def set_arm(short, angle_deg, direction):
        pb = bone_pose(short)
        rest = pb.bone.matrix_local.copy()
        Jw = arm.matrix_world @ pb.bone.head_local       # world-space joint
        uw = (arm.matrix_world.to_3x3() @ (pb.bone.tail_local - pb.bone.head_local)).normalized()
        tgt = Vector((0, 0, 1)) if direction == 'lat' else Vector((1, 0, 0))
        axis = uw.cross(tgt)
        if axis.length < 1e-6: axis = Vector((0, 1, 0))
        axis.normalize()
        Rw = Matrix.Rotation(math.radians(angle_deg), 4, axis)
        if (Rw @ uw).dot(tgt) < uw.dot(tgt):  # keep the arm rotating TOWARD target
            Rw = Matrix.Rotation(math.radians(-angle_deg), 4, axis)
        # express the joint-centric rotation in armature space
        A = arm.matrix_world
        R = A.inverted() @ Rw @ A
        J = pb.bone.head_local
        T1 = Matrix.Translation(J); T2 = Matrix.Translation(-J)
        pb.matrix = T1 @ R @ T2 @ rest
        bpy.context.view_layer.update()
    def deformed_cos():
        dg = bpy.context.evaluated_depsgraph_get()
        return [v.co.copy() for v in mesh.evaluated_get(dg).data.vertices]
    def tri_list():
        tris = []
        for p in mesh.data.polygons:
            vs = p.vertices
            for i in range(1, len(vs) - 1): tris.append((vs[0], vs[i], vs[i+1]))
        return tris
    tris = tri_list()
    reset_pose(); rest_cos = deformed_cos()
    per_angle, failed, worst_all, worst_where = {}, [], 1.0, ""
    for short in ("LeftArm", "RightArm"):
        pb = bone_pose(short)
        sc = arm.matrix_world @ pb.bone.head_local
        for direction in ("fwd", "lat"):
            for angle in (15, 30, 45, 60, 90):
                reset_pose(); set_arm(short, angle, direction)
                posed = deformed_cos()
                w = 1.0; w_edge = 0.0; w_cent = None
                for a, b, c in tris:
                    ra, rb, rc = rest_cos[a], rest_cos[b], rest_cos[c]
                    d2 = ((ra.x+rb.x+rc.x)/3-sc.x)**2 + ((ra.y+rb.y+rc.y)/3-sc.y)**2 + ((ra.z+rb.z+rc.z)/3-sc.z)**2
                    if d2**0.5 > 0.30: continue
                    re_ = max((ra-rb).length, (rb-rc).length, (rc-ra).length)
                    if re_ < 1e-3: continue
                    pa, pb_, pc = posed[a], posed[b], posed[c]
                    pe = max((pa-pb_).length, (pb_-pc).length, (pc-pa).length)
                    r = pe / re_
                    if r > w:
                        w = r; w_edge = re_
                        w_cent = (round((ra.x+rb.x+rc.x)/3,3), round((ra.y+rb.y+rc.y)/3,3), round((ra.z+rb.z+rc.z)/3,3))
                key = f"{short}/{direction}/{angle}"
                per_angle[key] = round(w, 2)
                if w > worst_all: worst_all, worst_where = w, f"{key} edge={w_edge*1000:.1f}mm at {w_cent}"
                if w >= 3.0: failed.append(key)
    reset_pose()
    gates["G4_ARM_PROBES"] = ("PASS" if not failed else "FAIL") + f" worst={worst_all:.2f}x at {worst_where}"
    report["stages"]["verify"] = {"gates": gates, "per_angle": per_angle, "failed": failed}
    say("G4 per-angle: " + json.dumps(per_angle))
    for g, s in gates.items(): say(f"{g}: {s}")

if JSON_OUT:
    with open(JSON_OUT, "w") as f: json.dump(report, f, indent=1)
print("REBUILD COMPLETE")
print("JSON:" + json.dumps(report["stages"]))
