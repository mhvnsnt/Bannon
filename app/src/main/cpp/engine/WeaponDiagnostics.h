#pragma once
#include <string>

class WeaponDiagnostics {
public:
    static void enableBackendDebugDraw();
    static void logStaminaDrainCalculation(float weaponMass, float targetVelocity, float actualVelocity, float injuryMultiplier, float baseStaminaCost);
    static void renderKinematicLinkVisualization(float massOffset, float centerOfGravityZ);
    static void logWeaponImpact(float impactForce, float staminaDelta, const std::string& collisionTarget, bool triggeredWhiff, bool triggeredReversalShock);
    static void renderPredictedSwingArc(float startX, float startY, float endX, float endY, float momentumOverExtensionRisk);
private:
    static bool debugDrawEnabled;
};
