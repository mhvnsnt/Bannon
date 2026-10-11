# Bannon Generative Pipeline — `tools/generative/`

Everything here runs on CPU, offline, with no accounts and no API credits.
Real can run every script below on his own machine. Python 3.10+.

## One-command self test

```bash
cd tools/generative
python3 selftest.py
```

## Quick recipes

```bash
# --- 1. MOTION: procedural wrestling animations (34 moves, 58-bone skeleton)
python3 motion/procedural_moves.py --list
python3 motion/procedural_moves.py --move SUPLEX \
    --on ../../out/STICKUP_repaired.glb --out motion/proof/STICKUP_SUPLEX.glb
# all 34 moves onto a character:
python3 motion/procedural_moves.py --all --on ../../out/STICKUP_repaired.glb --outdir motion/proof/
# verify a move visually before shipping it:
python3 motion/preview.py --move HURRICANRANA --on ../../out/STICKUP_repaired.glb --out /tmp/hurr.png

# --- 2. RETARGET: mocap onto the Bannon skeleton
# from video (needs: pip install mediapipe opencv-python):
python3 retarget/mediapipe_to_glb.py --video ref.mp4 --on ../../out/STICKUP_repaired.glb \
    --out retarget/proof/STICKUP_capture.glb --name POWERBOMB
# from any BVH file (CMU database, Mixamo packs, itch.io):
python3 retarget/bvh_retarget.py --bvh walk.bvh --on ../../out/STICKUP_repaired.glb \
    --out retarget/proof/STICKUP_walk.glb

# --- 3. MESH: cleanup + LOD
python3 mesh/mesh_doctor.py --input model.glb --output fixed.glb
python3 mesh/lod_chain.py --input fixed.glb --outdir lod_out/   # needs: pip install fast-simplification
bash mesh/optimize_glb.sh fixed.glb fixed_opt.glb              # needs: npx (draco+webp)

# --- 4. WORLD: arena + crowd
python3 world/arena_generator.py --company HOUSE --out world/proof/arena.glb \
    --schematic world/proof/arena.svg
python3 world/crowd_generator.py --count 400 --seed 3 --out world/proof/crowd.glb
```

## Layout

| Folder | What | License of deps |
|---|---|---|
| `common/` | GLB animation injection, quaternion math, forward kinematics | stdlib + numpy |
| `motion/` | 34 procedural wrestling moves → glTF animations on the 58-bone Mixamo skeleton | numpy/matplotlib |
| `retarget/` | MediaPipe video-mocap → GLB; BVH → GLB (CMU/Mixamo/itch.io captures) | numpy (+ mediapipe, opencv for video) |
| `mesh/` | mesh doctor (weld/repair/hole-fill/normalize), LOD chain, gltf-transform optimize | trimesh (MIT), fast-simplification |
| `world/` | procedural arena + 6-company ring palettes + varied-humanoid crowd (cheer/boo/wave) | trimesh (MIT) |

See `GENERATIVE_PIPELINE.md` for the full catalog, license rules, and what complements
(rather than duplicates) the existing `tools/mocap/` and AshLanev2 `tools/generative/`.

## License law (owner directive — no exceptions)

Only **MIT / Apache-2.0 / BSD / CC0** in this pipeline. Rejected: Stable Fast 3D,
Hunyuan3D-2, GPL/AGPL/MPL/copyleft, OpenPose's custom license. Every new tool added
here must have its license verified from the actual LICENSE file before it lands.
