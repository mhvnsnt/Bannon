#include "BannonMedicalTrauma.h"

void UBannonMedicalTrauma::ApplyTargetedTrauma(EBannonLimb TargetLimb, float DamageAmount, float& LacerationLevel, bool& bIsDislocated)
{
    // 5% chance per heavy strike to cause a severe laceration (bleeding)
    if (DamageAmount > 300.0f && FMath::RandRange(0, 100) > 95)
    {
        LacerationLevel += 25.0f; // Increase blood mask intensity
    }

    // Joint dislocation logic for limbs exceeding physics constraints (Submissions)
    if ((TargetLimb == EBannonLimb::LeftArm || TargetLimb == EBannonLimb::RightArm || TargetLimb == EBannonLimb::LeftLeg || TargetLimb == EBannonLimb::RightLeg) && DamageAmount > 2000.0f)
    {
        bIsDislocated = true; // Triggers permanent IK limping/dangling limb for the remainder of the match
    }
}

void UBannonMedicalTrauma::CalculateFirstBlood(float CurrentLaceration, bool& bMatchTerminated)
{
    if (CurrentLaceration >= 100.0f)
    {
        bMatchTerminated = true; // If First Blood rules are active, ring the bell
    }
}
