#include "RefereeDiagnostics.h"
#include <iostream>

bool RefereeDiagnostics::debugDrawEnabled = false;

void RefereeDiagnostics::enableBackendDebugDraw() {
    debugDrawEnabled = true;
    std::cout << "[RefereeDiagnostics] Backend debug draw toggled ON. Rendering LoS cones and trajectories to frame buffer.\n";
}

void RefereeDiagnostics::logCollisionEvent(float impactForce, float hpDrain, float poiseDrain) {
    std::cout << "[RefereeDiagnostics] COLLISION EVENT LOGGED (DMG_SCALE = 8.0 applied)\n";
    std::cout << "  -> Impact Force: " << impactForce << " N\n";
    std::cout << "  -> HP Drain Applied: " << hpDrain << "\n";
    std::cout << "  -> Poise Drain Applied: " << poiseDrain << "\n";
}

void RefereeDiagnostics::renderAvoidanceTreeVisualization(float predictedX, float predictedY, float backpedalX, float backpedalY) {
    if (debugDrawEnabled) {
        std::cout << "[RefereeDiagnostics] [BACKEND OVERLAY] Avoidance Tree Visualization:\n";
        std::cout << "  -> Predicted Wrestler Impact Trajectory: (" << predictedX << ", " << predictedY << ")\n";
        std::cout << "  -> Calculated Backpedal Vector: (" << backpedalX << ", " << backpedalY << ")\n";
    }
}

void RefereeDiagnostics::renderLoSConeDebugOverlay(bool hasClearSightline, float targetX, float targetY) {
    if (debugDrawEnabled) {
        std::cout << "[RefereeDiagnostics] [BACKEND OVERLAY] Raycast LoS Cone Active:\n";
        std::cout << "  -> Target Coordinates: (" << targetX << ", " << targetY << ")\n";
        std::cout << "  -> Sightline Status: " << (hasClearSightline ? "CLEAR" : "BLOCKED") << "\n";
    }
}
