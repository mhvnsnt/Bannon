// Copyright BANNON.

#include "BannonBrainComponent.h"
#include "GameFramework/Character.h"

UBannonBrainComponent::UBannonBrainComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UBannonBrainComponent::AdaptToPlayerPattern(FName ActionType, float TimingDelta)
{
	// Logs repeated actions (e.g. player always attempts reversal immediately)
	// Shifts internal probability matrix to feint or delay strikes.
}

void UBannonBrainComponent::CalculateAggressionShift(float Health, float Stamina)
{
	// If health is critically low and stamina is high, desperation move triggers increase.
	// If both are low, AI rolls out of the ring (navmesh pathfinding).
}

ACharacter* UBannonBrainComponent::EvaluateBiggestThreat(const TArray<ACharacter*>& Opponents)
{
	ACharacter* BiggestThreat = nullptr;
	float HighestThreatScore = -1.0f;

	for (ACharacter* Target : Opponents) {
		if (!Target) continue;
		
		// Proximity + Momentum + Health remaining calculates threat score
		float ThreatScore = 100.0f; // Mock score
		
		if (ThreatScore > HighestThreatScore) {
			HighestThreatScore = ThreatScore;
			BiggestThreat = Target;
		}
	}
	return BiggestThreat;
}
