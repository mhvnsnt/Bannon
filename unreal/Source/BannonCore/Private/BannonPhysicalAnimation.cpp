// Copyright BANNON.

#include "BannonPhysicalAnimation.h"

UBannonPhysicalAnimation::UBannonPhysicalAnimation()
{
	ReactionMultiplier = 1.2f;
	bUseControlRigIKMapping = true;
	
	DefaultProfile.LinearStrength = 400.0f;
	DefaultProfile.AngularStrength = 1200.0f;
	DefaultProfile.LinearDamping = 8.0f;
	DefaultProfile.AngularDamping = 20.0f;
}

void UBannonPhysicalAnimation::ApplyHitReaction(FName BoneName, FVector StrikeVelocity, float MassRatio)
{
	// Calculate dynamic impulse based on mass ratio and velocity vector
	FVector CalculatedImpulse = StrikeVelocity * MassRatio * ReactionMultiplier;
	float ImpulseMagnitude = CalculatedImpulse.Size();

	UE_LOG(LogTemp, Log, TEXT("Bannon PAC: Applying dynamic strike hit reaction. Bone: %s, MassRatio: %f, Velocity: %s, Resulting Impulse: %f N"),
		*BoneName.ToString(), MassRatio, *StrikeVelocity.ToString(), ImpulseMagnitude);

	// Dynamically loosen the joint on heavy impact to simulate joint shock
	if (ImpulseMagnitude > 800.0f)
	{
		FBannonPhysicsProfile ImpactProfile = DefaultProfile;
		ImpactProfile.AngularStrength *= 0.15f; // Major loss of control, going limp
		ImpactProfile.LinearStrength *= 0.25f;
		ConfigureBannonPhysicsAsset(BoneName, ImpactProfile);
		
		UE_LOG(LogTemp, Warning, TEXT("Bannon PAC: Critical joint impact! Loosening %s constraint to simulate physical stun/daze reaction."), *BoneName.ToString());
	}
}

void UBannonPhysicalAnimation::ConfigureBannonPhysicsAsset(const FName& BoneName, const FBannonPhysicsProfile& Profile)
{
	// Hooks into the Unreal skeletal physical animation data.
	// FIELD NAMES: FPhysicalAnimationData only has BodyName, bIsLocalSimulation, OrientationStrength,
	// AngularVelocityStrength, PositionStrength, VelocityStrength, MaxLinearForce, MaxAngularForce.
	// This previously assigned bIsLocalSpaceSimulation / JointStrength / SkeletalMeshComponentBudget and
	// called ApplyPhysicalAnimationData() — none of which exist, so the module could not compile.
	// Angular terms drive orientation, linear terms drive position: the same PD split as bannon_rig.
	FPhysicalAnimationData Data;
	Data.BodyName = BoneName;
	Data.bIsLocalSimulation = true;
	Data.OrientationStrength = Profile.AngularStrength;
	Data.AngularVelocityStrength = Profile.AngularDamping;
	Data.PositionStrength = Profile.LinearStrength;
	Data.VelocityStrength = Profile.LinearDamping;
	Data.MaxLinearForce = 0.0f;    // 0 = unlimited; UBannonRagdollComponent's MAX_BODY_VEL cap bounds motion
	Data.MaxAngularForce = 0.0f;

	ApplyPhysicalAnimationSettings(BoneName, Data);
}
