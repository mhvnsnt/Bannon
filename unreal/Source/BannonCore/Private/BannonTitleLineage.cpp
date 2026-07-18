#include "BannonTitleLineage.h"

void UBannonTitleLineage::TransferChampionship(const FString& NewChampion, const FString& OldChampion, int32 MatchDay, TMap<FString, int32>& TitleHistory)
{
    // Immutable ledger of who held what belt, and how many days.
    // Logs the change of hands directly into the map tracking days held or reign start dates.
    TitleHistory.Add(NewChampion, MatchDay);
}
