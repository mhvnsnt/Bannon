#include "BannonHospitalRehabSystem.h"

void UBannonHospitalRehabSystem::ProcessRehabilitation(float InjurySeverity, float GodWithinHealingPoints, bool bIsRushingRecovery, int32& OutWeeksToRecover, float& OutPermanentStatPenalty)
{
    // Replaces shallow injury stubs with robust Hospital/Rehab tracking.
    // Base recovery time is derived strictly from bone/tissue damage matrices.
    float BaseWeeks = (InjurySeverity / 10.0f); 

    // The God Within progression system allows players to expend cosmic alignment points to hyper-regenerate tissue.
    float AcceleratedWeeks = BaseWeeks - (GodWithinHealingPoints * 0.5f);
    
    if (bIsRushingRecovery)
    {
        // MDickie classic risk: Rushing an injury to get back on TV halves the wait time but permanently damages a stat.
        OutWeeksToRecover = FMath::Max(1, FMath::RoundToInt(AcceleratedWeeks / 2.0f));
        OutPermanentStatPenalty = InjurySeverity * 0.1f; // High severity = massive permanent loss to agility/strength
    }
    else
    {
        OutWeeksToRecover = FMath::Max(1, FMath::RoundToInt(AcceleratedWeeks));
        OutPermanentStatPenalty = 0.0f; // Healing fully prevents permanent stat degradation
    }
}
