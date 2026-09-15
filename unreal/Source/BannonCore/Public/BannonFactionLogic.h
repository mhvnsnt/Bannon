#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFactionLogic.generated.h"

UCLASS()
class BANNONCORE_API UBannonFactionLogic : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|AI")
    void EvaluateRunInInterference(const FString& FactionID, float FactionLoyalty, float AllyHealth, UPARAM(ref) bool& bTriggerRunIn);
};
