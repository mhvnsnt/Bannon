#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonFuneralLogistics.generated.h"

UCLASS()
class BANNONCORE_API UBannonFuneralLogistics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void EvaluateLethalDamage(float TotalTrauma, const FString& WrestlerName, UPARAM(ref) bool& bIsFatal, UPARAM(ref) FString& OutMemorialEventName);
};
