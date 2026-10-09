"""verify_character.py — PASS/FAIL gate suite for a finished game character GLB.

Run headless:
    blender -b --python verify_character.py -- --input /path/to/character.glb [--json /tmp/verify.json]

Gates:
  G1 STRUCTURE        GLB loads with >=1 mesh and >=1 armature
  G2 RIG COMPLETENESS >=20 bones; Hips/Spine/Head/Arm/Leg bones found (suffix match)
  G3 WEIGHTS          every vertex's skin weights sum to 1.0 (+/- 0.01)
  G4 ARM PROBES       arms raised 15/30/45/60/90 deg forward + lateral (both arms);
                      max triangle stretch < 3.0x at every angle (deterministic,
                      computed from deformed vertex data — no eyeballing)
  G5 STRAY GEOMETRY  no verts >5 cm below the feet cluster (catches exploded
                      geometry; character GLBs are authored origin-at-center,
                      so feet are NOT at z=0)
  G6 SCALE            character height 1.4 - 2.2 m
  G7 TEXTURES         WARN (not fail) if no image textures found

Exit 0 = all PASS (WARNs allowed). Exit 1 = any FAIL.
"""
import bpy, sys, os, json, math
from mathutils import Matrix

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

IN = arg("--input")
JSON_OUT = arg("--json")
if not IN or not os.path.exists(IN):
    print(f"VERIFY ERROR: --input missing or not found: {IN}")
    sys.exit(2)

results = []  # (gate, status, detail)
def gate(name, status, detail):
    results.append({"gate": name, "status": status, "detail": detail})

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=IN)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
arms = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']

# ---------- G1 STRUCTURE ----------
STRUCT_OK = bool(meshes and arms and len(arms[0].data.bones) > 0)
if STRUCT_OK:
    gate("G1_STRUCTURE", "PASS",
         f"{len(meshes)} mesh(es), {len(arms)} armature(s), {len(arms[0].data.bones)} bones")
else:
    gate("G1_STRUCTURE", "FAIL",
         f"meshes={len(meshes)} armatures={len(arms)} — need >=1 of each")
    # remaining gates cascade to FAIL on missing mesh/armature; report at end

mesh = max(meshes, key=lambda o: len(o.data.vertices)) if meshes else None
arm = arms[0] if arms else None

def bone(short):
    for b in arm.pose.bones:
        if b.name.split(":")[-1] == short: return b
    return None

# ---------- G2 RIG COMPLETENESS ----------
if arm:
    required = ["Hips", "Spine", "Head", "LeftArm", "RightArm", "LeftLeg", "RightLeg"]
    missing = [r for r in required if bone(r) is None]
    nb = len(arm.data.bones)
    if nb >= 20 and not missing:
        gate("G2_RIG", "PASS", f"{nb} bones, all required bones present")
    else:
        gate("G2_RIG", "FAIL", f"{nb} bones (<20: {nb < 20}); missing: {missing or 'none'}")
else:
    gate("G2_RIG", "FAIL", "no armature")

# ---------- G3 WEIGHTS NORMALIZED ----------
if mesh:
    vg_index = {vg.index: vg.name for vg in mesh.vertex_groups}
    worst, worst_i = 0.0, -1
    for v in mesh.data.vertices:
        s = sum(g.weight for g in v.groups)
        # unweighted verts (rigid props) are fine; only check skinned verts
        if v.groups and abs(s - 1.0) > worst:
            worst, worst_i = abs(s - 1.0), v.index
    if worst <= 0.01:
        gate("G3_WEIGHTS", "PASS", f"all skinned verts sum to 1.0 (max dev {worst:.4f})")
    else:
        gate("G3_WEIGHTS", "FAIL",
             f"max weight-sum deviation {worst:.3f} at vert {worst_i} (limit 0.01)")
else:
    gate("G3_WEIGHTS", "FAIL", "no mesh")

# ---------- helpers for G4 ----------
def reset_pose():
    for pb in arm.pose.bones: pb.matrix_basis.identity()
    bpy.context.view_layer.update()

def set_arm(short, angle_deg, direction):
    pb = bone(short)
    rest = pb.bone.matrix_local.copy()
    if direction == 'fwd':
        R = Matrix.Rotation(math.radians(-angle_deg), 4, 'Y')
    else:  # lateral: left arm toward -Y, right arm toward +Y
        s = -1 if short.startswith("Left") else 1
        R = Matrix.Rotation(math.radians(s * angle_deg), 4, 'X')
    pb.matrix = R @ rest
    bpy.context.view_layer.update()

def deformed_cos():
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    return [v.co.copy() for v in ev.data.vertices]

def tri_list():
    me = mesh.data
    tris = []
    for p in me.polygons:
        vs = p.vertices
        for i in range(1, len(vs) - 1):
            tris.append((vs[0], vs[i], vs[i + 1]))
    return tris

def shoulder_center(short):
    """World-space shoulder joint for LeftArm/RightArm (fallback: arm bone head)."""
    pb = bone(short)
    return (arm.matrix_world @ pb.bone.head_local) if pb else None

