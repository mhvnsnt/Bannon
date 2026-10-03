// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonPhysicsCollider.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonPhysicsCollider : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonPhysicsCollider();

	// Calculates procedural impact force based on limb velocity and relative mass
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	float CalculateImpactForce(FVector AttackingLimbVelocity, float AttackerMass, float DefenderMass, FVector ImpactNormal);

	// Determine glancing blows where rotational torque is applied instead of direct damage
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	bool IsGlancingBlow(FVector ImpactNormal, FVector DefenderForward, float ThresholdAngle);
};
