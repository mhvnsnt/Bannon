#include "BannonDesperationTriggers.h"

void UBannonDesperationTriggers::EvaluateDesperationState(float CurrentHealth, float MatchMomentum, bool& bWillAttemptHighRiskMove)
{
    // Brawler AI: Desperation Move Triggers
    // AI triggers high-risk aerial/springboard moves when their health is critical, 
    // overriding their normal safety boundaries in an attempt to turn the tide.
    
    if (CurrentHealth < 20.0f && MatchMomentum < 30.0f)
    {
        // Low health and losing the momentum battle = 75% chance to go for a desperation spot
        if (FMath::RandRange(0, 100) > 25)
        {
            bWillAttemptHighRiskMove = true;
        }
        else
        {
            bWillAttemptHighRiskMove = false;
        }
    }
    else
    {
        bWillAttemptHighRiskMove = false;
    }
}
