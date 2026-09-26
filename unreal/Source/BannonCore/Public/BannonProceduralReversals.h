#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonProceduralReversals.generated.h"

UCLASS()
class BANNONCORE_API UBannonProceduralReversals : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateReversalWindow(float AttackerVelocity, float DefenderAgility, UPARAM(ref) float& OutWindowMs);
};
