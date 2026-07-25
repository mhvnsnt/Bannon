#include "BannonContextualPropSpawner.h"

void UBannonContextualPropSpawner::DeterminePropSpawnTable(const FString& EnvironmentZone, TArray<FString>& OutPropSpawnList)
{
    // Dynamically loads interactive props based on the sandbox zone to mimic MDickie's chaotic environments.
    OutPropSpawnList.Empty();

    if (EnvironmentZone == TEXT("ParkingLot"))
    {
        OutPropSpawnList.Add(TEXT("TrafficCone"));
        OutPropSpawnList.Add(TEXT("Dumpster"));
        OutPropSpawnList.Add(TEXT("Tire"));
    }
    else if (EnvironmentZone == TEXT("Catering"))
    {
        OutPropSpawnList.Add(TEXT("WaterBottle"));
        OutPropSpawnList.Add(TEXT("FoldingTable"));
        OutPropSpawnList.Add(TEXT("HotCoffee"));
    }
    else if (EnvironmentZone == TEXT("RingSide"))
    {
        OutPropSpawnList.Add(TEXT("SteelChair"));
        OutPropSpawnList.Add(TEXT("Sledgehammer"));
        OutPropSpawnList.Add(TEXT("KendoStick"));
        OutPropSpawnList.Add(TEXT("RingBell"));
    }
    else
    {
        // Default generic backstage props
        OutPropSpawnList.Add(TEXT("CardboardBox"));
        OutPropSpawnList.Add(TEXT("FireExtinguisher"));
    }
}
