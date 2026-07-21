// AI ORIENTATION BLOCK v114
#include "BannonCombatAnimator.h"
#include "BannonCharacter.h"
#include "Components/SkeletalMeshComponent.h"
#include "PhysicsEngine/PhysicsConstraintComponent.h"
#include "Animation/AnimInstance.h"

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
            if (OwnerMesh) {
                OwnerMesh->CustomTimeDilation = 1.0f; // Restore normal time post-hitstop
            }
        }
    }

    // Continually extract root motion to drive the physics proxy when not frozen
    if (!bIsHitStopActive) {
        ExtractAndApplyRootMotion(DeltaTime);
    }
}

void UBannonCombatAnimator::ExtractAndApplyRootMotion(float DeltaTime) {
    if (!OwnerMesh || !OwnerMesh->GetAnimInstance()) return;

    UAnimInstance* AnimInst = OwnerMesh->GetAnimInstance();
    FTransform RootMotion = AnimInst->ConsumeExtractedRootMotion(1.0f); 

    if (!RootMotion.GetTranslation().IsNearlyZero()) {
        AActor* Owner = GetOwner();
        if (Owner) {
            // Convert Root Motion delta into velocity for physics laws verification
            FVector TargetVelocity = RootMotion.GetTranslation() / DeltaTime;
            
            // Enforce MAX_BODY_VEL (3.8m/s = 380cm/s) from BannonPhysicsLaws natively
            bannon::Vec3 NativeVel = { static_cast<float>(TargetVelocity.X), static_cast<float>(TargetVelocity.Y), static_cast<float>(TargetVelocity.Z) };
            bannon::PhysicsLaws::EnforceVelocity(NativeVel);
            
            FVector EnforcedVelocity(NativeVel.x, NativeVel.y, NativeVel.z);
            
            // Sweep the collision capsule along the enforced root motion vector
            // bSweep = true ensures foot planting stability against the floor/environment
            Owner->AddActorWorldOffset(EnforcedVelocity * DeltaTime, true);
        }
    }
}

void UBannonCombatAnimator::TriggerHitStop(float DurationFrames) {
    if (!OwnerMesh) return;

    // Assuming 60fps base logic: 1 frame = ~0.0166s
    CurrentHitStopTimer = DurationFrames * (1.0f / 60.0f);
    bIsHitStopActive = true;
    
    // Massive localized time dilation to simulate physical impact weight without global network desync
    OwnerMesh->CustomTimeDilation = 0.01f; 
}

void UBannonCombatAnimator::BlendActiveRagdollLimb(FName BoneName, float BlendWeight) {
    if (!OwnerMesh) return;
    
    // Activate proxy simulation for the specific bone chain (Jolt/Chaos wrapper)
    OwnerMesh->SetAllBodiesBelowSimulatePhysics(BoneName, true, true);
    
    // Linearly blend the kinematic animation frame into the active simulation
    OwnerMesh->SetAllBodiesBelowPhysicsBlendWeight(BoneName, BlendWeight, false, true);
}

void UBannonCombatAnimator::ApplyRealisticJointLimits(FName JointName, float Swing1Limit, float Swing2Limit, float TwistLimit) {
    if (!OwnerMesh || !OwnerMesh->GetPhysicsAsset()) return;
    
    // Interfacing natively with UE's physical constraint system
    FConstraintInstance* Constraint = OwnerMesh->FindConstraintInstance(JointName);
    if (Constraint) {
        Constraint->SetAngularSwing1Limit(ACM_Limited, Swing1Limit);
        Constraint->SetAngularSwing2Limit(ACM_Limited, Swing2Limit);
        Constraint->SetAngularTwistLimit(ACM_Limited, TwistLimit);
    }
}

void UBannonCombatAnimator::ExecuteRealityCheck(ABannonCharacter* Target) {
    if (!Target) return;

    // Tyneshia's signature God Within Mode mechanic.
    // Explicitly bypasses normal damage scaling to force a direct absolute crumple via Poise break.
    float RealityCheckDamage = 9999.0f; 
    
    FHitResult DummyHit;
    DummyHit.BoneName = TEXT("spine_03"); // Targets the upper thoracic matrix to force a full-body collapse
    
    // Target takes the hit, instantly breaking poise, activating the ragdoll spine, and triggering 15f hitstop
    Target->ProcessHit(DummyHit, RealityCheckDamage, 15.0f);
    
    // Lock the cervical and thoracic joints to realistic limits to prevent spaghetti-flipping during the massive impact
    ApplyRealisticJointLimits(TEXT("spine_03"), 45.0f, 45.0f, 20.0f);
    ApplyRealisticJointLimits(TEXT("neck_01"), 30.0f, 30.0f, 15.0f);
}
