# BANNON — Native C++ Engine (AAA target)

From-scratch native core, built alongside the web build during migration. Compiles + tests green.

    cd native && cmake -B build && cmake --build build && ./build/test_core

## Layout
- `include/bannon_math.h`   — Vec3 / Quat (rotate, axis-angle, rotationBetween), MAX_BODY_VEL clamp
- `include/bannon_core.h`   — constants (ported 1:1 from the web engine) + WrestlerState + 15-joint enum
- `include/bannon_ragdoll.h`— RigidBody, PD-controller joints (drive toward animation, give on impact), bone constraint
- `src/wrestler_state.cpp`  — poise-driven crumple (independent of HP), stamina/poise regen
- `tests/test_core.cpp`     — proves all of the above

## Next
- Jolt Physics as the rigid-body/ragdoll solver (submodule + `-DBANNON_USE_JOLT=ON`); PD torques replace positional drive.
- Vulkan/DX12 renderer fed by the joint transforms.
- Port move logic + damage tables from the web engine into clean `moves.cpp`.
- GLB/FBX (Hunyuan3D/FLUX/Blender pipeline) loads straight in — asset stack is engine-agnostic.
