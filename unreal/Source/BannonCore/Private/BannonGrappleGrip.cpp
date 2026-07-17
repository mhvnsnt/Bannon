// Copyright BANNON.
#include "BannonGrappleGrip.h"
#include "BannonBridge.h"
#include "PhysicsEngine/PhysicsHandleComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "PhysicsEngine/BodyInstance.h"
#include "PhysicsEngine/BodySetup.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_core.h"
THIRD_PARTY_INCLUDES_END

UBannonGrappleGrip::UBannonGrappleGrip()
{
	PrimaryComponentTick.bCanEverTick = false;   // driven by the grapple state machine, not self-ticking
}

void UBannonGrappleGrip::BeginPlay()
{
	Super::BeginPlay();
	if (!Handle && GetOwner())
	{
		Handle = NewObject<UPhysicsHandleComponent>(GetOwner(), TEXT("BannonGripHandle"));
		Handle->RegisterComponent();
		// stiff, well-damped grip so the carried load tracks the hand without exploding.
		Handle->SetLinearStiffness(1500.f);
		Handle->SetLinearDamping(120.f);
		Handle->SetAngularStiffness(800.f);
		Handle->SetAngularDamping(80.f);
		Handle->SetInterpolationSpeed(GripStiffness);
	}
}

bool UBannonGrappleGrip::FindClosestSimulatingBody(USkeletalMeshComponent* SkelMesh, const FVector& Point,
	float MaxDistance, FName& OutBone, FVector& OutCOM, float& OutDistance)
{
	OutBone = NAME_None; OutCOM = FVector::ZeroVector; OutDistance = TNumericLimits<float>::Max();
	if (!SkelMesh) return false;

	float closest = TNumericLimits<float>::Max();
	const FBodyInstance* best = nullptr;
	// iterate every physics body; keep the nearest one that is actually SIMULATING and within reach.
	for (const FBodyInstance* Body : SkelMesh->Bodies)
	{
		if (!Body || !Body->IsValidBodyInstance()) continue;
		const FVector COM = Body->GetCOMPosition();
		const float Dist = FVector::Dist(COM, Point);
		if (Body->IsInstanceSimulatingPhysics() && Dist < closest && Dist <= MaxDistance)
		{
			best = Body; closest = Dist;
			OutBone = Body->BodySetup.IsValid() ? Body->BodySetup->BoneName : NAME_None;
			OutCOM = COM;
		}
	}
	if (best) { OutDistance = closest; return true; }
	return false;
}

bool UBannonGrappleGrip::GripNearest(USkeletalMeshComponent* VictimMesh, FVector HandWorldPos)
{
	if (!Handle || !VictimMesh) return false;
	FName Bone; FVector COM; float Dist;
	if (!FindClosestSimulatingBody(VictimMesh, HandWorldPos, GripReach, Bone, COM, Dist))
		return false;   // nothing simulating within reach — grapple whiffs

	Handle->GrabComponentAtLocationWithRotation(VictimMesh, Bone, COM, VictimMesh->GetComponentRotation());
	GrippedBone = Bone; Victim = VictimMesh; bGripping = true;
	return true;
}

void UBannonGrappleGrip::UpdateGrip(FVector HandWorldPos, FRotator HandWorldRot)
{
	if (!bGripping || !Handle) return;
	// drag the gripped body toward the attacker's hand — this is the physical carry/lift (a real load,
	// so the attacker feels it; the handle's stiffness/damping keep it from exceeding the body cap).
	Handle->SetTargetLocationAndRotation(HandWorldPos, HandWorldRot);
}

void UBannonGrappleGrip::Release(FVector ReleaseImpulse)
{
	if (!Handle) return;
	if (bGripping && Victim)
	{
		Handle->ReleaseComponent();
		// fling the freed body (the move's deliver kind sets the impulse), clamped to MAX_BODY_VEL.
		if (FBodyInstance* BI = Victim->GetBodyInstance(GrippedBone))
		{
			const float capCm = bannon::MAX_BODY_VEL * BannonBridge::UE_M;
			FVector Imp = ReleaseImpulse;
			// impulse -> implied dv; clamp the resulting speed after applying.
			BI->AddImpulse(Imp, /*bVelChange*/ false);
			FVector V = BI->GetUnrealWorldVelocity();
			if (V.SizeSquared() > capCm * capCm) BI->SetLinearVelocity(V.GetClampedToMaxSize(capCm), false);
		}
	}
	bGripping = false; GrippedBone = NAME_None; Victim = nullptr;
}
