#include "BannonFatiguePosture.h"

void UBannonFatiguePosture::CalculateSpineDeformation(float CurrentStamina, float MaxStamina, float& SpineSlumpPitch)
{
    // Fatigue Posture Deformation: Spine sways and shoulders slump dynamically as stamina empties.
    // This feeds directly into the AnimBP additive skeletal controls.
    float StaminaPercentage = CurrentStamina / FMath::Max(MaxStamina, 1.0f);
    
    if (StaminaPercentage < 0.3f)
    {
        // Inverse relationship: lower stamina = higher forward pitch (slumping)
        // Max slump at 0 stamina is +25.0 degrees on the spine bone
        SpineSlumpPitch = FMath::Lerp(25.0f, 0.0f, StaminaPercentage / 0.3f);
    }
    else
    {
        SpineSlumpPitch = 0.0f; // Perfect posture
    }
}
