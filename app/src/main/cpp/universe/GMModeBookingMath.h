#pragma once
#include <string>

class GMModeBookingMath {
public:
    static void evaluateMatchConsequences(const std::string& matchType, float maxImpactVelocity, bool criticalInjuryOccurred);
    static void updateFinancialArrays(float showRating);
    static void updateRosterMorale(bool criticalInjuryOccurred, int frictionSpikes);
};
