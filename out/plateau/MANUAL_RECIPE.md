# MANUAL RECIPE — EDWIN_KENNEDY_unchained (and remaining weight spikes)

## Status

`EDWIN_KENNEDY_unchained_v2.glb` is the best automated result: p95 0.0437 (from 0.0441),
spikes 1062 (from 1288), worst 190 (from 261). The 311 fused-surface bridges are fixed.
What remains: **~1000 weight-blend spikes** at elbows (267 tris), shoulders, and hips.
The 46-joint flat skeleton (arms parented directly to Hips, no clavicles) plus
fundamentally bad authored weights are beyond what non-destructive automation can fix.
This needs a Blender re-skin.

## Option A: Automatic (Blender script, 5 minutes)

Run in Blender's Scripting tab with `EDWIN_KENNEDY_unchained_v2.glb` imported:

```python
import bpy

# 1. Clear scene, import
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/path/to/EDWIN_KENNEDY_unchained_v2.glb")

# 2. Find armature and mesh
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
mesh = next(o for o in bpy.data.objects if o.type == 'MESH')
print(f"Armature: {arm.name} ({len(arm.data.bones)} bones), Mesh: {mesh.name}")

# 3. Clear existing (bad) weights
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.mode_set(mode='OBJECT')
mesh.vertex_groups.clear()

# 4. Parent with automatic weights (heat diffusion)
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
mesh.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print("Automatic weights done. Check elbows/shoulders in Weight Paint mode.")

# 5. Export
bpy.ops.export_scene.gltf(
    filepath="/path/to/EDWIN_KENNEDY_unchained_v3.glb",
    export_format='GLB',
    export_skins=True,
)
print("Exported v3.")
```

Then re-run QA: `node qa_pose.cjs EDWIN_KENNEDY_unchained_v3.glb`
Target: p95 < 0.030, spikes < 500. If not there, proceed to Option B.

## Option B: Manual weight painting (30-60 minutes, highest quality)

For the specific spike clusters (run `diagnose2.py` on v2 for the live list):

1. **Elbows** (LeftArm+LeftForeArm, 267 tris): In Weight Paint mode, select the
   `LeftForeArm`/`RightForeArm` vertex groups. The gradient from upper arm to forearm
   should span ~4-6cm. Use Blur brush (Weight: 1.0, Strength: 0.3) along the elbow
   crease until the transition is smooth. Repeat for `RightArm`+`RightForeArm`.

2. **Shoulders** (Arm+Spine, Arm+Hips): The deltoid cap should blend Arm→Spine over
   the shoulder ball. If spikes persist, the arm is likely 100% Arm-weighted too far
   up — paint a Spine falloff starting 3cm above the armpit.

3. **Hips** (Hips+UpLeg): Smooth the hip crease with Blur brush on `Hips` group.

4. **Validate**: After each region, export and run `qa_pose.cjs`. The `worstSpikeJoints`
   field tells you exactly which joint pair still spikes.

## Why not just use the v2?

The v2 is USABLE (no more 100x+ stretches, worst is 190x on a single tri). But p95
0.0437 is 2x worse than the roster average (~0.02). For a hero character, do the
Blender pass. For background NPCs, v2 is fine as-is.

## For the other 4 models

TITAN, TITAN_white, CIPHER_feral, BANNON_muscular v2 files are DONE — no manual work
needed. Their remaining spikes (430-704) are normal joint-blend levels, not defects.
Promote them when the owner approves.
