# Taunt clips — Stick-Up (retargeted, staged)

Owner rule: no hand-keyed taunts. Every clip here comes from real
mocap/reference, retargeted with `tools/taunts/retarget.py` (world-space
delta transfer, constraint-free, per-bone bone map in
`tools/taunts/retarget_map.json`), and every staged clip must pass the
deformation gate before it is used in any video build.

Verification gate: `node ../../rigging/clip_deform_qa.cjs <clip.glb>`
(PASS: spikes/frame p95 < 40; WATCH: 40–150; FAIL: > 150 or worst spike
ratio > 100x on any frame). A worker's "verified" is a claim — this
README records the measured verdict, not the claim.

Safe envelope (until the shoulder repair lands): 15° max shoulder
abduction delta-from-rest. Clips that exceed it are staged under
`needs-repaired-rig/` and are NOT cleared for the current rig. No clip
that webs the mesh ships anywhere.

## Clip inventory

| clip | source | license | retarget | QA verdict | envelope | status |
|---|---|---|---|---|---|---|
| `crucifix_hardy.bvh` / `.glb` | MediaPipe pose extraction from Jeff Hardy entrance video → `../poses/seg_crucifix_hardy.npz` → `../landmarks_to_bvh.py` | video source: Jeff Hardy reference footage (owner-provided reference use) | `retarget.py --source hardy_bvh`, root_motion_scale 1.08, 97 frames @30fps, 6.47s | **FAIL** — spikesP95 874, worstRatio 194.7x, spikes concentrated at mixamorig:Hips/UpLegs (watchdog run 2026-10-09). NOTE: the same QA also fails the earlier `tools/generative/motion/proof/STICKUP_JAB.glb` (329) and `STICKUP_SUPLEX.glb` (419) on this model, so the QA metric itself may be miscalibrated for the Stick-Up skin — unresolved. Do NOT mark this verified. | Arms peak 77.7° delta from first frame — EXCEEDS 15° envelope → staged for repaired rig only | STAGED, NOT VERIFIED — do not use in builds |
| `finger_guns_hardy.glb` | Jeff Hardy finger-gun segment (live worker built 2026-10-09 ~18:27 CDT via `../pose_taunt.py`); 5.67s | video source: Jeff Hardy reference footage | retargeted | spikesP95 361, worstRatio 135.6x → QA says FAIL (same signature as crucifix/JAB/SUPLEX — miscalibration unresolved). QA's "frozen" flag is WRONG for this clip: arms move 95.0° (raise to chest height, plausible finger-guns), forearms 34.7°, head 13.8° — real upper-body motion, hips/feet just don't travel (QA's frozen detector only watches hips/feet) | arms 95° — EXCEEDS 15° envelope → repaired rig only | STAGED, NOT VERIFIED |
| `hair_whip_hardy.glb` | Jeff Hardy headbang/hair-whip segment (live worker built 2026-10-09 ~18:28 CDT); 5.67s | video source: Jeff Hardy reference footage | retargeted | spikesP95 368, worstRatio 121.7x → QA says FAIL (same signature — miscalibration unresolved). "frozen" flag again wrong: arms 86.3°, spine1 17.5°, head 12.8°, neck 3.7° — real motion | EXCEEDS 15° envelope → repaired rig only | STAGED, NOT VERIFIED |
| `cmu/143_01..08.bvh` | CMU mocap database via `tools/statue-to-game/fetch_mocap.py` (no-login pull) | CMU / public mocap | not yet retargeted | — | — | PENDING retarget |
| `quaternius/` | EMPTY — Quaternius CC0 pulls not yet done (quaternius.com, verified free) | CC0 | — | — | — | PENDING |

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
- `segment_taunts.py` — window npz into taunt segments (`poses/*.seg.npz`, `win_*.npz`)
- `landmarks_to_bvh.py` — npz landmarks → BVH (`clips/*.bvh`)
- `pose_orient.py`, `retarget_npz.py` — orientation/np-space helpers
- `retarget.py` — headless-Blender retarget: source BVH → STICKUP_repaired.glb mixamorig rig; prints PEAK_ABDUCTION + SAFE_ENVELOPE_15DEG verdict
- `retarget_map.json` — bone map (hardy_bvh + cmu_bvh conventions), root_motion_scale 1.08

## Open problems (for the next worker)

1. `crucifix_hardy.glb` QA FAIL is unresolved — determine whether the
   spike metric is miscalibrated on the Stick-Up skin (both prior
   Stick-Up motion proofs also fail it) or the skin/retarget is really
   tearing. Until resolved, nothing in this folder is "verified".
2. Build `finger_guns_hardy` and `hair_whip_hardy`: locate/extract the
   Hardy video segments, MediaPipe → npz → bvh → retarget → QA gate.
3. Pull Quaternius CC0 supplements; retarget the CMU 143_0x clips.
4. Move full-range clips into `needs-repaired-rig/` once the shoulder
   repair lands; re-run QA on the repaired rig.
