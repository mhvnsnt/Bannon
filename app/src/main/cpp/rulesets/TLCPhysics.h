#pragma once
#include <string>

class TLCPhysics {
public:
    static void calculateTableStructuralIntegrity(float impactMass, float velocityY);
    static void engageLadderClimbIK();
    static void processChairCollision(float velocityLinear);
};
