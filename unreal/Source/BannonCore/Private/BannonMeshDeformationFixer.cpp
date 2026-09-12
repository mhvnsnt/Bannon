#include "BannonMeshDeformationFixer.h"

void UBannonMeshDeformationFixer::StabilizeVerticesDuringGrapple(float GrappleTorque, TArray<FVector>& BoneTranslations, bool& bRequiresCorrection)
{
    // Fixes mesh deformation bugs pulled from historical rig deprecation issues
    // If torque exceeds structural safety limits of the skeletal mesh, we clamp translations
    if (GrappleTorque > 5000.0f)
    {
        bRequiresCorrection = true;
        for (int32 i = 0; i < BoneTranslations.Num(); i++)
        {
            // Clamp explosive vertex translations to maintain anatomical correctness
            BoneTranslations[i].X = FMath::Clamp(BoneTranslations[i].X, -15.0f, 15.0f);
            BoneTranslations[i].Y = FMath::Clamp(BoneTranslations[i].Y, -15.0f, 15.0f);
            BoneTranslations[i].Z = FMath::Clamp(BoneTranslations[i].Z, -15.0f, 15.0f);
        }
    }
    else
    {
        bRequiresCorrection = false;
    }
}

void UBannonMeshDeformationFixer::EnforceBoneLengthLimits(float MaxStretchTolerance, float& CurrentBoneLength, float& CorrectionScale)
{
    // Resolves the deprecated rig bugs where active ragdolls cause limbs to stretch infinitely (spaghetti limbs)
    if (CurrentBoneLength > MaxStretchTolerance)
    {
        CorrectionScale = MaxStretchTolerance / CurrentBoneLength;
        CurrentBoneLength = MaxStretchTolerance; // Hard snap back to anatomical reality
    }
    else
    {
        CorrectionScale = 1.0f;
    }
}
