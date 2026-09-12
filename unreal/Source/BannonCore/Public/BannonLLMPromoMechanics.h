#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonLLMPromoMechanics.generated.h"

UCLASS()
class BANNONCORE_API UBannonLLMPromoMechanics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|LLM")
    void ScorePromoSentiment(const FString& LLMAnalysisSentiment, float SpeakerCharisma, UPARAM(ref) float& OutMomentumBoost, UPARAM(ref) bool& bCrowdTurnsHostile);

    UFUNCTION(BlueprintCallable, Category="Bannon|LLM")
    void ProcessMicInterrupt(float TargetAnger, float PromoLength, UPARAM(ref) bool& bBrawlErupts);
};
