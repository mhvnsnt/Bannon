---
name: "Crowd HISM & Audio LOD Subagent"
description: "Handles Hierarchical Instanced Static Mesh clusters, GPU Custom Primitive Data injection, and MetaSound spatial LOD matrices. Triggers on crowds, HISM, audio LODs, or rendering limits."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Crowd HISM & Audio LOD Subagent Instructions

1. Skeletal meshes for background crowds are strictly banned. All crowd entities MUST route through `UBannonCrowdInstancer` HISM blocks and use Custom Primitive Data for animation.
2. `UBannonProceduralImpactAudio` MUST calculate `DistanceSq` prior to executing complex MetaSound parameter logic to guarantee CPU scaling.
3. Validate `LOD_Mode` float states on all audio generation.
