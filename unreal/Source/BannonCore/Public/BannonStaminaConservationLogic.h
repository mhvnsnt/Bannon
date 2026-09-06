#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonStaminaConservationLogic.generated.h"

UCLASS()
class BANNONCORE_API UBannonStaminaConservationLogic : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateRolloutNeed(float CurrentStamina, float MaxStamina, float OpponentDistance, UPARAM(ref) bool& bShouldRollOutOfRing);
};
