#include "BannonDynamicMatchBooking.h"

void UBannonDynamicMatchBooking::GeneratePPVMainEvent(const TMap<FString, float>& RivalryIntensityMatrix, FString& OutWrestlerA, FString& OutWrestlerB, FString& OutStipulation)
{
    // Scans faction matrix for highest intensity rivalries to book the main event.
    // In this stub, keys are expected as "WrestlerA_vs_WrestlerB"
    
    float HighestIntensity = -100.0f; // Represents maximum hate
    FString BestMatchup = TEXT("");
    
    for (const TPair<FString, float>& Pair : RivalryIntensityMatrix)
    {
        // Finding the rivalry with the most negative value (highest hatred/intensity)
        if (Pair.Value < HighestIntensity)
        {
            HighestIntensity = Pair.Value;
            BestMatchup = Pair.Key;
        }
    }
    
    if (!BestMatchup.IsEmpty())
    {
        TArray<FString> Combatants;
        BestMatchup.ParseIntoArray(Combatants, TEXT("_vs_"), true);
        
        if (Combatants.Num() == 2)
        {
            OutWrestlerA = Combatants[0];
            OutWrestlerB = Combatants[1];
            
            // Blood feuds (intensity < -80) get extreme stipulations
            if (HighestIntensity <= -80.0f)
            {
                OutStipulation = TEXT("Hell in a Cell");
            }
            else if (HighestIntensity <= -50.0f)
            {
                OutStipulation = TEXT("No Holds Barred");
            }
            else
            {
                OutStipulation = TEXT("Standard Match");
            }
        }
    }
    else
    {
        OutWrestlerA = TEXT("Champion");
        OutWrestlerB = TEXT("Number One Contender");
        OutStipulation = TEXT("Standard Match");
    }
}
