# Muse work log — 2026-10-05

Coordinator: Muse (Meta). Grok-side teams: Repo Co Dev, Producerbot, MoneyMachineBusch.
Lane split: Muse owns model QA baseline + weight-transfer repair track, monetization
coordination, and mission briefs. Blender remap/re-skin and WWE-model reskins are
Repo Co Dev's track. Marketing videos are Producerbot's track.

## Commits (main)
- `9530050` — MUSE_MISSION_BRIEF.md (coordinator brief: lanes, gates, text policy)
- `ead8a41` — brief text-policy update (never ship placeholder text; default "parts unknown")
- `3b63e34` — docs/ASSET_RENAME_PLAN.md (7 WWE-named GLBs replaced via reskin with
  owner-approved canon names; 2 reference files to update on deletion)

## Decisions recorded
- El Toro de Oro video: dark opening 5s is INTENTIONAL dramatic lighting. Priority
  defects are shoulder/delt-pec twisting and hands/feet lacking finger/toe bones.
  El Toro is the quality bar, not evidence about the weak seven.
- Bannon target = high quality. Brutal Fist low-poly is intentional PS1 style — don't "fix" it.
- Asset rename: no in-place rename mid-reskin. Reskin → new canon name (owner-approved)
  → delete old file → update manifest.json + env_snapshots README.
- Money: CodeDummy brand = free lead magnet; Code Doctor = the only thing for sale
  ($75/$250/from $600); Neon-App-Builder = case study + leverage, local-only.
  Docs live in mhvnsnt/money-machine-hq (offers/CODE_DOCTOR_OFFER.md,
  plan/CONSOLIDATION_PLAN.md, plan/CLIENT_CHANNELS.md).
- CODEDUMMY repos are not shippable products — case-study material for Code Doctor.

## Agent teams running (local, nothing pushed without owner review)
- Repair: model QA baseline + weight-transfer (weak seven first). Output: ~/workspace/bannon-repair/out/
- Money: consolidation plan complete 2026-10-05; docs delivered to money-machine-hq.
- Video pipeline: verified gameplay capture per MUSE_AGENT_HANDOFF.md gates.

## Still pending (owner)
- Delete mhvnsnt public forks (M-OS-Daywalker, Moneymachine); change reused admin password.
- Revoke Bannon GitHub PAT + Telegram bot token flagged 2026-10-05.

# Muse work log — 2026-10-06 (playtest)

## Playtest: STICK_UP vs GOLEM lift scenario (in progress)
- Tool: `tools/harness/playtest_lift.cjs` (new, committed `ea55d97`) — builds on
  `tools/harness/harness_lib.cjs` (sibling video-pipeline track), no duplication.
  Boots BANNON_v150.html over HTTP, starts STICK_UP vs GOLEM via char-select
  cards (falls back to `startFight()`+`MATCH_SETUP`), drives walk/jab/grab→lockup/
  grab→LIFT/deliver with per-step `grappleStage` probes, measured world heights
  (THREE.Box3), crowd-object inspection, CDP screenshots + full-session WebM.
- Findings so far (run 1, `~/workspace/bannon-teardown/drive2/`):
  - Match starts and plays: ROUND 1, HUD, health bars, timer all live.
  - Fighters walk, strike, and clinch/grapple (video frames at 1200s/1500s/2100s/2400s).
  - GOLEM has NO entry in CHAR_MODEL_DEFAULTS → always the procedural mannequin.
  - STICK_UP's GLB (`assets/models/STICKUP_repaired.glb`, exists, 858KB) loads late;
    both render as mannequins at the bell.
  - Height: GOLEM (heightScale 1.18) and STICK_UP (0.99) render at visually
    identical heights — `heightScale` is written (line 2980) but never read for
    visuals; fit-scale is uniform `1.78/hgt` (line 16648).
  - Crowd = instanced colored boxes (code: 5 InstancedMeshes); `assets/js/bannon_kaykit.js` 404s.
  - Debug text visible in-shots ("AUTOPILOT • staged 0 • queue 2", "BANNON V160" watermark).
- Run 1 died mid-drive (browser closed ~06:08); rerun (drive3) in progress with
  fixed probes (game uses lexical `let fighters`, not `window.fighters`).
