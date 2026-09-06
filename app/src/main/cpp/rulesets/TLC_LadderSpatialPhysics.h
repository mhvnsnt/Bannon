#pragma once
#include <string>

class TLC_LadderSpatialPhysics {
public:
    static void evaluateLadderToRingPostInteraction(float distance);
    static void applyRagdollStackingConstraints();
};
