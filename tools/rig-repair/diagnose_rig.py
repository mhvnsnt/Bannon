#!/usr/bin/env python3
"""diagnose_rig.py — RIG DIAGNOSTIC SUITE (mandatory pre-repair stage).

Diagnose-before-repair law (owner 2026-10-09): no rig/mesh repair attempt
runs without this report first. It sees what blind repair scripts miss:
bind pose, skeleton sanity, weight bleed, severed meshes.

Usage:
  env -u PYTHONPATH /path/to/blender --background --python diagnose_rig.py \
      -- --glb /path/to/model.glb [--json /path/to/report.json]

Report sections:
  rest_pose   — arm/leg angles in degrees, A-pose vs T-pose verdict
  skeleton    — bone count, hierarchy depth, L/R mirror-label check
  weight_bleed— verts carrying significant weight on distant bones
  mesh        — island count (severed-mesh check)
  diagnosis   — plain-language lines a human can act on
"""
import bpy, math, json, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(n, d=None):
    for i, a in enumerate(argv):
        if a == n and i + 1 < len(argv): return argv[i + 1]
    return d

GLB = arg("--glb")
JSON_OUT = arg("--json")
if not GLB:
    print("USAGE: diagnose_rig.py -- --glb model.glb [--json report.json"); sys.exit(2)

bpy.ops.wm.read_factory_settings(use_empty=True)
try:
    bpy.ops.import_scene.gltf(filepath=GLB)
except RuntimeError as e:
    # e.g. EXT_meshopt_compression on Blender 4.0 — report, don't crash
    print("IMPORT_FAILED:", e)
    print("DIAG: UNREADABLE: Blender 4.0 cannot import this file (%s). "
          "Decompress with: npx @gltf-transform/cli copy in.glb out.glb" % str(e)[:80])
    print("DIAGNOSTIC COMPLETE: import failed")
    print('JSON:{"glb": "%s", "import_error": "%s"}' % (GLB, str(e)[:120]))
    sys.exit(0)

arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
mesh = max(meshes, key=lambda o: len(o.data.vertices)) if meshes else None

report = {"glb": GLB, "diagnosis": []}
def say(s): report["diagnosis"].append(s); print("DIAG:", s)

if arm is None:
    say("NO ARMATURE: model has no skeleton — it is a statue, not a character. Rig it before anything else.")
    report["rest_pose"] = None; report["skeleton"] = None
