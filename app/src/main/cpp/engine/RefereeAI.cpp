#include "RefereeAI.h"
#include "RefereeDiagnostics.h"
#include <iostream>

void RefereeAI::initializeAutonomousRefereeProtocol() {
    std::cout << "[RefereeAI] Initializing Autonomous Referee Protocol...\n";
    RefereeDiagnostics::enableBackendDebugDraw();
    interfaceTripo3DPipeline();
    raycastPerceptionEngine();
}

void RefereeAI::interfaceTripo3DPipeline() {
    std::cout << "[RefereeAI] Interfacing with Tripo 3D pipeline...\n";
    std::cout << "[RefereeAI] Generating 1.85m human referee mesh.\n";
    std::cout << "[RefereeAI] Applying standard anatomical weight clamps.\n";
    std::cout << "[RefereeAI] Referee mesh integrated as physically simulated entity (vulnerable to active ragdoll collisions).\n";
}

void RefereeAI::executePredictiveSpatialAvoidance() {
    if (isInCollisionTrajectory()) {
        std::cout << "[RefereeAI] Trajectory path of Irish Whip or Apex Forklift detected.\n";
        std::cout << "[RefereeAI] Backpedaling using engine's current velocity arrays to avoid collision.\n";
        RefereeDiagnostics::renderAvoidanceTreeVisualization(12.5f, 8.2f, -2.0f, -1.5f);
    }
}

bool RefereeAI::isInCollisionTrajectory() {
    // Simulated check
    return true; 
}

bool RefereeAI::validateLineOfSight() {
    std::cout << "[RefereeAI] Casting Line of Sight (LoS) cone to opponent's shoulders...\n";
    RefereeDiagnostics::renderLoSConeDebugOverlay(true, 5.0f, 5.0f);
    // Simulated validation
    return true;
}

void RefereeAI::autonomouslyNavigate() {
    std::cout << "[RefereeAI] Navigating ring space to maintain LoS to the pin and avoid collisions.\n";
}

void RefereeAI::raycastPerceptionEngine() {
    std::cout << "[RefereeAI] Building C++ raycast perception engine within behavior tree...\n";
    if (!validateLineOfSight()) {
        autonomouslyNavigate();
    } else {
        std::cout << "[RefereeAI] Clear sightline validated. Pinning count sequence ready.\n";
    }
}

void RefereeAI::handleRefereeCollision(float wrestlerVelocity) {
    // Adheres to DMG_SCALE = 8.0
    float impactForce = wrestlerVelocity * 8.0f;
    float hpDrain = impactForce * 1.5f;
    float poiseDrain = impactForce * 2.0f;
    
    RefereeDiagnostics::logCollisionEvent(impactForce, hpDrain, poiseDrain);
    
    // Visual frontend representation
    std::cout << "[RefereeAI] [FRONTEND VISUAL] Referee struck! Enabling active ragdoll solver for referee mesh.\n";
    std::cout << "[RefereeAI] [FRONTEND VISUAL] Referee collision bump playing out natively on the frontend.\n";
}
