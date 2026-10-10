# How the Hardy taunt clips were made

Saved 2026-10-09. The three Stick-Up taunt clips in `../clips/`
(`crucifix_hardy.glb`, `finger_guns_hardy.glb`, `hair_whip_hardy.glb`,
PR #58, commit `e7ce5e9`) were rotoscoped from Jeff Hardy reference
footage. This doc pins down exactly how, so nobody has to reverse-engineer it.

## Source video

- Primary: Jeff Hardy entrance video, https://www.youtube.com/watch?v=JGa-Gly3NrY
  (owner-sourced reference footage, "reference use").
- The owner's own reference stills (the frames the poses were actually
  matched to) are saved in this directory as `owner_ref_finger_guns.jpg`,
  `owner_ref_crucifix.jpg`, `owner_ref_dread_whip.jpg`.

## Why rotoscope (not motion capture)

Automatic extraction was tried first and abandoned:

1. `extract_poses.py` ran MediaPipe on the Hardy footage → `.npz` landmark
   files in `../poses/` (e.g. `hardy_entrance.npz`, `seg_crucifix_hardy.npz`).
2. The 3D **world** landmarks came out unusable: noisy/inconsistent 3D
   skeletons and left/right confusion across frames (see the
   `seg_crucifix_hardy.npz` analysis). Wrestling footage is the worst case
   for it: motion blur, camera movement, occlusions, fast hair motion.
3. `landmarks_to_bvh.py` also had coordinate-convention bugs; `retarget_npz.py`
   exists as the direct MediaPipe→rig path but was never usable here because
   the input landmarks were garbage.

So the clips were built by **rotoscope**: a human studied a clear reference
frame and hand-posed the bones to match it — motion-reference extraction,
not guessing, not hand-keyed from imagination (owner rule: no hand-keyed
taunts; rotoscoping from real reference is the allowed path).

## The rotoscope process (`pose_taunt.py`)

- Script: `../pose_taunt.py`, run headless under Blender
  (`blender -b -P pose_taunt.py -- --glb <in> --out <out> --pose <name>`).
- Desired bone **directions** are specified manually in model space (z-up,
  anatomical left = +y) from studying the reference frame — see the `POSES`
  dict in the script: `crucifix`, `finger_guns`, `hair_whip`.
- Each bone direction is converted to a rotation via shortest-arc from rest
  (`shortest_arc()`), then keyframed as:
  **rest → pose → hold → rest**, defaults 20 raise / 45 hold / 20 lower
  frames at **15 fps** → **85 frames, 5.67 s** per clip.
- Note the mirrored naming in the GLB: the bones called "LeftArm" etc. sit
  on the **anatomical right**; the script's pose vectors already account for
  this (comments in `pose_taunt.py` and `retarget_npz.py`).

## Reference-frame → clip mapping

| clip | reference frame used | pose in the frame |
|---|---|---|
| `crucifix_hardy.glb` | `owner_ref_crucifix.jpg` (known in the build notes as `verify_c1.jpg`) | arms spread wide, slightly above horizontal, elbows soft; head tilted back, chest up |
| `finger_guns_hardy.glb` | `owner_ref_finger_guns.jpg` | both arms extended forward at shoulder height, hands in finger-gun pointing shape (elbows bent, hands at chest height in the frame) |
| `hair_whip_hardy.glb` | `owner_ref_dread_whip.jpg` | head-snapping hair whip — head thrown forward/down, arms slightly out |

## QA status (from `../clips/README.md`, unchanged)

- `verify_clip.py` (G4 max_stretch metric, 3.0x limit, 0.30 m shoulder region)
  on each clip's peak pose: **all three FAIL** (25–29x stretch) — the shoulder
  skin webs at these arm angles.
- Peak deltas: crucifix 90.7°, finger_guns 95.0°, hair_whip 86.3° — all
  exceed the 15° safe envelope. The clips are **staged for the repaired rig
  only**. Nothing here ships in a build until the shoulder repair lands and
  QA passes.

## Video availability note (2026-10-09)

The original YouTube source (`JGa-Gly3NrY`) could not be downloaded from this
environment: YouTube returns HTTP 429 + a "sign in to confirm you're not a
bot" challenge (datacenter-IP block; two public Invidious front-ends tried
and also failed). Supplement frames were instead pulled from real,
downloadable Hardy footage found on archive.org.

Saved frames (all 960px wide, pulled via ffmpeg remote-seek from the
archive.org mp4):

| file | source video, timestamp | what it shows |
|---|---|---|
| `hardy_crucifix_01.jpg` | TNA Bound for Glory 2025 (https://archive.org/details/tna-bound-for-glory-2025-12-10-25), ~10090s | the Hardys on the entrance stage — Matt with arms spread wide overhead, Jeff with arms raised |
| `hardy_crucifix_02.jpg` | same, ~10098s | Jeff from behind, arms spread wide (crucifix pose), full body |
| `hardy_fingerguns_01.jpg` | same, ~10095s | Jeff with right arm raised high pointing upward, full body |
| `hardy_entrance_01.jpg` | same, ~10165s | Matt entrance walk close-up with the title belt (context frame) |

No clean head-snap/hair-whip frame was found in this broadcast footage; the
owner's `owner_ref_dread_whip.jpg` still remains the actual rotoscope
reference for `hair_whip_hardy.glb`. Also noted as checked-but-rejected:
https://archive.org/details/wwe-svr-jeff-hardy-entrance-with-2007-theme (fan
capture of the SmackDown vs. Raw 2008 entrance — game footage with a YouTube
player overlay, too low-quality to use); TNA Impact 2026-06-20 and 2026-06-27
(full episodes on archive.org — preview thumbs scanned, no Hardy entrances).

These supplement frames document the taunt poses from real video; the
owner's stills remain the frames the rotoscope was actually matched to.
