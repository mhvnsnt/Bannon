# VIDEO_WORKFLOW.md — the character-video machine

## (a) What the old workflow was

Evidence: `tools/harness/play_and_record.cjs`, `.github/workflows/character-videos.yml`,
`tools/video/` (TOOLS_VIDEO.md, assemble/beat_edl/thumbnail/encode scripts).

1. **Capture** — `tools/harness/play_and_record.cjs` (Playwright/Chromium, SwiftShader):
   boots `BANNON_v150.html` over real HTTP, drives a match like a player
   (walk, strike, grapple, taunt, ropes, pin), records WebM at wall-clock rate,
   and writes `playtest_report.json` telemetry: frame-time percentiles, stalls
   over 250ms, page/console errors, pose calls, clip-bone resolution counts,
   and runtime deformation samples. Viewport: 412×915 portrait.
2. **Batch CI** — `.github/workflows/character-videos.yml`: a 4-character matrix
   (BANNON/BANNON_rigged.glb, VIPER, KOBRA, AARON_RUBEN), each captured 28s,
   then fail-closed gates on the report: match must reach FIGHT (a `bell:`
   beat = real gameplay, not menus), 0 page errors, 0 console errors,
   ≥1 animation pose call, clip bones referenced→resolved, recorder
   instrumentation attached, deformation telemetry present with spikes == 0.
3. **Encode (no edit)** — the old workflow re-encoded raw WebM straight to
   16:9 and 9:16 MP4s with `ffmpeg -an` (no audio), medium/crf18, plus
   SHA256SUMS, uploaded as artifacts (14-day retention). There was no edit
   step: no music bed, no title cards, no beat sync, no loudness, no thumbnails.
4. **Assembly tooling (local, unwired)** — `tools/video/` added later:
   `assemble_character_video.py` (sting → name card → footage → end card,
   beat-snapped holds, two-pass loudnorm music bed, 16:9 + 9:16, delivery
   profile), `beat_edl.py` (beat grid → OTIO timeline), `make_thumbnail.py`
   (beat-aligned poster frame + title treatment), `encode_profiles.sh`
   (draft 2.5× faster than delivery — the old workflow hardcoded
   medium/crf18 for everything). These worked locally but were never wired
   into the capture→gate→deliver chain, and CI never ran them.

## (b) What the new machine does better

`tools/video/queue/` — one character at a time, owner-operable, local-first.

| Old | New |
|---|---|
| Batch matrix of 4, all-or-nothing | `queue/queue.json`: owner-edited priority order; `run_one.py` takes the head (or `--character`), finishes it fully, marks it done |
| Encode with `-an` — silent videos | Assembly wired in-chain: beat-synced music bed, name/end cards, two-pass loudnorm |
| No thumbnails | `make_thumbnail.py` in-chain, beat-aligned frame |
| No per-delivery record | `queue/VIDEO_LOG.md`: one entry per delivered video with hashes |
| CI-only | Runs on this machine (`python3 tools/video/queue/run_one.py`) or CI (`.github/workflows/character-video-queue.yml`, manual dispatch, 30-day artifacts) |
| Gates only in CI | Same fail-closed gates in `run_one.py`: bell=gameplay, 0 errors, pose_calls≥1, bones resolved, spikes==0 — nonzero exit leaves the character `queued`, never `done` |

**Zero new cost.** Existing stack only: node + Playwright/Chromium (already
vendored/used by the harness), python3 + Pillow/OTIO (`requirements-video.txt`),
system ffmpeg. CI uses free GitHub Actions minutes on ubuntu-latest.

**Owner operation:**
```bash
# see the order, edit freely (never mid-run)
cat tools/video/queue/queue.json
# run the head of the queue
python3 tools/video/queue/run_one.py
# preview without running
python3 tools/video/queue/run_one.py --dry-run
# jump one character ahead of the queue
python3 tools/video/queue/run_one.py --character VIPER
```
Deliverables land in `dist/character-videos/<CHARACTER>/`:
`<CHARACTER>_16x9.mp4`, `<CHARACTER>_9x16.mp4`, `<CHARACTER>_thumb.jpg`,
`SHA256SUMS.txt`, plus the raw capture (`bannon_match_*.webm`) and
`playtest_report.json` for audit.

Text policy: all rendered text comes from owner-locked canon in queue.json
(name/nicknames/billing) — never placeholder or "not in canon" text.
