#include "BannonMatchCardBooking.h"

void UBannonMatchCardBooking::GenerateMainEvent(const TArray<FString>& ActiveRivalries, float PPVImportance, FString& OutMainEventMatchup)
{
    // Auto-generates PPV main events based on underlying rivalry matrices
    if (ActiveRivalries.Num() > 0)
    {
        // In a full implementation, we'd sort by heat/importance. 
        // For MDickie style chaos, we just take a top rivalry and maybe add a gimmick.
        FString SelectedRivalry = ActiveRivalries[0]; 
        if (PPVImportance > 80.0f)
        {
            OutMainEventMatchup = SelectedRivalry + TEXT(" (No Holds Barred)");
        }
        else
        {
            OutMainEventMatchup = SelectedRivalry;
        }
    }
}
