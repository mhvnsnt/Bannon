#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonEnvironmentalTraps.generated.h"

UCLASS()
class BANNONCORE_API UBannonEnvironmentalTraps : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void TriggerVendingMachineShatter(float WrestlerImpactVelocity, UPARAM(ref) bool& bMachineShattered, UPARAM(ref) float& OutElectricalDamage);
};
