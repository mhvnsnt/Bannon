# Stick-Up Shoulder Repair — Attempt Report

**Branch:** `stickup-shoulder-repair`  
**Date:** 2026-10-09  
**Status:** AUTOMATED REPAIR FAILED — manual weight painting required  
**Model:** `STICKUP_repaired.glb` (original, untouched)

## Summary

Six different algorithmic weight-repaint approaches were tried in Blender 4.0.2
headless. All failed to achieve the zero-webbing bar at 15/30/45/60/90° forward
and lateral arm raises. Blender's Corrective Smooth modifier (the open-source
answer to corrective blendshapes) was also tested at multiple settings and
failed. The shoulder requires manual artistic weight painting (owner's Prisma 3D
workflow) or a complete re-rig.

**No model is shipped in this PR** — per the "zero webbing or it doesn't ship"
rule, the broken automated outputs were discarded. The scripts are preserved
here so the attempts are reproducible and the lessons aren't lost.

## What was tried

### v1: Cone-based repaint (`repaint_shoulders.py`)
Smooth gradient clavicle→arm using cone-shaped blend boundary around the joint.
780 verts touched. **Result:** Fixed armpit verts but missed the scapula/back
verts. Still massive webbing at 90°.

### v2: Aggressive carve (`repaint_shoulders_v2.py`)
2D smoothstep on bone-segment coords (axial t × radial dseg). 909 verts had
Arm weight reduced. Zero off-bone verts with Arm>0.5. **Result:** Eliminated the
catastrophic back webbing but introduced pinching/folding at 45° — the tight
falloffs created weight discontinuities.

### v3: Minimal carve + blur (`repaint_shoulders_v3.py`)
Only reduced Arm weight on verts >0.05m from bone with Arm>0.3, using WIDE
falloffs, then blurred the Arm groups with `vertex_group_smooth`.
740 verts reduced. **Result:** Still webbing at 30°+. Smoothing helped but
didn't fix the fundamental issue.

### v4: Targeted diffusion (`repaint_shoulders_v4.py`)
Found 1052 verts that displace >0.04m at 90° raise, then diffused good neighbor
weights into them (10 iterations). Guarantees smoothness by construction.
**Result:** Least destructive of the attempts, but still webbing. The "good
neighbors" were also bad — the whole region has broken weights.

### v5: Deltoid reweight (`repaint_shoulders_v5.py`)
Discovered the deltoid (shoulder cap) is weighted to the clavicle (Shoulder
bone), which the pipeline fixes at rest. Transferred 60% of deltoid Shoulder
weight to Arm (283 verts). **Result:** WORSE — massive stretching. The deltoid
must stay with the torso, not follow the arm.

### v6: Combined (`repaint_shoulders_v6.py`)
Mild deltoid (25%) + aggressive diffusion (1229 verts, threshold 0.02).
**Result:** Still webbing, even at 15°. The automated approaches are
destructive — they make low angles worse.

## Corrective Smooth tests

Blender's Corrective Smooth modifier (after Armature, vertex group restricted
to shoulder region) was tested at:
- factor=0.8, iterations=5, SIMPLE, pin boundary, 0.15m group → no improvement
- factor=1.0, iterations=8, LENGTH_WEIGHTED, pin boundary, 0.25m group → no improvement

**Conclusion:** Corrective Smooth cannot fix fundamentally broken weights. It
smooths minor volume loss, not severe topological collapse with folded triangles.

## Rigify evaluation

Rigify (built into Blender 4.0.2) was evaluated for upper-arm twist bones:
- The human metarig has `upper_arm.L/R` bones.
- Rigify generates segmented DEF bones (DEF-upper_arm.L, .001, etc.) that function as twist bones.
- **BUT:** Full Rigify generation is fragile in headless mode (operator errors).
- **AND:** Adopting Rigify requires a complete re-rig — different bone hierarchy
  (`DEF-` prefix, different names/rest positions), which breaks the Mixamo
  animation pipeline (`mixamorig:` bone names). All animations would need
  re-retargeting.
- **AND:** Twist bones need to be DRIVEN (drivers/constraints), which don't
  export to glTF. The game would see static twist bones.

**Conclusion:** Rigify is not a drop-in fix. It's a full re-rig project.

## Root cause analysis

The webbing is caused by the interaction of:
1. **Severe weight discontinuities** in the shoulder region (auto-weights from
   a mesh transfer — "BANNON_XFER_MESH" suggests the rig was fit to a different
   body and transferred).
2. **Fixed clavicle** — the pipeline holds the Shoulder (clavicle) bone at rest
   while the Arm rotates 90°. The deltoid is clavicle-weighted, creating shear.
3. **LBS limitations** — linear blend skinning collapses at large angles. Without
   dual-quaternion (not in glTF) or corrective shapes, 90° will always pinch.

The mesh topology (messy triangles from decimation) makes it worse, but the
weights are the primary issue.

## Probe results (honest)

Tested on ORIGINAL `STICKUP_repaired.glb` (all repaints were worse or equal):

| Angle | Forward | Lateral |
|-------|---------|---------|
| 15°   | Clean   | Clean   |
| 30°   | Webbing | Webbing |
| 45°   | Webbing | Webbing |
| 60°   | Webbing | Webbing |
| 90°   | Severe  | Severe  |

The safe envelope remains ~15°, as previously measured. The automated repaints
did not extend it.

## Recommendation

1. **Manual weight painting in Prisma 3D** (owner's workflow) — the shoulder
   needs an artist's eye. The scripts here provide the probe setup
   (`probe_shoulders.py`) so he can verify his work at all angles.
2. **OR: Complete re-rig** — fit a new rig (Rigify or manual) to the actual mesh,
   re-target animations. Large project.
3. **OR: Accept the 15° envelope** — choreograph taunts within it (as the v2
   video did). The crucifix at 90° is not achievable without (1) or (2).

## Files in this PR

- `repaint_shoulders.py` through `repaint_shoulders_v6.py` — the six attempts
- `probe_shoulders.py` — the probe rig (15/30/45/60/90° fwd+lat, with optional
  Corrective Smooth). Reusable for verifying manual work.
- `REPORT.md` — this file.

## Gate numbers

The `rig.rotation_error_eff_deg` gate (22.797° FAIL on the original) is a
rig-structure metric (bone placement accuracy), not a weight metric. Weight
repaints do not affect it. It remains 22.797° FAIL.
