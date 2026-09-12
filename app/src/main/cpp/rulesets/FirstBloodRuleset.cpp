#include "FirstBloodRuleset.h"
#include <iostream>

void FirstBloodRuleset::evaluateHeadStrike(float incomingVelocity, float attackerPowerMultiplier) {
    float hardCap = 5.0f * attackerPowerMultiplier; 
    std::cout << "[FirstBloodRuleset] Parsing head trauma buffer. Strike Velocity: " << incomingVelocity << " | Threshold: " << hardCap << "\n";
    if (incomingVelocity > hardCap) {
        std::cout << "[FirstBloodRuleset] Threshold breached. Triggering localized skin texture alpha-blend swap on forehead mesh.\n";
        std::cout << "[FirstBloodRuleset] Blood Alpha = 1.0. Stopping clock. MATCH TERMINATED.\n";
    }
}