else:
    # ---------- 1. REST POSE ----------
    def bone(short):
        for b in arm.data.bones:
            if b.name.split(":")[-1] == short: return b
        return None
    def wpos(b, head=True):
        return arm.matrix_world @ (b.head_local if head else b.tail_local)
    hips, neck = bone("Hips"), bone("Neck")
    torso_up = ((wpos(neck, True) - wpos(hips, True)).normalized()
                if hips and neck else Vector((0, 0, 1)))
    rp = {}
    for label, hand_s, fa_s, sh_s in [("L", "LeftHand", "LeftForeArm", "LeftShoulder"),
                                      ("R", "RightHand", "RightForeArm", "RightShoulder")]:
        hb, fb_, sb = bone(hand_s), bone(fa_s), bone(sh_s)
        angs, info = [], {}
        if mesh and hb and fb_ and sb:
            idxs = [i for i in (mesh.vertex_groups.find(hb.name),
                                mesh.vertex_groups.find(fb_.name)) if i >= 0]
            pts = [mesh.matrix_world @ v.co for v in mesh.data.vertices
                   if sum(g.weight for g in v.groups if g.group in idxs) > 0.5]
            if pts:
                c = sum(pts, Vector()) / len(pts)
                d = (c - wpos(sb, True)).normalized()
                ang = 180.0 - math.degrees(d.angle(torso_up))  # from straight-down
                angs.append(ang); info = {"deg_from_down": round(ang, 1), "n_verts": len(pts)}
        # bone-direction fallback
        ab = bone("LeftArm" if label == "L" else "RightArm")
        if ab:
            bd = (wpos(ab, False) - wpos(ab, True)).normalized()
            b_ang = 180.0 - math.degrees(bd.angle(torso_up))
            angs.append(b_ang); info["bone_deg_from_down"] = round(b_ang, 1)
        rp[label] = info
    arm_angs = [v["deg_from_down"] for v in rp.values() if "deg_from_down" in v]
    avg_arm = sum(arm_angs) / len(arm_angs) if arm_angs else None
    if avg_arm is None: pose_v = "UNKNOWN"
    elif avg_arm >= 75: pose_v = "T-POSE"
    elif avg_arm >= 55: pose_v = "BETWEEN"
    elif avg_arm >= 20: pose_v = "A-POSE"
    else: pose_v = "ARMS-DOWN"
    # legs
    leg_angs = []
    for s in ["LeftUpLeg", "RightUpLeg"]:
        b = bone(s)
        if b:
            d = (wpos(b, False) - wpos(b, True)).normalized()
            leg_angs.append(180.0 - math.degrees(d.angle(torso_up)))
    report["rest_pose"] = {"arms": rp, "avg_arm_deg_from_down": round(avg_arm, 1) if avg_arm else None,
                           "leg_deg_from_down": [round(x, 1) for x in leg_angs], "verdict": pose_v}
    if pose_v == "A-POSE":
        say(f"A-POSE ({avg_arm:.0f} deg from straight-down): arms hang close to the torso. "
            "Re-pose to T-pose and re-skin BEFORE painting weights — A-pose bind causes shoulder weight bleed.")
    elif pose_v == "T-POSE":
        say(f"T-POSE ({avg_arm:.0f} deg): clean bind pose for skinning.")
    else:
        say(f"REST POSE: {pose_v} ({avg_arm if avg_arm else '?'} deg).")

    # ---------- 2. SKELETON SANITY ----------
    bones = arm.data.bones
    def depth(b, d=0):
        kids = b.children
        return d if not kids else max(depth(c, d + 1) for c in kids)
    roots = [b for b in bones if not b.parent]
    maxdepth = max([depth(r) for r in roots], default=0)
    # L/R mirror check: pair Left/Right bones, verify mirrored across Y (sagittal) plane
    pairs, mirrored_ok, mislabeled = 0, 0, []
    seen = set()
    for b in bones:
        short = b.name.split(":")[-1]
        if short in seen: continue
        mate = None
        if short.startswith("Left"): mate = "Right" + short[4:]
        elif short.startswith("Right"): mate = "Left" + short[5:]
        if not mate: continue
        mb = bone(mate)
        if not mb: continue
        seen.add(short); seen.add(mate); pairs += 1
        pl = wpos(b, True); pr = wpos(mb, True)
        # mirrored across Y=mid plane?
        mid = (pl.y + pr.y) / 2
        if abs((pl.y - mid) + (pr.y - mid)) < 0.05 and abs(pl.x - pr.x) < 0.05 and abs(pl.z - pr.z) < 0.05:
            mirrored_ok += 1
        # label check: assume character faces +X (probe convention) -> anatomical left = +Y
        left_b = b if short.startswith("Left") else mb
        if (wpos(left_b, True).y) < 0:
            mislabeled.append(short + "/" + mate)
    report["skeleton"] = {"bone_count": len(bones), "root_bones": len(roots),
                          "max_depth": maxdepth, "lr_pairs": pairs,
                          "lr_pairs_mirrored": mirrored_ok,
                          "mirrored_labels": mislabeled}
    say(f"SKELETON: {len(bones)} bones, depth {maxdepth}, {mirrored_ok}/{pairs} L/R pairs mirrored.")
    if mislabeled:
        say(f"MIRRORED BONE LABELS ({len(mislabeled)} pairs, e.g. {mislabeled[0]}): bones named 'Left' sit on the "
            "anatomical right. Any retarget/animation code assuming Left=left WILL break — fix labels or use mirror-aware mapping.")
    if len(bones) < 15:
        say(f"SPARSE SKELETON ({len(bones)} bones): no fingers/face/toes likely — fine for background, not hero.")

    # ---------- 3. WEIGHT BLEED ----------
    bleed_verts, worst = 0, {}
    total = 0
    if mesh:
        bhead = {b.name: wpos(b, True) for b in bones}
        vg_names = {vg.index: vg.name for vg in mesh.vertex_groups}
        for v in mesh.data.vertices:
            total += 1
            co = mesh.matrix_world @ v.co
            for g in v.groups:
                if g.weight < 0.15: continue
                bn = vg_names.get(g.group)
                bh = bhead.get(bn)
                if bh is None: continue
                if (co - bh).length > 0.35:
                    bleed_verts += 1
                    worst[bn] = worst.get(bn, 0) + 1
                    break
        pct = 100.0 * bleed_verts / total if total else 0
        top = sorted(worst.items(), key=lambda x: -x[1])[:5]
        report["weight_bleed"] = {"verts": bleed_verts, "total": total, "pct": round(pct, 1),
                                  "worst_bones": [{"bone": k, "verts": n} for k, n in top]}
        if pct > 5:
            say(f"WEIGHT BLEED: {pct:.1f}% of verts carry >15% weight on bones over 0.35m away "
                f"(worst: {', '.join(k.split(':')[-1] for k, _ in top[:3])}). Paint or re-skin.")
        else:
            say(f"WEIGHT BLEED: {pct:.1f}% — clean.")
    else:
        report["weight_bleed"] = None

