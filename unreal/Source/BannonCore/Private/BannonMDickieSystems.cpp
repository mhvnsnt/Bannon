#include "BannonMDickieSystems.h"

void UBannonMDickieSystems::ApplyMDickieStats(const FString& CharacterName, const FMDickieStats& LegacyStats)
{
    // Convert 1-99 MDickie stat scale into Unreal Engine Gameplay Ability System (GAS) Attributes
    // Popularity affects Crowd Heat generation.
    // Attitude affects promo choices (Heel vs Face tendencies).
    // The core physical stats map to health, damage multipliers, and animation speed.
}

void UBannonMDickieSystems::CalculateLimbDamage(float BaseDamage, bool bIsSubmission, float& LeftArm, float& RightArm, float& LeftLeg, float& RightLeg, float& Core, float& Head)
{
    // Replicating MDickie's targeted limb damage system
    // e.g. A Figure Four applies damage to the Left Leg and Right Leg.
    // When a limb reaches 0 health, it triggers an injury state or forces an automatic submission.
    
    if (bIsSubmission) {
        Core -= (BaseDamage * 1.5f);
    } else {
        Head -= BaseDamage;
        Core -= BaseDamage;
    }
}
