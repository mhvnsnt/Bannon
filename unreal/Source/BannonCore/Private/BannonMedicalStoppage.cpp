#include "BannonMedicalStoppage.h"

void UBannonMedicalStoppage::CheckStoppageConditions(float BloodVolumeLost, float CriticalJointDamage, bool& bMatchStopped, FString& OutStoppageReason)
{
    // Medical Stoppage Logic: Referees dynamically stopping matches if damage hits catastrophic thresholds.
    bMatchStopped = false;
    OutStoppageReason = TEXT("");

    if (BloodVolumeLost > 1000.0f) // Arbitrary ml volume threshold
    {
        bMatchStopped = true;
        OutStoppageReason = TEXT("Excessive Blood Loss");
    }
    else if (CriticalJointDamage > 95.0f) // Joint integrity failure (e.g. snapped arm)
    {
        bMatchStopped = true;
        OutStoppageReason = TEXT("Catastrophic Joint Failure");
    }
}
