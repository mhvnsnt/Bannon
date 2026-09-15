// Copyright BANNON.

#include "BannonPhysicalAnimation.h"
#include "BannonPoseAuthorityComponent.h"
#include "GameFramework/Actor.h"

UBannonPhysicalAnimation::UBannonPhysicalAnimation()
{
    ReactionMultiplier = 1.2f;
    bUseControlRigIKMapping = true;
    DefaultProfile.LinearStrength = 400.0f;
    DefaultProfile.AngularStrength = 1200.0f;
    DefaultProfile.LinearDamping = 8.0f;
    DefaultProfile.AngularDamping = 20.0f;
}

void UBannonPhysicalAnimation::BeginPhysicalResponse(FName BoneName)
{
    if (BoneName.IsNone()) return;
    if (UBannonPoseAuthorityComponent* Authority = FindComponentByClass<UBannonPoseAuthorityComponent>())
    {
        if (!Authority->ClaimBone(BoneName, EBannonPoseOwner::Physical))
            return;
    }
    ActiveBone = BoneName;
    bPhysicalResponseActive = true;
}

void UBannonPhysicalAnimation::EndPhysicalResponse()
{
    bPhysicalResponseActive = false;
    ActiveBone = NAME_None;
}

void UBannonPhysicalAnimation::ApplyHitReaction(FName BoneName, FVector StrikeVelocity, float MassRatio)
{
    if (BoneName.IsNone() || StrikeVelocity.ContainsNaN() || !FMath::IsFinite(MassRatio)) return;

    BeginPhysicalResponse(BoneName);
    if (!bPhysicalResponseActive) return;

    const FVector CalculatedImpulse = StrikeVelocity * MassRatio * ReactionMultiplier;
    const float ImpulseMagnitude = CalculatedImpulse.Size();
    UE_LOG(LogTemp, Log, TEXT("Bannon PAC: bone=%s impulse=%f"), *BoneName.ToString(), ImpulseMagnitude);

    if (ImpulseMagnitude > 800.0f)
    {
        FBannonPhysicsProfile ImpactProfile = DefaultProfile;
        ImpactProfile.AngularStrength *= 0.15f;
        ImpactProfile.LinearStrength *= 0.25f;
        ConfigureBannonPhysicsAsset(BoneName, ImpactProfile);
    }
}

void UBannonPhysicalAnimation::ConfigureBannonPhysicsAsset(const FName& BoneName, const FBannonPhysicsProfile& Profile)
{
    if (BoneName.IsNone() || !bPhysicalResponseActive || ActiveBone != BoneName) return;

    FPhysicalAnimationData Data;
    Data.BodyName = BoneName;
    Data.bIsLocalSimulation = true;
    Data.OrientationStrength = Profile.AngularStrength;
    Data.AngularVelocityStrength = Profile.AngularDamping;
    Data.PositionStrength = Profile.LinearStrength;
    Data.VelocityStrength = Profile.LinearDamping;
    Data.MaxLinearForce = 0.0f;
    Data.MaxAngularForce = 0.0f;
    ApplyPhysicalAnimationSettings(BoneName, Data);
}
