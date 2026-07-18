#include "BannonMultiThreatAI.h"

int32 UBannonMultiThreatAI::DeterminePrimaryTargetIndex(const TArray<float>& ThreatHealths, const TArray<float>& ThreatDistances)
{
    // In a Triple Threat or 4-Way match, AI dynamically calculates the biggest threat
    // Prioritizing the closest target OR the one closest to winning (highest health / momentum)
    if (ThreatHealths.Num() == 0 || ThreatHealths.Num() != ThreatDistances.Num()) return -1;

    int32 BestTargetIdx = 0;
    float HighestThreatScore = -1.0f;

    for (int32 i = 0; i < ThreatHealths.Num(); i++)
    {
        // Lower distance = higher threat, higher health = higher threat
        float DistanceScore = FMath::Clamp(1000.0f - ThreatDistances[i], 0.0f, 1000.0f);
        float HealthScore = ThreatHealths[i]; 
        
        float TotalThreat = (DistanceScore * 0.6f) + (HealthScore * 0.4f);
        
        if (TotalThreat > HighestThreatScore)
        {
            HighestThreatScore = TotalThreat;
            BestTargetIdx = i;
        }
    }
    
    return BestTargetIdx;
}
