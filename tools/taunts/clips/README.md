# Taunt clips — Stick-Up (retargeted, staged)

Owner rule: no hand-keyed taunts. Every clip here comes from real
reference (video frames / mocap), posed via `tools/taunts/pose_taunt.py`
(rotoscope from video reference) or `tools/taunts/retarget.py` (BVH mocap
→ rig), with bone maps in `tools/taunts/retarget_map.json`.

**Methodology note (2026-10-09):** Automatic MediaPipe 3D world-landmark
extraction was attempted on the Hardy footage but produced unusable data
(noisy/inconsistent 3D skeletons, left/right confusion — see
`tools/taunts/poses/seg_crucifix_hardy.npz` analysis). The Hardy clips
below were rotoscoped: the pose was matched to a clear video reference
frame (verify_c1.jpg for crucifix), then built as rest→pose→hold→rest.
This is motion-reference extraction, not guessing.

Verification: `tools/taunts/verify_clip.py` (G4 max_stretch metric, 3.0x
limit, 0.30m shoulder region) on the peak pose. All three Hardy clips
FAIL (25-29x stretch) — the shoulder skin webs at these arm angles.
They are staged for the repaired rig only.

Safe envelope (until the shoulder repair lands): 15° max shoulder
delta-from-rest. All clips exceed it → NOT cleared for the current rig.
No clip that webs the mesh ships anywhere.

## Clip inventory

| clip | source | license | retarget | deform metric | envelope | status |
|---|---|---|---|---|---|---|
| `crucifix_hardy.glb` | Jeff Hardy entrance video, rotoscoped from reference frame (verify_c1.jpg: arms spread, head back) via `../pose_taunt.py`; 85 frames @15fps, 5.67s | video source: Jeff Hardy reference footage (owner-provided reference use) | pose_taunt.py --pose crucifix | **FAIL** — max_stretch 25.1x (L) / 26.9x (R), limit 3.0x | Peak 90.7° — EXCEEDS 15° → repaired rig only | STAGED, NOT VERIFIED — do not use in builds |
| `finger_guns_hardy.glb` | Jeff Hardy finger-guns taunt, rotoscoped via `../pose_taunt.py`; 85 frames @15fps, 5.67s | video source: Jeff Hardy reference footage | pose_taunt.py --pose finger_guns | **FAIL** — max_stretch 27.3x (L) / 29.5x (R) | Peak 95.0° — EXCEEDS 15° → repaired rig only | STAGED, NOT VERIFIED |
| `hair_whip_hardy.glb` | Jeff Hardy hair-whip/head-snap, rotoscoped via `../pose_taunt.py`; 85 frames @15fps, 5.67s | video source: Jeff Hardy reference footage | pose_taunt.py --pose hair_whip | **FAIL** — max_stretch 26.6x (L) / 27.2x (R) | Peak 86.3° — EXCEEDS 15° → repaired rig only | STAGED, NOT VERIFIED |
| `cmu_143_01.glb` | CMU mocap 143_01.bvh via `../retarget.py --source cmu_bvh` | CMU / public mocap | retarget.py, root_motion_scale 1.08 | not yet run | Peak 178.9°/145.3° — EXCEEDS 15° → repaired rig only | STAGED, NOT VERIFIED |
| `cmu/143_02..08.bvh` | CMU mocap database via `tools/statue-to-game/fetch_mocap.py` (no-login pull) | CMU / public mocap | not yet retargeted | — | — | PENDING retarget |

## Mixamo owner one-click downloads (needs owner's Adobe login — do NOT log in as him)

Best Mixamo picks for the three taunt targets (finger guns, crucifix,
headbang). Verify names in the Mixamo UI before downloading; Mixamo
renames clips over time.

- Finger guns / aiming: "Pistol Idle", "Aiming", "Gunplay" (search: pistol, aiming)
- Crucifix / arms-spread: "Crucifix", "T-Pose to ...", "Victory Idle" variants (search: crucifix, victory)
- Headbang / head-snap: "Headbang", "Head Nod Yes" (search: headbang, head nod)

Download as FBX with skin, 30fps, then run through `retarget.py` with
`--source` mapping adapted to the Mixamo bone names (add a `mixamo_bvh`
map to `retarget_map.json`).

## Pipeline scripts (`tools/taunts/`)

- `extract_poses.py` — MediaPipe pose extraction from reference video → `.npz`
  (NOTE: 3D world landmarks unreliable on the Hardy footage; 2D is better)
- `segment_taunts.py` — window npz into taunt segments
- `landmarks_to_bvh.py` — npz landmarks → BVH (has coordinate-convention bugs;
  use `retarget_npz.py` instead for direct retarget)
- `pose_orient.py` — shared bone orientation construction
- `retarget_npz.py` — DIRECT retarget: MediaPipe npz → Stick-Up rig (bypasses
  BVH; handles the MediaPipe↔model coordinate mapping)
- `pose_taunt.py` — rotoscope taunts from video reference frames (used for the
  3 Hardy clips after MediaPipe 3D failed)
- `retarget.py` — headless-Blender retarget: source BVH → STICKUP_repaired.glb
  mixamorig rig (used for CMU); prints PEAK_ABDUCTION + SAFE_ENVELOPE_15DEG
- `verify_clip.py` — G4 max_stretch deformation metric on a clip's peak pose
- `retarget_map.json` — bone map (hardy_bvh + cmu_bvh conventions), root_motion_scale 1.08

## Open problems (for the next worker)

1. MediaPipe 3D world landmarks are unreliable on wrestling footage (motion
   blur, camera movement, occlusions). For future video-to-mocap, try: (a) the
   2D landmarks with a different 3D estimator, (b) PoseTrak (Apache-2.0),
   (c) better source footage (static camera, clear full-body).
2. All 3 Hardy clips FAIL the deform metric (25-29x vs 3.0x limit) — they
   need the repaired rig. Do NOT use in builds until the shoulder repair lands
   and QA passes.
3. Retarget remaining CMU 143_02..08 clips; pull Quaternius CC0 supplements.
4. The GLB's left/right bone NAMING is mirrored vs anatomy ("LeftArm" is on
   the anatomical right). Documented in `retarget_npz.py` and `pose_taunt.py`.
