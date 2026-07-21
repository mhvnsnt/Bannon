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

## Deployment & Pipeline
- **Target Architecture**: Android ARM64 strict enforcement. ARMv7 and x86_64 are permanently disabled to optimize Dalvik AOT native pointers.
- **Rendering API**: Vulkan is enforced as the sole API to guarantee continuous-body skinning and RGB sweat/damage buffers render without artifacting on mobile GPUs.
- **CI/CD**: Epic Games GameCI pipeline handles automated artifact generation for `Shipping` configurations on push.

## Roster, Rigging & DNA Generation (AGENTS.md DIRECTIVES)
- **Tripo 3D Alternative Integration**: System handles runtime GLB base mesh injection via `UBannonDNAParser`.
- **Exclusion Protocol**: Cipher, Echo, Static, Hollow, and the Onyx teammate are permanently hard-coded as excluded in the C++ logic. Automatic generation bypasses these entries entirely.
- **Anatomical Weight Clamps**: `UBannonRiggingStabilizer` aggressively scrubs imported skin weights. Pelvis vertices cannot inherit leg-bone weights (fixing the "hips widen" bug permanently). Weak influences (<0.05) are pruned, and smooth passes are hard-capped at 3.

## Weapons & Procedural Audio (Liontamer Concurrency)
- **Weapon Physics**: `UBannonWeaponPhysicsComponent` acts as an independent mass/velocity modifier multiplying against the Jolt framework. Instantly triggers max-level `HitStop` and `DMG_SCALE` (8.0) ragdoll overrides upon collision.
- **Procedural Impact Synthesis**: `UBannonProceduralImpactAudio` scales MetaSound parameters (Amplitude, Pitch, Distortion) directly from the raw float data of the weapon collision, eradicating the need for static impact `.wav` banks.

## AI Spacing & Environmental Physics (Liontamer Concurrency)
- **Ring Generalship**: `ABannonRingGeneralshipAI` dictates spacial awareness. AI movement vectors are directly controlled by `Poise` thresholds. Low poise triggers NavMesh retreats; high poise triggers intercept vectors.
- **Verlet Ring Ropes**: `UBannonVerletRopesComponent` eradicates static bounding boxes. Ring ropes operate as interconnected spring-damper nodes in the Jolt solver, dynamically deforming based on capsule intersection, mass, and velocity.

## Telemetry & Live-Sync Visual Damage (Liontamer Concurrency)
- **Headless Analytics Server**: `UBannonTelemetryLogger` continuously exports limb damage, force vectors, and Poise levels as JSON objects. I/O operations are forcibly offloaded via `Async(EAsyncExecution::ThreadPool, ...)` to guarantee zero main-thread hitching.
- **Dynamic Laceration & Sweat Arrays**: `UBannonOptimizedSkeletalMeshComponent` natively queries `LimbFatigueArrays` from the match logic. It calculates `SweatOpacity` and `BloodOpacity` floats directly from the underlying bone damage parameters, replacing standard health bars with immediate RGB vertex buffer visual feedback.

## High-Density Rendering & Audio LODs (Liontamer Concurrency)
- **Instanced Crowd Rendering**: `UBannonCrowdInstancer` uses `UHierarchicalInstancedStaticMeshComponent` (HISM). Tens of thousands of crowd members render in a single draw call. `CurrentCrowdIntensity` floats are injected natively into Custom Primitive Data, allowing the Vulkan shader to compute jump/jitter animations via World Position Offsets directly on the GPU, completely eradicating CPU skeletal mesh updates.
- **Spacial Audio LODing**: `UBannonProceduralImpactAudio` checks squared camera distance against `AudioLODDistanceThreshold` (2500.0f). Distant procedural sounds are aggressively culled or routed through simplified noise generation matrices (`LOD_Mode = 1.0f`) to prevent MetaSound thread blowout during mass-collision brawls.

## FX Fluid & Volumetric Physics (Liontamer Concurrency)
- **Blood Fluid Dynamics**: `UBannonFluidDynamicsComponent` calculates real-time raycasts using swing velocity, impact force (>6.0f), and bone fatigue (>75%). Spawns deferred decals accurately on ring mats or ropes, ensuring visual damage maps directly to Jolt collision math rather than pre-scripted events.
- **Volumetric Fog Displacement**: `UBannonVolumetricDisplacement` tracks capsule `MAX_BODY_VEL` velocities and bridges them into Niagara parameter collections, generating physical atmospheric air displacement in the arena grid instantly.

## Camera AI & Springboard Physics (Liontamer Concurrency)
- **Director Camera AI**: `UBannonDirectorCamera` physically paths the camera based on actor midpoints and Jolt momentum vectors. `HitStop` triggers above 6.0f execute algorithmic FOV punch-ins and screen shake, completely decoupling the camera from static ringside rail mounts.
- **Springboard Physics Hooks**: `UBannonSpringboardEngine` natively intersects with `UBannonVerletRopesComponent`. Springboard attacks do not use canned animations; they invert capsule velocities and multiply against environmental spring-damper tension variables to launch the actor mathematically.
