#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonGLBModelValidator.generated.h"

UCLASS()
class BANNONCORE_API UBannonGLBModelValidator : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Pipeline")
    void ValidateModelOrientation(const FVector& BoundingBoxMin, const FVector& BoundingBoxMax, const FVector& RootBoneLocation, UPARAM(ref) bool& bNeedsReorientation, UPARAM(ref) FVector& OutCorrectionOffset);
};
