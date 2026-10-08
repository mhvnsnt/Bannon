# Plateau Breaker — Diagnosis & Results (2026-10-05)

Technique: **mesh-bridge vertex-split surgery**. For each triangle spiking under the
QA action pose (edge stretch >2.5x), the "odd" vertex (whose dominant joint diverges
under pose) is duplicated; the duplicate is assigned 100% to the majority's joint;
the triangle is rewritten to use the duplicate. Fused contact surfaces (hand↔thigh,
arm↔hip) separate cleanly instead of stretching 100x.

Classification: bridge = odd joint >2 skeleton hops from majority joint (fused surfaces);
weight = ≤2 hops (legitimate joint blends, left for manual/Blender work).

## Results (qa_pose.cjs, real tool)

| Model | Before (p95 / spikes / worst) | After v2 (p95 / spikes / worst) | Bridge tris fixed | Verts duplicated |
|---|---|---|---|---|
| TITAN | 0.0212 / 862 / 122.38 (RightHand/Hips/RightUpLeg) | **0.0211 / 567 / 23.7** | 377 | 227 |
| TITAN_white | 0.0186 / 694 / 102.32 (LeftUpLeg/bone_18) | **0.0185 / 430 / 27.27** | 345 | ~200 |
| CIPHER_feral | 0.0301 / 981 / 257.46 (bone_11/RightLeg) | **0.0300 / 682 / 24.0** | 418 | ~250 |
| BANNON_muscular | 0.0434 / 1803 / 210.38 (RightLeg/bone_11) | **0.0426 / 704 / 46.75** | 1308 | ~844 |
| EDWIN_KENNEDY_unchained | 0.0441 / 1288 / 261.58 (v1 prune) | **0.0437 / 1062 / 190.09** (v1+bridge) | 311 | ~208 |

Worst-spike collapses: 122→23, 102→27, 257→24, 210→46. The 100x+ fused-surface
stretches are gone.

## Per-model bridge anatomy

**TITAN / TITAN_white**: forearms fused to hips (Hips+ForeArm 56+48 tris), upper arms
fused to hips (Hips+Arm 36+35). Classic "arms at sides" bind pose with welded contacts.

**CIPHER_feral**: upper arms fused to hips (Hips+Arm 59+54), lower legs fused to finger
bones (RightLeg+bone_11 39) — feral pose has hands near legs.

**BANNON_muscular**: worst case. 1308 bridge tris including **146 LeftLeg+RightLeg**
(legs fused together!), 185 Hips+RightArm, 98 Hips+RightShoulder. Transfer from donor
put both legs in overlapping bind space. All separated.

**EDWIN_KENNEDY_unchained** (46-joint flat skeleton, no clavicles): 311 bridges fixed
(Hips+ForeArm 77+46, Arm+UpLeg 27+24). Remaining 1062 spikes are WEIGHT issues at
elbows/shoulders/hips (267 LeftArm+LeftForeArm alone) — needs Blender re-skin.
See MANUAL_RECIPE.md.

## What did NOT work (documented, not hidden)

- **Naive weight averaging** (smooth odd-vert toward triangle neighbors): made TITAN
  worse (spikes 567→680). Averaging propagates bad weights.
- **Cross-body influence pruning** (drop influences >2.5x farther than nearest): made
  TITAN worse (spikes 567→646, worst 23→55). Far influences are often load-bearing.
- **Nearest-bone from-scratch re-skin** (1/d² to 4 nearest joints): catastrophic on
  EDWIN_KENNEDY (p95 0.047→0.237). Ignores hierarchy; original weights are better
  than naive geometry.
- **Dominant-joint reassignment** (if d(dominant) > 3·d(nearest)): marginal p95 gain
  (0.0472→0.0460) but spikes increased (994→1316). Too aggressive.

## Files

- `TITAN_v2.glb`, `TITAN_white_v2.glb`, `CIPHER_feral_v2.glb`, `BANNON_muscular_v2.glb`:
  production candidates. Bridge surgery complete, converged (2nd pass finds 0 new).
- `EDWIN_KENNEDY_unchained_v2.glb`: best automated result (v1 prune + bridge split).
  Still needs Blender work — see MANUAL_RECIPE.md.
- All v2 files are plain (non-meshopt) GLBs. Recompress with meshopt before promoting
  if size matters (use the repo's standard pipeline).
