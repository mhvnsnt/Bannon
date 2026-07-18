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
    void EvaluateEscapeStrategy(const FVector& DefenderLocation, const TArray<FVector>& RopeSplinePoints, float CurrentStamina, float EscapeDifficulty, UPARAM(ref) FString& OutChosenStrategy, UPARAM(ref) FVector& OutCrawlTarget);
};
