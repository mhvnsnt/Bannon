#include "BannonWeaponDegradation.h"

void UBannonWeaponDegradation::ProcessWeaponImpact(float ImpactForce, bool& bWeaponDestroyed)
{
    // Weapons bend/break dynamically. A steel chair might withstand 3 impacts, a wooden table 1.
    StructuralIntegrity -= (ImpactForce * 0.005f);
    
    if (StructuralIntegrity <= 0.0f)
    {
        bWeaponDestroyed = true;
        // Trigger Chaos destruction logic to spawn fractured mesh pieces
    }
    else
    {
        bWeaponDestroyed = false;
        // Trigger morph target to bend the weapon visually (e.g. dented chair)
    }
}
