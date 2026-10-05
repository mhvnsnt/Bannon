# Video Pipeline Tooling — tools/video/

Owner ask (2026-10-05): make the character-video pipeline faster, better, more
efficient with appropriate open-source. Lane: **verified gameplay capture +
character videos for Bannon**. Marketing/demo videos are Grok-side
Producerbot's lane — nothing here duplicates that.

## Pipeline inventory (end-to-end, as found)

| Stage | Tool | State |
|---|---|---|
| Capture | `tools/harness/play_and_record.cjs` (Playwright/Chromium, swiftshader, WebM + `playtest_report.json` telemetry) | Working. Bottleneck: software GL, 412×915 portrait viewport only |
| Gates | `gate_check.cjs` + `.github/workflows/character-videos.yml` fail-closed gates (bell beat, 0 errors, pose calls, deformation spikes == 0) | Working, solid |
| Edit | **nothing** — workflow re-encodes raw WebM to 16:9/9:16 with `-an` (no audio) | **Gap: no NLE, no music bed, no title cards, no beat sync, no loudness, no thumbnails** |
| Package | `SHA256SUMS.txt` + artifact upload | Working |

### Gaps closed by this directory

1. **No programmatic edit** → `assemble_character_video.py`: roster-spot skeleton
   (sting → name card → footage → end card), beat-snapped name-card hold,
   two-pass loudness-normalized music bed, 16:9 + 9:16 deliverables, hashes.
2. **No edit lists** → `beat_edl.py`: beat grid → OpenTimelineIO `.otio`
   timeline (2 tracks, beat + phrase markers). Same OTIO-as-truth contract as
   TRIPPEDD's `opensource/editorial/blender-vse-otio.md` — reuse, not rebuild.
3. **No thumbnails** → `make_thumbnail.py`: beat-aligned poster frame + title
   treatment (pattern lifted from TRIPPEDD `tools/visual/make_visual_packet.py`).
4. **Slow/unguessed encodes** → `encode_profiles.sh`: draft/delivery/archive
   presets with measured benchmark (see below).

## What was evaluated and deliberately NOT added

| Candidate | License | Verdict |
|---|---|---|
| MoviePy (programmatic NLE) | MIT | **Not added.** Raw ffmpeg filtergraphs do everything our format needs with one fewer dependency and no extra encode pass. Revisit if edits need per-frame Python compositing. |
| Remotion (React NLE) | Apache-2.0 | **Not added.** Heavy Node/React stack for title cards Pillow already renders. Wrong weight class for this pipeline. |
| faster-whisper (captions) | MIT | **Deferred.** Current formats (gameplay spots, entrance videos) have no speech — captions solve nothing today. Revisit for promo/interview formats. |
| Essentia (audio analysis) | mostly GPL-3.0 | **Not added.** aubio already covers beat grids; Essentia's copyleft needs an owner decision first. |
| OBS headless (capture) | GPL-2.0 | **Not added.** Our capture is browser-driven (Playwright); OBS adds a display server for no gain. |
| Blender VSE scripting | GPL-3.0 (Blender) | **Not added — TRIPPEDD owns this lane** (`tools/provision_render_tools.sh` fetches Blender 4.2.1 + Rhubarb). We reference their stack instead of duplicating it. |
| MLT/melt | LGPL-2.1 | **Not added.** ffmpeg covers our filter needs; MLT shines for live/complex timelines we don't have. |

## Reused from the owner's other repos (not rebuilt)

- **TRIPPEDD-Production-studios-** `tools/visual/make_visual_packet.py` pattern
  (ffprobe → ffmpeg frame pull → hash) → adapted in `make_thumbnail.py`.
- **TRIPPEDD-Production-studios-** `opensource/editorial/blender-vse-otio.md`
  contract (OTIO is the editorial interchange truth) → `beat_edl.py` emits OTIO
  natively so timelines round-trip into their Blender VSE flow later.
- **TRIPPEDD-Production-studios-** `tools/provision_render_tools.sh`
  (Blender 4.2.1 + Rhubarb Lip Sync 1.13.0 portable fetch) → referenced, not
  copied; Rhubarb is the future viseme-timing source for GNM face work.
