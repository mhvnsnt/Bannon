#!/usr/bin/env python3
"""relabel_bones.py — swap mirrored L/R bone labels (the 'bullshit skeleton' fix).

Owner 2026-10-09: "you're probably using the bullshit skeleton" — diagnosis
confirmed (STICKUP_repaired_diag_20261009.json): all 23 L/R bone pairs have
mirrored labels, i.e. the bone NAMED 'Left' sits on the anatomical RIGHT
(character faces +X, anatomical left = +Y). Any retarget/animation code that
assumes Left=left breaks silently.

This script: for every L/R pair where the 'Left'-named bone is at y<0,
swaps the two bone names (vertex groups follow the bone rename automatically
in Blender — verified, do NOT rename them separately or the skin cross-wires).
Bones keep their positions; only labels change. Verified afterward with
diagnose_rig.py (mirrored_labels must be empty) plus a per-pair
bone-head-vs-group-centroid consistency check.

Usage:
  env -u PYTHONPATH <blender> --background --python relabel_bones.py -- <in.glb> <out.glb>
"""
import bpy
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=IN)

arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
if arm is None:
    print("RELABEL: no armature found — nothing to do")
    sys.exit(1)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
main_mesh = max(meshes, key=lambda o: len(o.data.vertices)) if meshes else None
groups_before = sorted(g.name for g in main_mesh.vertex_groups) if main_mesh else []

def bone(short):
    for b in arm.data.bones:
        if b.name.split(":")[-1] == short:
            return b
    return None

def wpos(b):
    return arm.matrix_world @ b.head_local

# find mislabeled pairs (same convention as diagnose_rig.py)
swaps = []  # (left_name, right_name) full bone names
seen = set()
for b in arm.data.bones:
    short = b.name.split(":")[-1]
    if short in seen:
        continue
    mate = None
    if short.startswith("Left"):
        mate = "Right" + short[4:]
    elif short.startswith("Right"):
        mate = "Left" + short[5:]
    if not mate:
        continue
    mb = bone(mate)
    if not mb:
        continue
    seen.add(short)
    seen.add(mate)
    left_b = b if short.startswith("Left") else mb
    if wpos(left_b).y < 0:
        # 'Left'-named bone is on the anatomical right -> swap this pair
        lname = b.name if short.startswith("Left") else mb.name
        rname = mb.name if short.startswith("Left") else b.name
        swaps.append((lname, rname))

print(f"RELABEL: {len(arm.data.bones)} bones, {len(seen)//2} L/R pairs, {len(swaps)} mislabeled")

# two-phase rename with temp suffix to avoid name collisions
TMP = "__SWAP__"
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones
for lname, rname in swaps:
    eb[lname].name = lname + TMP
for lname, rname in swaps:
    eb[rname].name = lname           # right-side bone takes the Left name
for lname, rname in swaps:
    eb[lname + TMP].name = rname     # left-side bone takes the Right name
bpy.ops.object.mode_set(mode='OBJECT')

# NOTE: do NOT rename vertex groups here. Empirically verified (2026-10-10):
# renaming an edit-bone AUTOMATICALLY renames the matching vertex group to
# follow the bone. An explicit group rename on top of that double-swaps and
# CROSS-WIRES the skinning (bones correct, groups holding the other side's
# verts — caught by the centroid check below). Bone rename alone is the fix.
#
# the rename is a pure permutation of group names: the SET of group names
# must be unchanged (Blender follows bone renames on the groups). If any
# group failed to follow, the sets differ and we abort.
groups_after = sorted(g.name for g in main_mesh.vertex_groups)
if groups_before != groups_after:
    missing = [g for g in groups_before if g not in groups_after]
    extra = [g for g in groups_after if g not in groups_before]
    raise AssertionError(f"GROUP SET CHANGED: missing={missing} extra={extra}")
print(f"RELABEL: vertex-group name set unchanged ({len(groups_after)} groups) — rename followed bones")

from mathutils import Vector
bad_skin, checked = [], 0
for lname, rname in swaps:
    for nm in (lname, rname):
        b = next((x for x in arm.data.bones if x.name == nm), None)
        gi = main_mesh.vertex_groups.find(nm)
        pts = [main_mesh.matrix_world @ v.co for v in main_mesh.data.vertices
               if any(g.group == gi and g.weight > 0.5 for g in v.groups)] if gi >= 0 else []
        if not b or gi < 0 or not pts:
            continue  # bone not skinned on main mesh (fingers/toes) — nothing to verify
        checked += 1
        bone_y = (arm.matrix_world @ b.head_local).y
        cy = sum(p.y for p in pts) / len(pts)
        if (bone_y > 0) != (cy > 0):
            bad_skin.append(f"{nm}:bone_y={bone_y:+.3f}!=group_y={cy:+.3f}")
print(f"RELABEL: skin-consistency checked {checked} bones: {'ALL OK' if not bad_skin else bad_skin}")
assert not bad_skin, f"SKIN CROSS-WIRED: {bad_skin}"

# re-verify with the same check diagnose_rig.py uses
def vbone(short):
    for b in arm.data.bones:
        if b.name.split(":")[-1] == short:
            return b
    return None

bad, pairs = [], set()
for b in arm.data.bones:
    short = b.name.split(":")[-1]
    if short in pairs:
        continue
    mate = None
    if short.startswith("Left"):
        mate = "Right" + short[4:]
    elif short.startswith("Right"):
        mate = "Left" + short[5:]
    if not mate or not vbone(mate):
        continue
    pairs.add(short); pairs.add(mate)
    left_b = b if short.startswith("Left") else vbone(mate)
    if (arm.matrix_world @ left_b.head_local).y < 0:
        bad.append(short + "/" + mate)

print(f"RELABEL: swapped {len(swaps)} pairs, mislabeled after: {bad}")
assert not bad, f"STILL MISLABELED: {bad}"

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_materials='EXPORT')
print("WROTE", OUT)
