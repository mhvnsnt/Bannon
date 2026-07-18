#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFatiguePosture.generated.h"

UCLASS()
class BANNONCORE_API UBannonFatiguePosture : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Animation")
    void CalculatePostureDeformation(float CurrentStamina, float MaxStamina, UPARAM(ref) float& OutSpineSlumpAlpha, UPARAM(ref) float& OutBreathingIntensity);
};
