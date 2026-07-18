#include "BannonMatchRatingAlgorithm.h"

float UBannonMatchRatingAlgorithm::CalculateTVRating(int32 NearFalls, int32 HighImpactMoves, int32 BloodVolume, bool bIsChampionshipMatch, float CrowdHeat)
{
    // Evaluates match quality (physics variety, near falls, blood) to determine show ratings and budget.
    float BaseScore = 1.0f;
    
    float NearFallBonus = FMath::Clamp(NearFalls * 0.25f, 0.0f, 1.5f);
    float ActionBonus = FMath::Clamp(HighImpactMoves * 0.1f, 0.0f, 2.0f);
    float BloodBonus = FMath::Clamp(BloodVolume * 0.05f, 0.0f, 0.5f);
    
    float TotalScore = BaseScore + NearFallBonus + ActionBonus + BloodBonus;
    
    if (bIsChampionshipMatch)
    {
        TotalScore *= 1.2f;
    }
    
    // Crowd heat scales the final output
    TotalScore *= (1.0f + (CrowdHeat / 100.0f));
    
    return FMath::Clamp(TotalScore, 0.0f, 5.0f); // 5-Star scale
}
