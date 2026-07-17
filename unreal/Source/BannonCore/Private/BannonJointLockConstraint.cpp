// Copyright BANNON.

#include "BannonJointLockConstraint.h"
#include "GameFramework/Character.h"
#include "Components/SkeletalMeshComponent.h"

UBannonJointLockConstraint::UBannonJointLockConstraint()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UBannonJointLockConstraint::ApplyJointTorque(ACharacter* Attacker, ACharacter* Defender, FName TargetBone, float BaseTorque)
{
	if (!Attacker || !Defender) return;
	
	float Leverage = CalculateLeverageMultiplier(Attacker, Defender);
	float FinalTorque = BaseTorque * Leverage;

	// In engine, this hooks into the PhAT (Physics Asset) constraint limits.
	// We apply a localized angular impulse/motor drive directly to the physics bone.
	// If the threshold exceeds the joint limit, it triggers a dislocation event.
}

float UBannonJointLockConstraint::CalculateLeverageMultiplier(ACharacter* Attacker, ACharacter* Defender)
{
	if (!Attacker || !Defender) return 1.0f;
	
	// Very simple mock logic: Taller/heavier wrestlers generate more torque
	// In production, fetch actual limb lengths and bone scales
	
	float AttackerHeight = 190.0f; 
	float DefenderHeight = 175.0f; 
	
	if (AttackerHeight > DefenderHeight) {
		return 1.2f; // +20% leverage for being taller
	}
	
	return 1.0f;
}
