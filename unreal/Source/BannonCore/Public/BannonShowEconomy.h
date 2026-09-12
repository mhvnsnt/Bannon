#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonShowEconomy.generated.h"

UCLASS()
class BANNONCORE_API UBannonShowEconomy : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void CalculateShowBudget(float AvailableFunds, float PyroCost, float TalentCost, UPARAM(ref) bool& bIsBankrupt);
};
