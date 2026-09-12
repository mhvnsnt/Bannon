#include "BannonStaminaConservationLogic.h"

void UBannonStaminaConservationLogic::EvaluateRolloutNeed(float CurrentStamina, float MaxStamina, float OpponentDistance, bool& bShouldRollOutOfRing)
{
    // Stamina Conservation Logic: AI pacing themselves, rolling out of the ring to catch their breath.
    bShouldRollOutOfRing = false;

    float StaminaPercentage = CurrentStamina / FMath::Max(MaxStamina, 1.0f);

    // If stamina drops to critical levels (under 15%)
    if (StaminaPercentage < 0.15f)
    {
        // And the opponent gives them some space (or is down)
        if (OpponentDistance > 300.0f)
        {
            bShouldRollOutOfRing = true; // Strategic retreat to regain breath
        }
    }
}
