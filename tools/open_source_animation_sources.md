# Open-source animation/physics sources evaluated for BANNON P0

## UE Full Body IK / Control Rig
Epic's Full Body IK is position-based and supports per-bone stiffness, preferred angles, excluded bones, root behavior, and effector weighting. Use these concepts for BANNON's target-only IK layer; do not let IK become a capsule/root writer.
Source: https://dev.epicgames.com/documentation/unreal-engine/control-rig-full-body-ik-in-unreal-engine

## Vaei/FBIK
MIT-licensed project providing a Full Body IK Anim Graph node equivalent to Control Rig FBIK. Candidate for an optional project plugin after engine-version validation; do not vendor blindly.
Source: https://github.com/Vaei/FBIK

## GASP-ALS-R
Open-source Unreal animation sample architecture using layered animation, linked layers, gameplay abilities, Physics Control, ragdoll states, and motion-oriented gameplay. Its separation of animation layers and physical control is useful as an architectural reference for BANNON.
Source: https://github.com/SAM-tak/GASP-ALS-R

## UE5 active ragdoll reference
The tigershan1130 UE5 active-ragdoll prototype demonstrates an animation-following physical character and separates physical response from the normal animation path. Treat as research/reference, not a drop-in dependency.
Source: https://github.com/tigershan1130/UE5-active-ragdoll-with-floating-capsule

## Jolt Physics
Jolt provides animated ragdoll support including hard/soft keying, motor-driven constraints, and mapping between animation and ragdoll skeletons. BANNON remains Unreal/Chaos-first; Jolt is a reference for future isolated physics experiments, not a replacement for CharacterMovement.
Source: https://github.com/jrouwe/JoltPhysics

## Integration rule
No external source is accepted into the gameplay runtime merely because it looks good. Every candidate must pass engine-version compatibility, license review, build verification, and BANNON authority laws. UNKNOWN is never PASS.
