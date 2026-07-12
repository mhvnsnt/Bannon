#pragma once
#include <string>

class RefereeDiagnostics {
public:
    static void enableBackendDebugDraw();
    static void logCollisionEvent(float impactForce, float hpDrain, float poiseDrain);
    static void renderAvoidanceTreeVisualization(float predictedX, float predictedY, float backpedalX, float backpedalY);
    static void renderLoSConeDebugOverlay(bool hasClearSightline, float targetX, float targetY);
private:
    static bool debugDrawEnabled;
};
