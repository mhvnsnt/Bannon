# PROMO PACK KIT — canonical spec

The reusable 3D-game promo pack kit for the animation pipeline: cutscenes,
promos, ads. Perfected from the El Toro v1 promo. Game-agnostic — Bannon is
the proving ground, AshLane reuses it. Tooling lives in
`tools/promo-pack-kit/` (see its README for the pipeline diagram).

Owner request 2026-10-07: perfect the El Toro v1 promo into this kit.
Owner update 2026-10-07: the kit follows the MEDIA PROOF STANDARD playbook
(baked into §7 below).

## 1. Beat grid (BPM-parameterized, never hardcoded)

Every cut lands on a beat. BPM is a parameter: shots are authored in BEATS,
then converted to times/frames. The El Toro v1 reference is 50 s @ 120 BPM
(beat = 0.5 s, 100 beats, 24 fps → 1200 frames — verified against the v1
video: 50.0 s, 1200 frames).

`scene_grid.py --bpm <BPM> --duration <DUR> --fps <FPS> --table` generates the
cut sheet. Canonical shot list (beats):

| # | Shot | Beats | @120 BPM | Camera | Lighting | Audio | Graphics |
|---|------|-------|----------|--------|----------|-------|----------|
| 1 | shadow_pushin | 0–8 | 0.00–4.00 s | character in shadow, slow push-in | near-black, single dim key | music swelling | none |
| 2 | dead_air | 7.5–8 | 3.75–4.00 s | hold push-in | near-black | 0.25 s silence (dropout) | none |
| 3 | golden_hit | 8–24 | 4.00–12.00 s | cut to lit medium, slight dolly | full reveal | THE GOLDEN HIT (see §4) | logo slams in, name card appears |
| 4 | walk_out | 24–38 | 12.00–19.00 s | side track, eye level | entrance spots | beat-locked: 1 step per beat (2 steps/s @120) | name + finisher + hometown lower third |
| 5 | gesture_mask_orbit | 38–56 | 19.00–28.00 s | entrance gesture, tight orbit around the mask | colored spots | music full | none (the mask is the graphic) |
| 6 | slowmo_breakdown | 56–72 | 28.00–36.00 s | slow motion, tighter frames | strobes | music cut to half-time | black letterbox bars in |
| 7 | wide_pyro | 72–92 | 36.00–46.00 s | high wide | pyro hits, haze | music peak | win poses, signature-move graphic |
| 8 | end_card | 92–100 | 46.00–50.00 s | locked end-card frame | final look | final hit, then ring out | end card |

Notes:
- Shot 2's 7.5-beat start is the deliberate quarter-second dropout before the
  hit — `scene_grid.py` flags it as off-beat on purpose; keep it.
- Shots are in beats; at any other BPM the same beat list applies. If the last
  shot overruns the requested duration, the script warns — fix the shot list
  or the duration, never fudge the beats.
- Edit-time companions (different job, same family): `tools/video/beat_edl.py`
  (beat JSON → OTIO editorial timeline) and `tools/video/make_beat_edit.py`
  (cut captured footage to the beat grid). This kit does authoring-time
  planning; those do edit-time cutting.

## 2. Why v1 worked (keep these invariants)

1. The owner's own rigged model, run through the game's own skin-weight and
   pose repair — so it held up.
2. Masked performer = no face to get wrong. (See §7: NO AI faces, ever.)
3. Every on-screen word comes from the character's canon notes
   (Off The Top Rope or owner-confirmed). See §6.
4. Music written to the exact cut times.
5. Walk speed matched to the beat grid so feet don't slide
   (1 step per beat; 14 steps across the 14-beat walk-out).

## 3. Shot specs: camera / lighting / crowd / pyro / graphics

- **Camera:** push-in (shot 1), dolly (shot 3), side track at eye level
  (shot 4), tight orbit around the mask (shot 5), slow-mo tight frames
  (shot 6), high wide (shot 7). No shot may let a ring rope cross the
  character's body (gate: `rope_crossing_frames == 0`).
- **Lighting:** near-black → full reveal → colored entrance spots → strobes
  (shot 6) → pyro light. v2 requirement: real lighting with colored spots,
  no flat lighting.
- **Crowd:** v2 requirement: a real crowd with camera flashes. Arena may not
  be dark and empty.
- **Entrance stage:** v2 requirement: an entrance stage with screens.
- **Pyro:** v2 requirement: real 3D pyro + haze. Flat 2D pyro pasted on top
  is a defect (v1's was).
- **Graphics:** logo slam (shot 3), name card (shot 3), lower third with
  name + finisher + hometown (shot 4), signature-move graphic (shot 7),
  animated 3D title card + end card (deliverables, §5). All text obeys §6.

## 4. Music spec

- Written to the exact cut times from the beat grid — not edited to fit later.
- The golden hit (shot 3, beat 8) is an original sound: sub boom + crack +
  gold bell + glass-like pings.
- v2 requirement: fuller bass, bigger hit, wider mix.
- Shot 6: music cut to half-time under the slow-motion breakdown.

## 5. Per-character owned-animation requirements

No borrowed walks/poses may ship. Every character gets their OWN set,
checked for sliding and broken poses (gates in §8):

- luchador strut: feet planted, beat-locked, 1 step per beat
- bull-horns taunt + stomp: feet planted through the stomp
- turnbuckle pose: holds, no slide
- finisher tease: no broken poses

NO procedural bone-wiggle posing as a substitute for real retargeted motion —
a prior promo was rejected for glitchy procedural posing. Every clip must be
a real retargeted / motion-captured / animator-made clip.

## 6. Canon text rules (deliverable text policy)

- Every on-screen word comes from the character's canon notes (Off The Top
  Rope or owner-confirmed). No placeholder text — never "not in canon",
  never TBD, never lorem ipsum.
