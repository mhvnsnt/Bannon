#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPromoBattleMechanics.generated.h"

UCLASS()
class BANNONCORE_API UBannonPromoBattleMechanics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Meta")
    void EvaluatePromoKeywords(const FString& LLMGeneratedDialogue, float CharismaStat, UPARAM(ref) float& OutMomentumBuff, UPARAM(ref) float& OutCrowdHeatShift);
};
