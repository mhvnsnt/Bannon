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

## Combat & Animation Directives
- **Mocap Root Motion**: Root motion velocity is strictly bounded by MAX_BODY_VEL (3.8 m/s). Scaled down natively in C++ via `UBannonMocapBridge` if exceeded.
- **Hit Reactions & Active Ragdoll**: Dynamic Jolt physics blending based on DMG_SCALE (8.0). Heavy impacts force a 1.0 physics blend weight on the hit bone chain.
- **Hit-Stop Time Dilation**: Heavy strikes trigger a 3-5 frame micro-freeze (time dilation multiplier) via `UBannonCombatAnimator`.
- **Poise Crumple**: When Poise reaches 0, mocap is severed and full-body Jolt ragdoll is forced.
- **Continuous-Body Skinning**: Uses `UBannonOptimizedSkeletalMeshComponent` with optimized buffer attributes (vertex colors/norms) and per-vertex LOD to maintain AAA frame rates for distant fighters.
- **GGPO Rollback Sync**: State serialization (`IBannonRollbackInterface`) captures AnimSequenceTime, CurrentBlendWeight, and Jolt bone transform offsets in the ring buffer.

## Layering & Dynamic Media (Rendering & Memory)
- **Attire Mesh Dynamic Drape**: Handled natively by `UBannonLayerSorter` inside `UBannonMeshCompositor`. Applies progressive depth-buffer stencil masking and DMI offsets per layer (1-60) while generating Jolt proxy collisions to force cloth over-draping, eradicating the need for mesh booleans.
- **Custom Entrance Media**: `UBannonMemoryManager` isolates `.mp4` and `.webm` video decoding pipelines strictly onto separate worker threads, translating raw bytes to dynamic textures without ever blocking the primary Jolt physics queue.

## Network & Open WebUI Tailscale Bridge
- **Local API Endpoints**: `UBannonAPIBridge` establishes a local C++ HTTP/WebSocket server listening (default: 8080) for incoming parameter sweeps from the Open WebUI mobile app over Tailscale.
- **Real-Time Physics Sync**: High-speed JSON payloads route directly to `UpdateMorph`, `UpdateMaterial`, and `SaveCAW` methods, dynamically syncing visual and Jolt collision matrices with sub-10ms latency.

## AI Audio & Crowd Dynamics
- **Generative Commentary**: `UBannonCommentaryEngine` builds context strings from Jolt impacts and combat animator state changes. Impacts exceeding 75% of `DMG_SCALE` (8.0) trigger immediate local LLM/TTS generation async requests.
- **Physics-Driven Crowd**: `UBannonCrowdDynamics` dictates crowd roar and sentiment purely through math. Intensity directly correlates to physical impact force (Jolt metrics) and inverse `Poise` values rather than scripted animation events.

## Match State Logic & Physical AI
- **Physical Pin Mechanics**: Pin counts (`UBannonMatchStateLogic`) are NOT triggered by animation states. They explicitly demand Jolt physics verification that both `bone_Shoulder_L` and `bone_Shoulder_R` collision proxies are within tolerance (15cm) of the ring mat bounds.
- **Localized Bone Fatigue**: Submissions and heavy strikes apply exact localized damage vectors to limb arrays, directly mathematically degrading the base `Poise` regeneration formula.
- **Referee AI Pathfinding**: `ABannonRefereeAIController` uses real-time NavMesh checks to step around active ragdolls, employing Grapple IK to physically snap the hand to the mat instead of relying on pre-baked counting clips.
