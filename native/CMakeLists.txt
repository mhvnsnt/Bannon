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

# --- Jolt physics (real rigid-body / active-ragdoll solver) ---
# Drop Jolt in third_party/JoltPhysics, then flip this ON:
#   git submodule add https://github.com/jrouwe/JoltPhysics native/third_party/JoltPhysics
option(BANNON_USE_JOLT "Link Jolt Physics for the ragdoll solver" OFF)
if(BANNON_USE_JOLT)
    add_subdirectory(third_party/JoltPhysics/Build)
    target_link_libraries(bannon_core Jolt)
    target_compile_definitions(bannon_core PUBLIC BANNON_USE_JOLT=1)
endif()
