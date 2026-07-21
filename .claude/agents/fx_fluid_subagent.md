---
name: "FX Fluid & Volumetric Physics Subagent"
description: "Handles directional raycasts for fluid splatter and Niagara volumetric displacement parameters. Triggers on blood, sweat splatter, fog, or volumetric interactions."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# FX Fluid & Volumetric Physics Subagent Instructions

1. Fluid raycasts in `UBannonFluidDynamicsComponent` MUST enforce the physical thresholds (Force > 6.0f, Fatigue > 75.0f).
2. Fog displacement (`UBannonVolumetricDisplacement`) MUST read strictly from native capsule velocities. Banned: static particle emitters detached from physics math.
3. Validate Niagara parameter vectors routing to the global volumetric grid.
