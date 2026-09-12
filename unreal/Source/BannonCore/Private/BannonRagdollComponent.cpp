// Copyright BANNON.

#include "BannonRagdollComponent.h"

#include "GameFramework/Character.h"
#include "Components/SkeletalMeshComponent.h"
#include "PhysicsEngine/PhysicalAnimationComponent.h"
#include "PhysicsEngine/PhysicsAsset.h"
#include "PhysicsEngine/PhysicsConstraintTemplate.h"
#include "PhysicsEngine/ConstraintInstance.h"
#include "PhysicsEngine/BodyInstance.h"

// THE BRIDGE: the same header-only laws the web build and the ctest suite run. Included in the .cpp
// only — bannon's Vec3/Ragdoll types stay out of the UE header so nothing collides with FVector.
#include "bannon_core.h"
#include "bannon_rig.h"

namespace
{
	/** UE is centimetres, the native laws are metres. One conversion, stated once. */
	constexpr float BANNON_M_TO_CM = 100.0f;

	/** Native joint index -> default bone name, in bannon_rig.h's JOINT_* order exactly:
	 *  pelvis, chest, head, shL, elL, haL, shR, elR, haR, hipL, knL, ftL, hipR, knR, ftR.
	 *  These are the mixamorig: names tools/unirig/rename_bones.cjs writes, so a UniRig-rigged
	 *  fighter maps with no hand editing. */
	static const TCHAR* kDefaultBoneNames[bannon::JOINT_COUNT] = {
		TEXT("mixamorig:Hips"),
		TEXT("mixamorig:Spine1"),
		TEXT("mixamorig:Head"),
		TEXT("mixamorig:LeftArm"),      TEXT("mixamorig:LeftForeArm"),  TEXT("mixamorig:LeftHand"),
		TEXT("mixamorig:RightArm"),     TEXT("mixamorig:RightForeArm"), TEXT("mixamorig:RightHand"),
		TEXT("mixamorig:LeftUpLeg"),    TEXT("mixamorig:LeftLeg"),      TEXT("mixamorig:LeftFoot"),
		TEXT("mixamorig:RightUpLeg"),   TEXT("mixamorig:RightLeg"),     TEXT("mixamorig:RightFoot")
	};
}

float UBannonRagdollComponent::MaxBodyVelCmPerSec()
{
	// 3.8 m/s -> 380 cm/s. Never hardcode 380 anywhere else; derive it from the law.
	return bannon::MAX_BODY_VEL * BANNON_M_TO_CM;
}

UBannonRagdollComponent::UBannonRagdollComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
	// clamp velocities AFTER Chaos has integrated, before the frame is drawn.
	PrimaryComponentTick.TickGroup = TG_PostPhysics;

	CurrentBlend = 0.0f;
	COMOffset = FVector::ZeroVector;
	TargetStiffness = 1.0f;
	Poise01 = 1.0f;
	RootBoneName = FName(kDefaultBoneNames[bannon::J_PELVIS]);
	BlendRecoveryRate = 2.0f;
	LimbBlendRecoveryRate = 2.0f;   // bannon_rig: blend += 2.0 * dt
	PhysAnim = nullptr;

	SeedDefaultJointMap();
}

void UBannonRagdollComponent::SeedDefaultJointMap()
{
	JointMap.Reset(bannon::JOINT_COUNT);
	for (int32 i = 0; i < bannon::JOINT_COUNT; ++i)
	{
		FBannonJointMap Entry;
		Entry.NativeJoint = i;
		Entry.BoneName = FName(kDefaultBoneNames[i]);
		JointMap.Add(Entry);
	}
}

USkeletalMeshComponent* UBannonRagdollComponent::GetMeshComp() const
{
	if (const ACharacter* AsChar = Cast<ACharacter>(GetOwner()))
	{
		return AsChar->GetMesh();
	}
	if (AActor* Owner = GetOwner())
	{
		return Owner->FindComponentByClass<USkeletalMeshComponent>();
	}
	return nullptr;
}

