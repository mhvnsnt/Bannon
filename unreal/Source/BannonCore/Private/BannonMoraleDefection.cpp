#include "BannonMoraleDefection.h"

void UBannonMoraleDefection::EvaluateMoraleDefection(int32 DaysOffTV, float CurrentMorale, float RivalOfferMultiplier, bool& bWillDefect)
{
    // MDickie Legacy: Morale drops if kept off TV. Low morale + good rival offer = defection.
    float DefectionThreshold = 30.0f; // Below 30 morale is dangerous
    if (DaysOffTV > 14 && CurrentMorale < DefectionThreshold)
    {
        float DefectChance = (DefectionThreshold - CurrentMorale) * RivalOfferMultiplier;
        bWillDefect = (FMath::RandRange(0.0f, 100.0f) < DefectChance);
    }
    else
    {
        bWillDefect = false;
    }
}
