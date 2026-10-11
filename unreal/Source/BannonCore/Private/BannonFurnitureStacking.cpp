#include "BannonFurnitureStacking.h"

void UBannonFurnitureStacking::EvaluateStackStability(int32 StackedObjectCount, float CombinedMass, bool& bWillCollapse)
{
    // Classic MDickie Wrestling Mpire furniture stacking physics
    // Allows stacking multiple tables/chairs, but evaluates structural stability
    if (StackedObjectCount > 3 || CombinedMass > 200.0f)
    {
        // High probability of procedural collapse
        bWillCollapse = (FMath::RandRange(0, 100) > 40);
    }
    else
    {
        bWillCollapse = false;
    }
}
