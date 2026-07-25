#include "BannonAICowardiceMatrix.h"

void UBannonAICowardiceMatrix::DetermineFlightResponse(float CurrentHealth, float CourageStat, bool bFacingMultipleOpponents, bool& bWillFlee)
{
    // AI behavioral sliders determining flight vs fight response
    float FleeThreshold = 100.0f - CourageStat; // 99 courage means threshold is 1 (never flees). 10 courage means threshold is 90 (flees easily).

    if (CurrentHealth < FleeThreshold)
    {
        bWillFlee = true;
    }
    else if (bFacingMultipleOpponents && CourageStat < 50.0f)
    {
        bWillFlee = true; // Cowards run when outnumbered regardless of health
    }
    else
    {
        bWillFlee = false;
    }
}
