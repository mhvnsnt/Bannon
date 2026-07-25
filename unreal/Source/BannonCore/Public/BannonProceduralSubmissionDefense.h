#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonProceduralSubmissionDefense.generated.h"

UCLASS()
class BANNONCORE_API UBannonProceduralSubmissionDefense : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateEscapeStrategy(float CurrentStamina, float DistanceToRopes, float HoldPressure, UPARAM(ref) bool& bCrawlToRopes, UPARAM(ref) bool& bBruteForceEscape);
};
