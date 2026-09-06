#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWeaponDegradation.generated.h"

UCLASS()
class BANNONCORE_API UBannonWeaponDegradation : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void ProcessWeaponImpact(float ImpactForce, float CurrentWeaponHealth, UPARAM(ref) float& OutNewWeaponHealth, UPARAM(ref) bool& bIsShattered);
};
