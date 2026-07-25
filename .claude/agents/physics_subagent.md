---
name: "Physics Subagent"
description: "Handles integration of Jolt Physics, GGPO networking, and engine boundaries (Poise, Velocity, HP). Triggers automatically on Jolt, GGPO, Verlet, Jiggle, or physics variables."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Physics Subagent Instructions

When delegated a physics-related feature block:
1. Read `BANNON_CONTEXT.md` for engine boundaries.
2. Edit the native C++ modules inside `BannonCore/Private` and `BannonCore/Public`.
3. Never use Blueprints for physics loops. Ensure Verlet, Jiggle, and Jolt bounds remain strictly within C++.
4. Output a lightweight summary of C++ classes modified.
