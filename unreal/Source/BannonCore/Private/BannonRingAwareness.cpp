#include "BannonRingAwareness.h"

EBannonTacticalZone UBannonRingAwareness::EvaluateTacticalZone(FVector EntityLocation, FVector RingCenterLocation)
{
    // Simplified distance check for tactical zones
    float Dist = FVector::Distance(EntityLocation, RingCenterLocation);
    
    if (Dist < 200.0f) return EBannonTacticalZone::RingCenter;
    if (Dist >= 200.0f && Dist < 300.0f) return EBannonTacticalZone::Ropes;
    if (Dist >= 300.0f && Dist < 350.0f) return EBannonTacticalZone::Apron;
    if (Dist >= 350.0f && Dist < 800.0f) return EBannonTacticalZone::Ringside;
    
    return EBannonTacticalZone::CrowdArea;
}

void UBannonRingAwareness::CalculateRopeBreakPriority(float DistanceToRope, float SubmissionPressure, bool& bAttemptRopeBreak)
{
    // AI prioritizes crawling to the ropes over breaking the grip based on geometry
    if (DistanceToRope < 150.0f && SubmissionPressure > 60.0f)
    {
        bAttemptRopeBreak = true; // Engage FBIK dragging state towards nearest rope spline
    }
    else
    {
        bAttemptRopeBreak = false; // Attempt standard reversal or power-out
    }
}
