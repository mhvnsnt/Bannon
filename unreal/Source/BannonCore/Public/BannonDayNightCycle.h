#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDayNightCycle.generated.h"

UCLASS()
class BANNONCORE_API UBannonDayNightCycle : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void CalculateTimeOfDayLighting(float InGameTimeHours, UPARAM(ref) float& OutDirectionalLightIntensity, UPARAM(ref) float& OutSunAnglePitch);
};
