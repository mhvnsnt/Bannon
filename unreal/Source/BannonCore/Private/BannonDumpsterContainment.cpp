#include "BannonDumpsterContainment.h"

void UBannonDumpsterContainment::ProcessContainerImpact(const FVector& WrestlerVelocity, float ContainerDepth, bool& bIsTrappedInside, FVector& OutCameraOffset)
{
    // Procedural logic for throwing a character into a confined physics space.
    // If the Z velocity is negative (falling downward) into the container bounds:
    if (WrestlerVelocity.Z < -100.0f && ContainerDepth > 50.0f)
    {
        bIsTrappedInside = true;
        
        // Shifts the camera upward to look down into the dumpster/casket
        OutCameraOffset = FVector(0.0f, 0.0f, ContainerDepth + 150.0f); 
    }
    else
    {
        bIsTrappedInside = false;
        OutCameraOffset = FVector::ZeroVector;
    }
}
