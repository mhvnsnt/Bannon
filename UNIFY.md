# MODEL UNIFICATION PLAN — DRAFT (owner approval required before any moves)

**Date:** 2026-10-09
**Rule:** NOTHING MOVES until the owner approves this plan. Then the moves happen.

## Headline verdict (measured, not eyeballed)

**There is no better Stick-Up hiding in the repos.** Brutal-Fist's STICKUP.glb,
AshLane's STICKUP.glb, and AshLanev2's STICKUP.glb are the same broken model as
Bannon's STICKUP_repaired.glb (A-pose 28°, 23 mirrored L/R bone labels, 12.6%
weight bleed, mesh severed into 34 pieces — identical diagnostic numbers).
The fix must be BUILT, not found.

**The owner's belief is half-right:** AshLane/Brutal-Fist do NOT have better
*working* character models — 28 of 32 Brutal-Fist models and the whole AshLane
cast share the same broken `BANNON_XFER_MESH` transfer base. BUT AshLanev2's
Tripo auto-rig family has the best *donor* skeletons/weights in the org
(PABLO_attire2: 0.0% bleed, correct L/R labels, T-pose 82°).

All scores from `tools/rig-repair/diagnose_rig.py` (/12: rest pose 3 + skeleton 3
+ weight bleed 3 + mesh 3).

## Ranked models (top candidates)

### Tier 1 — Donor skeletons/weights (transplant, don't use mesh as-is)
| Model | Repo | Score | Why |
|---|---|---|---|
| PABLO_attire2.glb | AshLanev2 | 8/12 | 0.0% bleed, correct labels, T-pose 82°, 52 bones. Mesh exploded (142 islands) — donate skeleton+weights only |
| EDWIN_KENNEDY_attire3.glb | AshLanev2 | 7/12 | 0.0% bleed, correct labels. 65.6° between-pose, 215 islands |
| CAIN_ELIAS_attire3.glb | AshLanev2 | 6/12 | Correct labels, 52 bones, 90° bone-T. 14.9% bleed needs paint pass |

### Tier 2 — Usable with work
| Model | Repo | Score | Why |
|---|---|---|---|
| MARKS.glb | AshLanev2 | 3/12 | Least-severed mesh (10 islands) but mirrored labels |
| TYNESHIA.glb | Brutal-Fist | 2/12 | Lowest real bleed in the 58-bone family (7.7%) |
| CIPHER_rigged.glb | Brutal-Fist | 2/12 | 52 bones, 6.9% bleed (2nd lowest) |

### Tier 3 — Broken base (the `BANNON_XFER_MESH` family — do not propagate)
Everything else: Stick-Up (all repos), the AshLane cast (JAGER, CIPHER,
MASTER_SENSEI, KOBRA, TITAN, VIPER, ONYX), most of Brutal-Fist's roster.
A-pose 22–46°, mirrored labels, 7–44% bleed, 20–83 severed pieces.
**These are the models the unification replaces.**

## Unification moves (PROPOSED — approve first)

### Stick-Up (the priority)
- **Current:** broken in Bannon, Brutal-Fist, AshLane, AshLanev2 (same model everywhere)
- **Plan:** BUILD the fix, don't hunt for one —
  1. Weld mesh (`tools/model_diag/sew_rig.cjs --weld`)
  2. Fix mirrored L/R bone labels
  3. Re-pose to T-pose, heat-diffusion re-skin (donor weights from PABLO_attire2 if needed)
  4. Verify: diagnostic clean + probes 15–90° + G4 < 3.0x
- **Target:** the fixed STICKUP becomes canon in Bannon, Brutal-Fist, AshLanev2 (replaces all four broken copies)

### Donor skeleton rollout (phase 2)
- PABLO_attire2's skeleton/weight pattern becomes the reference rig for re-skins
- Applies to: the worst of the `BANNON_XFER_MESH` family, model by model, as they're rebuilt

## What this does NOT do
- No file moves yet. No meshes replaced. No animations retargeted.
- The 3 staged Hardy taunt clips will be re-retargeted after the Stick-Up fix lands
  (they were built mirror-aware for the broken labels).
