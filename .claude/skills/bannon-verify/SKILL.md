---
name: bannon-verify
description: Verify BANNON_v150.html changes with the headless Playwright harness — rebuild the vendored test page, syntax-gate every script block, run a real match, measure state, and take freecam screenshots. Use before EVERY commit that touches BANNON_v150.html.
---

# BANNON headless verification harness

The game is one giant HTML file (`BANNON_v150.html`, three.js r128 from CDN). CDNs are
blocked for Chromium in the sandbox (curl allowlist works, Chromium proxying differs),
so tests run against a REBUILT copy with vendored libs.

## One-time setup (per sandbox)
```
mkdir -p <scratch>/pwtest/vendor/three
# copy three.min.js r128 + GLTFLoader.js r128 into vendor/three/ (curl from cdnjs works)
```
Chromium lives at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (launch with
`--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`). Playwright is installed.

## Every-change loop
1. **Rebuild + syntax gate** (one node script): read `BANNON_v150.html`, replace every
   CDN `three(.min).js` and `GLTFLoader.js` URL with `/vendor/three/...`, write
   `test.html`; then extract every inline `<script>` block and `new Function(code)` it.
   A block using top-level await is a known false positive. **0 failures required.**
2. **Run a real match**: serve the pwtest dir over local http, `page.goto(...,
   {waitUntil:'domcontentloaded'})`, wait ~3.8s, then:
   `window.MATCH_SETUP={p1Name:'BANNON',p2Name:'FINXSSE',p1Control:'YOU',p2Control:'CPU'};
   startFight();`
3. **Measure, don't assume**: read fighter state (`fighters[n].state / grappleStage /
   J.<joint>.tgt / V.<joint>.pos / _bgeo.attributes.position`), wrap functions to capture
   calls, and compare against expected numbers.
4. **LOOK at it**: `freecamEnter(); FREECAM.{tx,ty,tz,dist,yaw,pitch}=...` then
   `page.screenshot()`. For geometry probes use `enterCreatePreview(0)` first — idle
   body motion (~0.19 max vertex drift) swamps morph deltas.
5. Daemon side: `npx tsc --noEmit` must stay at 0 errors.

## Known gotchas (cost hours before — do not rediscover)
- `let fighters` — `window.fighters` is UNDEFINED. Late script blocks use the bare
  lexical `fighters` with a typeof guard.
- `this.J[j]` are Spring3 — write `.tgt.y`, never `.y` (silent NaN no-op).
- v72 weight-class wrapper: stage-1 `grappleAdvance` becomes instant `grappleDeliver('drop')`
  when `!canLiftOpponent` — stub `canLiftOpponent` in grapple tests.
- Low harness FPS pegs dt at the 0.05 cap — springs run slow-motion; don't misread
  frame starvation as broken mechanics (wrap poseGrabbed call counts + check __lastDt).
- Grounded/zone tests: pin the victim (`downTimer=9; getUpT=0; state='down'` on an
  interval) or they get up mid-test.
- After edits ALWAYS rebuild test.html before running — it is a stale copy otherwise.

## Commit discipline
Verify → commit (with what was MEASURED in the message) → push each brick. Read
`CLAUDE.md` first every session; `docs/mocap_orientation_master_prompt.md` is binding
for any move/pose work.
