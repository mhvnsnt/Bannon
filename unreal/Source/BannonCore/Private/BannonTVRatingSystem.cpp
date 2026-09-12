#include "BannonTVRatingSystem.h"

void UBannonTVRatingSystem::CalculateMatchRating(int32 UniquePhysicsEvents, int32 NearFalls, bool bFirstBloodSpilled, float& OutStarRating)
{
    // Match quality (physics variety, near falls, blood) determines show ratings and budget.
    float BaseRating = 1.0f; // 1 star base
    
    BaseRating += (UniquePhysicsEvents * 0.1f);
    BaseRating += (NearFalls * 0.5f);
    
    if (bFirstBloodSpilled)
    {
        BaseRating += 0.5f; // Blood adds drama/rating boost
    }
    
    OutStarRating = FMath::Clamp(BaseRating, 0.0f, 5.0f);
}
