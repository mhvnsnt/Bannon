#include "BannonProceduralStrikeHitbox.h"
#include "Components/SkeletalMeshComponent.h"
#include "PhysicsEngine/PhysicsConstraintComponent.h"

UBannonProceduralStrikeHitbox::UBannonProceduralStrikeHitbox()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonProceduralStrikeHitbox::CalculateJointConstraintStress(UPhysicsConstraintComponent* TargetJoint, float AppliedVelocity)
{
    if (!TargetJoint) return;

    float ClampedVelocity = FMath::Clamp(AppliedVelocity, 0.0f, 3.8f); 

    float CurrentTwist = TargetJoint->ConstraintInstance.GetCurrentTwist();
    float TwistLimit = TargetJoint->ConstraintInstance.AngularPlasticityLimit;
    
    float SimulatedStress = CurrentTwist + (ClampedVelocity * 8.0f); 

    if (SimulatedStress > TwistLimit)
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Structural Yield Triggered on %s. Stress: %f"), *TargetJoint->GetFName().ToString(), SimulatedStress);
        // BroadcastYieldStateToTelemetry(TargetJoint->GetFName(), SimulatedStress);
    }
}

void UBannonProceduralStrikeHitbox::CalculateTargetedStrike(FVector AttackerLimbPos, FVector AttackerLimbVelocity, USkeletalMeshComponent* DefenderMesh, FName TargetBone)
{
    if (!DefenderMesh) return;

    const float MAX_BODY_VEL = 3.8f;
    const float DMG_SCALE = 8.0f;

    FVector DefenderBonePos = DefenderMesh->GetSocketLocation(TargetBone);
    FVector IntersectionVector = DefenderBonePos - AttackerLimbPos;
    IntersectionVector.Normalize();

    FVector SurfaceNormal = DefenderMesh->GetRightVector();
    float HitAngleDot = FVector::DotProduct(IntersectionVector, SurfaceNormal);

    FVector ClampedVelocity = AttackerLimbVelocity;
    if (ClampedVelocity.Size() > (MAX_BODY_VEL * 100.f))
    {
        ClampedVelocity = ClampedVelocity.GetSafeNormal() * (MAX_BODY_VEL * 100.f);
    }

    float TransferredEnergy = ClampedVelocity.Size() / 100.f;

    if (FMath::Abs(HitAngleDot) < 0.5f)
    {
        TransferredEnergy *= 0.4f;
    }

    float PoiseDamage = TransferredEnergy * DMG_SCALE;
    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Strike calculated. Poise Damage: %f. Triggering independent crumple state."), PoiseDamage);
}