UPhysicalAnimationComponent* UBannonRagdollComponent::GetPhysAnim()
{
	if (PhysAnim)
	{
		return PhysAnim;
	}
	AActor* Owner = GetOwner();
	if (!Owner)
	{
		return nullptr;
	}
	// reuse the fighter's existing physical-animation component (BannonPhysicalAnimation derives from
	// it) rather than fighting it with a second driver on the same bodies.
	PhysAnim = Owner->FindComponentByClass<UPhysicalAnimationComponent>();
	if (!PhysAnim)
	{
		PhysAnim = NewObject<UPhysicalAnimationComponent>(Owner, TEXT("BannonPhysAnim_Auto"));
		if (PhysAnim)
		{
			PhysAnim->RegisterComponent();
		}
	}
	if (PhysAnim)
	{
		if (USkeletalMeshComponent* Mesh = GetMeshComp())
		{
			PhysAnim->SetSkeletalMeshComponent(Mesh);
		}
	}
	return PhysAnim;
}

void UBannonRagdollComponent::BeginPlay()
{
	Super::BeginPlay();

	for (const FBannonJointMap& Entry : JointMap)
	{
		LimbBlend.Add(Entry.BoneName, 1.0f);
	}

	SetupPhysicsAssetFromNativeRig();
	ApplyNativePDProfile();
}

void UBannonRagdollComponent::ApplyNativePDProfile()
{
	UPhysicalAnimationComponent* PA = GetPhysAnim();
	USkeletalMeshComponent* Mesh = GetMeshComp();
	if (!PA || !Mesh)
	{
		return;
	}

	// bannon_rig's PDJoint gains are the source of truth for BOTH builds.
	const bannon::PDJoint Reference;                       // kp 900, kd 60
	const float Kp = Reference.kp;
	const float Kd = Reference.kd;

	for (const FBannonJointMap& Entry : JointMap)
	{
		if (Entry.BoneName.IsNone())
		{
			continue;
		}
		const float* Found = LimbBlend.Find(Entry.BoneName);
		const float Blend = Found ? *Found : 1.0f;

		// PDJoint::drive multiplies BOTH terms by blend; poise scales how hard the wrestler can hold
		// the animation at all. A dazed fighter (low poise) has slack motors, which is what makes a
		// stagger read as physical instead of as a different animation.
		const float Scale = FMath::Clamp(Blend, 0.0f, 1.0f) * FMath::Clamp(Poise01, 0.0f, 1.0f) * TargetStiffness;

		FPhysicalAnimationData Data;
		Data.BodyName = Entry.BoneName;
		Data.bIsLocalSimulation = true;
		// kp -> position/orientation strength, kd -> velocity/angular-velocity strength: the same
		// proportional/derivative split, in Chaos' units.
		Data.OrientationStrength = Kp * Scale;
		Data.AngularVelocityStrength = Kd * Scale;
		Data.PositionStrength = Kp * Scale;
		Data.VelocityStrength = Kd * Scale;
		Data.MaxLinearForce = 0.0f;    // 0 = unlimited; the velocity cap below is what bounds motion
		Data.MaxAngularForce = 0.0f;

		PA->ApplyPhysicalAnimationSettings(Entry.BoneName, Data);
	}
}

void UBannonRagdollComponent::SetPoiseNormalized(float InPoise01)
{
	const float Clamped = FMath::Clamp(InPoise01, 0.0f, 1.0f);
	if (FMath::IsNearlyEqual(Clamped, Poise01, 0.01f))
	{
		return;    // don't re-push 15 profiles every frame for imperceptible changes
	}
	Poise01 = Clamped;
	ApplyNativePDProfile();
}

void UBannonRagdollComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

	// THE LAW: no part may exceed MAX_BODY_VEL. Runs post-physics, every frame, unconditionally.
	EnforceVelocityCap();

	// whole-body ragdoll blend decays back toward animation
	if (CurrentBlend > 0.0f)
	{
		CurrentBlend = FMath::Max(0.0f, CurrentBlend - DeltaTime * BlendRecoveryRate);
		if (USkeletalMeshComponent* Mesh = GetMeshComp())
		{
			Mesh->SetAllBodiesBelowPhysicsBlendWeight(RootBoneName, CurrentBlend);
		}
	}

	// per-limb motor blend recovery (bannon_rig: blend += 2.0 * dt, capped at 1)
	bool bAnyRecovered = false;
	for (TPair<FName, float>& Pair : LimbBlend)
	{
		if (Pair.Value < 1.0f)
		{
			Pair.Value = FMath::Min(1.0f, Pair.Value + DeltaTime * LimbBlendRecoveryRate);
			bAnyRecovered = true;
		}
	}
	if (bAnyRecovered)
	{
		ApplyNativePDProfile();
	}
}

