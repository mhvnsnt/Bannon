#include "BannonChampionshipManager.h"

void UBannonChampionshipManager::TransferTitle(const FString& NewChampion, bool bIsScrewjob, FTitleHistory& TitleData)
{
    // Manages title changes, accounting for volatile "screwjob" finishes (e.g., Salvation Screwjob, New Hampshire Screwjob)
    TitleData.CurrentChampion = NewChampion;
    TitleData.DaysHeld = 0;
    
    if (bIsScrewjob)
    {
        // Immediately de-sanctions the title locally to trigger narrative revolt events, reflecting Book 6 logic
        TitleData.bIsSanctioned = false;
    }
    else
    {
        TitleData.bIsSanctioned = true;
    }
}
