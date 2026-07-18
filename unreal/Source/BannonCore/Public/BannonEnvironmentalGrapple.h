#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonEnvironmentalGrapple.generated.h"

UCLASS()
class BANNONCORE_API UBannonEnvironmentalGrapple : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Grappling")
    void CalculateProximityIKTargets(const FVector& GrappleLocation, const TArray<FVector>& NearbyEnvironmentNodes, UPARAM(ref) FVector& OutLeftHandIK, UPARAM(ref) FVector& OutRightHandIK, UPARAM(ref) bool& bIsEnvironmentInteraction);
};
