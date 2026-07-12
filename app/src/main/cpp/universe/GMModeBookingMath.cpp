#include "GMModeBookingMath.h"
#include <iostream>

void GMModeBookingMath::evaluateMatchConsequences(const std::string& matchType, float maxImpactVelocity, bool criticalInjuryOccurred) {
    std::cout << "[GMModeBookingMath] Parsing match consequence telemetry...\n";
    float showRating = 50.0f; // Base rating
    
    if (matchType == "HARDCORE" || matchType == "FIRST_BLOOD") {
        if (maxImpactVelocity > 3.5f) {
            showRating += 25.0f;
            std::cout << "[GMModeBookingMath] Extreme violence detected. Demographic engagement spiked. Rating +25.0\n";
        }
    }
    
    if (criticalInjuryOccurred) {
        std::cout << "[GMModeBookingMath] Critical injury in broadcast. Shock value increases short-term metrics, but roster morale penalized.\n";
        showRating += 10.0f;
    }

    std::cout << "[GMModeBookingMath] Final Match Rating Calculated: " << showRating << "/100\n";
    updateFinancialArrays(showRating);
    updateRosterMorale(criticalInjuryOccurred, 1);
}

void GMModeBookingMath::updateFinancialArrays(float showRating) {
    float revenue = showRating * 15000.0f;
    std::cout << "[GMModeBookingMath] [FINANCIAL ARRAY] Show Rating mapped to ticket/PPV sales. Revenue generated: $" << revenue << "\n";
}

void GMModeBookingMath::updateRosterMorale(bool criticalInjuryOccurred, int frictionSpikes) {
    std::cout << "[GMModeBookingMath] [MORALE ARRAY] Adjusting locker room sentiment...\n";
    if (criticalInjuryOccurred) {
        std::cout << "[GMModeBookingMath] Morale DROP: Roster shaken by severe in-ring injury.\n";
    }
    if (frictionSpikes > 0) {
        std::cout << "[GMModeBookingMath] Morale ALERT: Backstage friction spikes detected. Faction tension rising.\n";
    }
}
