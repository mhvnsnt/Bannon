#include "BannonWeaponDegradation.h"

void UBannonWeaponDegradation::ProcessWeaponImpact(float ImpactForce, float CurrentWeaponHealth, float& OutNewWeaponHealth, bool& bIsShattered)
{
    // Tracks structural damage for props like chairs and tables.
    // Massive impacts degrade health faster until the object triggers a Chaos physics shatter event.
    float DamageTaken = ImpactForce * 0.05f; 
    OutNewWeaponHealth = CurrentWeaponHealth - DamageTaken;

    if (OutNewWeaponHealth <= 0.0f)
    {
        bIsShattered = true; // Trigger Chaos fracture
        OutNewWeaponHealth = 0.0f;
    }
    else
    {
        bIsShattered = false; // Prop bends/dents but survives
    }
}
