cmake_minimum_required(VERSION 3.16)
project(bannon_native CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# core engine library (math is header-only)
add_library(bannon_core STATIC src/wrestler_state.cpp)
target_include_directories(bannon_core PUBLIC include)

# test harness
enable_testing()
add_executable(test_core tests/test_core.cpp)
target_link_libraries(test_core bannon_core)
add_test(NAME core COMMAND test_core)

add_executable(test_rig tests/test_rig.cpp)
target_link_libraries(test_rig bannon_core)
add_test(NAME rig COMMAND test_rig)

# --- Jolt physics (real rigid-body / active-ragdoll solver) ---
# Drop Jolt in third_party/JoltPhysics, then flip this ON:
#   git submodule add https://github.com/jrouwe/JoltPhysics native/third_party/JoltPhysics
option(BANNON_USE_JOLT "Link Jolt Physics for the ragdoll solver" OFF)
if(BANNON_USE_JOLT)
    add_subdirectory(third_party/JoltPhysics/Build)
    target_link_libraries(bannon_core Jolt)
    target_compile_definitions(bannon_core PUBLIC BANNON_USE_JOLT=1)
endif()

add_executable(test_combat tests/test_combat.cpp)
target_link_libraries(test_combat bannon_core)
add_test(NAME combat COMMAND test_combat)

# bricks 245-444 batch 1 (shockwave / torsion limiter / zone scaling / throw stability / tension
# recovery / knee buckling / kickout) — header-only solvers, pure-function tests
add_executable(test_solvers tests/test_solvers.cpp)
target_link_libraries(test_solvers bannon_core)
add_test(NAME solvers COMMAND test_solvers)

# God Within — three-persona (Marquis/Bannon/Maime) physics-multiplier state machine
add_executable(test_persona tests/test_persona.cpp)
target_link_libraries(test_persona bannon_core)
add_test(NAME persona COMMAND test_persona)

# 4-quadrant release matrix (A slam/B drop/X throw/Y toss) + weapon mass/stamina physics
add_executable(test_weapon tests/test_weapon.cpp)
target_link_libraries(test_weapon bannon_core)
add_test(NAME weapon COMMAND test_weapon)

# referee AI (LoS pin gating, predictive avoidance, ref bumps) + pin kickout tiers + submission
# torque→limb-HP organic tap-out — real implementations of the bannonengine_2 stub specs
add_executable(test_referee tests/test_referee.cpp)
target_link_libraries(test_referee bannon_core)
add_test(NAME referee COMMAND test_referee)

# universe/modes layer: trait subtypes, TLC physics, iron-man wear, crowd kinetics, GM booking,
# friction politics, God Within consequences
add_executable(test_universe tests/test_universe.cpp)
target_link_libraries(test_universe bannon_core)
add_test(NAME universe COMMAND test_universe)
