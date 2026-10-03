#include "BannonFederationDraft.h"

void UBannonFederationDraft::EvaluateDraftPick(const TArray<FString>& AvailableRoster, float FederationBudget, FString& OutSelectedWrestler)
{
    // MDickie style drafting logic: AI logically drafts rosters based on archetype synergy and budget.
    if (AvailableRoster.Num() > 0)
    {
        // Simplified random pick for now, but conceptually prioritizes stars if budget allows
        int32 RandomIndex = FMath::RandRange(0, AvailableRoster.Num() - 1);
        OutSelectedWrestler = AvailableRoster[RandomIndex];
    }
}
