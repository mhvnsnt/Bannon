#include "BannonWeaponScavengingAI.h"

void UBannonWeaponScavengingAI::EvaluateWeaponSearch(float AggressionStat, bool bIsNoDQ, const TArray<FVector>& NearbyWeaponLocations, const FVector& AILocation, bool& bShouldScavenge, FVector& OutTargetWeaponLocation)
{
    // Weapon Scavenging AI: Actively searching the sandbox environment for high-damage props.
    bShouldScavenge = false;
    OutTargetWeaponLocation = FVector::ZeroVector;

    // AI will only look for weapons if they are aggressive, and it's either No DQ or they just don't care.
    if (AggressionStat > 60.0f && (bIsNoDQ || AggressionStat > 90.0f))
    {
        float ClosestDist = 999999.0f;

        for (const FVector& WeaponLoc : NearbyWeaponLocations)
        {
            float Dist = FVector::DistSquared(AILocation, WeaponLoc);
            if (Dist < ClosestDist && Dist < (1500.0f * 1500.0f)) // Within 15 meters
            {
                ClosestDist = Dist;
                OutTargetWeaponLocation = WeaponLoc;
                bShouldScavenge = true;
            }
        }
    }
}
