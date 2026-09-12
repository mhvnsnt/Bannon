#include "BannonMoveDegradation.h"

void UBannonMoveDegradation::CalculateExhaustedImpulse(float BaseImpulse, float CurrentStamina, float& OutDegradedImpulse, bool& bMoveFailed)
{
    // MDickie logic: Low stamina makes your moves weak and sloppy.
    // Extremely low stamina can cause a move (like a lifting suplex) to collapse mid-animation.
    if (CurrentStamina < 10.0f)
    {
        OutDegradedImpulse = BaseImpulse * 0.2f;
        
        // 50% chance the wrestler just collapses under the weight
        bMoveFailed = (FMath::RandRange(0, 100) < 50); 
    }
    else
    {
        float StaminaFactor = CurrentStamina / 100.0f; // Assuming max stamina is 100
        OutDegradedImpulse = BaseImpulse * FMath::Max(0.5f, StaminaFactor); // Moves never drop below 50% effectiveness unless critical
        bMoveFailed = false;
    }
}
