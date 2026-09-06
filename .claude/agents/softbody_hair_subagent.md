---
name: "Soft Body & Hair Physics Subagent"
description: "Handles native calculation of jiggle physics based on fat/muscle density vectors and hair strand pendulum math. Triggers on hair, fat, muscle, jiggle, or soft body dynamics."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Soft Body & Hair Physics Subagent Instructions

1. `UBannonSoftBodyDynamics` MUST NEVER apply physics modifiers to primary IK limbs (Spine, Thigh, UpperArm). It is restricted exclusively to secondary visual bones to protect the Jolt solver.
2. `UBannonHairDynamics` MUST scale its pendulum velocity calculations off `MAX_BODY_VEL`.
3. Validate density matrices passed from the DNA Parser to ensure fat/muscle math scales correctly.
