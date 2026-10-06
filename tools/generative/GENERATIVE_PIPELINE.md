# Bannon Generative Pipeline Catalog

**Rule: nothing here is claimed integrated until it runs end-to-end and produces output.**
Proof files live next to each tool under `proof/`. All CPU, all offline, all owner-runnable.

## What already existed (do NOT duplicate)

| Existing | Where | This pipeline's relationship |
|---|---|---|
| MediaPipe video→clip JSON, MoMask/MDM/MotionGPT text→clip JSON | `tools/mocap/` (video_to_clip.py, text_to_clip.py) | **Complementary:** those write the engine's clip JSON; `retarget/` writes **glTF animations** onto character GLBs (web/three.js builds, previews) |
| TripoSR / TRELLIS / Shap-E / Real-ESRGAN wrappers, procedural textures/audio/worldgen | AshLanev2 `tools/generative/` | **Referenced, not copied** — the 3D-gen wrappers are GPU-bound; Bannon's pipeline is the CPU-runnable layer |
| Character repair (weight transfer, reskins) | `tools/` + repair lane | `mesh/` complements with cleanup/LOD only; no rig changes |

## New in this pipeline (built + tested 2026-10-06)

### 1. Motion — `motion/procedural_moves.py` ✅ runs end-to-end
34 deterministic wrestling moves baked as glTF animations onto the 58-bone
Mixamo skeleton (`mixamorig:` bones): IDLE/WALK/RUN/TAUNT_CROWD/FLEX, JAB/CROSS/
HOOK/UPPERCUT/ELBOW/KNEE/FRONT_KICK/ROUNDHOUSE_KICK/STOMP/CLOTHESLINE/DROPKICK/
SPEAR/BIG_BOOT, TIEUP/IRISH_WHIP/BODYSLAM/SUPLEX/DDT/POWERBOMB/CHOKESLAM/
PILEDRIVER/GERMAN_SUPLEX/HURRICANRANA/ARMDRAG/HIP_TOSS/BACKDROP, KNOCKDOWN/
GETUP/PINFALL. Every move visually verified as stick-figure strips
(`motion/proof/preview_*.png`, 34 files). Deps: numpy (+matplotlib for previews).

Proof: `motion/proof/STICKUP_SUPLEX.glb` (MOVE_SUPLEX, 10 channels, 64 keys),
`motion/proof/STICKUP_JAB.glb` (MOVE_JAB, 5 channels, 16 keys) — injected into
the real `out/STICKUP_repaired.glb`, structure-validated, mesh/skin intact.

### 2. Retarget — `retarget/` ✅ runs end-to-end
- `mediapipe_to_glb.py` — MediaPipe Pose Landmarker (Apache-2.0) → bone-direction
  solve → glTF animation. Proven via `--synthetic-test` (45-frame punch,
  14 nodes → `retarget/proof/SYNTH_CAPTURE.glb`). Video path needs
  `pip install mediapipe opencv-python`; model auto-downloads (~9MB).
- `bvh_retarget.py` — stdlib BVH parser + `mixamo_map.json` → glTF animation.
  Proven via `--synthetic-test` (`retarget/proof/SYNTH_BVH.glb`, structure valid).
  Works with CMU / Mixamo / itch.io BVH captures.

### 3. Mesh — `mesh/` ✅ runs end-to-end
- `mesh_doctor.py` (trimesh, MIT) — weld, degenerate-face removal, normal fix,
  hole fill, normalize. Proof: `mesh/proof/doctor_report.json` on STICKUP
  (12,633→12,102 verts, 81 holes filled). **Caveat:** trimesh export drops skin/
  rig data — use on static meshes or pre-rig stages, not finished characters.
- `lod_chain.py` — LOD0/1/2 via `fast-simplification` (pip install) or open3d (MIT).
  Proof: `mesh/proof/lod/` 18,081 → 9,039 → 4,520 faces.
- `optimize_glb.sh` — gltf-transform (Apache-2.0, via npx 4.5.1 verified) draco+webp.

### 4. World — `world/` ✅ runs end-to-end
- `arena_generator.py` (trimesh, MIT) — full venue: ring, apron, posts, sagging
  ropes, turnbuckles, steps, barricade, ramp, titantron, side screens, light rig,
  4 tiered stands. Proof: `world/proof/arena_house.glb` (112 nodes), `arena.svg`.
- `ring_variants.py` — 6 company palette slots. **Palettes still pending from
  owner** — slots are explicit placeholders, no canon names/colors invented.
- `crowd_generator.py` — varied humanoids (build/skin-tone/clothing/hair
  randomized; NOT chibi per owner directive) as rigid node hierarchies with
  CROWD_CHEER / CROWD_BOO / CROWD_WAVE clips. Proof: `world/proof/crowd_test.glb`
  (40 fans, 389 nodes, 3 clips, spec-valid), `crowd_seats.png`, `cheer_verify.png`.

### Shared — `common/`
`glb_anim.py` (raw JSON+BIN animation injection — appends without re-encoding
meshes; auto-converts `matrix` nodes to TRS for animation targets),
`quat.py`, `fk.py` (forward kinematics incl. column-major matrix decompose).

## License rules

**Allowed:** MIT, Apache-2.0, BSD-2/3-Clause, CC0.
**Rejected:** Stable Fast 3D (Stability AI Community License), Hunyuan3D-2
(Tencent territorial restrictions), GPL/AGPL/MPL/copyleft, OpenPose (custom
non-commercial license). Note: `tools/gen/hf_pipeline.py` (pre-existing,
another lane) references Hunyuan3D-2 via HF Spaces — flagged for license review,
not part of this pipeline.

## Queued next (research scouts delivered 2026-10-06 — folding in)
- Text-to-motion: MoMask (already wired in `tools/mocap/text_to_clip.py`; license
  re-verification queued) and scout-verified alternates → GLB converter reusing
  the SMPL-22→Bannon mapping pattern.
- Extra mesh backends: gltf-transform (verified Apache-2.0, already wrapped),
  meshoptimizer (MIT) for LOD, open3d (MIT) as alt decimator.
- World: scout-verified procedural arena/city tools to extend `world/`.
