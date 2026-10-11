#include "BannonGLBModelValidator.h"

void UBannonGLBModelValidator::ValidateModelOrientation(const FVector& BoundingBoxMin, const FVector& BoundingBoxMax, const FVector& RootBoneLocation, bool& bNeedsReorientation, FVector& OutCorrectionOffset)
{
    // Batch-verify imported GLB orientation/position — loads banked models and measures height, grounding, and centering.
    bNeedsReorientation = false;
    OutCorrectionOffset = FVector::ZeroVector;

    // Check Z Grounding: Is the root bone floating or buried?
    // Tolerance of 5 units.
    if (FMath::Abs(RootBoneLocation.Z) > 5.0f)
    {
        bNeedsReorientation = true;
        OutCorrectionOffset.Z = -RootBoneLocation.Z;
    }

    // Check Centering: X and Y bounds should be roughly symmetrical around 0.
    float CenterX = (BoundingBoxMin.X + BoundingBoxMax.X) * 0.5f;
    float CenterY = (BoundingBoxMin.Y + BoundingBoxMax.Y) * 0.5f;

    if (FMath::Abs(CenterX) > 5.0f || FMath::Abs(CenterY) > 5.0f)
    {
        bNeedsReorientation = true;
        OutCorrectionOffset.X = -CenterX;
        OutCorrectionOffset.Y = -CenterY;
    }
}