void UBannonRagdollComponent::EnforceVelocityCap()
{
	USkeletalMeshComponent* Mesh = GetMeshComp();
	if (!Mesh)
	{
		return;
	}
	const float MaxVel = MaxBodyVelCmPerSec();
	const float MaxVelSq = MaxVel * MaxVel;

	for (FBodyInstance* Body : Mesh->Bodies)
	{
		if (!Body || !Body->IsInstanceSimulatingPhysics())
		{
			continue;
		}
		const FVector Vel = Body->GetUnrealWorldVelocity();
		// NaN guard: one bad frame from a degenerate constraint would otherwise poison the body
		// permanently (the R.A.B.B.I.T.S.F.O.O.T. sanitiser rule, applied locally).
		if (Vel.ContainsNaN())
		{
			Body->SetLinearVelocity(FVector::ZeroVector, /*bAddToCurrent*/ false);
			continue;
		}
		if (Vel.SizeSquared() > MaxVelSq)
		{
			Body->SetLinearVelocity(Vel.GetSafeNormal() * MaxVel, /*bAddToCurrent*/ false);
		}
	}
}

void UBannonRagdollComponent::ImpactBlend(float BlendWeight)
{
	CurrentBlend = FMath::Clamp(BlendWeight, 0.0f, 1.0f);
	if (USkeletalMeshComponent* Mesh = GetMeshComp())
	{
		Mesh->SetAllBodiesBelowPhysicsBlendWeight(RootBoneName, CurrentBlend);
	}
}

void UBannonRagdollComponent::ApplyJointHit(FName BoneName, FVector Impulse, float LimbBlendWeight)
{
	USkeletalMeshComponent* Mesh = GetMeshComp();
	if (!Mesh || BoneName.IsNone() || Impulse.ContainsNaN())
	{
		return;
	}

	// the struck limb goes semi-limp and recovers — Ragdoll::applyHit, not a full-body flop
	LimbBlend.Add(BoneName, FMath::Clamp(LimbBlendWeight, 0.0f, 1.0f));

	if (FBodyInstance* Body = Mesh->GetBodyInstance(BoneName))
	{
		Body->AddImpulse(Impulse, /*bVelChange*/ false);
	}
	ApplyNativePDProfile();
	// clamp immediately so a huge impulse is never visible above the law, even for one frame
	EnforceVelocityCap();
}

void UBannonRagdollComponent::ApplyReversalImpulse(FVector ImpulseVector)
{
	if (ImpulseVector.ContainsNaN())
	{
		return;
	}
	if (USkeletalMeshComponent* Mesh = GetMeshComp())
	{
		Mesh->AddImpulseToAllBodiesBelow(ImpulseVector, RootBoneName);
		EnforceVelocityCap();
	}
}

void UBannonRagdollComponent::ShiftCenterOfMass(FVector Offset)
{
	COMOffset = Offset;
	if (USkeletalMeshComponent* Mesh = GetMeshComp())
	{
		Mesh->SetCenterOfMass(COMOffset, RootBoneName);
	}
}

void UBannonRagdollComponent::SetJointStiffness(float StiffnessScale)
{
	TargetStiffness = FMath::Clamp(StiffnessScale, 0.0f, 10.0f);

	USkeletalMeshComponent* Mesh = GetMeshComp();
	if (!Mesh)
	{
		return;
	}

	// REAL implementation: walk the live constraint instances and rewrite their drive params. The
	// previous version stored the multiplier and admitted in a comment that it did nothing.
	const bannon::PDJoint Reference;                 // kp 900 / kd 60
	const float Spring = Reference.kp * TargetStiffness;
	const float Damping = Reference.kd * TargetStiffness;
	const float ForceLimit = 0.0f;                   // 0 = unlimited; the velocity cap bounds it

	for (FConstraintInstance* Constraint : Mesh->Constraints)
	{
		if (!Constraint)
		{
			continue;
		}
		Constraint->SetAngularDriveParams(Spring, Damping, ForceLimit);
		Constraint->SetLinearDriveParams(Spring, Damping, ForceLimit);
	}

	// the motors are the other half of "bracing" — push the scaled PD profile too
	ApplyNativePDProfile();
}

