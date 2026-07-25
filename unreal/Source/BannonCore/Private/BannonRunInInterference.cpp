#include "BannonRunInInterference.h"

void UBannonRunInInterference::CalculateInterferenceProbability(float MatchHeat, bool bRefIsDown, float FactionLoyalty, bool& bWillInterfere)
{
    // Evaluates if an ally will dynamically run into the arena based on MDickie logic
    float BaseChance = 10.0f; // 10% base chance

    if (bRefIsDown)
    {
        BaseChance += 40.0f; // Massive increase if the ref is bumped (physics object incapacitated)
    }

    BaseChance += (MatchHeat * 0.2f);
    BaseChance += (FactionLoyalty * 0.3f);

    bWillInterfere = (FMath::RandRange(0.0f, 100.0f) < BaseChance);
}
