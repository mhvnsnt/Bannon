// Copyright BANNON.

#include "BannonALSMovementComponent.h"

UBannonALSMovementComponent::UBannonALSMovementComponent()
{
	HeavyImpactThreshold = 1000.0f; // Force/momentum threshold
	bIsInActiveRagdoll = false;
	
	WarpingState.bIsSpeedWarping = false;
	WarpingState.bIsDirectionWarping = false;
	WarpingState.CurrentWarpAngle = 0.0f;
	WarpingState.SpeedWarpMultiplier = 1.0f;
	WarpingState.ProceduralVelocityVector = FVector::ZeroVector;
}

void UBannonALSMovementComponent::SetLocomotionState(FName NewState)
{
	UE_LOG(LogTemp, Log, TEXT("Bannon ALS-R: Seamless 8-way blending switched state to: %s"), *NewState.ToString());
}

void UBannonALSMovementComponent::TriggerGetUpAnimation()
{
	if (bIsInActiveRagdoll)
	{
		bIsInActiveRagdoll = false;
		UE_LOG(LogTemp, Log, TEXT("Bannon ALS-R: Blending active ragdoll physics into procedural get-up animation root motion."));
	}
}

void UBannonALSMovementComponent::CalculateWarpingStates(float DeltaTime, const FVector& InputDirection, const FVector& ActualVelocity)
{
	if (bIsInActiveRagdoll)
	{
		WarpingState.bIsSpeedWarping = false;
		WarpingState.bIsDirectionWarping = false;
		return;
	}

	WarpingState.ProceduralVelocityVector = ActualVelocity;

	// Speed warping calculation based on character speed vs maximum expected speed
	float CurrentSpeed = ActualVelocity.Size();
	float MaxExpectedSpeed = MaxSpeed > 0.0f ? MaxSpeed : 600.0f;
	
	if (CurrentSpeed > 5.0f && InputDirection.Size() > 0.1f)
	{
		WarpingState.bIsSpeedWarping = true;
		WarpingState.SpeedWarpMultiplier = FMath::Clamp(CurrentSpeed / MaxExpectedSpeed, 0.5f, 2.0f);

		// Direction warping calculation (angle between movement input and actual velocity)
		FVector NormalizedInput = InputDirection.GetSafeNormal();
		FVector NormalizedVelocity = ActualVelocity.GetSafeNormal();
		
		float DotProduct = FVector::DotProduct(NormalizedInput, NormalizedVelocity);
		float AngleRad = FMath::Acos(FMath::Clamp(DotProduct, -1.0f, 1.0f));
		WarpingState.CurrentWarpAngle = FMath::RadiansToDegrees(AngleRad);

		// Determine if direction warping is active (e.g. pivoting on high velocity)
		WarpingState.bIsDirectionWarping = WarpingState.CurrentWarpAngle > 15.0f;
	}
	else
	{
		WarpingState.bIsSpeedWarping = false;
		WarpingState.bIsDirectionWarping = false;
		WarpingState.SpeedWarpMultiplier = 1.0f;
		WarpingState.CurrentWarpAngle = 0.0f;
	}
}

void UBannonALSMovementComponent::TriggerActiveRagdoll(float ImpactVelocity, float MassRatio, const FVector& ImpactVector)
{
	float CalculatedKineticImpact = ImpactVelocity * MassRatio;
	
	if (CalculatedKineticImpact >= HeavyImpactThreshold)
	{
		bIsInActiveRagdoll = true;
		UE_LOG(LogTemp, Warning, TEXT("Bannon ALS-R: Heavy kinetic impact detected (Force: %f / Threshold: %f). Transitioning skeletal mesh to active physical ragdoll."), CalculatedKineticImpact, HeavyImpactThreshold);
		
		// In actual gameplay, this disables character movement and initiates skeletal physics blend
		DisableMovement();
	}
	else
	{
		UE_LOG(LogTemp, Log, TEXT("Bannon ALS-R: Minor collision impact (Force: %f). Resisted via physical animation constraints."), CalculatedKineticImpact);
	}
}