int32 UBannonRagdollComponent::SetupPhysicsAssetFromNativeRig()
{
	USkeletalMeshComponent* Mesh = GetMeshComp();
	if (!Mesh)
	{
		return 0;
	}
	UPhysicsAsset* Asset = Mesh->GetPhysicsAsset();
	if (!Asset)
	{
		return 0;
	}

	// bone name -> native joint index, so JOINT_PARENT can be read for any constraint we find
	TMap<FName, int32> BoneToJoint;
	for (const FBannonJointMap& Entry : JointMap)
	{
		if (!Entry.BoneName.IsNone() && Entry.NativeJoint >= 0 && Entry.NativeJoint < bannon::JOINT_COUNT)
		{
			BoneToJoint.Add(Entry.BoneName, Entry.NativeJoint);
		}
	}

	// Joint limits by role. A wrestling rig needs elbows/knees that hinge and a spine that only gives
	// a little, or the ragdoll folds through itself on every bump.
	auto IsHinge = [](int32 J)
	{
		return J == bannon::J_ELL || J == bannon::J_ELR || J == bannon::J_KNL || J == bannon::J_KNR;
	};
	auto IsSpine = [](int32 J)
	{
		return J == bannon::J_CHEST || J == bannon::J_HEAD;
	};

	const bannon::PDJoint Reference;
	int32 Configured = 0;

	for (UPhysicsConstraintTemplate* Template : Asset->ConstraintSetup)
	{
		if (!Template)
		{
			continue;
		}
		FConstraintInstance& CI = Template->DefaultInstance;

		// the constraint is named for the CHILD bone it drives
		const int32* FoundJoint = BoneToJoint.Find(CI.ConstraintBone1);
		const int32 Joint = FoundJoint ? *FoundJoint : INDEX_NONE;

		float Swing1 = 45.0f, Swing2 = 45.0f, Twist = 30.0f;
		if (Joint != INDEX_NONE)
		{
			if (IsHinge(Joint))
			{
				// elbows/knees: one axis of real travel, everything else locked
				Swing1 = 0.0f; Swing2 = 100.0f; Twist = 0.0f;
			}
			else if (IsSpine(Joint))
			{
				Swing1 = 20.0f; Swing2 = 20.0f; Twist = 20.0f;
			}
		}

		CI.SetAngularSwing1Limit(Swing1 > 0.0f ? EAngularConstraintMotion::ACM_Limited : EAngularConstraintMotion::ACM_Locked, Swing1);
		CI.SetAngularSwing2Limit(Swing2 > 0.0f ? EAngularConstraintMotion::ACM_Limited : EAngularConstraintMotion::ACM_Locked, Swing2);
		CI.SetAngularTwistLimit(Twist > 0.0f ? EAngularConstraintMotion::ACM_Limited : EAngularConstraintMotion::ACM_Locked, Twist);

		// limbs stay attached: the UE equivalent of constrainBone()'s solver iterations
		CI.SetLinearLimits(ELinearConstraintMotion::LCM_Locked, ELinearConstraintMotion::LCM_Locked, ELinearConstraintMotion::LCM_Locked, 0.0f);

		// drives seeded from the native PD gains so the asset is playable straight after import
		CI.SetAngularDriveParams(Reference.kp, Reference.kd, 0.0f);
		CI.SetLinearDriveParams(Reference.kp, Reference.kd, 0.0f);
		CI.SetOrientationDriveSLERP(true);

		++Configured;
	}

	// push the edited templates onto the running instances
	if (Configured > 0)
	{
		Mesh->RecreatePhysicsState();
	}

	UE_LOG(LogTemp, Log, TEXT("[BANNON] Ragdoll: configured %d PhysicsAsset constraints from the native rig (kp %.0f / kd %.0f, cap %.0f cm/s)."),
		Configured, Reference.kp, Reference.kd, MaxBodyVelCmPerSec());

	return Configured;
}
