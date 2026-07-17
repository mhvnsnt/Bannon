// Copyright BANNON.

#include "BannonBalanceMatrix.h"
#include "GameFramework/Character.h"

UBannonBalanceMatrix::UBannonBalanceMatrix()
{
	PrimaryComponentTick.bCanEverTick = true;
}

bool UBannonBalanceMatrix::EvaluateRecovery(FVector CenterOfMass, FVector AngularVelocity, float DeltaTime)
{
	// Core math to determine if a wrestler can recover their footing
	float StabilityThreshold = 100.0f;
	if (AngularVelocity.Size() < StabilityThreshold) {
		return true; // Stable enough to recover
	}
	return false;
}

void UBannonBalanceMatrix::BlendToAnimation()
{
	ACharacter* Owner = Cast<ACharacter>(GetOwner());
	if (Owner) {
		// Native API to restore animation update weight vs physics update weight
	}
}
