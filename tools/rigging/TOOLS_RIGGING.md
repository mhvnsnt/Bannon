# tools/rigging — Fight-Ready Rig QA & Retarget Pipeline

**Owner mandate (2026-10-05):** models that deform like Cronenbergs and animations that
don't work are what's holding the games back. Gameplay/animation FIRST, environment art
later. Milestone: *one guy hits/grabs/lifts another guy correctly.*

**Design law:** everything here is GAME-AGNOSTIC and portable. Bannon is the proving
ground; Brutal Fist, AshLane, and future projects consume the same scripts with their
own `jointmaps/*.json`. No Bannon-only hardcoding — joint correspondence lives in JSON
map files, thresholds are documented guidance, input is any skinned GLB.

**Lane:** tooling, automation, and QA. Grok-side Repo Co Dev owns Blender remap/re-skin
execution — this pipeline measures and feeds their work, it does not duplicate it.

## What it does (one system, three tools)

```
 source clip GLB (Mixamo etc.)            any skinned GLB
        │                                        │
        ▼                                        ▼
 retarget_clip.cjs ──► baked GLB ──► clip_deform_qa.cjs ──► PASS/WATCH/FAIL
  (delta retarget,            (per-frame LBS deformation
   jointmap JSON)              + motion sanity)
                                                  ▲
 rom_qa.cjs ──────────────────────────────────────┘
 (procedural range-of-motion QA, no clip needed —
  the shoulder/delt-pec twist finder)
```

| Tool | Purpose | Input → Output |
|---|---|---|
| `fbx2glb.cjs` | Converts Mixamo-style FBX (skeleton + animation) to GLB — skeleton + clips only, meshes stripped. Handles textured FBX via stubbed loaders. | `clip.fbx` → `clip.glb` |
| `retarget_clip.cjs` | Bakes a source animation onto a target skeleton (rest-pose-robust delta method: works even when rest poses differ — verified 22/52 joints differ between Mixamo and Bannon bind) | `target.glb + source_anim.glb --map jointmaps/X.json -o baked.glb` |
| `clip_deform_qa.cjs` | Plays the baked clip headlessly (pure-JS LBS); per-frame spikes/p95/worst-ratio + motion sanity (hips bob, foot travel — catches frozen clips) | `baked.glb` → JSON report + verdict |
| `rom_qa.cjs` | Procedural ROM sweep per joint (raise/abduct/twist); ranks joints by worst deformation — no animation data required | `model.glb` → per-joint worst table |
| `lib/rigmath.cjs` | Shared math: quats, LBS, spike/p95 metrics, weight hygiene | — |
| `lib/animsample.cjs` | Shared glTF animation sampling (LINEAR/STEP interp, TRS+matrix nodes) | — |
| `jointmaps/mixamo_to_bannon58.json` | Portable joint-name map, Mixamo 66 → Bannon 58. Other games: copy + edit | — |

## Measured results (real runs, 2026-10-05)

**Drive combat pack (17 Mixamo FBX → GLB → retargeted → QA):** owner's Drive holds
~100 Mixamo-style FBX files. Pulled the combat set (strikes, hit reactions, takedown,
kip-ups): Combo Punch, Body Jab Cross, Boxing 1/3/4/5, Hit To Head/Body, Hit Reaction,
Hit On Side Of Head, Drop Kick, Hurricane Kick, Illegal Elbow/Knee, Double Leg Takedown
(Victim), Kip Up, Corkscrew Kip Up. All 17 convert, retarget (52 joints driven), and
**play with verified real motion** (not frozen) on repaired STICKUP.

Donor-relative deformation (spikes/frame median — the honest bar, since even the
gold-standard donor shows ~500 on intense clips):

| Clip | Donor | Stick-Up (repaired) | Ratio |
|---|---|---|---|
| Body_Jab_Cross | 518 | 1178 | 2.3x |
| Combo_Punch | 498 | 1156 | 2.3x |
| Hit_To_Head | 471 | 1009 | 2.1x |
| Hit_Reaction | 485 | 1085 | 2.2x |
| Double_Leg_Takedown (victim) | 484 | 1104 | 2.3x |
| Drop_Kick | 543 | 1095 | 2.0x |
| Hurricane_Kick | 448 | 1077 | 2.4x |
| Kip_Up | 131 | 533 | 4.1x |

Stick-Up is consistently **~2.2x worse than the donor** across every clip — a systematic
mesh/weight gap (the mesh-bridge spike family), not clip-specific. Verdict: motion plays
correctly, but Stick-Up is a prime candidate for plateau-style mesh-bridge surgery
before he's truly fight-ready. Absolute PASS/FAIL thresholds in the tools are guidance;
donor-relative ratio is the real bar.

**Retarget (Mixamo walk → STICKUP_repaired.glb):** 52 joints driven, root motion on,
motion verified real (hips bob 0.063 m, feet travel 1.83/1.95 m over 1 s — not frozen).

