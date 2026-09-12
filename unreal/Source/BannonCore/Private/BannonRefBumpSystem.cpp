#include "BannonRefBumpSystem.h"

void UBannonRefBumpSystem::ProcessRefereeImpact(float ImpactForce, bool& bIsRefKnockedOut, float& OutLawlessDurationTimer)
{
    // The referee is a physics object; hitting him disables rules (pin counts, DQs) for a set duration.
    if (ImpactForce > 250.0f)
    {
        bIsRefKnockedOut = true;
        
        // The harder the ref is hit, the longer they stay down. 
        // Force of 500 = 50 seconds of lawless match time.
        OutLawlessDurationTimer = ImpactForce * 0.1f; 
    }
    else if (ImpactForce > 50.0f && !bIsRefKnockedOut)
    {
        // Minor bump, ref gets distracted/stumbles but doesn't go unconscious
        bIsRefKnockedOut = false;
        OutLawlessDurationTimer = 5.0f; // 5 seconds of distraction
    }
    else
    {
        bIsRefKnockedOut = false;
        OutLawlessDurationTimer = 0.0f;
    }
}
