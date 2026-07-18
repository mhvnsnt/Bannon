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
    void CalculateSpineDeformation(float CurrentStamina, float MaxStamina, UPARAM(ref) float& SpineSlumpPitch);
};
