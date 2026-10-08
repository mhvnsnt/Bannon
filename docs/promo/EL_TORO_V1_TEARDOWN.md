# El Toro de Oro v1 — frame-verified production teardown

Teardown of the actual shipped v1 video (`~/workspace/promo-work/EL_TORO_DE_ORO/EL_TORO_DE_ORO.mp4`),
verified frame by frame 2026-10-08. This is what the v2 rebuild must match —
measured from the video itself, not from memory.

## Master spec (ffprobe-verified)

- 1920x1080, h264, 24 fps, **exactly 50.000 s**, ~17.7 MB
- Black void + fine star/dust particles throughout; haze on the floor

## Shot-by-shot (24 fps frame numbers; t in seconds)

| t | frame | What's on screen |
|---|-------|------------------|
| 2 | verify_t2 | Character emerging from pure black, single cool-blue rim spot from behind-above, silhouette only. Camera slow push-in. The intentional dark opening. |
| 4 | f_00096 | Blue spot hits: character revealed center frame, medium-wide, arms slightly out, standing in a cool blue spotlight pool. Feet planted, no motion blur, no flinging. No text on screen. |
| 6 | frame_t6 | Same medium-wide framing; red/warm gel sweep enters from frame left, washes the floor pool. Still no text. |
| 15 | frame_t15 | Walk-out segment: character mid-stride, hand on chest/stomach gesture, warm red floor wash + blue ambient pool. No text. |
| 24 | frame_t24 | Gesture/pose segment, camera closer. |
| 32 | frame_t32 | Slow-motion segment. |
| **40** | verify_t40 | **Name plate slams in**: "EL TORO DE ORO" over the character in a win pose (arm raised). Warm gold wash, volumetric light cones behind, floor pool with haze. Lower-third sub plate "ASHLANE" appears bottom-center. |
| **48** | verify_t48 | **End card**: "ASHLANE" + "URBAN REIGN 2 • 2026" composited over character in gold-lit win pose (head thrown back, arm raised). |

## Title card system (the actual assets, in `titles/`)

Grok did NOT render text in-engine and did NOT use ffmpeg drawtext. The cards are
**pre-rendered graphic plates composited over the 3D footage**:

1. **Name plate** (`titles/name.png`) — character name in a bold comic/display font
   (condensed, slightly italic), GOLD fill with BLACK outline, red radial glow
   behind, and a solid RED underline bar beneath the text. Full-screen centered plate.
2. **Sub / lower-third plate** (`titles/sub.png`) — small plain white condensed
   "ASHLANE", bottom-center, subtle dark outline. Used during the win-pose segment.
3. **End card** (`titles/end.png`) — "ASHLANE" in WHITE comic font with black
   outline and GOLD glow, plus gold sub-line "URBAN REIGN 2 • 2026" beneath.
   Composited over the character's final win pose (t=46–50), not on black.

Recipe to replicate per character: render 3 plates (name / sub / end) with the same
font treatment, composite over footage at the win-pose and outro beats.

## Lighting design (verified across all frames)

- ONE dominant spot per shot on a black void — never flat ambient lighting.
- Color gels shift across the timeline: cool blue (0–6s) → red sweep (t≈6) →
  red wash (12–19s) → warm gold (36–50s).
- Floor light pools under the character + visible volumetric cones (t=40) + haze.
- Rim light on the mask/horns at the reveal.

## Model/rig ground truth

- Character is FEET-PLANTED in every checked frame. No flinging, no floating,
  no foot slide — the rig held because the model was repaired before capture.
- Framing: medium-wide with margin; character centered; full body visible.

## Correction to the kit spec

`PROMO_PACK_KIT.md` currently describes cards at t=4s and name+finisher+hometown
text at 12–19s (from the owner brief). Verified frames show **no text at t=6 or
t=15** — the name plate actually lands at t≈40 over the win pose, and the end card
at t≈48 over the outro. The v2 rebuild should follow this measured timing, or get
the owner's explicit call to move the plates.
