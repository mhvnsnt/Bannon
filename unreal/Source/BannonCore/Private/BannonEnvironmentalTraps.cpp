#include "BannonEnvironmentalTraps.h"

void UBannonEnvironmentalTraps::TriggerVendingMachineShatter(float WrestlerImpactVelocity, bool& bMachineShattered, float& OutElectricalDamage)
{
    // Environmental traps in the backstage areas.
    // If a wrestler is thrown into a vending machine with enough force, it shatters.
    
    if (WrestlerImpactVelocity > 500.0f)
    {
        bMachineShattered = true;
        OutElectricalDamage = (WrestlerImpactVelocity - 500.0f) * 0.1f; // Bonus shock damage
    }
    else
    {
        bMachineShattered = false;
        OutElectricalDamage = 0.0f;
    }
}
