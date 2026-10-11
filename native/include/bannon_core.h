#pragma once
// BANNON native core — game constants + fighter state. Values ported 1:1 from the current engine.
#include "bannon_math.h"

namespace bannon {

// --- hard constants (match the web engine so behavior carries over) ---
constexpr float MAX_HP        = 10000.0f;  // 100x scale
constexpr float DMG_SCALE     = 8.0f;
constexpr float MAX_BODY_VEL  = 3.8f;      // per-part linear cap (m/s)
constexpr float MAX_STAMINA   = 440.0f;
constexpr float FIXED_DT      = 1.0f / 120.0f; // fixed physics step (kills variable-dt jitter)

// --- the 15 core joints (same rig the web engine + GLB exports use) ---
enum Joint {
    J_PELVIS = 0, J_CHEST, J_HEAD,
    J_SHL, J_ELL, J_HAL, J_SHR, J_ELR, J_HAR,
    J_HIPL, J_KNL, J_FTL, J_HIPR, J_KNR, J_FTR,
    JOINT_COUNT
};

struct WrestlerState {
    float hp       = MAX_HP;
    float poise    = 100.0f;   // knockdown/crumple driver — independent of HP
    float stamina  = MAX_STAMINA;
    bool  crumpled = false;
};

// poise-driven crumple (crumple is NOT gated on HP — keeps match length calibrated)
void applyImpact(WrestlerState& s, float impact);

// stamina regen per fixed step (idle regens faster)
void regenStamina(WrestlerState& s, bool idle);

} // namespace bannon
