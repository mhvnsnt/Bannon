#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDumpsterContainment.generated.h"

UCLASS()
class BANNONCORE_API UBannonDumpsterContainment : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void ProcessContainerImpact(const FVector& WrestlerVelocity, float ContainerDepth, UPARAM(ref) bool& bIsTrappedInside, UPARAM(ref) FVector& OutCameraOffset);
};
