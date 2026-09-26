#include "BannonLocationalDamage.h"

void UBannonLocationalDamage::InitializeLimbs()
{
    LimbStates.Add(TEXT("Head"), {100.0f, false});
    LimbStates.Add(TEXT("Torso"), {100.0f, false});
    LimbStates.Add(TEXT("LeftArm"), {100.0f, false});
    LimbStates.Add(TEXT("RightArm"), {100.0f, false});
    LimbStates.Add(TEXT("LeftLeg"), {100.0f, false});
    LimbStates.Add(TEXT("RightLeg"), {100.0f, false});
}

void UBannonLocationalDamage::ApplyLocalizedDamage(FName BoneName, float DamageAmount)
{
    if (FBannonLimbState* Limb = LimbStates.Find(BoneName))
    {
        // Apply strict DMG_SCALE = 8.0 baseline from Bannon constants
        Limb->Integrity -= (DamageAmount / 8.0f); 
        if (Limb->Integrity <= 0.0f)
        {
            Limb->Integrity = 0.0f;
            Limb->bIsFractured = true;
        }
    }
}

float UBannonLocationalDamage::GetMobilityPenalty()
{
    float Penalty = 1.0f;
    // Drops MAX_BODY_VEL multiplier based on leg structural integrity
    if (LimbStates.Contains(TEXT("LeftLeg")) && LimbStates[TEXT("LeftLeg")].bIsFractured) Penalty *= 0.5f;
    if (LimbStates.Contains(TEXT("RightLeg")) && LimbStates[TEXT("RightLeg")].bIsFractured) Penalty *= 0.5f;
    return Penalty; 
}