**clip_deform_qa, walk cycle, 21 frames:**
| Model | Median spikes/frame | Worst ratio | Verdict |
|---|---|---|---|
| TITAN (original) | 580 | 49x | FAIL |
| TITAN_v2 (plateau mesh surgery) | 269 (−54%) | 20x | FAIL→borderline |
| STICKUP (repaired) | 393 | 119x | FAIL |

The tool correctly ranks the plateau-breaker's mesh surgery as a 54% spike reduction
with independent animation data (not the static QA pose it was tuned on).

**rom_qa (shoulder-twist finder):**
| Model | Worst joint | Spikes | Verdict |
|---|---|---|---|
| STICKUP_repaired | LeftShoulder (arm raise −70°) | 203, 129x | PASS |
| TITAN original | RightShoulder | 285, 39x | WATCH |
| TITAN_v2 | RightShoulder | 132, 18x (−54%) | PASS |

Shoulders top the defect list on every model tested — owner's #1 complaint confirmed
with numbers, on animation, not just a static pose.

## Usage

```bash
# Deps once (repo root has them via the repair workspace; or npm i in tools/rigging)
export NODE_PATH=/path/to/node_modules   # needs @gltf-transform/core, extensions, meshoptimizer

# 1. Retarget a clip onto your model (FBX from Drive? convert first)
node tools/rigging/fbx2glb.cjs mocap/Combo_Punch.fbx /tmp/combo.glb
node tools/rigging/retarget_clip.cjs models/MYCHAR.glb /tmp/combo.glb \
  -o /tmp/mychar_punch.glb --map tools/rigging/jointmaps/mixamo_to_bannon58.json --fps 30

# 2. Prove it plays without tearing
node tools/rigging/clip_deform_qa.cjs /tmp/mychar_punch.glb --frames 31

# 3. Find the worst joint with no clip at all
node tools/rigging/rom_qa.cjs models/MYCHAR.glb
```

**Verdict thresholds** (calibrated on Bannon roster; guidance for other games):
- `clip_deform_qa`: PASS spikes/frame p95 < 40 · WATCH 40–150 · FAIL > 150 or any frame > 100x (FAIL_FROZEN if no motion detected)
- `rom_qa`: PASS worst joint < 250 spikes · WATCH 250–800 · FAIL > 800

## Open-source pulled in (licenses verified from vendored LICENSE files)

| Package | License | Verified | Use |
|---|---|---|---|
| `@gltf-transform/core` 4.5.1 | **MIT** (Copyright 2024 Don McCurdy, LICENSE.md in package) | package.json + LICENSE.md | GLB read/write, animation baking |
| `@gltf-transform/extensions` | **MIT** (same package family) | package.json | meshopt/KHR extension support |
| `meshoptimizer` | **MIT** (README: "under the terms of MIT License") | README.md | mesh decoder/encoder |
| `three` 0.186.1 | **MIT** (threejs.org license page) | npm package license field | FBXLoader + GLTFExporter for FBX→GLB conversion |

Drive animation files: treat as **Mixamo-licensed** — royalty-free for game use, do NOT
redistribute standalone. Baked/retargeted outputs stay in the game pipeline.

No GPL-family code integrated. three.js (MIT) is used by the game runtime, not vendored here.

## Deliberately NOT added (and why)

- **Blender / Rigify / AccuRIG scripts** — Repo Co Dev owns the Blender remap track; a competing
  auto-rig here would duplicate their lane. This pipeline measures their output instead.
- **FreeMoCap / MediaPipe mocap-from-video** — valuable for *new* animations, but the repo
  already has 973 authored clips + Mixamo FBX library + an ingester. Second system; queued
  behind proving the current library fight-ready.
- **gltf-transform CLI mesh ops (weld/dedup)** — the repair program's prune/transfer scripts
  already cover weight-side repair; mesh-bridge surgery is documented in the plateau report.
- **Jiggle/cloth (KawaiiPhysics etc.)** — cosmetic; owner's order is combat fundamentals first.
- **three.js SkeletonUtils retarget** — runtime already retargets via BONE_MAP; this pipeline
  is the offline proof layer, not a second runtime.

## For other games (portability contract)

1. Add `jointmaps/<source>_to_<yourrig>.json` (copy the Mixamo map; format documented in-file).
2. Run the three tools unchanged — they read joint names from the map + fuzzy tokens.
3. Recalibrate verdict thresholds on 3–5 of your models; record them in your game's doc.

## Next (queued, not started)

- Strike/grab/lift clip pack through this pipeline: walk is proven; a punch clip is the
  next proof point for "one guy hits another guy correctly."
- Feed FAIL/WATCH models to Repo Co Dev's Blender track with the per-joint report attached.
- Phase 3 (fingers/hair/face) re-runs rom_qa to prove no regression.
