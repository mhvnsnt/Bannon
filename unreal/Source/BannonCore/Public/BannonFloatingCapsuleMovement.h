// Copyright BANNON.
// Floating-capsule movement — a rigid-body-dynamics character controller. Instead of a kinematic
// CharacterMovementComponent sweeping a capsule, the capsule is a SIMULATED body that HOVERS above the
// ground on a spring (a downward ray finds the floor; a critically-damped spring holds RideHeight).
// This is what lets an active ragdoll walk while staying fully physical — it can be shoved, it climbs
// steps for free, and it never fights the ragdoll's own physics. Ported/adapted from
// tigershan1130/UE5-active-ragdoll-with-floating-capsule (UTsPhysicsCharacterMovement), retuned to the
// BANNON law set (MAX_BODY_VEL cap, no magic kinematic teleports).
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PawnMovementComponent.h"
#include "BannonFloatingCapsuleMovement.generated.h"

class UPrimitiveComponent;

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFloatingCapsuleMovement : public UPawnMovementComponent
{
	GENERATED_BODY()

public:
	UBannonFloatingCapsuleMovement();

	// the simulated capsule/body we hover + push (defaults to the pawn's root primitive if left null).
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|FloatCapsule") UPrimitiveComponent* RootDrive = nullptr;

	// spring-ride: hold the body RideHeight above the ground; strength/damper form the hover spring.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|FloatCapsule") float RideHeight = 60.f;    // cm
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|FloatCapsule") float RideSpringStrength = 1500.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|FloatCapsule") float RideSpringDamper = 120.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|FloatCapsule") float ProbeLength = 200.f;   // cm ray

	// horizontal locomotion: acceleration toward input, clamped to a walk/run max (never past the cap).
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|FloatCapsule") float MoveAccel = 2400.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|FloatCapsule") float MaxPawnSpeed = 600.f;  // cm/s

	UPROPERTY(BlueprintReadOnly, Category="Bannon|FloatCapsule") bool bGrounded = false;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|FloatCapsule") float GroundDistance = 0.f;

	virtual void TickComponent(float Dt, ELevelTick, FActorComponentTickFunction*) override;

protected:
	virtual void BeginPlay() override;

	// one spring-ride + input step (cm units). Applies force to RootDrive, then caps its speed.
	void ApplyRideSpring(float Dt);
	void ApplyMoveInput(float Dt);
};
