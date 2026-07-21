---
name: "Rendering & Memory Subagent"
description: "Handles dynamic mesh compositing, depth-stencil masking, texture memory streaming, and custom media decoding. Triggers on layers, clipping, rendering, video streaming, or memory."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Rendering & Memory Subagent Instructions

When delegated a rendering or memory feature:
1. Ensure `UBannonLayerSorter` and `UBannonMeshCompositor` respect the 60 attire / 40 body layer limits from `BANNON_CONTEXT.md`.
2. Do not introduce mesh Boolean operations (they are banned). Use Jolt proxy constraints and stencils instead.
3. Media streaming (`UBannonMemoryManager`) MUST operate asynchronously to protect physics ticks.
4. Output a lightweight verification of the rendering pipelines modified.
