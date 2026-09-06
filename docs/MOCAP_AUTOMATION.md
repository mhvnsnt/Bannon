# Automated Move Animation / Mocap — the NON-MANUAL pipeline

Goal: every move looks authored (mocap-quality) with **zero manual keyframing** — the tooling/AI does it.

## Shipped
1. **182 FBX mocap clips** in `assets/mocap/` + `assets/mocap/drive/`, loaded at runtime via
   `BANNON_LOAD_FBX_LIBRARY()` → `STUDIO.clips`, applied by `studioApplyClipPose`.
2. **`tools/mocap/auto_map_moves.cjs`** — automated mapper: scores every clip against every move
   (name/category/position/engine-key) and writes `assets/moves/move_clip_map.json` (138/138 moves
   mapped). The engine (`BANNON_MOVE_LIBRARY.load`) attaches each move's best clip so it ANIMATES the
   moment the FBX library is loaded — physics-only until then (graceful). Re-run any time: zero manual work.

## Next non-manual upgrades (open-source, AI-does-the-work)
1. **More clips, auto-pulled** — a fetch script for free Mixamo / CMU-style mocap (FBX/BVH), converted
   to GLB via the in-repo `fbx2gltf` binary, dropped into `assets/mocap/` → auto-mapped by the mapper.
   No manual retarget: the engine's `BONE_MAP` already binds Mixamo-named bones.
2. **Video → motion** — open-source video-to-motion models (e.g. HF Spaces: WHAM / 4D-Humans / MotionBERT)
   turn wrestling clips into BVH/FBX automatically; run the model (hosted, no local GPU), export, drop in,
   re-run the mapper. This is the "AI does all the work" path — no manual mocap capture.
3. **Auto-retarget QA** — reuse `tools/model_diag/skinqa.cjs`-style residual checks to reject bad clips
   automatically, so only clean motion lands.
4. **Per-character style layers** — the mapper can weight clips by fighting style so a lucha move picks a
   lucha clip, a strong-style move picks a stiff one — still fully automatic.

## How to run
```
node tools/mocap/auto_map_moves.cjs      # re-map moves -> clips after adding clips or moves
```
`assets/moves/move_clip_map.json` is bundled into the APK (android.yml copies assets/moves/*.json) and
served on the web, so the mapping ships everywhere.
