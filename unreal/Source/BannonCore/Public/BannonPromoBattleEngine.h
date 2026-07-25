#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPromoBattleEngine.generated.h"

UCLASS()
class BANNONCORE_API UBannonPromoBattleEngine : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Systems")
    void EvaluatePromoKeywords(const FString& Dialogue, float PerformerCharisma, UPARAM(ref) float& OutMomentumBuff, UPARAM(ref) float& OutCrowdHeatShift);
};
