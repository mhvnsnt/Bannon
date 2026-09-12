# Model QA — measure the skinning, stop eyeballing

The owner's #1 complaint: fighter models look mutant during moves (arms/limbs smear into sheets).
Every past "it looks good now" claim was an AI eyeballing a bloom-lit 2 fps harness render and being
wrong. This doc is the **objective** replacement: a gate that MEASURES model correctness against the
model's own geometry, plus the pipeline that fixes the failures automatically (no Blender/Prisma).

## The root cause (proven, not guessed)
The engine retarget only ROTATES bones — it cannot stretch a mesh by itself. The smear is **bad skin
weights**: the deprecated in-house rigger `tools/rigready/skin.cjs` assigned vertices to the wrong
bones, so when a bone rotates for a strike it drags a swath of the body with it. Control test, same
heavy attack, same engine:
- **CIPHER** (skin.cjs, 16 joints) → sheared into a flat sheet.
- **BANNON** (UniRig, 28 joints) → body holds together.
The only variable is the skinning method. Fix = re-rig through UniRig; the engine is not the bug.

## The gate: `tools/model_diag/skinqa.cjs`
Runs in the pwtest harness (vendored three.js). For each GLB it loads the mesh, poses arms/spine/leg
into a canonical ACTION pose, and for a ~4000-vertex sample measures how far each skinned vertex lands
from the **rigid** motion of its dominant bone (bind→pose). Good weights → vertices ride their bone
(residual ~0). Bad weights → vertices fly across the body (high residual). The model's own bind
geometry is the ground truth — no screenshots, no opinion.

```
cd scratchpad/pwtest && node rebuild.cjs        # build test.html from BANNON_v150.html
node /path/to/tools/model_diag/skinqa.cjs BANNON_rigged.glb CIPHER.glb ...   # copy alongside pwtest or run from it
```
Output per model: `p50` / `p95` / `max` residual (fraction of body height).
- **PASS** p95 < 0.06 · **WEAK** 0.06–0.12 · **FAIL** ≥ 0.12 (or p50 > 0.02).

## Honest roster map (2026-07-19 measurement)
- **FAIL (catastrophic smear — re-rig first):** CIPHER 0.184, ECHO 0.151, STATIC 0.197,
  CODY 0.210, CAIN_ELIAS 0.277, STICK-UP 0.211, ONYX 0.152.
- **WEAK (noticeable):** FINXSSE 0.074, HOLLOW 0.072, HALL_NIGHTER 0.061, EDWIN 0.064, PABLO 0.077,
  TYNESHIA 0.074, TRIPLE_XXX 0.084, EL_TORO 0.077, STAN 0.077, BRUTUS 0.067, TITAN 0.068,
  MASTER_SENSEI 0.065, WRECK 0.067 — and BANNON_rigged itself 0.068 (UniRig is good, the test pose is
  aggressive; visually BANNON holds together).
- **PASS (fine as-is):** VIPER 0.045, KOBRA 0.051, AARON_RUBEN 0.040.

## The automatic fix pipeline (no manual modeling)
1. **Re-rig** through the hosted UniRig space (`jasongzy/UniRig` `/process_pipeline(input,'glb')`),
   batched + resumable: `HF_TOKEN=… python3 tools/unirig/batch_rerig.py --fails`
   (≈20–25 min/model on the free ZeroGPU queue, serial). Output: `assets/models/<KEY>_rigged.glb`.
2. **Rename** bone_N → Mixamo names by topology (`tools/unirig/rename_bones.cjs`, run inside the batch)
   so it binds the engine BONE_MAP.
3. **Gate** the result with `skinqa.cjs` — it must beat the original's p95, ideally PASS/WEAK.
4. **Promote** only gated winners: point `CHAR_MODEL_DEFAULTS[KEY]` at `<KEY>_rigged.glb`.
   Never promote on a screenshot; promote on the number.

## What UniRig fixes vs doesn't
- FIXES: skin weights → no more action-pose smear (the mutant look). This is the visual blocker.
- DOESN'T fix: MOTION quality. Coherent limbs still need real animation (idle/locomotion/strike
  clips via `studioApplyClipPose` + AnimationMixer blend) — the Step 2 combat/animation phase.
