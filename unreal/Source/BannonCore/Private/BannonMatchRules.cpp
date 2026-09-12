#include "BannonMatchRules.h"

void UBannonMatchRules::TriggerRefBump(float ImpactForce)
{
    // If the referee takes a physics impact exceeding threshold, they are knocked out
    if (ImpactForce > 5000.0f)
    {
        bRefIsDown = true;
        RefDownTimer = 30.0f; // Ref stays down for 30 seconds
        // DQs and pinfalls are suspended
    }
}

void UBannonMatchRules::EvaluateBlindSpotInterference(const FString& InterferingEntity)
{
    // If the ref is down, weapons and run-ins bypass standard DQ logic
    if (bRefIsDown)
    {
        // Allow interference without triggering match termination
    }
}
