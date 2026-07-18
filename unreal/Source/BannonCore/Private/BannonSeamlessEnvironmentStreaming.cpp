#include "BannonSeamlessEnvironmentStreaming.h"

void UBannonSeamlessEnvironmentStreaming::EvaluateStreamingZone(const FVector& PlayerLocation, const TMap<FString, FBox>& ZoneBounds, TArray<FString>& OutLevelsToLoad, TArray<FString>& OutLevelsToUnload)
{
    // MDickie-style free-roaming: dynamically streams adjacent map sectors (e.g., Arena to Backstage to Parking Lot).
    OutLevelsToLoad.Empty();
    OutLevelsToUnload.Empty();

    float PreloadDistance = 2000.0f; // 20 meters preload buffer
    float UnloadDistance = 5000.0f;  // 50 meters unload buffer

    for (const TPair<FString, FBox>& Zone : ZoneBounds)
    {
        float DistanceToZone = Zone.Value.ComputeSquaredDistanceToPoint(PlayerLocation);

        if (DistanceToZone <= (PreloadDistance * PreloadDistance))
        {
            OutLevelsToLoad.Add(Zone.Key);
        }
        else if (DistanceToZone > (UnloadDistance * UnloadDistance))
        {
            OutLevelsToUnload.Add(Zone.Key);
        }
    }
}
