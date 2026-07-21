#include "BannonGrappleIKBridge.h"
#include "Math/UnrealMathUtility.h"

UBannonGrappleIKBridge::UBannonGrappleIKBridge()
{
}

void UBannonGrappleIKBridge::ExecuteConstrainedGrappleIK(TArray<FTransform>& BoneTransforms, float PoiseValue, float CurrentHP, float DeltaTime)
{
	// Strict assertion for engine physics constants
	// (Enforcing external plugin to obey the Bannon physical limits)
	float HealthFactor = FMath::Clamp(CurrentHP / MAX_HP, 0.0f, 1.0f);
	float Stiffness = HealthFactor * (PoiseValue > 0.0f ? 1.0f : 0.2f);
	
	// Execute the injected RTIK solver
	IKSolver.SolveIK(BoneTransforms, DeltaTime, Stiffness);
	
	// Ensure crumple state integrity
	ValidateCrumpleState(PoiseValue);
}

void UBannonGrappleIKBridge::ValidateCrumpleState(float PoiseValue)
{
	// Crumple states must remain coupled to Poise, independently of HP.
	if (PoiseValue <= 0.0f)
	{
		// Force physical crumple / skeletal collapse constraint override
		// Limits retargeting to prevent 'stiff' disconnected ragdolling
		IKSolver.SetJointLimits(0, FVector(0.f), FVector(0.f)); 
	}
}
