#include "BannonFactionLogic.h"

void UBannonFactionLogic::EvaluateRunInInterference(const FString& FactionID, float FactionLoyalty, float AllyHealth, bool& bTriggerRunIn)
{
    // Stable Logic: Group AI clustering causing allies to procedurally stream into the arena and interfere.
    bTriggerRunIn = false;

    // Only valid factions with high loyalty will bother to run in.
    if (FactionID != TEXT("None") && FactionLoyalty > 60.0f)
    {
        // If the ally's health drops into the danger zone, the faction member rushes the ring.
        if (AllyHealth < 35.0f)
        {
            bTriggerRunIn = true;
        }
    }
}
