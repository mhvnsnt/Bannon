// Copyright BANNON.

#include "BannonCrowdAgent.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

ABannonCrowdAgent::ABannonCrowdAgent()
{
	PrimaryActorTick.bCanEverTick = true;
	bIsFleeing = false;
}

void ABannonCrowdAgent::BeginPlay()
{
	Super::BeginPlay();
}

void ABannonCrowdAgent::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

void ABannonCrowdAgent::EvaluateIncomingThreat(FVector WrestlerVelocity, FVector WrestlerLocation)
{
	float Distance = FVector::Dist(GetActorLocation(), WrestlerLocation);
	if (Distance < 500.0f && WrestlerVelocity.Size() > 200.0f) {
		// Calculate trajectory intersection. If it intersects with this agent, flee!
		FVector DirectionToAgent = (GetActorLocation() - WrestlerLocation).GetSafeNormal();
		float Alignment = FVector::DotProduct(DirectionToAgent, WrestlerVelocity.GetSafeNormal());
		
		if (Alignment > 0.5f) {
			bIsFleeing = true;
			// Trigger navmesh fleeing logic here
		}
	}
}

bool ABannonCrowdAgent::TryWeaponHandoff(ACharacter* Wrestler)
{
	if (bIsFleeing) return false;
	
	float Distance = FVector::Dist(GetActorLocation(), Wrestler->GetActorLocation());
	if (Distance < 150.0f) {
		// Perform IK handoff animation to pass a weapon to the wrestler over the barricade
		return true;
	}
	return false;
}
