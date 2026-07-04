# Master Blueprint & Dev Log: BANNON Physics Combat Engine

## Project Goals & State
This file acts as the permanent brain, tracker, and configuration history for the AI coding assistant explicitly generated for the "Bannon" Pro Wrestling/Combat Engine project. 

### Core Vision
* Elite Physics Combat Engine: The game strives to accurately emulate pro wrestling physics (impacts, weight distribution, structural rig limits).
* Real-World Grappling Accuracy: Moves must map specifically to their real-world biomechanical traits (e.g., Powerbomb lifts vertical and drops chest-first, Suplex arches overhead, Clothesline leverages rigid arm/forward velocity, Uranage hooks shoulder and rotates downward). Anatomical joints shouldn't overextend into spider-like or raptor positions.
* State-of-the-Art Comprehension: The AI operates far beyond conventional coding assistants (e.g., Claude, Unity internal tools). It possesses deep capabilities to analyze videos dynamically (rather than just frame-by-frame) and possesses excruciatingly detailed knowledge of sports-entertainment moves across different franchises (WWE 2K, Virtual Pro Wrestling, Gang Beasts).
* Stand vs. Ground State: Characters have heavy balancing logic (RK_STAND) to stay upright. Once knocked down, they enter full ragdoll physics.

### Current Dev Focus & Status (June 2026)
**[HYPER-VISOR DEV TOOLS ACTIVATED]**
* The Swarm is now equipped with `Hitbox & Spatial Sweeper`, `IK & Biomechanics Solver`, `WebGL Skinning & Mesh Sync Analyst`, `V8 Heap Memory Profiler`, `DeltaTime & Frame Analyzer`, and a `State Machine Operator`.
* **The Goal**: Use these new toolsets to dynamically inspect the exact variables, buffers, continuous collision iterations, and vertex mappings. The Swarm now inherently evaluates the underlying architecture as if hooked directly into a V8 runtime and WebGL context.
* **The Specific Focus**: Fixing the Visual Mesh Skining bug. With the new WebGL Skinning Analyst node, we track exact joint interpolation versus rig referencing during standard simulation.

### Instructions for the AI Agent
When generating or fixing code:
1. NEVER lose track of the limb stretching skin interpolation issue. Remind the user if you modify `updateRagdoll` or `updateSkin` that you are using 1:1 rigid body coordinates for mesh positions.
2. Maintain high frame rate Delta Time compensations so the physics stay consistent.
3. Don't use basic HTML generic CSS. Rely fully on the complex canvas/Three/Cannon loops or the existing framework logic.
4. If a user uploads an HTML file for a fix, parse the Mesh positioning logic precisely and apply the fix.

## Done / Shipped
- [x] Initial Physics Joint Verification Engine (maxStretchOnHit diagnostic).
- [x] LIMB_LOCK implementation (rest length clamping).
- [x] Auto-scaffold diagnostics for: Mantis Arm limits, Stand Stasis values, DeltaTime Hz limits, Trajectory logic.
- [x] Dev Studio 'Visual Ragdoll Mesh Sync' scanner implemented.
- [x] HTML backup code Export button added to the UI/Library tab.

## Pending / Needs Work
- [x] Integrate full mesh skinning tracking (Agent now differentiates 'Joint Physics Bug' vs 'Interpolated Standing Canvas Skin Rendering Bug').
- [ ] Wait for user to run the specific diagnostic on the imported 'v47' or 'v44' file and generate the fix.
- [ ] Continue stabilizing character weight shifting.

## HUIHUI QWABLE 27B ABLITERATED INTEGRATION (LOCAL SWARM NODE)
* The user requires God Mode OS (Railway) to connect to a bare-metal remote GPU node (RunPod/Vast.ai) running the `huihui-ai/Huihui-Qwable-3.6-27b-abliterated-GGUF` model via `llama.cpp` server.
* The local phone device is strictly an interface remote, not the inference engine.
* Ensure God Mode OS `PORT` binding relies on `process.env.PORT || 3000` to prevent Railway collision.
* Route Quantum Chat endpoints through the secure Cloudflare Tunnel/Ngrok URL pointing to the external GPU node on port `8081`.

## ARTIFACT PROTOCOL
1. Wrap all compiled code inside <bannon_artifact id="[id]" type="[mime]" title="[title]"> [CODE] </bannon_artifact>.
2. If code exceeds limits split it into <artifact_chunk_1> and <artifact_chunk_2>.
3. Hide all diagnostic math and loops inside a <quantum_thought> tag.
4. Output these tags cleanly. The external UI will intercept them and render the download cards autonomously.