#include "BannonFuneralLogistics.h"

void UBannonFuneralLogistics::EvaluateLethalDamage(float TotalTrauma, const FString& WrestlerName, bool& bIsFatal, FString& OutMemorialEventName)
{
    // The legendary MDickie fatality system: characters can actually die in the sandbox.
    float FatalThreshold = 50000.0f; // Extreme sandbox trauma (trains, explosions, etc.)
    
    if (TotalTrauma > FatalThreshold)
    {
        bIsFatal = true;
        OutMemorialEventName = WrestlerName + TEXT(" Memorial Show"); // Next week's TV event is renamed
    }
    else
    {
        bIsFatal = false;
        OutMemorialEventName = TEXT("");
    }
}
