#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonLegacyScandals.generated.h"

UCLASS()
class BANNONCORE_API UBannonLegacyScandals : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void TriggerRandomDrugTest(float WrestlerStrengthStat, float WrestlerAgilityStat, UPARAM(ref) bool& bTestFailed, UPARAM(ref) int32& OutSuspensionWeeks);
};
