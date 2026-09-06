#ifndef GOD_WITHIN_STATE_MACHINE_H
#define GOD_WITHIN_STATE_MACHINE_H

// ============================================================================
// BANNON ENGINE — GOD WITHIN STATE MACHINE (TEKKEN-STYLE BRAWLER OVERRIDE)
// ============================================================================

namespace BannonEngine {

    class GodWithinStateMachine {
    public:
        float resonanceGauge;
        bool isGodWithinActive;
        float activeImpulseMultiplier;
        float gematriaBaseMultiplier;

        GodWithinStateMachine(float gematriaMultiplier);

        // Accumulates gauge during combat based on hidden stat multipliers
        void addResonance(float amount);
        
        // Triggers the state, uncaps multipliers, shifts physics to arcade-brawler logic
        void triggerTransformation();
        
        // Directly scales the kinematic impulse vector applied to enemy ragdolls
        void applyPhysicsImpulseOverride(float& baseKineticImpulse);
        
        void reset();
    };

}

#endif // GOD_WITHIN_STATE_MACHINE_H
