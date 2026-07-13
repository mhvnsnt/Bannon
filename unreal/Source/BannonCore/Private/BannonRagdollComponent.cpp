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
