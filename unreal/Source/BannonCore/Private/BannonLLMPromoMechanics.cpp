#include "BannonLLMPromoMechanics.h"

void UBannonLLMPromoMechanics::ScorePromoSentiment(const FString& LLMAnalysisSentiment, float SpeakerCharisma, float& OutMomentumBoost, bool& bCrowdTurnsHostile)
{
    // Analyzes LLM sentiment to dynamically alter match momentum before the bell rings.
    if (LLMAnalysisSentiment.Contains(TEXT("Devastating")) || LLMAnalysisSentiment.Contains(TEXT("Fire")))
    {
        OutMomentumBoost = SpeakerCharisma * 0.5f; // Huge momentum swing for a great promo
        bCrowdTurnsHostile = false;
    }
    else if (LLMAnalysisSentiment.Contains(TEXT("Boring")) || LLMAnalysisSentiment.Contains(TEXT("Awkward")))
    {
        OutMomentumBoost = -20.0f; // Lose momentum
        bCrowdTurnsHostile = true; // Crowd starts throwing trash
    }
    else
    {
        OutMomentumBoost = 10.0f;
        bCrowdTurnsHostile = false;
    }
}

void UBannonLLMPromoMechanics::ProcessMicInterrupt(float TargetAnger, float PromoLength, bool& bBrawlErupts)
{
    // If a promo drags on and the rival's anger is high, they interrupt it physically
    if (TargetAnger > 80.0f && PromoLength > 60.0f)
    {
        bBrawlErupts = true; // Transition from promo sandbox directly into a match/brawl
    }
    else
    {
        bBrawlErupts = false;
    }
}
