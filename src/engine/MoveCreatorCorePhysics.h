#ifndef MOVE_CREATOR_CORE_PHYSICS_H
#define MOVE_CREATOR_CORE_PHYSICS_H

#include <iostream>
#include <string>

// ============================================================================
// BANNON ENGINE — MOVE CREATOR CORE PHYSICS SOLVER
// ============================================================================
namespace BannonEngine {

    class MoveCreatorCorePhysics {
    public:
        MoveCreatorCorePhysics();
        ~MoveCreatorCorePhysics();

        // Calculates the required rotational force to lift a character
        // Multipliers are derived from the 50-Block Gimmick Matrix
        float calculateAngularVectorForce(float baseLifterStrength, float targetMass, float momentumSurgeMultiplier);

        // Translates move velocity into poise damage without destabilizing the C++ skeleton
        float clampImpactVelocity(float rawImpactVelocity, float skeletalDurability);

    private:
        float gematriaMultiplierBase;
    };

} // namespace BannonEngine

#endif // MOVE_CREATOR_CORE_PHYSICS_H
