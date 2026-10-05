# MUSE_MISSION_BRIEF — Coordinator briefing for Muse agents

Date: 2026-10-05
From: Muse (owner's coordinating agent)
Status: ACTIVE

## Read this first, then read MUSE_AGENT_HANDOFF.md

`MUSE_AGENT_HANDOFF.md` (same directory) is the technical handoff written from
the Grok bot's video-pipeline work. It is the authority on the character GLB /
recorder / certification-gate details. This brief covers the bigger mission and
how the Muse agent team fits in. Do not rewrite the handoff file — extend from it.

## 1. What Grok bot did (verified from git history on 2026-10-05)

All commits below are on Bannon `main`, verified present:

- Hardened the Playwright gameplay recorder (`tools/harness/play_and_record.cjs`)
  so its animation instrumentation attachment is explicitly verified and logged
  (`ef433c93`). Silent instrumentation failure is now impossible.
- Made video certification fail closed: no verified instrumentation attachment,
  no live deformation telemetry, or severe stretching = no certified video
  (`359d0167`, plus the deformation-telemetry series `6503971b`…`39362180`).
- Narrowed the first delivery batch to measured-good rigged GLBs only:
  BANNON_rigged.glb, VIPER.glb, KOBRA.glb, AARON_RUBEN.glb. Weak models
  (CIPHER, CAIN ELIAS, CODY, ECHO, STATIC, STICK-UP, ONYX) stay out until fixed.
- Fixed a roster bug: `BANNON.glb` is a rigid action-figure asset; the playable
  model is `BANNON_rigged.glb`.
- Wrote `MUSE_AGENT_HANDOFF.md` (`d4c57851`) and opened issue #47 as the
  Muse-team discovery point. Video production tracks in issue #46.

Current state: the pipeline is hardened but there is NO verified finished
video batch yet. Do not claim videos are done until a workflow run produces
artifacts with real gameplay video + telemetry + hashes.

## 2. The owner's bigger mission

The owner (Real) is building toward selling **$25–$50/hr AI automation and
web/3D build services**. The game + video + studio work feeds that:

- `money-machine-hq` (private repo, same account) is the monetization HQ: 3
  productized offers ($200–$750), 2 working Python demos (missed-call
  auto-reply, FAQ chatbot), Fiverr/Upwork gig copy, and a ranked money plan.
- TRIPPEDD Production studios / God-Molecule-Show-Studio is the commercial and
  video-production brand. Real gameplay captures from Bannon / Brutal Fist /
  AshLane become its portfolio pieces.
- The owner also holds the `mfluidmusic` GitHub account (Neon-App-Builder, an
  AI app builder, plus others). Consolidation of the best pieces into the main
  account is planned. Do not duplicate that work here without instruction.

## 3. What the Muse agent team should do

1. Operate as the verification/production team on the Bannon character-video
   pipeline per `MUSE_AGENT_HANDOFF.md`'s 10-step loop. Reproduce evidence —
   do not trust prior runs blindly, including Grok's.
2. Keep bounded GitHub Actions discipline: inspect a run once, diagnose, patch,
   rerun. Never sit in an unbounded polling loop.
3. Keep game identities separate: Bannon footage is Bannon; Brutal Fist gets
   its own captures; AshLane gets its own. No AI-generated substitute gameplay.
4. Coordinate in the open: comment findings on issues #46 / #47, commit with
   clear messages, link evidence.
5. Report conflicts instead of guessing. UNKNOWN stays UNKNOWN.

## 4. Hard rules

- No external publishing, posting, or sending without the owner's approval.
- Never commit secrets. Note: this repo's history contained a hardcoded GitHub
  token and a Telegram token (flagged 2026-10-05, revocation in progress).
  If you find a live secret, report it — do not use it, do not spread it.
- Do not auto-promote model-repair candidates (`*_rig28_candidate.glb`).
  Non-destructive artifacts only until a human approves.
- Do not merge Bannon and Brutal Fist identities, labels, or footage.

## 5. Definition of done (mission level)

- Character video packages: per `MUSE_AGENT_HANDOFF.md` — real GLB + real
  runtime gameplay + clean deformation + valid animation + no blocking errors
  + correct game identity + provenance/report + encoded deliverables.
- Service offers: demos runnable, copy accurate, nothing auto-sends or spends.
- When in doubt, produce evidence and ask. The owner approves every external step.
