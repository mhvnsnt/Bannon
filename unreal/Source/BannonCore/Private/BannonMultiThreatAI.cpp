#include "BannonMultiThreatAI.h"

void UBannonMultiThreatAI::EvaluateHighestThreat(const TArray<FThreatData>& ActiveThreats, FString& OutPrimaryTargetID)
{
    // In multi-man matches (e.g., Fatal 4-Way), the AI dynamically calculates the biggest threat.
    float HighestThreatScore = -1.0f;
    OutPrimaryTargetID = TEXT("None");

    for (const FThreatData& Threat : ActiveThreats)
    {
        // Closer threats are more dangerous.
        float ProximityScore = FMath::Clamp(1000.0f - Threat.Distance, 0.0f, 1000.0f) * 0.1f;
        
        // Healthier threats are more dangerous in the long run.
        float HealthScore = Threat.Health * 0.5f;

        float TotalScore = ProximityScore + HealthScore;

        // If someone is actively throwing a strike/grapple, they become an immediate emergency priority.
        if (Threat.bIsCurrentlyAttacking && Threat.Distance < 300.0f)
        {
            TotalScore += 500.0f; 
        }

        if (TotalScore > HighestThreatScore)
        {
            HighestThreatScore = TotalScore;
            OutPrimaryTargetID = Threat.WrestlerID;
        }
    }
}
