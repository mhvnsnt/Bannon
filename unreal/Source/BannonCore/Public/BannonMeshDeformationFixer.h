#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMeshDeformationFixer.generated.h"

UCLASS()
class BANNONCORE_API UBannonMeshDeformationFixer : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Rigging")
    void StabilizeVerticesDuringGrapple(float GrappleTorque, UPARAM(ref) TArray<FVector>& BoneTranslations, UPARAM(ref) bool& bRequiresCorrection);

    UFUNCTION(BlueprintCallable, Category="Bannon|Rigging")
    void EnforceBoneLengthLimits(float MaxStretchTolerance, UPARAM(ref) float& CurrentBoneLength, UPARAM(ref) float& CorrectionScale);
};
