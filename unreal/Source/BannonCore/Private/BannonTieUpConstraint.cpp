// Copyright BANNON.

#include "BannonTieUpConstraint.h"
#include "GameFramework/Character.h"

UBannonTieUpConstraint::UBannonTieUpConstraint()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UBannonTieUpConstraint::EstablishCollarAndElbow(ACharacter* Attacker, ACharacter* Defender)
{
	if (!Attacker || !Defender) return;
	
	// Dynamic hand targeting via FBIK. 
	// Hands seek shoulders/neck based on opponent's height difference.
	// Hook to UE5 FBIK component targets for both wrestlers simultaneously to simulate the lockup.
}

bool UBannonTieUpConstraint::AttemptLift(ACharacter* Attacker, ACharacter* Defender)
{
	if (!Attacker || !Defender) return false;
	
	// Check mass/strength ratio
	// In full logic, fetch strength attribute.
	float AttackerStrength = 100.0f; 
	// Mock Defender Mass
	float DefenderMass = 120.0f; // e.g. super heavyweight
	
	if (DefenderMass > AttackerStrength * 1.5f) {
		// Lift fails, transition to a back-strain state
		return false;
	}
	
	return true;
}
