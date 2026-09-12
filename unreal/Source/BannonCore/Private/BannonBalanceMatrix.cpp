// Copyright BANNON.

#include "BannonBalanceMatrix.h"
#include "GameFramework/Character.h"

UBannonBalanceMatrix::UBannonBalanceMatrix()
{
	PrimaryComponentTick.bCanEverTick = true;
	RecoveryStaminaFactor = 1.0f;
	StabilityTargetSpeed = 120.0f;
	CurrentBlendAlpha = 0.0f; // 0 = Pure Physics, 1 = Pure Animation
	RecoveryBlendRate = 3.5f;
	bIsRecovering = false;
}

bool UBannonBalanceMatrix::EvaluateRecovery(FVector CenterOfMass, FVector AngularVelocity, float DeltaTime)
{
	// Math to determine if center of mass alignment and low rotational speed allow balance restoration
	float RotationalEnergy = AngularVelocity.Size();
	
	// A lower Center of Mass Z-deviation relative to the pelvis means more stable projection
	float BalanceDeviation = FMath::Abs(CenterOfMass.X) + FMath::Abs(CenterOfMass.Y);
	
	bool bIsStable = (RotationalEnergy < StabilityTargetSpeed) && (BalanceDeviation < 80.0f);
	
	if (bIsStable && !bIsRecovering)
	{
		UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Stability achieved! Center of Mass deviation (%f), Rotational Speed (%f). Triggering recovery sequence."), BalanceDeviation, RotationalEnergy);
		BlendToAnimation();
	}
	
	return bIsStable;
}

void UBannonBalanceMatrix::BlendToAnimation()
{
	ACharacter* Owner = Cast<ACharacter>(GetOwner());
	if (Owner)
	{
		bIsRecovering = true;
		CurrentBlendAlpha = 0.05f; // Begin interpolation
		UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Initiating blend-to-animation. Interp speed scaled by stamina factor: %f"), RecoveryStaminaFactor);
	}
}

void UBannonBalanceMatrix::UpdateBalanceBlending(float DeltaTime)
{
	if (!bIsRecovering) return;

	// Interpolate the skeletal mesh physics weight down, and animation weight up
	CurrentBlendAlpha = FMath::FInterpTo(CurrentBlendAlpha, 1.0f, DeltaTime, RecoveryBlendRate * RecoveryStaminaFactor);

	if (CurrentBlendAlpha >= 0.98f)
	{
		CurrentBlendAlpha = 1.0f;
		bIsRecovering = false;
		UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Balance Recovery completed successfully! Skeletal mesh fully handed back to ALS-R locomotion."));
	}
}
