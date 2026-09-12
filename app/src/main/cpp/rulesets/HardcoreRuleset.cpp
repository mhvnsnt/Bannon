#include "HardcoreRuleset.h"
#include <iostream>

void HardcoreRuleset::initialize() {
    std::cout << "[HardcoreRuleset] Modifying boundary logic: Standard out-of-bounds ring clamp DISABLED.\n";
    std::cout << "[HardcoreRuleset] Full active ragdoll physics engaged for ringside floor.\n";
}

void HardcoreRuleset::evaluateWeaponImpact(const std::string& targetLimb, float limbHP, float impactVelocity) {
    if (limbHP <= 0.0f && impactVelocity > 3.0f) {
        std::cout << "[HardcoreRuleset] CRITICAL WEAPON IMPACT: " << impactVelocity << " m/s against 0 HP " << targetLimb << ".\n";
        std::cout << "[HardcoreRuleset] MATCH TERMINATED: TKO/Injury Stoppage flagged.\n";
    }
}
