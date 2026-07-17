// Copyright BANNON.
// Grapple grip — the physical hand-to-body weld the web engine fakes with verlet `_gripPts`, done for
// real in Chaos. When a wrestler grabs an opponent, this finds the NEAREST SIMULATING ragdoll body on
// the victim to the attacker's hand and clamps a UPhysicsHandleComponent onto that bone, then drags it
// toward the attacker's hand socket each tick so the victim follows the carry/lift pose as a physical
// load (not a canned parent-attach). Release drops it with an impulse, MAX_BODY_VEL-capped.
// Grab-search + physics-handle technique adapted from noahbutcher97/OnlyHands (OHPhysicsHandler).
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGrappleGrip.generated.h"

class UPhysicsHandleComponent;
class USkeletalMeshComponent;
class UPrimitiveComponent;

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGrappleGrip : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonGrappleGrip();

	// how far the hand can reach to find a body to grip (cm).
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Grapple") float GripReach = 60.f;

	// interp speed the handle drags the gripped body toward the hand target (higher = stiffer grip).
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Grapple") float GripStiffness = 30.f;

	UPROPERTY(BlueprintReadOnly, Category="Bannon|Grapple") FName GrippedBone;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Grapple") bool bGripping = false;

	// grab the nearest simulating body on VictimMesh to HandWorldPos (within GripReach). Returns true and
	// sets GrippedBone on success. The victim's ragdoll must be simulating (blend it up first).
	UFUNCTION(BlueprintCallable, Category="Bannon|Grapple")
	bool GripNearest(USkeletalMeshComponent* VictimMesh, FVector HandWorldPos);

	// each frame while carrying: move the grip target to the attacker's hand (drag the load into pose).
	UFUNCTION(BlueprintCallable, Category="Bannon|Grapple")
	void UpdateGrip(FVector HandWorldPos, FRotator HandWorldRot);

	// let go; optionally fling the freed body (release impulse from the move's deliver kind), velocity-capped.
	UFUNCTION(BlueprintCallable, Category="Bannon|Grapple")
	void Release(FVector ReleaseImpulse);

	// find the closest SIMULATING FBodyInstance on a skeletal mesh to a point (bone + COM + distance).
	// Ported from OnlyHands OHPhysicsHandler::FindClosestSimulatingBodyInstance.
	static bool FindClosestSimulatingBody(USkeletalMeshComponent* SkelMesh, const FVector& Point,
		float MaxDistance, FName& OutBone, FVector& OutCOM, float& OutDistance);

protected:
	virtual void BeginPlay() override;

	UPROPERTY() UPhysicsHandleComponent* Handle = nullptr;
	UPROPERTY() USkeletalMeshComponent* Victim = nullptr;
};
