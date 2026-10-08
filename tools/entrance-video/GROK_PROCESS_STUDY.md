# GROK'S EL TORO PROCESS — What It Actually Did (Process Archaeology)

Date: 2026-10-08. Task: study Grok's PROCESS, not the product.

## TL;DR

Grok's Producerbot made the El Toro video on Grok's side. **Its actual scripts,
Blender project, prompts, and title-card assets are NOT in any repo we can
reach.** What survives is: (1) the finished 50s MP4, (2) a full methodology
kit reverse-engineered from it by a Muse agent on 2026-10-08
(`tools/promo-pack-kit/` + `docs/promo/PROMO_PACK_KIT.md`), and (3) the owner's
memory of what was good/bad about v1. The El Toro originals (theme music,
title-card source assets, before/after proof) were **never recovered**
(owner-confirmed 2026-10-05).

Anyone claiming to "replicate Grok's process" from scripts is working from the
reconstruction, not Grok's actual files. This document separates what was
FOUND from what is MISSING from what can be INFERRED.

---

## 1. FOUND — Grok's process as reconstructed

### A. The 8-shot blueprint (from PROMO_PACK_KIT.md + scene_grid.py)

Grok's El Toro v1 is 50s @ 120 BPM = 100 beats @ 24fps = 1200 frames.
Every cut lands on a beat. The 8 shots:

| # | Shot | Beats | Time | Camera | Lighting | Audio | Graphics |
|---|------|-------|------|--------|----------|-------|----------|
| 1 | shadow_pushin | 0–8 | 0–4s | slow push-in, character in shadow | near-black, single dim key | music swelling | none |
| 2 | dead_air | 7.5–8 | 3.75–4s | hold | near-black | 0.25s silence dropout | none |
| 3 | golden_hit | 8–24 | 4–12s | cut to lit medium, slight dolly | FULL REVEAL | sub boom + crack + gold bell + glass pings | logo slam, name card |
| 4 | walk_out | 24–38 | 12–19s | side track, eye level | entrance spots | 2 steps/s, beat-locked | name + finisher + hometown lower third |
| 5 | gesture_mask_orbit | 38–56 | 19–28s | tight orbit around the mask | colored spots | music full | none (mask is the graphic) |
| 6 | slowmo_breakdown | 56–72 | 28–36s | slow-mo, tighter frames | STROBES | music half-time | black letterbox bars |
| 7 | wide_pyro | 72–92 | 36–46s | high wide | PYRO hits, haze | music peak | win poses, signature-move graphic |
| 8 | end_card | 92–100 | 46–50s | locked frame | final look | final hit, ring out | end card |

The dead_air dropout (beat 7.5) is DELIBERATE — scene_grid.py flags it as
intentional_offbeat. It's the quarter-second silence before the golden hit.

### B. The 5 production invariants (why v1 worked — from PROMO_PACK_KIT.md §2)

1. Owner's own rigged model, run through skin-weight + pose repair
2. Masked performer = no face to get wrong
3. Every on-screen word from canon notes (no placeholder text)
4. Music written to the exact cut times (not edited to fit later)
5. Walk speed matched to the beat grid — 1 step per beat, 14 steps across
   the 14-beat walk-out — so feet don't slide

### C. The automated gate system (promo_gates.py + rig_measure.py)

Grok's QA was not eyeballs — it was measured gates:
- rotation_error_eff_deg <= 3.0 (measured from GLB vs XBot reference)
- feet_above_ground_max_mm <= 15 (no floating)
- facing_vs_movement_deg <= 15 (no crab-walking)
- skin_flap_area_px <= 200 (no stretch/flap)
- ribbon_geometry / exploded_geometry == false
- foot_slide_mm_per_frame <= 8 (walk locked to beat)
- rope_crossing_frames == 0
- broken_pose_frames == 0

Plus the media proof standard: real files, exact checked frames listed,
sha1 fingerprints, before/after side-by-side per defect, version-never-overwrite.

### D. The v1 defect list (what the owner flagged — fixes_el_toro_v2.json)

1. Pale skin flap at left shoulder (1250px → 40px)
2. Floating off the mat in ending pose (42mm → 6mm)
3. Ring rope cutting across chest (1 frame → 0)
4. Borrowed walks/poses (Mixamo walk 12.4mm/frame → owned luchador strut 5.1mm/frame)
5. Flat 2D pyro pasted on top (→ real 3D pyro + haze)
6. Dark empty arena, flat lighting (→ crowd w/ flashes, colored spots, stage screens)
7. Rotation error after rig repair (5.1° → 4.2°, STILL OVER the 3.0° gate — not fixed)

---

## 2. MISSING — what Grok never left behind

1. **Grok's actual render scripts.** No Blender .blend project, no Python render
   scripts, no scene files from Producerbot exist in any reachable repo.
   Grok works on its side; the user relays finished videos.
2. **The El Toro originals.** Theme music, title-card source assets,
   before/after proof package — owner-confirmed never recovered (2026-10-05).
3. **Grok's AI prompts/settings.** No record of what image/video generation
   prompts, models, or settings it used (if any).
4. **No Grok commits** in any local repo (git log shows only muse/Muse/mhvnsnt/Ashes authors).
5. The Bannon commits 7cf8bafd/521fb950/5b9ccad5/9e15a70a are the **in-game
   Three.js entrance system** — a different thing from the promo video.
   They do NOT contain the video production process.

---

## 3. INFERRED — what the finished MP4 reveals

- **3D rendered character, not AI video.** Consistent model across all frames,
  proper 3D lighting/shadows. The character is the owner's rigged GLB.
- **Encoded with ffmpeg/libx264** (Lavf62.12.102, crf=18, threads=3).
  No Blender/Cycles metadata in the container.
- **Title cards composited over 3D**, not rendered in 3D (clean vector-style
  text with glow, floating over the scene).
- **50.0s duration, 1920x1080.** Kit docs verify 1200 frames @ 24fps.
- **The v2 fix list implies v1 was iterated** — the owner gave a fix list,
  Grok (or whoever) addressed 6 of 7 items.

---

## 4. What this means for our rebuild

We cannot "replicate Grok's process" file-for-file — those files don't exist
on our side. What we CAN do (and what the v2 pipeline in
`tools/entrance-video/` now does):

1. **Follow the 8-shot blueprint** — scene_grid.py already encodes it.
   Our pipeline should author in beats, not seconds.
2. **Enforce the 5 invariants** — especially: music to cut times, walk locked
   to beat grid, canon text only, repaired rig.
3. **Run the gates** — promo_gates.py exists and works. Our renders should
   pass feet-planted, no-slide, no-flap before shipping.
4. **Match the visual spec** — EL_TORO_STUDY.md documents the lighting
   (red rim signature, color-shifting spot pool, god rays, starfield),
   camera (7+ framings, low 3/4), and title cards (gold/black-stroke/red-glow
   via PIL, floating over 3D).
5. **Fix the v1 defects by default** — our pipeline should never ship the
   7 known defects (borrowed walks, flat pyro, empty arena, etc.).

The honest gap vs Grok: it had an animator's eye for posing and camera timing
that no script fully captures. The gates + checklist + study docs are the
closest reproducible form of that judgment.
