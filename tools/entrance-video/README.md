# Entrance Video Pipeline

Our own entrance-video production pipeline — built to match and exceed the
Grok producer bot's lane (owner directive 2026-10-08).

## What it does

Takes a rigged character GLB + entrance kit + music + beat grid, produces a
50-second 5-beat entrance video (16x9 + 9x16):

1. **titantron** — lower-third name card (billed from, height/weight)
2. **entrance** — character walk-in with camera push-in
3. **taunts** — signature taunts (orbit camera)
4. **finishers** — finisher montage (low-angle / static cameras)
5. **tagline + endcard** — nickname card + end card

All cuts land on beat boundaries from the beat grid JSON.

## Tools (all free/open-source)

- **Blender 4.x** (GPL) — headless EEVEE rendering, mocap retargeting
- **ffmpeg** (LGPL/GPL) — beat-synced editing, text cards, loudnorm audio, 9x16 crop

## Files

- `pipeline.py` — orchestrator: reads character config, renders scenes, edits
- `render_scene.py` — Blender bpy script: GLB + mocap FBX retarget + cinematic camera
- `edit.py` — ffmpeg beat-synced editor: scene assembly + text cards + music + outputs
- `kits/` — per-character configs (GLB, music, beats, cards, scenes)

## Usage

```bash
python3 pipeline.py kits/stickup_proof.json --width 960 --height 540
```

Config format — see `kits/stickup_test.json`. Beat spans reference indices
into the beat grid JSON. Scenes render at `--width/--height`, edit matches.

## Mocap retargeting

`render_scene.py` maps Reallusion `J_` bones → Mixamo `mixamorig:` bones
(52/58 on Stick-Up). Animation is REAL mocap from `assets/mocap/drive/*.fbx`
— never procedural bone-wiggling. If no mocap is given, the character holds
bind pose and the camera provides motion.

## Beating the Grok lane

- Same 5-beat structure, same beat-grid sync, same 50s format
- Ours renders fresh 3D from the repaired GLB (not gameplay capture)
- Automated cameras (push_in / orbit / low_angle / static)
- Per-character configs generated from the 130 entrance kits
- Iteratable: re-render any scene without redoing the edit
