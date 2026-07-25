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

	// Intercepts massive hit vectors and applies a catastrophe-scaled launch multiplier on active ragdolls
	UFUNCTION(BlueprintCallable, Category="Bannon|Diagnostics")
	FVector InterceptAndAmplifyForce(class ACharacter* Character, FVector IncomingVelocity, float LaunchMultiplier, float CatastrophicThreshold);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Diagnostics")
	float LastCalculatedKineticEnergy;
};