- **God-Molecule-Show-Studio** `tools/{animation,character}` → character/show
  tooling, no video-pipeline pieces to reuse; left alone.

## License table (verified from canonical sources)

| Tool | License | Source | Status |
|---|---|---|---|
| Pillow 10.2.0 | HPND (permissive) | package metadata (`pip show pillow`) | OK — integrated |
| OpenTimelineIO 0.18.1 | Apache-2.0 | https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/LICENSE.txt | OK — integrated |
| ffmpeg (system build) | GPL (this build has `--enable-gpl`) | `ffmpeg -buildconf` | OK as a **tool** (binary use, no linking). Note: a GPL build — keep it as an external binary, don't link libav*. |
| aubio 0.4.9 (existing beat-grid pipeline) | GPL-3.0 | package metadata (`pip show aubio`) | **FLAGGED for owner decision** — already in use by the stickup beat pipeline; GPL-family per policy needs owner sign-off before further integration. Used here only as a file-format consumer (reads its JSON), not linked. |

## Usage

```bash
# 1. Beat EDL (from the existing aubio beat JSON pattern)
python3 tools/video/beat_edl.py --beats stickup/audio/stickup_beats.json \
    --footage gameplay.mp4 --audio stickup_video_cut.mp3 \
    --name "STICK-UP spot" --out timeline.otio
python3 tools/video/beat_edl.py --verify timeline.otio

# 2. Assemble deliverables (name card + footage + end card + loud bed)
python3 tools/video/assemble_character_video.py \
    --footage gameplay.mp4 --audio stickup_video_cut.mp3 \
    --beats stickup/audio/stickup_beats.json \
    --name "STICK-UP" --nicknames "The Enigmatic Gangster|The Flamboyant Flexer" \
    --billing "Americus, Georgia - 6'1\" - 155 lbs" \
    --slug STICKUP --outdir dist/character-videos/STICKUP --profile delivery

# 3. Thumbnail (beat-aligned frame)
python3 tools/video/make_thumbnail.py --video dist/character-videos/STICKUP/STICKUP_16x9.mp4 \
    --at 12.4 --name "STICK-UP" --nickname "The Enigmatic Gangster" --out thumb.jpg

# 4. Encode preset benchmark
./tools/video/encode_profiles.sh gameplay.mp4
```

`requirements-video.txt` pins the pip deps.

## Measured results (this machine, 2026-10-05)

- **Assembly** (50s 1080p30 footage + 50s music bed → 16:9 + 9:16 with name
  card, end card, two-pass loudnorm bed, draft profile): **7m52s** total for
  55.6s of deliverables. Outputs verified: 1920×1080 and 1080×1920, h264+aac,
  55.64s, SHA256SUMS written. Test used real footage (El Toro gameplay.mp4)
  and the real Stick-Up audio cut.
- **Encode presets** (10s 1080p30 sample, same box):
  - draft (veryfast/crf23): **25.1s**, 1.9 MB
  - delivery (medium/crf18): **63.0s**, 4.7 MB
  - archive (slow/crf16): 5.5 MB (timing not cleanly captured; ~2.5× draft)
  - Takeaway: draft is **2.5× faster** than delivery at 40% the size — use
    draft for review iterations, delivery for the final package. The old
    workflow hardcoded medium/crf18 for everything.
- **OTIO round-trip**: PASS — 266 beat markers, 2 tracks / 2 clips, duration
  116.03s, written and re-read cleanly.
- **Thumbnail**: PASS — beat-aligned frame pull + title treatment renders
  correctly (visually verified).
- **Name card**: PASS — renders cleanly (visually verified).

- **Loudness**: two-pass `loudnorm` to I=-14 / TP=-1.5 / LRA=11 (streaming
  target); measured input I=-11.10 on the test track.

## Text policy

All rendered text comes from owner-locked canon (character card billing) —
never placeholder or "not in canon" text, per `MUSE_MISSION_BRIEF.md`.
