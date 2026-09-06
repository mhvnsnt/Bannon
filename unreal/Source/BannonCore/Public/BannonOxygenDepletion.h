#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonOxygenDepletion.generated.h"

UCLASS()
class BANNONCORE_API UBannonOxygenDepletion : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Submission")
    void ProcessChokehold(float HoldDuration, float AttackerGripStrength, UPARAM(ref) float& DefenderOxygen, UPARAM(ref) bool& bIsTKO);
};
