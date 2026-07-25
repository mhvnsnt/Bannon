#include "BannonPhysicsDiagnostics.h"
#include "GameFramework/Character.h"

void UBannonPhysicsDiagnostics::CalculateDebugMetrics(float Mass, const FVector& Velocity, const FVector& AngularVelocity, float& OutKineticEnergy, float& OutTotalTorque)
{
    // Exposes raw physics variables to the HUD for real-time debugging of active ragdoll states
    OutKineticEnergy = 0.5f * Mass * Velocity.SizeSquared();
    OutTotalTorque = AngularVelocity.Size() * Mass; // Simplified torque mapping for debug overlay
	LastCalculatedKineticEnergy = OutKineticEnergy;
}

FVector UBannonPhysicsDiagnostics::InterceptAndAmplifyForce(ACharacter* Character, FVector IncomingVelocity, float LaunchMultiplier, float CatastrophicThreshold)
{
	if (!Character)
	{
		return FVector::ZeroVector;
	}

	float IncomingSpeed = IncomingVelocity.Size();
	FVector ResultVelocity = IncomingVelocity;

	// Check if velocity exceeds the dynamic catastrophe limit
	if (IncomingSpeed >= CatastrophicThreshold)
	{
		// Scale velocity multiplicatively using the launch multiplier
		float ExcessRatio = IncomingSpeed / CatastrophicThreshold;
		float MultiplierApplied = LaunchMultiplier * ExcessRatio;
		
		ResultVelocity = IncomingVelocity * MultiplierApplied;

		UE_LOG(LogTemp, Error, TEXT("Bannon Physics Interceptor: CATASTROPHIC IMPACT DETECTED on %s! Speed %f exceeds threshold %f. Applying extreme multiplier %f. Resulting launch velocity: %s"),
			*Character->GetName(), IncomingSpeed, CatastrophicThreshold, MultiplierApplied, *ResultVelocity.ToString());

		// Force character immediately into full passive/active ragdoll state
		Character->LaunchCharacter(ResultVelocity, true, true);
	}
	else
	{
		UE_LOG(LogTemp, Log, TEXT("Bannon Physics Interceptor: Normal impact on %s. Speed %f is below catastrophic limit."), *Character->GetName(), IncomingSpeed);
	}

	return ResultVelocity;
}
