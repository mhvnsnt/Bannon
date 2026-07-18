#include "BannonEnvironmentalTrap.h"

void UBannonEnvironmentalTrap::TriggerTrapReaction(EBannonTrapType TrapType, float ImpactForce, float& ResultingDamage, FString& StatusEffect)
{
    // Contextual environment reactions based on high-velocity bumps into specific backstage props
    if (ImpactForce < 800.0f) return; // Must be a significant throw/Irish Whip

    switch (TrapType)
    {
        case EBannonTrapType::ElectricalPanel:
            ResultingDamage = 1500.0f;
            StatusEffect = TEXT("Electrocuted_Stun");
            break;
        case EBannonTrapType::VendingMachine:
            ResultingDamage = 800.0f;
            StatusEffect = TEXT("Crushed_Leg");
            break;
        case EBannonTrapType::Dumpster:
            ResultingDamage = 200.0f;
            StatusEffect = TEXT("Contained_In_Object");
            break;
        case EBannonTrapType::GlassWindow:
            ResultingDamage = 1200.0f;
            StatusEffect = TEXT("Severe_Laceration");
            break;
    }
}
