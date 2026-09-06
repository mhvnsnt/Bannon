#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMatchRules.generated.h"

UCLASS()
class BANNONCORE_API UBannonMatchRules : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Rules")
    bool bRefIsDown;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Rules")
    float RefDownTimer;

    UFUNCTION(BlueprintCallable, Category="Bannon|Rules")
    void TriggerRefBump(float ImpactForce);

    UFUNCTION(BlueprintCallable, Category="Bannon|Rules")
    void EvaluateBlindSpotInterference(const FString& InterferingEntity);
};
