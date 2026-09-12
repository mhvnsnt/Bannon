#include "BannonFatiguePosture.h"

void UBannonFatiguePosture::CalculatePostureDeformation(float CurrentStamina, float MaxStamina, float& OutSpineSlumpAlpha, float& OutBreathingIntensity)
{
    // Advanced Medical/Fatigue Systems: Posture Deformation.
    // As the stamina pool empties, the spine physically slumps via Animation Blueprint Control Rig.
    float StaminaPercentage = CurrentStamina / FMath::Max(MaxStamina, 1.0f);

    // If stamina drops below 40%, the character starts to heavily slump forward.
    if (StaminaPercentage < 0.40f)
    {
        OutSpineSlumpAlpha = (0.40f - StaminaPercentage) * 2.5f; // Scales from 0.0 to 1.0 slump factor
        OutBreathingIntensity = 1.0f + ((0.40f - StaminaPercentage) * 5.0f); // Deep, labored chest heaving
    }
    else
    {
        OutSpineSlumpAlpha = 0.0f; // Perfect posture
        OutBreathingIntensity = 1.0f; // Normal breathing
    }
}
