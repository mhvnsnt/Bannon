// Copyright BANNON.
#include "BannonFloatingCapsuleMovement.h"
#include "BannonBridge.h"
#include "Components/PrimitiveComponent.h"
#include "GameFramework/Pawn.h"
#include "Engine/World.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_core.h"
THIRD_PARTY_INCLUDES_END

UBannonFloatingCapsuleMovement::UBannonFloatingCapsuleMovement()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UBannonFloatingCapsuleMovement::BeginPlay()
{
	Super::BeginPlay();
	if (!RootDrive)
	{
		if (APawn* P = Cast<APawn>(GetOwner()))
			RootDrive = Cast<UPrimitiveComponent>(P->GetRootComponent());
	}
	if (RootDrive) RootDrive->SetSimulatePhysics(true);
}

void UBannonFloatingCapsuleMovement::TickComponent(float Dt, ELevelTick TickType, FActorComponentTickFunction* Fn)
{
	Super::TickComponent(Dt, TickType, Fn);
	if (!RootDrive || Dt <= KINDA_SMALL_NUMBER) return;
	ApplyRideSpring(Dt);
	ApplyMoveInput(Dt);

	// enforce the immutable cap on the capsule too (m/s -> cm/s), so nothing exceeds MAX_BODY_VEL.
	const float capCm = bannon::MAX_BODY_VEL * BannonBridge::UE_M;
	FVector V = RootDrive->GetPhysicsLinearVelocity();
	if (V.SizeSquared() > capCm * capCm)
		RootDrive->SetPhysicsLinearVelocity(V.GetClampedToMaxSize(capCm));
}

void UBannonFloatingCapsuleMovement::ApplyRideSpring(float Dt)
{
	// downward ray from the capsule center: distance to floor drives a damped hover spring.
	const FVector Start = RootDrive->GetComponentLocation();
	const FVector Down = -FVector::UpVector;

	FHitResult Hit;
	FCollisionQueryParams Params(SCENE_QUERY_STAT(BannonRideSpring), false, GetOwner());
	bGrounded = GetWorld()->LineTraceSingleByChannel(Hit, Start, Start + Down * ProbeLength, ECC_Visibility, Params);

	if (!bGrounded) { GroundDistance = ProbeLength; return; }   // airborne: gravity does its thing
	GroundDistance = Hit.Distance;

	// spring force = -k*(dist - rideHeight) - c*vZ  (critically-damped hover), F=ma -> dv, added to vZ.
	const float x = Hit.Distance - RideHeight;
	FVector Vel = RootDrive->GetPhysicsLinearVelocity();
	const float Mass = FMath::Max(1.f, RootDrive->GetMass());
	const float SpringForce = -(x * RideSpringStrength) - RideSpringDamper * Vel.Z;
	const float DeltaVel = (SpringForce / Mass) * Dt;
	Vel.Z += DeltaVel;
	RootDrive->SetPhysicsLinearVelocity(Vel);
}

void UBannonFloatingCapsuleMovement::ApplyMoveInput(float Dt)
{
	// consume the pending input vector into a horizontal acceleration, clamped to the walk/run max.
	FVector Input = ConsumeInputVector().GetClampedToMaxSize(1.f);
	Input.Z = 0.f;
	if (Input.IsNearlyZero()) return;

	FVector Vel = RootDrive->GetPhysicsLinearVelocity();
	FVector Horiz(Vel.X, Vel.Y, 0.f);
	Horiz += Input * MoveAccel * Dt;
	if (Horiz.SizeSquared() > MaxPawnSpeed * MaxPawnSpeed) Horiz = Horiz.GetClampedToMaxSize(MaxPawnSpeed);

	RootDrive->SetPhysicsLinearVelocity(FVector(Horiz.X, Horiz.Y, Vel.Z));
}