# ---------- 4. SEVERED MESH ----------
if mesh:
    import bmesh
    bm = bmesh.new(); bm.from_mesh(mesh.data); bm.verts.ensure_lookup_table()
    # merge coincident verts (1e-5 grid) before flood-fill: the glTF exporter
    # splits verts at UV seams, which reads as false "severed pieces".
    # Only merge if BOTH are boundary verts (same rule as the weld).
    bm.verts.index_update()
    def _is_b(v): return any(len(e.link_faces) < 2 for e in v.link_edges)
    from mathutils.kdtree import KDTree
    _bnd = {v.index for v in bm.verts if _is_b(v)}
    _kd = KDTree(len(bm.verts))
    for _v in bm.verts: _kd.insert(_v.co, _v.index)
    _kd.balance()
    _par = {v.index: v.index for v in bm.verts}
    def _find(a):
        while _par[a] != a: _par[a] = _par[_par[a]]; a = _par[a]
        return a
    for _v in bm.verts:
        if _v.index not in _bnd: continue
        for (_co, _ji, _dd) in _kd.find_range(_v.co, 1e-5):
            if _ji <= _v.index or _ji not in _bnd: continue
            _ra, _rb = _find(_v.index), _find(_ji)
            if _ra != _rb: _par[_ra] = _rb
    _groups = {}
    for _v in bm.verts: _groups.setdefault(_find(_v.index), []).append(_v)
    for _g in _groups.values():
        if len(_g) > 1:
            _cx = sum(_v.co.x for _v in _g)/len(_g)
            _cy = sum(_v.co.y for _v in _g)/len(_g)
            _cz = sum(_v.co.z for _v in _g)/len(_g)
            bmesh.ops.pointmerge(bm, verts=_g, merge_co=(_cx, _cy, _cz))
    bm.verts.ensure_lookup_table()
    seen_v, sizes = set(), []
    for v in bm.verts:
        if v.index in seen_v: continue
        sz, stack = 0, [v]
        while stack:
            u = stack.pop()
            if u.index in seen_v: continue
            seen_v.add(u.index); sz += 1
            stack.extend(e.other_vert(u) for e in u.link_edges)
        sizes.append(sz)
    bm.free()
    sizes.sort(reverse=True)
    big = [s for s in sizes if s > 100]
    largest_pct = 100.0 * sizes[0] / len(mesh.data.vertices) if sizes else 0
    report["mesh"] = {"verts": len(mesh.data.vertices), "islands": len(sizes),
                      "largest_island_pct": round(largest_pct, 1),
                      "islands_over_100v": len(big), "name": mesh.name}
    if len(big) > 3 and largest_pct < 70:
        say(f"SEVERED MESH: {len(big)} large disconnected pieces, largest is only {largest_pct:.0f}% of verts — "
            "the body is cut at the joints and cannot bend smoothly. Sew/weld before rigging.")
    elif len(sizes) > 10:
        say(f"MESH: {len(sizes)} islands but body is whole (largest {largest_pct:.0f}%) — small pieces are "
            "accessories (dreads, chain, clothes). OK.")
    elif len(sizes) > 1:
        say(f"MESH: {len(sizes)} islands (body + separate pieces — normal).")
    else:
        say("MESH: single watertight island.")
else:
    report["mesh"] = None
    say("NO MESH FOUND.")

# ---------- summary ----------
crit = sum(1 for d in report["diagnosis"]
           if d.startswith(("A-POSE", "MIRRORED", "WEIGHT BLEED:", "SEVERED", "NO ARMATURE", "NO MESH")))
report["critical_findings"] = crit
print("=" * 60)
print(f"DIAGNOSTIC COMPLETE: {crit} critical finding(s)")
for d in report["diagnosis"]:
    print(" -", d)
if JSON_OUT:
    json.dump(report, open(JSON_OUT, "w"), indent=1)
    print("wrote", JSON_OUT)
print("JSON:" + json.dumps(report))
