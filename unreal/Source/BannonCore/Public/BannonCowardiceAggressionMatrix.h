#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCowardiceAggressionMatrix.generated.h"

UCLASS()
class BANNONCORE_API UBannonCowardiceAggressionMatrix : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateFlightOrFight(float AggressionStat, float CurrentHealth, float OpponentMomentum, UPARAM(ref) FString& OutTacticalDecision);
};
