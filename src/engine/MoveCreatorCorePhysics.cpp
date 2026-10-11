#include "MoveCreatorCorePhysics.h"

namespace BannonEngine {

    MoveCreatorCorePhysics::MoveCreatorCorePhysics() {
        gematriaMultiplierBase = 1.0f;
    }

    MoveCreatorCorePhysics::~MoveCreatorCorePhysics() {}

    float MoveCreatorCorePhysics::calculateAngularVectorForce(float baseLifterStrength, float targetMass, float momentumSurgeMultiplier) {
        std::cout << "[NEXUS KINEMATICS] Calculating Angular Vector Force..." << std::endl;
        // J-Space derived math: Ensures an underweight wrestler cannot lift Absolute Mass without max momentum
        float rotationalForce = (baseLifterStrength * momentumSurgeMultiplier) / targetMass;
        std::cout << "[NEXUS KINEMATICS] Angular Vector Output: " << rotationalForce << std::endl;
        return rotationalForce;
    }

    float MoveCreatorCorePhysics::clampImpactVelocity(float rawImpactVelocity, float skeletalDurability) {
        std::cout << "[NEXUS KINEMATICS] Applying Impact Velocity Clamp..." << std::endl;
        // J-Space derived boundary check
        float maxAllowedVelocity = skeletalDurability * 2.5f;
        float actualPoiseDamage = rawImpactVelocity > maxAllowedVelocity ? maxAllowedVelocity : rawImpactVelocity;
        std::cout << "[NEXUS KINEMATICS] Clamped Poise Damage Applied: " << actualPoiseDamage << std::endl;
        return actualPoiseDamage;
    }

} // namespace BannonEngine
