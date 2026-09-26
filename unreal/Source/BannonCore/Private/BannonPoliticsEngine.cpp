#include "BannonPoliticsEngine.h"

void UBannonPoliticsEngine::EvaluateJobberMoralePenalty(FBannonRelationship& Rel, float OpponentHeat, float PlayerHeat)
{
    // If you have high heat but are booked to lose to someone with low heat, morale tanks
    if (PlayerHeat > OpponentHeat + 0.3f)
    {
        Rel.Morale -= 0.15f;
    }
}

void UBannonPoliticsEngine::TriggerMidMatchBetrayal(FBannonRelationship& Rel, const FString& PartnerID)
{
    // Remove from friends, add to enemies instantly
    Rel.Friends.Remove(PartnerID);
    Rel.Enemies.AddUnique(PartnerID);
    
    // Invert face/heel alignment if appropriate
    Rel.FaceHeelAlignment = 1.0f - Rel.FaceHeelAlignment;
}
