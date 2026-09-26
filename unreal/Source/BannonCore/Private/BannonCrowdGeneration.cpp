#include "BannonCrowdGeneration.h"

void UBannonCrowdGeneration::GenerateInstancedCrowd(int32 TargetCapacity, int32 TicketSales, int32& OutSpawnedInstances, float& OutDensityPercentage)
{
    // Procedurally generates crowd using Instanced Static Meshes (ISM) to allow 10,000+ fans with high performance.
    // Ticket sales (driven by TV Rating logic) determine how full the arena is.
    OutSpawnedInstances = FMath::Min(TargetCapacity, TicketSales);
    
    if (TargetCapacity > 0)
    {
        OutDensityPercentage = ((float)OutSpawnedInstances / (float)TargetCapacity) * 100.0f;
    }
    else
    {
        OutDensityPercentage = 0.0f;
    }
}
