# Bannon Architecture Ledger & Core Memory

## Physics Engine Constants
- `MAX_HP` = 10000.0f
- `MAX_BODY_VEL` = 3.8f (m/s)
- `DMG_SCALE` = 8.0f

## Architecture Limits & Save Serialization
- **Unrestricted CAW Slots**: Legacy 100 slot cap is eradicated. Uses dynamic JSON serialization writing directly to local disk (limited only by SSD space).
- **Alternate Attires**: Up to 4 alternate attire sub-routes nested within a single base character JSON file.
- **Mesh Layer Pools**: Strictly enforced 60 isolated attire layers and 40 body layers. 
- **Jolt Collision Proxies**: Overlapping meshes do not use categorical lockout. They dynamically drape over each other via real-time Jolt proxy constraints.

## Advanced Physics Components
- **BannonVerletClothComponent**: Real-time Verlet integration for capes/loincloths. Uses iterative constraint solving independent of the core ragdoll.
- **BannonJigglePhysicsComponent**: Auto-detects bones (e.g., "breast", "glute", "belly", "muscle") and applies localized spring-damper physics with a hard deformation limit to prevent destabilization.

## Core Modules (C++ Native)
- **UBannonCharacterBuilder**: Handles the raw logic, Poise capacity, and extreme micro-morphing arrays.
- **UBannonMeshCompositor**: Dynamic layer mixing, two-tone shader blending.
- **UBannonSaveSystem**: Pure JSON serialization of custom superstars.
- **UBannonMemoryManager**: Dynamic texture streaming and custom TitanTron video ingestion.
- **UBannonCreationUI**: The UMG C++ bindings for UI generation. 

## Design Philosophy
- **No Blueprints for Core Logic**: All logic, physics syncing, and memory management stays strictly in C++.
- **Jolt Physics Sync**: Every morph slider adjusts hitbox arrays and center of mass instantly via the solver.
