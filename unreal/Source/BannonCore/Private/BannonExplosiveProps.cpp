#include "BannonExplosiveProps.h"

void UBannonExplosiveProps::CalculateExplosionImpulse(float BaseDamage, float DistanceFromCenter, float& OutPhysicsImpulse, bool& bIsDismembermentRisk)
{
    // Replicates MDickie's explosive prop physics (dynamite/C4/gas cans)
    // Applies massive radial impulse and checks for extreme dismemberment/gore events
    float MaxRadius = 1000.0f; // 10 meters
    
    if (DistanceFromCenter >= MaxRadius)
    {
        OutPhysicsImpulse = 0.0f;
        bIsDismembermentRisk = false;
        return;
    }
    
    float Falloff = 1.0f - (DistanceFromCenter / MaxRadius);
    OutPhysicsImpulse = (BaseDamage * 50.0f) * Falloff;
    
    // Extreme MDickie injury logic
    if (OutPhysicsImpulse > 25000.0f)
    {
        bIsDismembermentRisk = true; // Blows off a limb visually
    }
    else
    {
        bIsDismembermentRisk = false;
    }
}
