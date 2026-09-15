#include "bannon_core.h"

namespace bannon {

void applyImpact(WrestlerState& s, float impact) {
    // HP: scaled damage
    s.hp -= impact * DMG_SCALE;
    if (s.hp < 0.0f) s.hp = 0.0f;

    // poise: independent driver of crumple/knockdown
    s.poise -= impact;
    if (s.poise <= 0.0f) {
        s.poise = 0.0f;
        s.crumpled = true;   // crumple strictly from poise, never HP
    }
}

void regenStamina(WrestlerState& s, bool idle) {
    // matches the web tuning: idle regens ~30/s, active ~18/s (per fixed step here)
    float perSec = idle ? 30.0f : 18.0f;
    s.stamina += perSec * FIXED_DT;
    if (s.stamina > MAX_STAMINA) s.stamina = MAX_STAMINA;

    // poise slowly recovers when not crumpled
    if (!s.crumpled) {
        s.poise += 12.0f * FIXED_DT;
        if (s.poise > 100.0f) s.poise = 100.0f;
    }
}

} // namespace bannon
