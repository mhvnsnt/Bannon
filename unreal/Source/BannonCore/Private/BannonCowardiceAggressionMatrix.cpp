#include "BannonCowardiceAggressionMatrix.h"

void UBannonCowardiceAggressionMatrix::EvaluateFlightOrFight(float AggressionStat, float CurrentHealth, float OpponentMomentum, FString& OutTacticalDecision)
{
    // Cowardice vs. Aggression Matrix: Behavioral sliders that determine if AI runs away or presses the attack.
    // AggressionStat is 0-100. 0 = Cowardly Heel, 100 = Reckless Brawler.

    if (CurrentHealth < 40.0f && OpponentMomentum > 70.0f)
    {
        // Under heavy fire. Does the AI flee?
        if (AggressionStat < 40.0f)
        {
            OutTacticalDecision = TEXT("FleeRing"); // Cowards roll out of the ring to avoid taking a finisher
        }
        else
        {
            OutTacticalDecision = TEXT("StandAndTrade"); // Aggressive brawlers will stand their ground and trade blows
        }
    }
    else
    {
        OutTacticalDecision = TEXT("PressAttack"); // Default state if not in immediate danger
    }
}
