#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonPhysicsDiagnostics.generated.h"

UCLASS()
class BANNONCORE_API UBannonPhysicsDiagnostics : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Diagnostics")
    void CalculateDebugMetrics(float Mass, const FVector& Velocity, const FVector& AngularVelocity, UPARAM(ref) float& OutKineticEnergy, UPARAM(ref) float& OutTotalTorque);
};
