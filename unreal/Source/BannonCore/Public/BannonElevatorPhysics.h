#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonElevatorPhysics.generated.h"

UCLASS()
class BANNONCORE_API UBannonElevatorPhysics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void CalculateInertialThrow(float ElevatorVelocityZ, float ThrowForceZ, UPARAM(ref) float& ResultingZForce);
};
