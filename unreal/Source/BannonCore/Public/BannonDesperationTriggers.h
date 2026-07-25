#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDesperationTriggers.generated.h"

UCLASS()
class BANNONCORE_API UBannonDesperationTriggers : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateDesperationState(float CurrentHealth, float MatchMomentum, UPARAM(ref) bool& bWillAttemptHighRiskMove);
};
