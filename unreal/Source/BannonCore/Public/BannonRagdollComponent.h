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

	virtual void TickComponent(float Dt, ELevelTick, FActorComponentTickFunction*) override;

	// drive the ragdoll bodies toward the current animated pose with poise-scaled PD, then clamp every
	// body's linear velocity to MAX_BODY_VEL (the immutable cap). Poise01 in [0,1].
	UFUNCTION(BlueprintCallable, Category="Bannon|Ragdoll")
	void DriveToPose(float Poise01);

	// pop the blend to physics on a hit (decays back over ~0.6s), like the web _physBlend.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ragdoll")
	void ImpactBlend(float Amount) { PhysBlend = FMath::Clamp(FMath::Max(PhysBlend, Amount), 0.f, 1.f); }

protected:
	virtual void BeginPlay() override;
};
