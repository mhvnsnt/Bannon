#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonLLMContractExpansion.generated.h"

UCLASS()
class BANNONCORE_API UBannonLLMContractExpansion : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|LLM")
    void ParseContractCounterOffer(const FString& LLMResponseJSON, float StarPower, UPARAM(ref) bool& bDemandsCreativeControl, UPARAM(ref) float& OutMerchCut, UPARAM(ref) float& OutAdvanceFee, UPARAM(ref) bool& bWalksOut);

    UFUNCTION(BlueprintCallable, Category="Bannon|LLM")
    void EvaluateCreativeControlBreach(bool bHasCreativeControl, bool bBookedToLose, UPARAM(ref) bool& bRefusesToWrestle, UPARAM(ref) FString& OutLLMComplainPrompt);
};
