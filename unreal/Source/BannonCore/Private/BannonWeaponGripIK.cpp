#include "BannonWeaponGripIK.h"

void UBannonWeaponGripIK::CalculateProceduralGrip(const FVector& ObjectCenter, const FVector& ObjectBounds, bool bIsDualWielding, FTransform& OutLeftHandIK, FTransform& OutRightHandIK)
{
    // Procedural hand IK attachment for picking up any object regardless of shape (MDickie style).
    // Calculates offset bounds to snap the hands realistically.
    
    // Default single-wield heavy object (like a monitor or garbage can)
    FVector RightHandPos = ObjectCenter + FVector(0.0f, ObjectBounds.Y * 0.8f, 0.0f);
    FVector LeftHandPos = ObjectCenter - FVector(0.0f, ObjectBounds.Y * 0.8f, 0.0f);

    OutRightHandIK.SetLocation(RightHandPos);
    
    if (bIsDualWielding)
    {
        // If dual wielding (e.g. holding two separate light weapons), left hand IK operates independently on the second object.
        // For this function context, we treat it as releasing the left hand constraint from the primary object.
        OutLeftHandIK.SetLocation(FVector::ZeroVector); // Signals standard animation loop for left hand
    }
    else
    {
        OutLeftHandIK.SetLocation(LeftHandPos);
    }

    OutRightHandIK.SetRotation(FQuat::Identity);
    OutLeftHandIK.SetRotation(FQuat::Identity);
}
