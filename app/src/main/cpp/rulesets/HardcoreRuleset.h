#pragma once
#include <string>

class HardcoreRuleset {
public:
    static void initialize();
    static void evaluateWeaponImpact(const std::string& targetLimb, float limbHP, float impactVelocity);
};
