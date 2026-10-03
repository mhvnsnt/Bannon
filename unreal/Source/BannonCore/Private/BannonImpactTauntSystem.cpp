#include "BannonImpactTauntSystem.h"

void UBannonImpactTauntSystem::EvaluateTauntImpact(const FString& TauntID, const FVector& PerformerLocation, const FVector& OpponentLocation, bool& bTriggersImpact, float& OutDamageDealt)
{
    // Handles taunts that double as moves (like Ginga capoeira strikes or Spinaroony).
    bTriggersImpact = false;
    OutDamageDealt = 0.0f;

    float Distance = FVector::Dist(PerformerLocation, OpponentLocation);

    // If the taunt has offensive hitboxes and the opponent is in range
    if ((TauntID == TEXT("Ginga") || TauntID == TEXT("SpinaroonySweep")) && Distance < 120.0f)
    {
        bTriggersImpact = true;
        
        if (TauntID == TEXT("Ginga"))
        {
            OutDamageDealt = 15.0f; // Quick capoeira strike
        }
        else if (TauntID == TEXT("SpinaroonySweep"))
        {
            OutDamageDealt = 20.0f; // Breakdance leg sweep
        }
    }
}
