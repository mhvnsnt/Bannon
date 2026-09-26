# tools/model_preview — snapshot + auto-rig ANY model, headless

The "senses" for models: drop in any GLB/GLTF/FBX and get (a) rig diagnostics and (b) turnaround
PNGs — without opening the whole game. Also the canonical **auto-rig** the engine's importer mirrors,
so the tool and the game agree on how a model binds.

## Use
```
node snapshot.cjs <model.glb|.gltf|.fbx> [outDir=./shots] [label]
```
Prints `RIG {…}` diagnostics and writes `<label>_front/fq/side/back/pose.png`. The `pose` shot bends
every driven bone so you can SEE it's articulated, not a statue.

Runs headless in the sandbox: Chromium at `/opt/pw-browsers/chromium-1194`, swiftshader, Playwright
(global). All three.js libs are vendored in `vendor/` (no CDN).

## What the auto-rig does (`autorig.js`, engine-agnostic global `AutoRig`)
Four paths, chosen automatically:
| Model shape | Path | Result |
|---|---|---|
| Already has Bones (Mixamo/FBX/authored GLB) | **skinned** | used as-is |
| Mesh nodes named `pelvis/chest/head/shL/…` (Tripo *rigready*) | **named-parts** | synthetic REST skeleton, each part attached to its like-named joint |
| Several unnamed meshes | **chunks** | nearest-centroid attach (Goro) |
| One un-named mesh | **single-static** | flagged `needsSplit:true` — can't per-joint rig |

Every path then **orientation-normalizes** (recenter X/Z, feet to y=0) and reports a **pose test**
(`meshesMoved` / `maxDisp`) — the statue detector.

## Verified
- `BANNON.glb` → named-parts, 15/15 parts, 10 driven segments, pose moved 15/15 (0.678). Renders as a
  correctly-oriented masked Bannon (mask/dreads/trunks/boots all in place).
- `MAIME_tattered.glb` → named-parts, 14 parts, pose moved 14/14 (1.075).
- `BANNON_muscular.glb` → single-static, `needsSplit:true` (correctly refuses to fake-rig a single mesh).

## Format notes
- **GLB / GLTF / FBX**: supported directly.
- **.blend**: cannot load in a browser/three.js — Blender's binary format needs Blender. Convert to
  GLB/FBX first (`tools/blender/convert.py`, `blender-mcp-main/`, or fbx2gltf) then snapshot. The
  auto-rig treats the converted skinned/named result like any other.
- **Single-mesh Tripo previews**: re-export as *rigready* (named-part split) to make them animate.

## Relationship to the engine
`autorig.js` is the reference implementation of `_bindFighterGltf`'s named-part/chunk logic. Keep them
in sync; when the engine importer gains a path (e.g. FBX, orientation heuristics), port it here too so
this stays the ground-truth previewer.
