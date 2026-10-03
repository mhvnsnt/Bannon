#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonProceduralWeather.generated.h"

UCLASS()
class BANNONCORE_API UBannonProceduralWeather : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void UpdateRingFriction(float PrecipitationLevel, bool bIsOutdoorArena, UPARAM(ref) float& OutCanvasFriction, UPARAM(ref) float& OutSlipProbability);
};
