// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonBalanceMatrix.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonBalanceMatrix : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonBalanceMatrix();

	// Procedural Balance Recovery Matrix
	// Evaluates center of mass vs angular velocity to determine ragdoll recovery
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	bool EvaluateRecovery(FVector CenterOfMass, FVector AngularVelocity, float DeltaTime);

	// Blends from pure ragdoll back to animation state based on balance evaluation
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void BlendToAnimation();
};
