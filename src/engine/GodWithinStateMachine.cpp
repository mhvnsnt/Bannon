#include "GodWithinStateMachine.h"
#include <iostream>

namespace BannonEngine {

    GodWithinStateMachine::GodWithinStateMachine(float gematriaMultiplier) {
        gematriaBaseMultiplier = gematriaMultiplier;
        resonanceGauge = 0.0f;
        isGodWithinActive = false;
        activeImpulseMultiplier = 1.0f;
    }

    void GodWithinStateMachine::addResonance(float amount) {
        if (isGodWithinActive) return;
        resonanceGauge += (amount * gematriaBaseMultiplier);
        if (resonanceGauge >= 100.0f) {
            resonanceGauge = 100.0f;
            triggerTransformation();
        }
    }

    void GodWithinStateMachine::triggerTransformation() {
        isGodWithinActive = true;
        // Uncap the physics impulse vectors based on esoteric shadow stats
        activeImpulseMultiplier = 3.5f * gematriaBaseMultiplier; 
        std::cout << "[NEXUS OVERRIDE] GOD WITHIN STATE TRIGGERED. Physics constraints uncapped. Impulse multiplier: " 
                  << activeImpulseMultiplier << std::endl;
    }

    void GodWithinStateMachine::applyPhysicsImpulseOverride(float& baseKineticImpulse) {
        if (isGodWithinActive) {
            baseKineticImpulse *= activeImpulseMultiplier;
            // Native logic triggers massive crowd-clearing ragdoll force here
        }
    }

    void GodWithinStateMachine::reset() {
        resonanceGauge = 0.0f;
        isGodWithinActive = false;
        activeImpulseMultiplier = 1.0f;
    }

}
