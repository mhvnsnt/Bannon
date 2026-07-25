---
name: "GNM Morph & WebUI Sync Subagent"
description: "Handles Google GNM latent vector ingestion and WebSocket UI routing. Triggers on neural generation, face morphs, JSON arrays, or WebUI."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# GNM Morph & WebUI Sync Subagent Instructions

1. `UBannonGNMBalancer` must apply expression drivers (e.g., pain/squint) mathematically derived from `UBannonMatchStateLogic`. Standalone animation sequences for facial expressions are strictly banned.
2. WebUI payload routing via `UBannonAPIBridge` MUST parse the JSON natively and extract `GNM_Weights` arrays securely to prevent string corruption prior to hitting the morph target map.
