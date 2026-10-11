#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonNeuralNetworkAI.generated.h"

UCLASS()
class BANNONCORE_API UBannonNeuralNetworkAI : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void RegisterPlayerTendency(const FString& ActionType, UPARAM(ref) TMap<FString, int32>& ActionFrequencyLedger);

    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void CalculateAdaptiveReversalTiming(const TMap<FString, int32>& ActionFrequencyLedger, const FString& IncomingAction, float BaseReversalChance, UPARAM(ref) float& OutAdaptedReversalChance);
};
