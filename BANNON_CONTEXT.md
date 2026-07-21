# Bannon Architecture Ledger & Core Memory

## Physics Engine Constants
- `MAX_HP` = 10000.0f
- `MAX_BODY_VEL` = 3.8f (m/s)
- `DMG_SCALE` = 8.0f

## Core Modules (C++ Native)
- **UBannonCharacterBuilder**: Handles the raw logic, Poise capacity, and extreme micro-morphing arrays.
- **UBannonMeshCompositor**: Dynamic layer mixing (60 attire layers, 40 body layers). Jolt collision proxies for overlapping meshes, two-tone shader blending.
- **UBannonSaveSystem**: Dynamic JSON serialization of custom superstars directly to local storage to bypass legacy limits. Includes 4 alternate attire sub-routes per file.
- **UBannonMemoryManager**: Dynamic texture streaming and custom TitanTron video ingestion (reads .mp4 / .webm directly).
- **UBannonCreationUI**: The UMG C++ bindings for Phase 1-6 UI generation. 

## Design Philosophy
- **No Blueprints for Core Logic**: All logic, physics syncing, and memory management stays strictly in C++.
- **Jolt Physics Sync**: Every morph slider adjusts hitbox arrays and center of mass instantly via the solver.
