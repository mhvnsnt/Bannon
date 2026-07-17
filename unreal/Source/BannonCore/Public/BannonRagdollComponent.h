// Copyright BANNON.
// The active ragdoll — the first system moving off Three.js verlet into live Chaos. Drives a
// 15-joint PhysicsAsset with PD targets toward the animated pose (bannon_rig layout), and enforces
// the immutable MAX_BODY_VEL per-body clamp AFTER the solver (the web engine's post-constraint clamp
// lesson: constraint corrections re-inflate velocity, so cap last). Poise scales motor stiffness.
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRagdollComponent.generated.h"

class USkeletalMeshComponent;

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRagdollComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonRagdollComponent();

	// the skeletal mesh whose PhysicsAsset bodies we drive (the 15 core joints, Mixamo-named).
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ragdoll") USkeletalMeshComponent* Mesh = nullptr;

	// motor stiffness/damping (PD), scaled by poise at runtime (stiff upright, limp when poise breaks).
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ragdoll") float MotorStiffness = 8000.f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ragdoll") float MotorDamping = 400.f;

	// 0 = fully animated (kinematic), 1 = fully physical. Blend up on impact, decay back (RagdollBlendMatrix).
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Ragdoll") float PhysBlend = 0.f;

	// How much of a limb hit is coupled back into the pelvis/root (the reference's signature: striking a
	// body part shoves the hips, so a big boot to the head whips the whole body, not just the head).
	// tigershan1130/UE5-active-ragdoll drives root from the struck body; we scale it by this.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ragdoll", meta=(ClampMin="0.0", ClampMax="1.0"))
	float PelvisCoupling = 0.35f;

	virtual void TickComponent(float Dt, ELevelTick, FActorComponentTickFunction*) override;

	// drive the ragdoll bodies toward the current animated pose with poise-scaled PD, then clamp every
	// body's linear velocity to MAX_BODY_VEL (the immutable cap). Poise01 in [0,1].
	UFUNCTION(BlueprintCallable, Category="Bannon|Ragdoll")
	void DriveToPose(float Poise01);

	// pop the blend to physics on a hit (decays back over ~0.6s), like the web _physBlend.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ragdoll")
	void ImpactBlend(float Amount) { PhysBlend = FMath::Clamp(FMath::Max(PhysBlend, Amount), 0.f, 1.f); }

	// Route an impact into the ragdoll: impulse (cm/s * kg) at WorldPos on BoneName. The struck body
	// takes the full impulse; a PelvisCoupling share is added to the pelvis so the whole body reacts
	// (ported from the reference's "hit a body part -> drive root/hips" reaction). Also pops PhysBlend.
	// Impulse magnitude is derived by gameplay from visceralImpact(); this method only routes it and
	// enforces the MAX_BODY_VEL cap afterward. Struck-body vertical share is trimmed (whip back, not up).
	UFUNCTION(BlueprintCallable, Category="Bannon|Ragdoll")
	void ApplyHitReaction(FName BoneName, FVector WorldImpulse, FVector WorldPos, float BlendPop = 0.7f);

	// The reference's velocity-drive active ragdoll (tigershan1130 AnimNode_ActiveRagdoll): instead of
	// PD torque motors, push each simulated body's linear+angular velocity toward its animated target
	// this frame, weighted by (1-PhysBlend) so a fully-blended-out body is fully physical. Alternative
	// to DriveToPose's Physical Animation path — pick one per fighter. Poise scales the tracking weight.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ragdoll")
	void DriveBodyVelocities(float Poise01, float Dt);

protected:
	virtual void BeginPlay() override;

	// clamp every simulated body's linear velocity to MAX_BODY_VEL (shared by both drive paths).
	void EnforceVelocityCap();
};
