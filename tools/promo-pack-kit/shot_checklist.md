# Shot Checklist — PROMO PACK KIT template

Copy this file per character / per version. Every row is a shot from the
scene grid (`scene_grid.py --table`). Every column is evidence: a gate result
or a proof frame. A row ships only when every gate column is PASS and the
proof frame has been opened and inspected.

Beat grid for this run: `scene_grid.py --bpm <BPM> --duration <DUR> --table > grid.txt`
(bpm parameter is never hardcoded — record the actual value here).

## Character / version info
- Character (canon name):
- Version (v1 / v2 / ...):
- BPM / duration / fps:
- Model file (own rigged model, post skin-weight + pose repair):
- Animation set: [ ] owned (named moves below) / [ ] borrowed (list sources — NOT allowed to ship)

## Per-shot checklist

| # | Shot | Beats | Time (s) | Frames | Camera | Gate: feet planted | Gate: facing | Gate: no flap | Gate: no ribbon/exploded | Gate: foot slide | Gate: no rope cross | Gate: no broken poses | Proof frame | Inspected? |
|---|------|-------|----------|--------|--------|--------------------|--------------|----------------|--------------------------|------------------|---------------------|----------------------|-------------|------------|
| 1 | shadow_pushin | 0-8 | 0.00-4.00 | 0-192 | slow push-in, in shadow | | | | | n/a | | | | [ ] |
| 2 | dead_air | 7.5-8 | 3.75-4.00 | 180-192 | hold | n/a | n/a | | | n/a | | | | [ ] |
| 3 | golden_hit | 8-24 | 4.00-12.00 | 192-576 | cut to lit medium | | | | | n/a | | | | [ ] |
| 4 | walk_out | 24-38 | 12.00-19.00 | 576-912 | side track, eye level | | | | | | | | | [ ] |
| 5 | gesture_mask_orbit | 38-56 | 19.00-28.00 | 912-1344 | gesture, tight mask orbit | | | | | n/a | | | | [ ] |
| 6 | slowmo_breakdown | 56-72 | 28.00-36.00 | 1344-1728 | slow-mo, letterbox, strobes | | | | | n/a | | | | [ ] |
| 7 | wide_pyro | 72-92 | 36.00-46.00 | 1728-2208 | high wide + pyro | | | | | n/a | | | | [ ] |
| 8 | end_card | 92-100 | 46.00-50.00 | 2208-2400 | locked end-card frame | n/a | n/a | | | n/a | n/a | | | [ ] |

(Times/frames shown are the 120 BPM / 50 s / 24 fps El Toro reference. Regenerate
with scene_grid.py for your run and overwrite them.)

## v1 -> v2 fix list (each mapped to a gate, each with a side-by-side proof)

| Defect (from v1) | Gate that proves it fixed | v1 measured | v2 measured | Fixed? | Proof image |
|------------------|---------------------------|-------------|-------------|--------|-------------|
| pale skin flap at left shoulder | skin_flap_area_px <= 200 px | | | [ ] | |
| floating off the mat in ending pose | feet_above_ground_max_mm <= 15 mm | | | [ ] | |
| ring rope cutting across chest | rope_crossing_frames == 0 | | | [ ] | |
| borrowed walks/poses | owned animation set + foot_slide gate | | | [ ] | |
| flat pyro pasted on top | 3D pyro + haze (render evidence) | | | [ ] | |
| dark empty arena, flat lighting | crowd + colored spots + stage (render evidence) | | | [ ] | |
| rotation error after rig repair | rig.rotation_error_eff_deg <= 3.0 deg | | | [ ] | |

## MEDIA PROOF STANDARD (owner law — nothing is "done" without these)
- [ ] Real files exist for every claim: video file + proof composites + this filled checklist
- [ ] Check frames actually looked at (list exact frames/timestamps):
- [ ] File fingerprints recorded (sha1 of each deliverable):
- [ ] Before-and-after proof for every v1 defect: side-by-side composite per defect
- [ ] No AI faces anywhere: character renders are the owner's own rigged model or
      masked performers only — no generated faces, no face swaps, no exceptions
- [ ] Version, never overwrite: v1 assets are untouched on disk (verify mtime/hash);
      every revision is a new versioned output (v2, v3, ...) in its own directory

## Canon text check (deliverable text policy — NO placeholder text)
- [ ] Every on-screen word comes from the character's canon notes (Off The Top Rope or confirmed)
- [ ] Name spelled as canon; finisher named as canon; hometown as canon
- [ ] Hometown unknown -> "parts unknown" (never "not in canon" / TBD / placeholder)
- [ ] No invented characters, names, factions, or based-on relationships anywhere in the video

## Owned-animation check (no procedural bone-wiggle)
- [ ] Every animation is a real retargeted/mocap/animator-made clip — no procedural posing passed off as a move
- [ ] Luchador strut: feet planted, beat-locked, 2 steps/s
- [ ] Bull-horns taunt + stomp: feet planted through the stomp
- [ ] Turnbuckle pose: holds, no slide
- [ ] Finisher tease: no broken poses (gate confirms)

## Deliverable formats
- [ ] 16:9 master (landscape)
- [ ] 9:16 vertical cut
- [ ] Animated 3D title card (separate asset)
- [ ] End card (separate asset)
- [ ] Side-by-side v1/v2 proof set with this checklist filled in