def max_stretch(rest_cos, posed_cos, tris, region_center, region_r=0.30):
    """Worst triangle stretch, restricted to the shoulder region.
    Only triangles whose rest centroid is within region_r of region_center count.
    Triangles with a rest edge under 1 mm are ignored (sub-mm slivers are noise)."""
    worst, w_edge, w_cent = 1.0, 0.0, None
    for a, b, c in tris:
        ra, rb, rc = rest_cos[a], rest_cos[b], rest_cos[c]
        cx, cy, cz = (ra.x+rb.x+rc.x)/3, (ra.y+rb.y+rc.y)/3, (ra.z+rb.z+rc.z)/3
        if ((cx-region_center.x)**2 + (cy-region_center.y)**2
                + (cz-region_center.z)**2) ** 0.5 > region_r:
            continue
        re_ = max((ra-rb).length, (rb-rc).length, (rc-ra).length)
        if re_ < 1e-3: continue
        pa, pb, pc = posed_cos[a], posed_cos[b], posed_cos[c]
        pe = max((pa-pb).length, (pb-pc).length, (pc-pa).length)
        r = pe / re_
        if r > worst:
            worst, w_edge = r, re_
            w_cent = (round(cx,3), round(cy,3), round(cz,3))
    return worst, w_edge, w_cent

# ---------- G4 ARM PROBES ----------
if mesh and arm and bone("LeftArm") and bone("RightArm"):
    tris = tri_list()
    reset_pose()
    rest_cos = deformed_cos()
    worst_all, worst_where = 1.0, ""
    per_angle = {}
    failed = []
    for short in ("LeftArm", "RightArm"):
        sc = shoulder_center(short)
        for direction in ("fwd", "lat"):
            for angle in (15, 30, 45, 60, 90):
                reset_pose(); set_arm(short, angle, direction)
                posed = deformed_cos()
                w, w_edge, w_cent = max_stretch(rest_cos, posed, tris, sc)
                key = f"{short}/{direction}/{angle}"
                per_angle[key] = round(w, 2)
                if w > worst_all:
                    worst_all, worst_where = w, f"{key} edge={w_edge*1000:.1f}mm at {w_cent}"
                if w >= 3.0: failed.append(key)
    reset_pose()
    if not failed:
        gate("G4_ARM_PROBES", "PASS",
             f"max stretch {worst_all:.2f}x at {worst_where} (limit 3.0x, all 20 poses)")
    else:
        gate("G4_ARM_PROBES", "FAIL",
             f"webbing at {failed} (worst {worst_all:.2f}x at {worst_where})")
    results[-1]["per_angle"] = per_angle
else:
    gate("G4_ARM_PROBES", "FAIL", "need mesh + both arm bones")

# ---------- G5 STRAY GEOMETRY ----------
# A character GLB is usually authored with origin at center/hips — feet are NOT
# at z=0. What matters: no stray/exploded verts far below the feet cluster.
if mesh:
    reset_pose()
    zs = sorted(v.z for v in deformed_cos())
    minz = zs[0]
    p1 = zs[max(0, int(len(zs) * 0.01))]  # 1st percentile ~ the feet cluster
    gap = p1 - minz
    if gap <= 0.05:
        gate("G5_STRAY_GEO", "PASS",
             f"feet cluster at {p1*1000:.0f} mm, lowest vert {minz*1000:.0f} mm (gap {gap*1000:.0f} mm)")
    else:
        gate("G5_STRAY_GEO", "FAIL",
             f"stray verts {gap*1000:.0f} mm below feet cluster ({minz*1000:.0f} vs {p1*1000:.0f} mm)")
else:
    gate("G5_STRAY_GEO", "FAIL", "no mesh")

# ---------- G6 SCALE ----------
if mesh:
    cos = deformed_cos()
    h = max(c.z for c in cos) - min(c.z for c in cos)
    if 1.4 <= h <= 2.2:
        gate("G6_SCALE", "PASS", f"height {h:.2f} m")
    else:
        gate("G6_SCALE", "FAIL", f"height {h:.2f} m outside 1.4-2.2 m")
else:
    gate("G6_SCALE", "FAIL", "no mesh")

# ---------- G7 TEXTURES (warn only) ----------
if mesh:
    tex = sum(1 for m in mesh.data.materials if m and m.use_nodes
              for nn in m.node_tree.nodes
              if nn.type == 'TEX_IMAGE' and nn.image)
    gate("G7_TEXTURES", "PASS" if tex else "WARN",
         f"{tex} image texture(s)" if tex else "no image textures — model will look flat/untextured")

# ---------- report ----------
def print_report_and_exit():
    print("=" * 60)
    print(f"VERIFY: {os.path.basename(IN)}")
    npass = sum(1 for r in results if r["status"] == "PASS")
    nfail = sum(1 for r in results if r["status"] == "FAIL")
    nwarn = sum(1 for r in results if r["status"] == "WARN")
    for r in results:
        mark = {"PASS": "[PASS]", "FAIL": "[FAIL]", "WARN": "[WARN]"}[r["status"]]
        print(f"  {mark} {r['gate']:12s} {r['detail']}")
        if "per_angle" in r:
            items = sorted(r["per_angle"].items())
            print(f"         per-angle worst stretch: " +
                  ", ".join(f"{k}={v}x" for k, v in items))
    print(f"  -> {npass} pass, {nwarn} warn, {nfail} fail")
    print("=" * 60)
    if JSON_OUT:
        json.dump({"input": IN, "results": results,
                   "summary": {"pass": npass, "warn": nwarn, "fail": nfail}},
                  open(JSON_OUT, "w"), indent=1)
        print(f"wrote {JSON_OUT}")
    print("VERIFY " + ("PASSED" if nfail == 0 else "FAILED"))
    sys.exit(0 if nfail == 0 else 1)

print_report_and_exit()
