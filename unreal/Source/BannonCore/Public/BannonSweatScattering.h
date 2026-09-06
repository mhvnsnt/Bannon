#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonSweatScattering.generated.h"

UCLASS()
class BANNONCORE_API UBannonSweatScattering : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
    void CalculateSweatAccumulation(float MatchDuration, float ExertionLevel, UPARAM(ref) float& OutRoughness, UPARAM(ref) float& OutSpecular);
};
