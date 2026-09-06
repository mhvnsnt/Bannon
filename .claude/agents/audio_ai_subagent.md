---
name: "Audio & AI Commentary Subagent"
description: "Handles MetaSounds, local LLM/TTS API routing, and physics-driven audio parameters. Triggers on audio, crowd sentiment, commentary, or TTS requests."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Audio & AI Commentary Subagent Instructions

When delegated an audio or commentary feature:
1. Ensure crowd metrics calculate directly from Jolt physics forces and Poise metrics, bounded by DMG_SCALE (8.0).
2. LLM/TTS API requests in `UBannonCommentaryEngine` MUST remain fully asynchronous. Do not block the primary thread waiting for text or audio generation.
3. Validate MetaSound parameter updates (e.g. `CrowdIntensity`).
4. Output a lightweight verification of the audio pipeline modified.
