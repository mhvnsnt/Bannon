#include "DomainEpsilonAI.h"
#include <iostream>

void DomainEpsilonAI::evaluateTacticalState(float stamina, float armHealth, float ringPositionX, float ringPositionY) {
    std::cout << "[DomainEpsilonAI] Parsing DynamicStaminaDepletionArray & Limb Health...\n";
    
    if (stamina < 15.0f || armHealth < 30.0f) {
        std::cout << "[DomainEpsilonAI] Tactical Assessment: CRITICAL DANGER. Stamina (" << stamina << ") or Arm Health (" << armHealth << ") in red zone.\n";
        executeRollOut();
    } else {
        std::cout << "[DomainEpsilonAI] Tactical Assessment: COMBAT VIABLE. Holding ground.\n";
        holdPosition();
    }
}

void DomainEpsilonAI::evaluateSubmissionDefense(float localLimbHP, float currentRotation, float maxRotationLimit) {
    std::cout << "[DomainEpsilonAI] CPU parsing submission IK torque danger...\n";
    if (localLimbHP < 20.0f || (currentRotation / maxRotationLimit) > 0.85f) {
        std::cout << "[DomainEpsilonAI] Limb near breaking point! CPU shifting all resources to UI Mini-game Delta defense.\n";
        struggleInUI();
    } else {
        std::cout << "[DomainEpsilonAI] Conserving stamina, riding out the torque.\n";
    }
}

void DomainEpsilonAI::executeRollOut() {
    std::cout << "[DomainEpsilonAI] Executing evasive maneuver: Rolling out of the ring to recover stamina.\n";
}

void DomainEpsilonAI::holdPosition() {
    std::cout << "[DomainEpsilonAI] CPU AI maintaining offensive posture.\n";
}

void DomainEpsilonAI::struggleInUI() {
    std::cout << "[DomainEpsilonAI] CPU aggressively fighting in Submission UI Mini-game to generate negative torque delta.\n";
}
