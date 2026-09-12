#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPropEngine.generated.h"

UCLASS()
class BANNONCORE_API UBannonPropEngine : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Props")
    void EvaluateConcreteImpact(float FallVelocity, UPARAM(ref) float& OutDamageMultiplier);

    UFUNCTION(BlueprintCallable, Category="Bannon|Props")
    void SeamlessTransitionToBrawl();
};
