#include "BannonTitleLineage.h"

void UBannonTitleLineage::UpdateTitleLineage(const FString& BeltID, const FString& NewChampionID, TMap<FString, FTitleReignRecord>& CurrentChampions, TArray<FTitleReignRecord>& HistoricalLedger)
{
    // Immutable ledger tracking who held what belt, for how long, and how many defenses.
    // When a title changes hands, the old reign is archived to the ledger.
    if (CurrentChampions.Contains(BeltID))
    {
        FTitleReignRecord OldReign = CurrentChampions[BeltID];
        HistoricalLedger.Add(OldReign); // Archive the previous champion's reign
    }
    
    // Establish the new champion
    FTitleReignRecord NewReign;
    NewReign.ChampionID = NewChampionID;
    NewReign.DaysHeld = 0;
    NewReign.Defenses = 0;
    
    CurrentChampions.Add(BeltID, NewReign);
}
