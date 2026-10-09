"""Mesh intake checker — first stop for any Tripo "statue" model.

Run headless:
    blender -b --python mesh_intake_check.py -- --input /path/to/statue.glb [--json /tmp/intake.json] [--target-height 1.88]

Loads a GLB or OBJ and reports: vertex/face counts, bounding-box size, whether
it's already rigged, whether the pose looks like a neutral standing pose,
watertight problems (holes, loose verts), and materials/textures.
Prints a human summary and optionally writes a JSON report. Exit 0 always
(it is a report, not a gate).
"""
import bpy, bmesh, sys, os, json, math

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

IN = arg("--input")
JSON_OUT = arg("--json")
TARGET_H = float(arg("--target-height", "1.88"))
if not IN or not os.path.exists(IN):
    print(f"INTAKE ERROR: --input missing or not found: {IN}")
    sys.exit(2)

report = {"input": IN, "file_bytes": os.path.getsize(IN), "checks": {}}

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
ext = os.path.splitext(IN)[1].lower()
if ext == ".glb":
    bpy.ops.import_scene.gltf(filepath=IN)
elif ext == ".obj":
    bpy.ops.import_scene.obj(filepath=IN)
else:
    print(f"INTAKE ERROR: unsupported extension {ext} (use .glb or .obj)")
    sys.exit(2)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
arms = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
report["checks"]["objects"] = {
    "meshes": len(meshes), "armatures": len(arms),
    "mesh_names": [o.name for o in meshes],
}

if not meshes:
    report["checks"]["verdict"] = "FAIL_NO_MESH"
    print(json.dumps(report, indent=1)); sys.exit(0)

main = max(meshes, key=lambda o: len(o.data.vertices))
me = main.data
report["checks"]["mesh"] = {
    "name": main.name, "vertices": len(me.vertices),
    "polygons": len(me.polygons),
    "triangles_est": sum(len(p.vertices) - 2 for p in me.polygons),
}

# --- bounding box / scale ---
mw = main.matrix_world
corners = [mw @ v.co for v in main.data.vertices]
xs = [c.x for c in corners]; ys = [c.y for c in corners]; zs = [c.z for c in corners]
dx, dy, dz = max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs)
height = max(dx, dy, dz)
report["checks"]["bbox"] = {
    "x": round(dx,3), "y": round(dy,3), "z": round(dz,3),
    "height_est_m": round(height,3),
    "min_z": round(min(zs),3),
}
scale_ratio = height / TARGET_H if TARGET_H else 1.0
report["checks"]["scale"] = {
    "target_height_m": TARGET_H,
    "scale_factor_needed": round(scale_ratio and TARGET_H/height, 4) if height else None,
    "verdict": "OK" if 0.9 <= scale_ratio <= 1.1 else "RESCALE_NEEDED",
}

# --- rig state ---
if arms:
    report["checks"]["rig"] = {
        "state": "ALREADY_RIGGED",
        "armature": arms[0].name, "bones": len(arms[0].data.bones),
        "note": "Statue came with a rig. Verify it with verify_character.py.",
    }
else:
    report["checks"]["rig"] = {"state": "UNRIGGED", "note": "Needs auto-rig (Mixamo / AccuRIG / Rigify)."}

# --- pose heuristics (unrigged statue): symmetry + stance ---
# spatial-hash mirror check (O(n), not O(n^2))
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
n = len(bm.verts)
tol = max(dx, dy, dz) * 0.01
q = tol  # quantization cell
cells = set()
for v in bm.verts:
    cells.add((round(v.co.x / q), round(v.co.y / q), round(v.co.z / q)))
sym = 0
for v in bm.verts:
    cx, cy, cz = round(-v.co.x / q), round(v.co.y / q), round(v.co.z / q)
    if any((cx + ox, cy + oy, cz + oz) in cells
           for ox in (-1, 0, 1) for oy in (-1, 0, 1) for oz in (-1, 0, 1)):
        sym += 1
sym_pct = 100.0 * sym / n if n else 0
arm_span = dx  # X is left-right in Blender
report["checks"]["pose"] = {
    "x_mirror_symmetry_pct": round(sym_pct, 1),
    "arm_span_m": round(arm_span, 3),
    "height_m": round(dz, 3),
    "verdict": "NEUTRAL_STANDING?" if sym_pct > 85 else "ASYMMETRIC_OR_POSED?",
    "note": "Auto-riggers (Mixamo/AccuRIG) need a neutral standing/T/A pose. "
            "If ASYMMETRIC_OR_POSED, the statue must be re-posed before rigging.",
}

# --- watertight ---
nonman = [e for e in bm.edges if not e.is_manifold]
boundary = [e for e in bm.edges if e.is_boundary]
loose = [v for v in bm.verts if not v.link_edges]
edge_total = len(bm.edges)
open_ratio = len(boundary) / edge_total if edge_total else 0
if not nonman and not boundary:
    wt_verdict = "WATERTIGHT"
elif open_ratio < 0.5:
    wt_verdict = "OPEN_EDGES_NORMAL"
else:
    wt_verdict = "MANY_OPEN_EDGES"
report["checks"]["watertight"] = {
    "non_manifold_edges": len(nonman),
    "boundary_edges (holes)": len(boundary),
    "loose_vertices": len(loose),
    "verdict": wt_verdict,
    "note": "Game characters are almost never watertight (clothes, hair, chains "
            "are open shells) — that is NORMAL. Only 3D printing needs watertight. "
            "For auto-rigging, open edges do not matter.",
}
bm.free()

# --- materials / textures ---
mats = me.materials
tex = 0
for m in mats:
    if m and m.use_nodes:
        for nn in m.node_tree.nodes:
            if nn.type == 'TEX_IMAGE' and nn.image: tex += 1
report["checks"]["materials"] = {
    "count": len(mats), "image_textures": tex,
    "verdict": "TEXTURED" if tex else "NO_TEXTURES",
}

print("=" * 60)
print(f"INTAKE: {os.path.basename(IN)}  ({report['file_bytes']/1e6:.1f} MB)")
print(f"  mesh: {report['checks']['mesh']['vertices']} verts, "
      f"{report['checks']['mesh']['triangles_est']} tris")
print(f"  size: {dx:.2f} x {dy:.2f} x {dz:.2f} m  "
      f"(height ~{height:.2f} m, target {TARGET_H} m) -> {report['checks']['scale']['verdict']}")
print(f"  rig: {report['checks']['rig']['state']}")
print(f"  pose: symmetry {sym_pct:.0f}% -> {report['checks']['pose']['verdict']}")
print(f"  watertight: {wt_verdict} "
      f"(non-manifold {len(nonman)}, open edges {len(boundary)}, loose {len(loose)})")
print(f"  materials: {len(mats)}, textures: {tex}")
print("=" * 60)

if JSON_OUT:
    json.dump(report, open(JSON_OUT, "w"), indent=1)
    print(f"wrote {JSON_OUT}")
print("INTAKE DONE")
