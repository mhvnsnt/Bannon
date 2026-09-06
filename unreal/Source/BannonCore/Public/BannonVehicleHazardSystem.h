#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonVehicleHazardSystem.generated.h"

UCLASS()
class BANNONCORE_API UBannonVehicleHazardSystem : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void ProcessVehicularImpact(float VehicleMass, float VehicleSpeed, const FVector& ImpactNormal, UPARAM(ref) float& OutDamageApplied, UPARAM(ref) FVector& OutRagdollLaunchVector, UPARAM(ref) bool& bIsCriticalCondition);
};
