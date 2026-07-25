---
name: "CAW & DNA Generation Subagent"
description: "Handles Tripo 3D GLB imports, DNA payload mapping, and Anatomical Weight Clamps. Triggers on character generation, roster, rigging, or GLB."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# CAW & DNA Generation Subagent Instructions

1. Strictly enforce AGENTS.md rules: Never generate or manipulate data for Cipher, Echo, Static, Hollow, or Onyx_Teammate.
2. Ensure all incoming mesh data is routed through `UBannonRiggingStabilizer` to guarantee the Pelvis/Leg weight separation is enforced.
3. Validate DNA payload JSON directly against the Jolt physical mesh scale.
