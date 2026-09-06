# Creation Suite — models, characters, movesets, entrances (WWE-2K / MDickie style)

What's live in-game vs what needs the offline rig step. The suite is the CREATION SUITE hub in the
main menu.

## 1. Drop in a model → auto-skin/rig → attach to a character
- **In-app import (live):** the CAW model file input (`#modelFile`, accepts .glb/.gltf/.fbx) loads a
  model onto the previewed fighter; `assignCharModel(KEY,url,name)` binds it to that CHARACTER so it
  loads for them everywhere. Added models persist in the IndexedDB library (BLIB) + MODEL_LIBRARY.
- **Auto-rig (tool step — can't run in-browser):** rigging needs the UniRig GPU. Drop raw GLBs into
  `assets/models/dropins/` and run `HF_TOKEN=… python3 tools/unirig/batch_rerig.py --dropins`. Each is
  rigged (real skeleton + smooth weights), bone-renamed to the engine BONE_MAP, and banked as
  `assets/models/<NAME>_rigged.glb`. Gate with `tools/model_diag/skinqa.cjs`, then attach in the suite.
- **Why not one in-app button:** the browser has no GPU rigger; the drop-in tool is the automation.

## 2. Make a new character from a procedural / MDickie base
- CAW morphs + attire + palette author a look on the procedural body (saved as a ~0.5KB DNA payload,
  `window.BANNON_DNA`). Pick the **MDickie Base** attire to build on a shared MDickie-style base body
  instead of the tube body (see docs/MDICKIE_BASES.md) — a rung above the Retro procedural body.
- Add a GLB later and it upgrades the same character via the drop-in → rig → attach flow above.

## 3. Moveset
- **MOVE LIBRARY / EDITOR (live):** equip signatures/finishers per position from the move pools
  (routed through resolveGrapPos into the real physics). **DIVE LAB (live):** tune/create/assign dives.
  Movesets are per-character and persist.

## 4. Entrance
- **Queued:** the ENTRANCE hub tile is present but marked "soon" — entrance video/tron, pyro,
  lighting, music timeline are the WWE-2K target. Music is already wired (JUKEBOX: menu/match/
  entrance/victory). The motion/pyro timeline editor is the remaining build.

## Status summary
| Piece                         | State |
|-------------------------------|-------|
| Drop-in GLB import + attach   | LIVE (in-app) |
| Auto-rig a dropped GLB        | LIVE (tool: batch_rerig --dropins) |
| Skinning-quality gate         | LIVE (skinqa.cjs) |
| New char from procedural/MDickie base | LIVE |
| Moveset editor + Dive Lab     | LIVE |
| Entrance editor (pyro/tron/timeline) | QUEUED (music live) |
