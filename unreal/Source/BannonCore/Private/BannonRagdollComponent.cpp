// Copyright BANNON.
#include "BannonRagdollComponent.h"
#include "BannonBridge.h"
#include "Components/SkeletalMeshComponent.h"
#include "PhysicsEngine/PhysicsAsset.h"
#include "PhysicsEngine/PhysicalAnimationComponent.h"
#include "PhysicsEngine/BodyInstance.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_core.h"
THIRD_PARTY_INCLUDES_END

// the 15 core joints, Mixamo-named — must match the PhysicsAsset body names + the auto-skinner rig.
static const TCHAR* kBoneNames[] = {
	TEXT("Hips"), TEXT("Spine"), TEXT("Head"),
	TEXT("LeftArm"), TEXT("LeftForeArm"), TEXT("LeftHand"),
	TEXT("RightArm"), TEXT("RightForeArm"), TEXT("RightHand"),
	TEXT("LeftUpLeg"), TEXT("LeftLeg"), TEXT("LeftFoot"),
	TEXT("RightUpLeg"), TEXT("RightLeg"), TEXT("RightFoot")
};

UBannonRagdollComponent::UBannonRagdollComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UBannonRagdollComponent::BeginPlay()
{
	Super::BeginPlay();
	if (!Mesh) { if (AActor* O = GetOwner()) Mesh = O->FindComponentByClass<USkeletalMeshComponent>(); }
	if (Mesh)
	{
		// Physical Animation profile: motors chase the animated pose; MAX_BODY_VEL enforced in Tick.
		Mesh->SetEnablePhysicsBlending(true);
	}
}

void UBannonRagdollComponent::TickComponent(float Dt, ELevelTick TickType, FActorComponentTickFunction* Fn)
{
	Super::TickComponent(Dt, TickType, Fn);
	if (PhysBlend > 0.f) PhysBlend = FMath::Max(0.f, PhysBlend - Dt * 1.6f);   // decay to the clean pose
}

void UBannonRagdollComponent::DriveToPose(float Poise01)
{
	if (!Mesh) return;
	const float k = 0.55f + 0.45f * FMath::Clamp(Poise01, 0.f, 1.f);   // poise-driven motor scale
	const float stiff = MotorStiffness * k, damp = MotorDamping * k;

	for (const TCHAR* Bone : kBoneNames)
	{
		const FName BN(Bone);
		if (Mesh->GetBoneIndex(BN) == INDEX_NONE) continue;
		// blend each body between kinematic (animated) and simulated by PhysBlend; drive with PD.
		Mesh->SetAllBodiesBelowPhysicsBlendWeight(BN, PhysBlend, /*skipCustom*/ false, /*includeSelf*/ true);
		Mesh->SetAllBodiesBelowSimulatePhysics(BN, PhysBlend > 0.01f, true);
	}
	// Physical Animation Component (assigned in BP) applies the stiff/damp profile; here we just set
	// the drive strength scalar so gameplay code can dial it from poise.
	if (UPhysicalAnimationComponent* PAC = GetOwner() ? GetOwner()->FindComponentByClass<UPhysicalAnimationComponent>() : nullptr)
	{
		FPhysicalAnimationData D; D.bIsLocalSimulation = true;
		D.OrientationStrength = stiff; D.AngularVelocityStrength = damp;
		D.PositionStrength = stiff; D.VelocityStrength = damp;
		PAC->ApplyPhysicalAnimationSettingsBelow(FName(TEXT("Hips")), D, false);
	}

	// IMMUTABLE CAP: clamp every simulated body's linear velocity to MAX_BODY_VEL (m/s -> cm/s).
	EnforceVelocityCap();
}

void UBannonRagdollComponent::EnforceVelocityCap()
{
	if (!Mesh) return;
	const float capCm = bannon::MAX_BODY_VEL * BannonBridge::UE_M;
	for (const TCHAR* Bone : kBoneNames)
	{
		if (FBodyInstance* BI = Mesh->GetBodyInstance(FName(Bone)))
		{
			FVector V = BI->GetUnrealWorldVelocity();
			if (V.SizeSquared() > capCm * capCm) BI->SetLinearVelocity(V.GetClampedToMaxSize(capCm), false);
		}
	}
}

