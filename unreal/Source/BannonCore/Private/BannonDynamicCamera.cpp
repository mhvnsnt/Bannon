#include "BannonDynamicCamera.h"

void UBannonDynamicCamera::CalculateFramingParameters(const TArray<FVector>& TargetLocations, float BaseFOV, FVector& OutCameraLocation, float& OutTargetFOV)
{
    // Dynamically adjusts camera framing based on the spread of active wrestlers
    if (TargetLocations.Num() == 0)
    {
        OutCameraLocation = FVector::ZeroVector;
        OutTargetFOV = BaseFOV;
        return;
    }

    FVector CenterMass = FVector::ZeroVector;
    float MaxDistanceSq = 0.0f;

    for (const FVector& Loc : TargetLocations)
    {
        CenterMass += Loc;
    }
    CenterMass /= TargetLocations.Num();

    for (const FVector& Loc : TargetLocations)
    {
        float DistSq = FVector::DistSquared(CenterMass, Loc);
        if (DistSq > MaxDistanceSq)
        {
            MaxDistanceSq = DistSq;
        }
    }

    // Pull camera back and widen FOV if characters are far apart (e.g. ringside brawling)
    float MaxDistance = FMath::Sqrt(MaxDistanceSq);
    
    // Simplistic framing math: Move camera back on Y axis
    OutCameraLocation = CenterMass + FVector(0.0f, MaxDistance * -1.5f - 500.0f, 250.0f);
    
    // Slightly expand FOV for extremely wide spreads
    OutTargetFOV = BaseFOV + (MaxDistance * 0.01f);
    OutTargetFOV = FMath::Clamp(OutTargetFOV, BaseFOV, 110.0f);
}
