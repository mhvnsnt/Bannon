// Copyright BANNON.

#include "BannonDestructionMatrix.h"
#include "Engine/World.h"

UBannonDestructionMatrix::UBannonDestructionMatrix()
{
	PrimaryComponentTick.bCanEverTick = false;
}

bool UBannonDestructionMatrix::EvaluateBreakThreshold(AActor* Prop, float ImpactForce)
{
	if (!Prop) return false;
	
	// Assume different props have different breaking strains
	float BreakingStrain = 50000.0f; // Arbitrary force needed to break a standard table
	
	if (ImpactForce > BreakingStrain) {
		// Return true to trigger the Chaos Geometry Collection fracture
		return true;
	}
	return false;
}

void UBannonDestructionMatrix::CheckRingImplosion(float CombinedMass, float FallHeight)
{
	// E.g. Super Heavyweight (150kg) + Heavyweight (120kg) = 270kg
	// Fall from top rope = ~300 units
	
	if (CombinedMass > 250.0f && FallHeight > 250.0f) {
		// Trigger the Ring collapse event (destroys constraints holding the ring posts)
		// Triggers particle dust and immediately stops the match (No Contest)
	}
}
