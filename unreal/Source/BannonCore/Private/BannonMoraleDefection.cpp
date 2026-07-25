#include "BannonMoraleDefection.h"

void UBannonMoraleDefection::EvaluateDefectionRisk(float WrestlerMorale, int32 WeeksOffTV, bool& bWillDefectToRival)
{
    // MDickie-style federation jumping. If a wrestler is kept off TV and morale drops, they will jump ship.
    if (WrestlerMorale < 30.0f && WeeksOffTV > 4)
    {
        // 50% chance to jump ship if disgruntled and ignored
        bWillDefectToRival = (FMath::RandRange(0, 100) < 50);
    }
    else if (WrestlerMorale < 10.0f)
    {
        // Guaranteed defection if completely miserable
        bWillDefectToRival = true;
    }
    else
    {
        bWillDefectToRival = false;
    }
}
