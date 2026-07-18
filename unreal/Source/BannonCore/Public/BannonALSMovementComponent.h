// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "BannonALSMovementComponent.generated.h"

USTRUCT(BlueprintType)
struct FBannonALSWarpState
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	bool bIsSpeedWarping = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	bool bIsDirectionWarping = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	float CurrentWarpAngle = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	float SpeedWarpMultiplier = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	FVector ProceduralVelocityVector = FVector::ZeroVector;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonALSMovementComponent : public UCharacterMovementComponent
{
	GENERATED_BODY()

public:
	UBannonALSMovementComponent();

	// Seamless 8-way directional movement blending
	UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
	void SetLocomotionState(FName NewState);

	// Handling transitions to active ragdoll states
	UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
	void TriggerGetUpAnimation();

	// Implement speed and direction warping states to align procedural locomotion with dynamic physics velocity vectors
	UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
	void CalculateWarpingStates(float DeltaTime, const FVector& InputDirection, const FVector& ActualVelocity);

	// Triggers to transition the skeletal mesh smoothly into active physical ragdolls upon heavy kinetic impacts
	UFUNCTION(BlueprintCallable, Category="Bannon|Locomotion")
	void TriggerActiveRagdoll(float ImpactVelocity, float MassRatio, const FVector& ImpactVector);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	FBannonALSWarpState WarpingState;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	float HeavyImpactThreshold;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Locomotion")
	bool bIsInActiveRagdoll;
};
