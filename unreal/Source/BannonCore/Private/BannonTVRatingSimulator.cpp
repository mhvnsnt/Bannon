#include "BannonTVRatingSimulator.h"

void UBannonTVRatingSimulator::CalculateMatchRating(int32 UniqueMovesUsed, bool bBloodDrawn, int32 TotalNearFalls, float& OutMatchRating)
{
    // Base rating
    float BaseScore = 50.0f;
    
    // Variety adds up to 25 points
    float VarietyBonus = FMath::Clamp(UniqueMovesUsed * 1.5f, 0.0f, 25.0f);
    
    // Blood adds dramatic effect
    float BloodBonus = bBloodDrawn ? 10.0f : 0.0f;
    
    // Near falls build tension
    float TensionBonus = FMath::Clamp(TotalNearFalls * 5.0f, 0.0f, 15.0f);
    
    OutMatchRating = BaseScore + VarietyBonus + BloodBonus + TensionBonus;
    OutMatchRating = FMath::Clamp(OutMatchRating, 0.0f, 100.0f);
}

void UBannonTVRatingSimulator::ProcessShowRating(float AverageMatchRating, float BaseBudget, float& OutNewBudget)
{
    // Ties television rating success to operational budget
    // Ratings > 75% increase the budget for pyrotechnics and props
    // Ratings < 50% reduce the budget
    
    float BudgetMultiplier = 1.0f;
    
    if (AverageMatchRating >= 90.0f)
    {
        BudgetMultiplier = 1.5f; // Huge success
    }
    else if (AverageMatchRating >= 75.0f)
    {
        BudgetMultiplier = 1.2f;
    }
    else if (AverageMatchRating < 50.0f)
    {
        BudgetMultiplier = 0.8f; // Losing money
    }
    else if (AverageMatchRating < 30.0f)
    {
        BudgetMultiplier = 0.5f; // Disastrous show
    }
    
    OutNewBudget = BaseBudget * BudgetMultiplier;
}
