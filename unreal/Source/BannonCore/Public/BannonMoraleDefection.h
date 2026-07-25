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
    void EvaluateDefectionRisk(float WrestlerMorale, int32 WeeksOffTV, UPARAM(ref) bool& bWillDefectToRival);
};
