#include "WeaponDiagnostics.h"
#include <iostream>

bool WeaponDiagnostics::debugDrawEnabled = false;

void WeaponDiagnostics::enableBackendDebugDraw() {
    debugDrawEnabled = true;
    std::cout << "[WeaponDiagnostics] Backend debug draw toggled ON. Rendering kinematic links and swing arcs to frame buffer.\n";
}

void WeaponDiagnostics::logStaminaDrainCalculation(float weaponMass, float targetVelocity, float actualVelocity, float injuryMultiplier, float baseStaminaCost) {
    std::cout << "[WeaponDiagnostics] [STAMINA CALC HOOK]\n";
    std::cout << "  -> Weapon Mass: " << weaponMass << "kg\n";
    std::cout << "  -> Target Vel: " << targetVelocity << "m/s, Actual Vel: " << actualVelocity << "m/s\n";
    std::cout << "  -> Injury Multiplier: " << injuryMultiplier << "x\n";
    std::cout << "  -> Calculated Base Cost: " << baseStaminaCost << "\n";
}

void WeaponDiagnostics::renderKinematicLinkVisualization(float massOffset, float centerOfGravityZ) {
    if (debugDrawEnabled) {
        std::cout << "[WeaponDiagnostics] [BACKEND OVERLAY] Kinematic Link Active:\n";
        std::cout << "  -> Hand-to-Weapon constraints bound.\n";
        std::cout << "  -> Mass Offset applied: " << massOffset << "kg\n";
        std::cout << "  -> Adjusted CoG (Z-axis): " << centerOfGravityZ << "m\n";
    }
}

void WeaponDiagnostics::logWeaponImpact(float impactForce, float staminaDelta, const std::string& collisionTarget, bool triggeredWhiff, bool triggeredReversalShock) {
    std::cout << "[WeaponDiagnostics] [IMPACT LOG]\n";
    std::cout << "  -> Target Hit: " << collisionTarget << "\n";
    std::cout << "  -> Impact Force: " << impactForce << " N\n";
    std::cout << "  -> Stamina Delta Applied: " << staminaDelta << "\n";
    if (triggeredWhiff) std::cout << "  -> 2.5x Whiff Penalty: TRIGGERED\n";
    if (triggeredReversalShock) std::cout << "  -> Reversal Shock: TRIGGERED\n";
}

void WeaponDiagnostics::renderPredictedSwingArc(float startX, float startY, float endX, float endY, float momentumOverExtensionRisk) {
    if (debugDrawEnabled) {
        std::cout << "[WeaponDiagnostics] [BACKEND OVERLAY] Predicted Swing Arc & Momentum:\n";
        std::cout << "  -> Trajectory: (" << startX << ", " << startY << ") to (" << endX << ", " << endY << ")\n";
        std::cout << "  -> Momentum Over-Extension Risk Factor: " << momentumOverExtensionRisk << "\n";
    }
}
