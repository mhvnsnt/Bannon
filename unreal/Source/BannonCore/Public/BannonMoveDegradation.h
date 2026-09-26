#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMoveDegradation.generated.h"

UCLASS()
class BANNONCORE_API UBannonMoveDegradation : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateExhaustedImpulse(float BaseImpulse, float CurrentStamina, UPARAM(ref) float& OutDegradedImpulse, UPARAM(ref) bool& bMoveFailed);
};
