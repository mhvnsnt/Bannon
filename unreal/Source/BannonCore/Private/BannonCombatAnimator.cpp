// AI ORIENTATION BLOCK v114
#include "BannonCombatAnimator.h"
#include "BannonCharacter.h"
#include "Components/SkeletalMeshComponent.h"
#include "Animation/AnimInstance.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "BannonPhysicsLaws.h"

UBannonCombatAnimator::UBannonCombatAnimator() {
    PrimaryComponentTick.bCanEverTick = true;
    CurrentHitStopTimer = 0.0f;
    bIsHitStopActive = false;
    OwnerMesh = nullptr;
}

void UBannonCombatAnimator::InitializeAnimator(USkeletalMeshComponent* InMesh) {
    OwnerMesh = InMesh;
}

void UBannonCombatAnimator::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (bIsHitStopActive) {
        CurrentHitStopTimer -= DeltaTime;
        if (CurrentHitStopTimer <= 0.0f) {
            bIsHitStopActive = false;
            if (OwnerMesh) OwnerMesh->CustomTimeDilation = 1.0f;
        }
    }

    if (!bIsHitStopActive) ExtractAndApplyRootMotion(DeltaTime);
}

void UBannonCombatAnimator::ExtractAndApplyRootMotion(float DeltaTime) {
    if (!OwnerMesh || !OwnerMesh->GetAnimInstance() || DeltaTime <= 0.0f) return;

    const FTransform RootMotion = OwnerMesh->GetAnimInstance()->ConsumeExtractedRootMotion(1.0f);
    const FVector Delta = RootMotion.GetTranslation();
    if (Delta.IsNearlyZero()) return;

    const FVector RequestedVelocity = Delta / DeltaTime;
    bannon::Vec3 NativeVel = {
        static_cast<float>(RequestedVelocity.X),
        static_cast<float>(RequestedVelocity.Y),
        static_cast<float>(RequestedVelocity.Z)
    };
    bannon::PhysicsLaws::EnforceVelocity(NativeVel);
    const FVector EnforcedVelocity(NativeVel.x, NativeVel.y, NativeVel.z);

    UE_LOG(LogTemp, Verbose,
        TEXT("Bannon RootMotion Measurement | Requested=%s Enforced=%s"),
        *RequestedVelocity.ToString(), *EnforcedVelocity.ToString());

    // Animation does not write the actor transform. CharacterMovement is the
    // sole capsule/root locomotion authority. A future explicit root-motion
    // submission path must hand this velocity to that authority.
}

void UBannonCombatAnimator::TriggerHitStop(float DurationFrames) {
    if (!OwnerMesh) return;
    CurrentHitStopTimer = DurationFrames * (1.0f / 60.0f);
    bIsHitStopActive = true;
    OwnerMesh->CustomTimeDilation = 0.01f;
}

void UBannonCombatAnimator::BlendActiveRagdollLimb(FName BoneName, float BlendWeight) {
    if (!OwnerMesh) return;
    OwnerMesh->SetAllBodiesBelowSimulatePhysics(BoneName, true, true);
    OwnerMesh->SetAllBodiesBelowPhysicsBlendWeight(BoneName, BlendWeight, false, true);
}

void UBannonCombatAnimator::ApplyRealisticJointLimits(FName JointName, float Swing1Limit, float Swing2Limit, float TwistLimit) {
    if (!OwnerMesh || !OwnerMesh->GetPhysicsAsset()) return;

    FConstraintInstance* Constraint = OwnerMesh->FindConstraintInstance(JointName);
    if (Constraint) {
        Constraint->SetAngularSwing1Limit(ACM_Limited, Swing1Limit);
        Constraint->SetAngularSwing2Limit(ACM_Limited, Swing2Limit);
        Constraint->SetAngularTwistLimit(ACM_Limited, TwistLimit);
    }
}

void UBannonCombatAnimator::ExecuteRealityCheck(ABannonCharacter* Target) {
    if (!Target) return;

    const float RealityCheckDamage = 9999.0f;
    FHitResult DummyHit;
    DummyHit.BoneName = TEXT("spine_03");
    Target->ProcessHit(DummyHit, RealityCheckDamage, 15.0f);

    ApplyRealisticJointLimits(TEXT("spine_03"), 45.0f, 45.0f, 20.0f);
    ApplyRealisticJointLimits(TEXT("neck_01"), 30.0f, 30.0f, 15.0f);
}
