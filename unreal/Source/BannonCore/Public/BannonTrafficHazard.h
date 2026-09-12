#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonTrafficHazard.generated.h"

UCLASS()
class BANNONCORE_API UBannonTrafficHazard : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void ProcessVehicleCollision(float VehicleSpeed, float VehicleMass, UPARAM(ref) float& TargetHealth, UPARAM(ref) bool& bTriggerRagdoll);
};
