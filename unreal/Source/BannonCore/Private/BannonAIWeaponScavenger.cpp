#include "BannonAIWeaponScavenger.h"

void UBannonAIWeaponScavenger::ScanForOptimalWeapon(const FVector& AILocation, const TArray<FVector>& AvailableWeaponLocations, const TArray<float>& WeaponDamageRatings, FVector& OutTargetWeaponLocation, bool& bFoundWeapon)
{
    // AI actively searching the sandbox environment for high-damage props.
    bFoundWeapon = false;
    float BestScore = -1.0f;
    int32 BestIndex = -1;

    for (int32 i = 0; i < AvailableWeaponLocations.Num(); i++)
    {
        if (i < WeaponDamageRatings.Num())
        {
            float Distance = FVector::Dist(AILocation, AvailableWeaponLocations[i]);
            
            // Score = Damage / Distance (wants the highest damage weapon closest to them)
            float Score = WeaponDamageRatings[i] / (Distance + 1.0f); // Prevent div by zero

            if (Score > BestScore)
            {
                BestScore = Score;
                BestIndex = i;
            }
        }
    }

    if (BestIndex != -1)
    {
        OutTargetWeaponLocation = AvailableWeaponLocations[BestIndex];
        bFoundWeapon = true;
    }
}
