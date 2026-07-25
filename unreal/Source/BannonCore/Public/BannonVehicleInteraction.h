#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonVehicleInteraction.generated.h"

UCLASS()
class BANNONCORE_API UBannonVehicleInteraction : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Legacy")
    void CalculateVehicleImpact(float VehicleVelocity, float TargetMass, UPARAM(ref) float& OutDamage, UPARAM(ref) FVector& OutLaunchVector);
};
