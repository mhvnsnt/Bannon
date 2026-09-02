# Bannon Architecture: The Minimum Working Vertical Slice

**Date:** 2026-09-01
**Objective:** Establish a physical proof-of-concept pipeline extending from raw repository assets to a playable character interaction in Unreal Engine 5.3.

## Architectural Responsibilities

The architecture is strictly divided to leverage mature open-source infrastructure without compromising Bannon's specialized wrestling rules.

### 1. Lyra (The Infrastructure / Organs)
Lyra patterns and Unreal core systems will be adopted or adapted for:
- Project / Content Organization
- `PlayerController` and Input routing (Enhanced Input)
- Character possession models
- Camera management
- Locomotion infrastructure
- UI framework
- Match types / Experience structure

### 2. Bannon (The Wrestling Brain)
Bannon retains absolute authority over the sport simulation:
- Wrestling combat rules (via `native/include` C++ headers shared with Web)
- Grappling logic and transitions
- Reversal windows and execution
- Move selection
- Pins, submissions, and rope interactions
- Entrances and wrestler creation logic
- Combat-specific physics bodies and collision

## The Vertical Slice Pipeline

Before any complex systems (like creation suites or multi-man matches) are built, this precise sequence must be physically verified:

1. **Bannon Source** (Recovered `BannonEngine` and `BannonCore` compilation)
2. **UE 5.3 Compile** (UBT successful exit)
3. **Recovered JAGER Asset** (`JAGER.glb` import to `.uasset`)
4. **Skeletal Pipeline** (Valid Skeleton and Physics Asset generated)
5. **Animation Blueprint** (Basic state machine mapping)
6. **Playable Character** (Possession and Input mapped via Lyra patterns)
7. **One Wrestling Interaction** (Test of `native/include` combat laws reaching the animation system)

**Note on Animation Reality Diagnostics:**
Only after this vertical slice is physically proven will we diagnose prior reports of animation/movement failure. We must observe root motion behavior, state transitions, and combat physics against real evidence, rather than speculating from source code.
