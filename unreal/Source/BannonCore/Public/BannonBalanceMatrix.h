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

	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void UpdateBalanceBlending(float DeltaTime);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float RecoveryStaminaFactor;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float StabilityTargetSpeed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float CurrentBlendAlpha;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float RecoveryBlendRate;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	bool bIsRecovering;
};
