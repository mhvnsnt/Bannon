#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDynamicCamera.generated.h"

UCLASS()
class BANNONCORE_API UBannonDynamicCamera : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Camera")
    void CalculateFramingParameters(const TArray<FVector>& TargetLocations, float BaseFOV, UPARAM(ref) FVector& OutCameraLocation, UPARAM(ref) float& OutTargetFOV);
};
