// Copyright BANNON.

#pragma once

// BANNON active ragdoll for Chaos. This is the UE half of native/include/bannon_rig.h: the SAME
// 15-joint hierarchy and the SAME PD gains (kp 900 / kd 60) that the tested native solver and the
// Three.js build run, expressed as Chaos physical-animation drives + constraint drives so one set of
// laws produces one feel in every build.
//
// Three things this owns that the previous version did not:
//   1. PD DRIVE per joint from bannon_rig's gains, scaled by POISE (a dazed wrestler tracks animation
//      worse — the motors go slack rather than the animation being swapped out).
//   2. MAX_BODY_VEL enforcement. The native law is 3.8 m/s per part; UE works in CENTIMETRES, so the
//      cap applied to every body is 380 cm/s. Without it the ragdoll launches on big impacts and the
//      web and UE builds visibly disagree.
//   3. Real joint stiffness — walks the PhysicsAsset constraint drives instead of storing a
//      multiplier and doing nothing with it (the old SetJointStiffness admitted it was a no-op).

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRagdollComponent.generated.h"

class USkeletalMeshComponent;
class UPhysicalAnimationComponent;

/** One native rig joint mapped to a real skeleton bone. */
USTRUCT(BlueprintType)
struct FBannonJointMap
{
	GENERATED_BODY()

	/** Index into the native rig (bannon_rig.h JOINT_* enum: 0=pelvis, 1=chest, 2=head, ...). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Rig")
	int32 NativeJoint = 0;

	/** Bone on the imported skeleton this joint drives (UniRig output uses mixamorig: names). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Rig")
	FName BoneName;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRagdollComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonRagdollComponent();

	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	// ── impact / reaction ────────────────────────────────────────────────────────────────────────
	/** Blends the skeletal mesh into physical simulation (0 = animation, 1 = full ragdoll). */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ImpactBlend(float BlendWeight);

	/** Impulse on one joint. Mirrors Ragdoll::applyHit: the struck limb drops to a semi-limp motor
	 *  blend (0.35) and recovers, so the hit gives naturally instead of the whole body going limp. */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyJointHit(FName BoneName, FVector Impulse, float LimbBlendWeight = 0.35f);

	/** Applies a physical impulse to every body below the root. */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyReversalImpulse(FVector ImpulseVector);

	/** Alters core balance by offsetting the centre of mass. */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ShiftCenterOfMass(FVector Offset);

	/** Scales every PhysicsAsset constraint drive (bracing / blocking / going limp). REAL: walks the
	 *  constraint instances and rewrites their angular + linear drive params. */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void SetJointStiffness(float StiffnessScale);

	// ── PD drive (bannon_rig parity) ─────────────────────────────────────────────────────────────
	/** Pushes the native PD gains (kp/kd, scaled by Poise and per-limb blend) into Chaos physical
	 *  animation for every mapped joint. Runs on BeginPlay; call again after a mesh swap. */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyNativePDProfile();

	/** Poise 0..1 from the native WrestlerState. 1 = composed (motors at full kp), 0 = dazed (motors
	 *  slack, body rides physics). Clamped; re-applies the PD profile. */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void SetPoiseNormalized(float InPoise01);

	/** Builds constraint limits + drives for the whole PhysicsAsset from the native joint hierarchy
	 *  (bannon_rig JOINT_PARENT), so a freshly imported fighter is playable without hand-authoring 15
	 *  constraints. Returns how many constraints it configured. */
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	int32 SetupPhysicsAssetFromNativeRig();

	/** Current ragdoll blend (0..1), for the anim graph / debug HUD. */
	UFUNCTION(BlueprintPure, Category="Bannon|Physics")
	float GetCurrentBlend() const { return CurrentBlend; }

	/** The MAX_BODY_VEL law expressed in UE centimetres per second (3.8 m/s -> 380 cm/s). */
	UFUNCTION(BlueprintPure, Category="Bannon|Laws")
	static float MaxBodyVelCmPerSec();

	/** 15 native joints -> skeleton bones. Defaults to the mixamorig: names UniRig/rename_bones emit. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Rig")
	TArray<FBannonJointMap> JointMap;

	/** Root body that blends/impulses propagate from. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Rig")
	FName RootBoneName;

	/** How fast the ragdoll blend decays back to animation (per second). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float BlendRecoveryRate;

	/** Per-limb motor blend recovery rate. bannon_rig recovers at 2.0/sec — kept identical. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float LimbBlendRecoveryRate;

protected:
	virtual void BeginPlay() override;

private:
	USkeletalMeshComponent* GetMeshComp() const;
	UPhysicalAnimationComponent* GetPhysAnim();
	void SeedDefaultJointMap();
	/** Hard-clamps every body's linear velocity to the MAX_BODY_VEL law (in cm/s). */
	void EnforceVelocityCap();

	float CurrentBlend;
	FVector COMOffset;
	float TargetStiffness;
	float Poise01;

	/** Per-bone motor blend (bannon_rig PDJoint::blend). 1 = motored, low = limp limb. */
	TMap<FName, float> LimbBlend;

	UPROPERTY(Transient)
	UPhysicalAnimationComponent* PhysAnim;
};
