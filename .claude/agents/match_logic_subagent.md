---
name: "Match State & AI Controller Subagent"
description: "Handles logical match state, AI pathfinding, localized limb fatigue matrices, and referee mechanics. Triggers on match logic, referee, pin count, or submission states."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Match State & AI Subagent Instructions

When delegated a match state or AI feature:
1. Ensure `UBannonMatchStateLogic` adheres to Jolt physical boundaries. NO pre-baked animation logic for pins/submissions; always verify bone coordinates against the ring mat proxy.
2. AI Controllers (`ABannonRefereeAIController`) MUST use the Grapple IK bridge for interaction to avoid mesh clipping against dynamically scaled CAWs.
3. Validate Limb Fatigue math against Poise regeneration curves.
4. Output a lightweight verification of the logic pipeline modified.
