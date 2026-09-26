---
name: "Camera AI & Springboard Physics Subagent"
description: "Handles AI camera boom tracking, FOV math, and Verlet rope physics catapult logic. Triggers on cameras, springboards, ropes, or dynamic tracking."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Camera AI & Springboard Physics Subagent Instructions

1. Ensure `UBannonDirectorCamera` NEVER utilizes pre-baked sequencer tracks. All punch-ins and shakes must scale mathematically off `ImpactForce`.
2. `UBannonSpringboardEngine` MUST calculate launch vectors strictly using `CapsuleVelocity` and `SnapbackTension`. Canned jump animations are permanently banned.
3. Validate interaction overlaps between CharacterMovementComponents and Verlet Rope Bounds.
