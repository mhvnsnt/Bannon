#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAICowardiceMatrix.generated.h"

UCLASS()
class BANNONCORE_API UBannonAICowardiceMatrix : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void DetermineFlightResponse(float CurrentHealth, float CourageStat, bool bFacingMultipleOpponents, UPARAM(ref) bool& bWillFlee);
};
