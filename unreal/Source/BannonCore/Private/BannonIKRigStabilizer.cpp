#include "BannonIKRigStabilizer.h"

void UBannonIKRigStabilizer::CalculateIKFloorOffset(float ActualFloorZ, float FootBoneZ, float& IKOffsetZ)
{
    // Prevents fighters' feet from sinking into the canvas or hovering, 
    // a common visual bug when importing legacy animation data
    if (FootBoneZ < ActualFloorZ)
    {
        IKOffsetZ = ActualFloorZ - FootBoneZ; // Push foot up to exact surface contact
    }
    else
    {
        IKOffsetZ = 0.0f; 
    }
}

void UBannonIKRigStabilizer::SmoothShoulderTwist(float CurrentTwistAngle, float& CorrectedTwistAngle)
{
    // MDickie's legacy "Wrestling Mpire" lifting moves often caused shoulder joints to invert or pop
    // This logic clamps the twist to natural anatomical limits (-90 to 90 degrees) to fix deprecated skeletal meshes
    CorrectedTwistAngle = FMath::Clamp(CurrentTwistAngle, -90.0f, 90.0f);
}
