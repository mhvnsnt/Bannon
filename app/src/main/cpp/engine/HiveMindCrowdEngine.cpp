#include "HiveMindCrowdEngine.h"
#include <iostream>

void HiveMindCrowdEngine::subscribeToKineticTelemetry() {
    std::cout << "[HiveMindCrowdEngine] Subscribed to C++ momentum solver telemetry.\n";
    std::cout << "[HiveMindCrowdEngine] Localized audience AI listening for kinetic thresholds.\n";
}

void HiveMindCrowdEngine::processKineticEvent(float impactVelocity, const std::string& eventType) {
    std::cout << "[HiveMindCrowdEngine] Intercepted event: " << eventType << " at " << impactVelocity << " m/s velocity.\n";
    
    if (eventType == "WEAPON_IMPACT" && impactVelocity > 2.0f) {
        triggerPop(8);
        triggerChant("HOLY S***!");
    } else if (eventType == "HIGH_ARC_THROW" && impactVelocity > 3.5f) {
        triggerPop(10);
    } else if (eventType == "BOTCH_OR_STALL") {
        triggerBoo();
    } else if (eventType == "DYNAMIC_PIN") {
        std::cout << "[HiveMindCrowdEngine] Synchronizing crowd counting audio with referee mat strikes.\n";
        triggerPop(5);
    }
}

void HiveMindCrowdEngine::triggerPop(int intensity) {
    std::cout << "[HiveMindCrowdEngine] CROWD POP! Intensity Level: " << intensity << "/10. Triggering synchronized audio and animation state shifts.\n";
}

void HiveMindCrowdEngine::triggerBoo() {
    std::cout << "[HiveMindCrowdEngine] CROWD BOO! Heavy heat generated.\n";
}

void HiveMindCrowdEngine::triggerChant(const std::string& chantText) {
    std::cout << "[HiveMindCrowdEngine] CROWD CHANT INITIATED: \"" << chantText << "\"\n";
}