void UBannonRagdollComponent::ApplyHitReaction(FName BoneName, FVector WorldImpulse, FVector WorldPos, float BlendPop)
{
	if (!Mesh) return;
	ImpactBlend(BlendPop);

	// Struck-body vertical share is trimmed so the hit whips the body BACK, not launches it UP — the
	// same lesson as the web engine's visceralImpact "head/struck-node vertical share cut" flail fix.
	FVector Imp = WorldImpulse;
	if (Imp.Z > 0.f) Imp.Z *= 0.45f;

	// make sure the struck body (and everything below it) is actually simulating so it can take the hit.
	Mesh->SetAllBodiesBelowSimulatePhysics(BoneName, true, /*includeSelf*/ true);
	if (FBodyInstance* Struck = Mesh->GetBodyInstance(BoneName))
	{
		Struck->AddImpulseAtPosition(Imp, WorldPos);
	}

	// COUPLE INTO THE PELVIS: a share of the impact drives the root so the whole body reacts as one
	// (reference behavior — hitting a limb shoves the hips). Horizontal only; keep the pelvis grounded.
	const float coupling = FMath::Clamp(PelvisCoupling, 0.f, 1.f);
	if (coupling > 0.f)
	{
		if (FBodyInstance* Pelvis = Mesh->GetBodyInstance(FName(TEXT("Hips"))))
		{
			Mesh->SetAllBodiesBelowSimulatePhysics(FName(TEXT("Hips")), true, true);
			FVector Coupled = Imp * coupling; Coupled.Z *= 0.5f;   // hips take mostly the lateral shove
			Pelvis->AddImpulse(Coupled, /*bVelChange*/ false);
		}
	}

	EnforceVelocityCap();
}

void UBannonRagdollComponent::DriveBodyVelocities(float Poise01, float Dt)
{
	// Ported from tigershan1130/UE5-active-ragdoll AnimNode_ActiveRagdoll::PhysicsTick: rather than PD
	// torque, set each simulated body's linear/angular velocity so it moves toward its ANIMATED target
	// pose over Dt. Weight by poise and (1-PhysBlend): a fully-blended-out (struck) body is left alone
	// to be physical; an upright, high-poise body is snapped tightly onto the animation.
	if (!Mesh || Dt <= KINDA_SMALL_NUMBER) return;
	const float poise = FMath::Clamp(Poise01, 0.f, 1.f);
	const float track = (0.35f + 0.65f * poise) * (1.f - FMath::Clamp(PhysBlend, 0.f, 1.f));
	if (track <= 0.f) { EnforceVelocityCap(); return; }

	for (const TCHAR* Bone : kBoneNames)
	{
		const FName BN(Bone);
		FBodyInstance* BI = Mesh->GetBodyInstance(BN);
		if (!BI || !BI->IsInstanceSimulatingPhysics()) continue;

		// target = where the animation wants this bone this frame (component-space anim pose in world).
		const FTransform Target = Mesh->GetSocketTransform(BN, RTS_World);      // reflects the animated pose
		const FVector CurLoc = BI->GetUnrealWorldTransform().GetLocation();

		// linear: velocity that closes the gap in one frame, scaled by the tracking weight.
		FVector LinVel = ((Target.GetLocation() - CurLoc) / Dt) * track;
		BI->SetLinearVelocity(LinVel, /*bAddToCurrent*/ false);

		// angular: shortest-arc rotation delta -> angular velocity (radians/s), scaled by tracking weight.
		const FQuat CurRot = BI->GetUnrealWorldTransform().GetRotation();
		FQuat Diff = Target.GetRotation() * CurRot.Inverse();
		Diff.EnforceShortestArcWith(FQuat::Identity);
		FVector Axis; float Angle; Diff.ToAxisAndAngle(Axis, Angle);
		FVector AngVel = Axis.GetSafeNormal() * (Angle / Dt) * track;
		BI->SetAngularVelocityInRadians(AngVel, false);
	}
	EnforceVelocityCap();
}
