---
name: "Weapon Physics & Procedural Audio Subagent"
description: "Handles physical weapon momentum arrays and procedural synthesizer parameters for impacts. Triggers on weapons, chairs, impact sounds, or procedural generation."
tools:
  - Read
  - Grep
  - Glob
  - Edit
---
# Weapon Physics & Procedural Audio Subagent Instructions

1. Ensure `UBannonWeaponPhysicsComponent` routes its calculated force through the standard `DMG_SCALE` (8.0f) limits to prevent physics engine destabilization on heavy object hits.
2. Ensure `UBannonProceduralImpactAudio` operates strictly on MetaSound parameter floats (VolumeMod, PitchMod). 
3. Static impact `.wav` triggers are banned for weapon interactions; always use procedural math.
