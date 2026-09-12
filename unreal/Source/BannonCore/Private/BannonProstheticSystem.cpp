#include "BannonProstheticSystem.h"

void UBannonProstheticSystem::AttachProstheticLimb(const FString& AmputatedBone, FString& OutProstheticMesh, float& OutAgilityPenalty, float& OutStrikeDamageBonus)
{
    // Expands the legacy amputation/dismemberment mechanics. 
    // If a wrestler survives a lethal train/explosive event, they return with a prosthetic limb.
    
    if (AmputatedBone.Contains(TEXT("Arm")))
    {
        OutProstheticMesh = TEXT("SM_BionicArm_Iron");
        OutAgilityPenalty = 10.0f; // Heavier, less agile
        OutStrikeDamageBonus = 25.0f; // Striking with a metal arm does significantly more damage (counts as a weapon)
    }
    else if (AmputatedBone.Contains(TEXT("Leg")))
    {
        OutProstheticMesh = TEXT("SM_PegLeg_Steel");
        OutAgilityPenalty = 25.0f; // Movement is heavily restricted
        OutStrikeDamageBonus = 15.0f; // Kicks do more damage
    }
    else
    {
        OutProstheticMesh = TEXT("");
        OutAgilityPenalty = 0.0f;
        OutStrikeDamageBonus = 0.0f;
    }
}
