#include "BannonCrowdHeatMemory.h"

void UBannonCrowdHeatMemory::RegisterBetrayalEvent(const FString& WrestlerID, const FString& VictimID, TArray<FCrowdMemoryEvent>& EventHistory)
{
    // MDickie-style persistent universe memory. Betraying a tag partner generates massive heat.
    FCrowdMemoryEvent NewEvent;
    NewEvent.EventDescription = FString::Printf(TEXT("Betrayed %s with a steel chair"), *VictimID);
    NewEvent.HeatImpact = -85.0f; // Massive heel heat
    NewEvent.WeeksAgo = 0; // Just happened

    EventHistory.Add(NewEvent);
}

void UBannonCrowdHeatMemory::CalculateCurrentAudienceAlignment(TArray<FCrowdMemoryEvent>& EventHistory, float& OutCurrentHeatMatrix, FString& OutCrowdReactionType)
{
    // Aggregates all historical events for this wrestler, applying an exponential decay algorithm.
    // The crowd eventually forgives old betrayals (decaying memory), but recent acts heavily influence their boos/cheers.
    float TotalHeat = 0.0f;

    for (FCrowdMemoryEvent& Event : EventHistory)
    {
        // Decay formula: Heat loses 10% of its impact each week. (0.9^Weeks)
        float DecayedHeat = Event.HeatImpact * FMath::Pow(0.9f, (float)Event.WeeksAgo);
        TotalHeat += DecayedHeat;
        
        // Age the event for the next evaluation
        Event.WeeksAgo++;
    }

    OutCurrentHeatMatrix = FMath::Clamp(TotalHeat, -100.0f, 100.0f);

    if (OutCurrentHeatMatrix <= -50.0f)
    {
        OutCrowdReactionType = TEXT("NuclearBoos");
    }
    else if (OutCurrentHeatMatrix >= 50.0f)
    {
        OutCrowdReactionType = TEXT("ThunderousCheers");
    }
    else
    {
        OutCrowdReactionType = TEXT("MixedReaction"); // Apathetic or divided crowd
    }
}
