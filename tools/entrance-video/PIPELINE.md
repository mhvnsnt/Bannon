# El Toro de Oro Style — Entrance Video Pipeline (v2)

**Status:** Working end-to-end as of 2026-10-08. Proof: `STICKUP_v2_proof_50s_16x9.mp4` (50s).

## What this produces

A 50-second cinematic character entrance video in the El Toro de Oro house style:
black void + colored spotlight pool, 3-point cinematic lighting, multiple camera
angles, mocap-animated (never procedural) character, beat-synced cuts, PIL-rendered
title cards (gold/black-stroke/red-glow, floating over 3D — never black panels),
licensed-style beat-driven music, 16x9 + 9x16 outputs.

## Inputs

| Input | Format | Source |
|---|---|---|
| Character model | Rigged `.glb` (Mixamo-style bones, repaired) | `repo/assets/models/*_repaired.glb` |
| Entrance kit config | JSON (see below) | `tools/entrance-video/kits/*.json` |
| Music | `.mp3`, cut to ~50s | per-character `audio/` dir |
| Beat grid | JSON `{"beat_times_s": [...]}` | per-character `audio/` dir (from librosa/manual) |
| Mocap clips | `.fbx` (Reallusion `J_*` or Mixamo bones) | `repo/assets/mocap/drive/*.fbx` (179 clips) |
| Title card text | In kit config | character name, billed-from, tagline |

### Kit config format (`kits/<char>_v2_proof_50s.json`)

```json
{
  "character": "STICK-UP",
  "glb": "/abs/path/to/STICKUP_repaired.glb",
  "music": "/abs/path/to/stickup_video_cut.mp3",
  "beats": "/abs/path/to/stickup_beats.json",
  "cards": {
    "titantron": {"lines": ["STICK UP", "AMERICUS, GEORGIA", "6'1\" - 155 LBS"]},
    "tagline":   {"lines": ["THE ENIGMATIC GANGSTER", "THE FLAMBOYANT FLEXER"]},
    "endcard":   {"lines": ["STICK UP", "BANNON"]}
  },
  "scenes": [
    {"name": "entrance", "mocap": "/abs/path/Box Idle.fbx",
     "camera": "push_in", "lightshift": "blue", "beats": [0, 24]},
    {"name": "taunts", "mocap": "/abs/path/Taunt.fbx",
     "camera": "orbit", "lightshift": "red", "beats": [24, 48]}
  ],
  "out": "/abs/path/out/STICKUP_v2_proof_50s"
}
```

- `beats: [b0, b1]` are indices into the beat grid; scene duration = `beats[b1]-beats[b0]`.
- Cameras: `push_in`, `orbit`, `low_angle`, `closeup_34`, `side_profile`, `wide`, `medium`.
- Lightshifts: `blue`, `red`, `gold`, `white` (spotlight pool color per scene).
- `mocap: null` → character holds bind pose, camera provides motion.

## Steps & commands

### 0. Prerequisites

```bash
# Blender 4.0.2 (persistent install)
~/workspace/tools/blender/blender-4.0.2-linux-x64/blender --version
# MUST unset PYTHONPATH or system numpy breaks Blender's Python:
env -u PYTHONPATH blender -b --python-expr "import bpy; print('ok')"

# ffmpeg, python3 with PIL
ffmpeg -version | head -1
python3 -c "import PIL; print(PIL.__version__)"
```

### 1. Render 3D scenes (Blender headless, EEVEE)

`pipeline.py` runs this per scene (or run manually):

```bash
env -u PYTHONPATH blender -b -P tools/entrance-video/render_scene.py -- \
  --glb /abs/to/CHAR_repaired.glb \
  --mocap /abs/to/clip.fbx \          # optional
  --camera push_in \                   # see camera list
  --lightshift blue \                  # see lightshift list
  --frames 237 --fps 30 \
  --output /abs/workdir/frames_entrance/ \
  --width 960 --height 540
```

What `render_scene.py` builds (El Toro spec):
- **World:** near-black with dim starfield (no gray, no flat ambient).
- **Floor:** large dark reflective plane catching the spotlight pool.
- **Lighting:** warm key spot (front-left), RED rim spot (back-right, the signature),
  cool blue fill, colored overhead spot pool (per-scene lightshift), front wash
  so the character reads on camera.
- **Retarget:** rotation-only mocap copy (`J_*` → Mixamo map + short-name fallback,
  52/58 bones on Stick-Up). Root stays planted — no flinging, no foot slide.
  Respects each bone's active rotation mode (no quaternion/euler double-write).
- **Camera:** 7 cinematic framings, slightly low default, 3/4 preferred, TRACK_TO
  the character. Never flat profile.
- Frames cached in `$ENTRANCE_WORKDIR` (default `~/workspace/bannon-video-pipe/out/entrance_work_v2/`);
  re-runs skip scenes whose frames already exist.

### 2. Edit (beat-synced ffmpeg + PIL cards)

```bash
python3 tools/entrance-video/edit.py \
  --scenes workdir/scenes.json \
  --beats /abs/to/beats.json \
  --music /abs/to/music.mp3 \
  --cards workdir/cards.json \
  --out /abs/to/out/NAME \
  --fps 30 --width 960 --height 540
```

What `edit.py` does:
1. PNG frames → per-scene MP4, trimmed to beat-span duration (loop-padded).
2. `cards.py` renders title cards as transparent PNG sequences —
   gold fill, black stroke, red glow, red rule (El Toro typography), 3s scale/fade
   animation baked in. **Cards float over the 3D scene; no black panels.**
3. Overlays: titantron card on scene 0, tagline on second-to-last, endcard on last.
   Cards cover the middle 60% of their scene with fade in/out.
4. Concat scenes → 3s fade-from-black opening → music mux
   (loudnorm, cut to video duration) → 9x16 crop.

### 3. One-command full run

```bash
cd ~/workspace/bannon-video-pipe/repo
python3 tools/entrance-video/pipeline.py \
  tools/entrance-video/kits/stickup_v2_proof_50s.json \
  --width 960 --height 540
# outputs: <out>_16x9.mp4 + <out>_9x16.mp4
```

## Outputs

- `<out>_16x9.mp4` — 960x540 (proof) or 1920x1080 (production), h264, 30fps, ~50s, AAC audio.
- `<out>_9x16.mp4` — 1080x1920 vertical crop for Reels/Shorts/TikTok.
- Intermediate frames persist in `~/workspace/bannon-video-pipe/out/entrance_work_v2/frames_*/` (do NOT use /tmp — tmpfs wipes on restart).

## Verification (per the deliverable verification law)

After every run, before claiming done:
1. `ffprobe` duration ≈ 50s, resolution as requested, has audio stream.
2. Extract frames at ≥8 timestamps spanning the whole timeline; open and inspect each:
   - character visible, lit, centered (not tiny/dark/off-frame)
   - no two consecutive sampled frames identical (no frozen sections)
   - title cards render in El Toro typography over 3D (not black panels)
   - feet planted (no below-ground), facing matches camera, no exploded geometry
3. Confirm audio present and video plays end-to-end.

## Known limitations (2026-10-08)

- No clean walk-cycle mocap in `assets/mocap/drive/` (only crouch/drunk/dwarf walks);
  entrance scenes use idle/taunt clips until a walk is sourced.
- Render speed ~15–35 s/frame at 960x540 EEVEE on this VM; a 50s/30fps video is
  ~1500 frames ≈ 6–14 hours. Proof renders use 960x540; production 1080p TBD.
- God-ray cone meshes removed (rendered as opaque pillars); black void + spot
  pool carries the look until a proven volumetric solution lands.