- Hometown unknown → "parts unknown".
- No invented characters, names, factions, or based-on relationships
  anywhere in the video. Canon comes from the owner's books and his
  confirmations only.

## 7. MEDIA PROOF STANDARD (owner law 2026-10-07)

Nothing is "done" without ALL of the following:

1. **Real files** — the video file, the proof composites, the filled
   checklist. A claim without files is not a deliverable.
2. **Check frames actually looked at** — the exact frames/timestamps the
   worker opened and inspected, listed by name. `sbs_proof.py --inspected`
   embeds this list in every proof composite.
3. **File fingerprints** — sha1 of every deliverable, recorded in the
   checklist and embedded in every proof composite
   (`sbs_proof.py` prints and renders both v1 and v2 sha1).
4. **Before-and-after proof** — a side-by-side v1/v2 composite per defect,
   with the fix checklist marking each item fixed or not, with the gate and
   the measured numbers that prove it (`sbs_proof.py --fixes`).
5. **NO AI faces on his characters** — character renders are the owner's own
   rigged models (masked where the design calls for it). The kit never
   generates faces, never swaps faces, no exceptions.
6. **Version, never overwrite** — v1 assets stay untouched on disk (verify
   mtime/hash). Every revision is a new versioned output (v2, v3, ...) in
   its own directory. No redoing work over the old version.

## 8. Rig + QA gates (automated, computed from data)

`promo_gates.py --metrics <shot-metrics.json>` evaluates per shot, following
the `gate_check.cjs` pattern (PASS/FAIL lines, exit 1 on any failure).
Thresholds are overridable via `--config`; defaults:

| Gate | Threshold | From |
|------|-----------|------|
| rig.rotation_error_eff_deg | ≤ 3.0 deg | QA chart after rig repair (2026-10-07): XBot ref 0.0 PASS, BANNON_v1 5.1 FAIL, Cody tripo 7.0 FAIL — the gate MUST fail these before any promo renders on repaired models |
| feet_above_ground_max_mm | ≤ 15 mm | v1's ending pose floated off the mat |
| facing_vs_movement_deg | ≤ 15 deg | no crab-walking |
| skin_flap_area_px | ≤ 200 px | v1's pale shoulder flap |
| ribbon_geometry / exploded_geometry | false | no exploded geometry |
| foot_slide_mm_per_frame | ≤ 8 mm/frame | walk locked to the beat, feet planted |
| rope_crossing_frames | == 0 | no rope across the body |
| broken_pose_frames | == 0 | no broken poses |
| capture.pageErrorCount / errorCount / deformation.spikes | == 0 | passthrough from capture gates |

Metrics must come from measurement tooling (rig-repair tools, retarget QA,
frame analysis). `promo_gates.py` evaluates; it does not measure. Verified
this session: the bundled v1 sample metrics FAIL 5 gates (exit 1); a clean
sample PASSES all 12 (exit 0). Gates that pass everything prove nothing.

## 9. Side-by-side proof format

Per defect: one composite from `sbs_proof.py` — v1 frame left, v2 frame
right, header naming the defect, footer with the fix checklist (each item
fixed / not fixed, gate, v1→v2 numbers), sha1 fingerprints of both frames,
the inspected-frame list, and the version marker. The checklist template
`tools/promo-pack-kit/shot_checklist.md` is filled per character.

## 10. Deliverable formats

- 16:9 master (landscape)
- 9:16 vertical cut
- Animated 3D title card (separate asset)
- End card (separate asset)
- Side-by-side v1/v2 proof set + filled shot checklist

## 11. Build verification (this kit build, 2026-10-07)

- `scene_grid.py`: 120 BPM / 50 s / 24 fps reproduces the v1 cut sheet
  exactly — golden hit 4.00 s (frame 96), walk-out 12.00–19.00 s
  (frames 288–456), end card 46.00–50.00 s (frames 1104–1200 = 1200 total,
  matching the v1 video's 1200 frames). BPM 100 correctly warns on duration
  overrun. Verified run output in the commit.
- `promo_gates.py --self-test`: v1 sample → FAIL 5 gates, exit 1
  (rotation error 5.1 deg > 3.0; floating 42 mm; skin flap 1250 px;
  foot slide 12.4 mm/frame; rope crossing 1 frame). Clean sample → all 12
  PASS, exit 0.
- `sbs_proof.py`: generated `examples/proof_demo.png` (1920×1138), opened
  and read — labels, checklist strip, sha1 fingerprints, inspected-frame
  list, version marker all render.
- `docs/promo/PROMO_PACK_KIT.md` (this file): read back after writing.
- Frames actually inspected this build: `verify_t2.png` (0–4 s shadow
  push-in, matches spec), `verify_t48.png` (end card: ASHLANE /
  URBAN REIGN 2 • 2026), `examples/proof_demo.png` (proof composite).
