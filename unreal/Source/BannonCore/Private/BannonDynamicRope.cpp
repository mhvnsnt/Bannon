// Copyright BANNON.

#include "BannonDynamicRope.h"
#include "GameFramework/Character.h"

UBannonDynamicRope::UBannonDynamicRope()
{
	PrimaryComponentTick.bCanEverTick = true;
	RopeCable = nullptr;
	RopeElasticity = 1.35f;
	SegmentLength = 40.0f;
	ConstraintIterations = 5;
	WindForce = FVector(5.0f, 0.0f, 0.0f);
}

void UBannonDynamicRope::BeginPlay()
{
	Super::BeginPlay();

	// Initialize 10 nodes for the rope segment
	RopeNodes.Empty();
	FVector StartPos = GetOwner() ? GetOwner()->GetActorLocation() : FVector::ZeroVector;
	FVector EndPos = StartPos + FVector(400.0f, 0.0f, 0.0f); // 4-meter rope segment

	for (int32 idx = 0; idx < 10; ++idx)
	{
		FBannonVerletPoint Node;
		float Alpha = (float)idx / 9.0f;
		Node.CurrentPosition = FVector::Lerp(StartPos, EndPos, Alpha);
		Node.OldPosition = Node.CurrentPosition;
		Node.bIsPinned = (idx == 0 || idx == 9); // Pin ends to the ring posts
		RopeNodes.Add(Node);
	}
}

void UBannonDynamicRope::ApplyRopeTension(ACharacter* InteractingCharacter, FVector HitLocation)
{
	if (!InteractingCharacter) return;

	// Locate nearest rope segment node
	float MinDist = MAX_flt;
	int32 NearestNodeIdx = -1;
	for (int32 idx = 0; idx < RopeNodes.Num(); ++idx)
	{
		float Dist = FVector::DistSquared(RopeNodes[idx].CurrentPosition, HitLocation);
		if (Dist < MinDist)
		{
			MinDist = Dist;
			NearestNodeIdx = idx;
		}
	}

	if (NearestNodeIdx != -1 && !RopeNodes[NearestNodeIdx].bIsPinned)
	{
		// Push the rope node back by the character's impact force
		float CharacterMass = 100.0f; // Default mass
		FVector VelocityDiff = InteractingCharacter->GetVelocity();
		
		RopeNodes[NearestNodeIdx].CurrentPosition += VelocityDiff * 0.05f;

		// Calculate Hooke's Tension Force: F = k * dx
		FVector Displacement = RopeNodes[NearestNodeIdx].CurrentPosition - RopeNodes[NearestNodeIdx].OldPosition;
		FVector TensionForce = -Displacement * RopeElasticity * CharacterMass;

		UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Ring Rope collision at node %d. Displaced: %s. Calculated spring tension back-force: %s N"), 
			NearestNodeIdx, *Displacement.ToString(), *TensionForce.ToString());

		// Apply impulse back onto the character for the rebound effect
		if (TensionForce.Size() > 150.0f)
		{
			FVector LaunchVelocity = CalculateReboundVelocity(InteractingCharacter->GetVelocity(), RopeElasticity);
			InteractingCharacter->LaunchCharacter(LaunchVelocity, true, true);
			UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Launching wrestler off ropes with momentum rebound: %s"), *LaunchVelocity.ToString());
		}
	}
}

FVector UBannonDynamicRope::CalculateReboundVelocity(FVector IncomingVelocity, float RopeTensionScalar)
{
	// Bounces the wrestler backwards off the rope normals with high kinetic coefficient
	FVector Normal = FVector(0.0f, -1.0f, 0.0f); // Simplified rope facing normal
	FVector Reflected = IncomingVelocity - 2 * FVector::DotProduct(IncomingVelocity, Normal) * Normal;
	return Reflected * RopeElasticity * RopeTensionScalar;
}

void UBannonDynamicRope::SimulateVerletRope(float DeltaTime)
{
	if (DeltaTime <= 0.0f) return;

	FVector Gravity(0.0f, 0.0f, -980.0f);

	for (int32 idx = 0; idx < RopeNodes.Num(); ++idx)
	{
		FBannonVerletPoint& Node = RopeNodes[idx];
		if (Node.bIsPinned) continue;

		FVector TempPos = Node.CurrentPosition;
		
		// Verlet Integration: x_new = x + (x - x_old) + a * dt^2
		FVector Acceleration = Gravity + WindForce;
		Node.CurrentPosition += (Node.CurrentPosition - Node.OldPosition) + (Acceleration * DeltaTime * DeltaTime);
		Node.OldPosition = TempPos;
	}

	ResolveVerletConstraints();
}

void UBannonDynamicRope::ResolveVerletConstraints()
{
	for (int32 Iter = 0; Iter < ConstraintIterations; ++Iter)
	{
		for (int32 idx = 0; idx < RopeNodes.Num() - 1; ++idx)
		{
			FBannonVerletPoint& NodeA = RopeNodes[idx];
			FBannonVerletPoint& NodeB = RopeNodes[idx + 1];

			FVector Delta = NodeB.CurrentPosition - NodeA.CurrentPosition;
			float CurrentDist = Delta.Size();
			float Difference = SegmentLength - CurrentDist;
			float Percent = Difference / CurrentDist / 2.0f;
			FVector Offset = Delta * Percent;

			if (!NodeA.bIsPinned)
			{
				NodeA.CurrentPosition -= Offset;
			}
			if (!NodeB.bIsPinned)
			{
				NodeB.CurrentPosition += Offset;
			}
		}
	}
}
