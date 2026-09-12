#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAINeuralAdaptation.generated.h"

UCLASS()
class BANNONCORE_API UBannonAINeuralAdaptation : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluatePlayerTendency(int32 ReversalAttempts, int32 SuccessfulReversals, UPARAM(ref) float& OutAIFeintProbability);
};
