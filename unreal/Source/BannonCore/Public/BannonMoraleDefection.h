#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMoraleDefection.generated.h"

UCLASS()
class BANNONCORE_API UBannonMoraleDefection : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void EvaluateMoraleDefection(int32 DaysOffTV, float CurrentMorale, float RivalOfferMultiplier, UPARAM(ref) bool& bWillDefect);
};
