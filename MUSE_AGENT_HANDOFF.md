# MUSE_AGENT_HANDOFF — Bannon / Off The Top Rope / Brutal Fist video + character pipeline

Updated: 2026-10-05
Owner rule: NO GUESSWORK.

## Mission

This file is the persistent handoff for Muse/Meta/Facebook agents working alongside the existing agents on the character-video, GLB, animation, and gameplay-verification work.

Do not treat this as permission to invent content. The objective is to observe the real game, repair measured defects, and produce canon-accurate video packages.

## Current production order

1. Bannon first.
2. Then Brutal Fist.
3. Then AshLane / other games.
4. If a character exists in multiple games, produce a SEPARATE video package for each game. Never relabel or visually recycle Bannon footage as Brutal Fist/AshLane.

The El Toro de Oro package is the Bannon visual/style reference. It is NOT evidence that later characters are implemented.

## Hard gates

- Character must have a real character GLB.
- GLB identity, rig, skin, textures, and runtime loading must be verified.
- GLB existence alone is insufficient.
- Character must actually appear/play correctly in the intended current game build.
- Procedural/generated placeholder bodies are NOT allowed in the video roster.
- Do not invent moves, stages, attire, UI, story beats, entrances, or gameplay.
- Canon documents describe intended character information but do not prove implementation.
- UNKNOWN stays UNKNOWN.
- Do not call a model/animation repaired merely because a static metric looks good.
- Use real gameplay recording whenever the claim is gameplay.
- No external publishing/sending without owner approval.

## Existing recorder

Bannon has a real Playwright gameplay recorder:
tools/harness/play_and_record.cjs

It boots BANNON_v150.html over HTTP, drives the actual UI into a match, records real WebM video, and emits playtest_report.json.

It checks:
- actual match start
- frame timing/stalls
- animation pose calls
- clip-bone resolution
- per-bone movement/extrema
- page/console errors
- live deformation telemetry

Recent recorder commits:
- b0513fab7d0866a6875e366d93e714b8817c045d — portable CI Chromium
- ef433c935e08a72684a1012dcc3140cba698bb06 — recorder attachment made verifiable
- 359d0167ff4fda9508d92d858cb6d3c955f9a607 — certification now requires verified recorder attachment

Do not sit in an unbounded GitHub Actions polling loop. Inspect logs/artifacts once, diagnose, patch, rerun, and use bounded verification.

## Current Bannon video workflow

.github/workflows/character-videos.yml

The intended first measured batch was narrowed to actual rigged GLBs, including:
- BANNON_rigged.glb
- VIPER.glb
- KOBRA.glb
- AARON_RUBEN.glb

The workflow must fail closed when:
- the GLB is missing
- a real match does not start
- recorder instrumentation does not attach
- deformation telemetry does not execute
- deformation sentinel reports severe stretching
- page/console errors invalidate the capture

Artifacts should contain the report, real gameplay video, encoded landscape/vertical versions, and hashes.

## Important historical findings to preserve

A prior measured Bannon pass found the 12-second freeze was NOT the GPU or GLB parsing. It was synchronous roster portrait rendering: renderRoster -> BANNON_PORTRAITS.get -> blocking toDataURL. The measured stall was about 11.3 seconds and was reduced substantially by making portrait rendering asynchronous/visibility-driven.

The same work found BANNON_rigged.glb was large and benefited from meshopt compression. It also found that position quantization on skinned meshes destroyed geometry quality and must NOT be used.

A separate measured pass proved that raw Bannon GLB models could render correctly and that the engine's physics retarget was mangling them. GLB_NATIVE_POSE was introduced so calm states can preserve the model's native correct pose while action states remain animation/physics driven.

The procedural body was deliberately demoted to the LAST "Retro (Procedural)" attire; normal/default play must use the character's actual GLB.

FINXSSE was given a real GLB and grounding was corrected.

These are historical findings, not permission to assume every character is now clean. Re-test each character.

## Model-repair track

.github/workflows/model-repair-candidates.yml

Candidates are NON-DESTRUCTIVE artifacts only. Do not promote a *_rig28_candidate.glb automatically.

Candidate flow:
- donor/reference rig
- transfer candidate
- skin QA
- spike QA
- inspect runtime deformation
- compare against actual gameplay
- only then consider promotion

The known defect family includes shoulder/upper-arm twisting, reversed arm orientation, stretching/mesh tearing, bad rest poses, grounding/sinking, and action-state retarget mangling.

## Muse's job

Muse agents should operate as a second engineering/production team, not as a blind parallel implementation.

For every target character:
1. Locate the real GLB.
2. Identify the actual runtime character mapping.
3. Verify the build loads that GLB.
4. Run real gameplay capture.
5. Inspect video plus telemetry.
6. Classify defects: asset, rig/retarget, animation semantics, runtime state, deformation, grounding, performance, or recorder failure.
7. Fix the smallest correct layer.
8. Re-run the real capture.
9. Preserve before/after evidence and hashes.
10. Only mark READY when all gates pass.

For video production:
- use the actual game's ring/stage, lighting, UI, and gameplay language.
- produce separate game-specific packages.
- do not generate fake gameplay with image/video AI to stand in for a real build capture.
- do not publish automatically.

## Known handoff concern

The deformation report must contain REAL live samples. A structure initialized to samples:0 is not telemetry. If samples remain zero, fix the instrumentation before certifying anything.

The latest recorder work explicitly logs whether instrumentation attached. A certification run that lacks the attachment event is a hard failure.

## Cross-project note

The active game the owner currently calls Brutal Fist is separate from Bannon even though they share canon and related assets. Do not merge their identities or labels.

Primary test expectation for Brutal Fist is its playable PWA/GitHub Pages build, not a static mock or local-only claim.

## Definition of done

A character video is READY only when:
real GLB + real runtime gameplay + clean observed deformation + valid animation playback + no blocking errors + correct game identity + provenance/report + encoded deliverables all agree.

If evidence conflicts, stop and report the conflict instead of guessing.
