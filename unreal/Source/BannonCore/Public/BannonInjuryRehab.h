#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonInjuryRehab.generated.h"

UCLASS()
class BANNONCORE_API UBannonInjuryRehab : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Universe")
    void ProcessHospitalization(float InjurySeverity, float AvailableFunds, UPARAM(ref) float& OutHospitalBill, UPARAM(ref) bool& bIsBankrupt, UPARAM(ref) int32& OutWeeksSidelined);
};
