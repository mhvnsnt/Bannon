#include "BannonFactionSystem.h"

void UBannonFactionSystem::EvaluateFactionLoyalty(FFactionData& Faction, const FString& EventTrigger, TArray<FString>& OutDefectors)
{
    OutDefectors.Empty();
    
    // Simulates the volatile faction changes, betrayals, and schisms native to the Bannon universe.
    if (EventTrigger == "Corporate Takeover" || EventTrigger == "Logistical Strike")
    {
        // Factions fragment under corporate/financial pressure if loyalty wasn't structurally sound
        if(Faction.Cohesion < 50.0f && Faction.ActiveMembers.Num() > 0)
        {
            OutDefectors.Add(Faction.ActiveMembers[Faction.ActiveMembers.Num() - 1]);
            Faction.ActiveMembers.RemoveAt(Faction.ActiveMembers.Num() - 1);
            Faction.Cohesion -= 10.0f;
        }
    }
    else if (EventTrigger == "Supernatural Threat" || EventTrigger == "Mainland Invasion")
    {
        // Forces temporary alliances against larger threats, boosting internal cohesion
        Faction.Cohesion = FMath::Clamp(Faction.Cohesion + 20.0f, 0.0f, 100.0f);
    }
}
