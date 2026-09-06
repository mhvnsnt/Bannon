#include "BannonWeaponPhysicsComponent.h"
#include "BannonCombatAnimator.h"
#include "BannonProceduralImpactAudio.h"
#include "GameFramework/Actor.h"

UBannonWeaponPhysicsComponent::UBannonWeaponPhysicsComponent() {
    PrimaryComponentTick.bCanEverTick = false;
    BaseWeaponMass = 5.0f; // Default mass for a steel chair
    HardnessMultiplier = 1.5f;
}

void UBannonWeaponPhysicsComponent::RegisterWeaponImpact(AActor* HitActor, FVector HitVelocity, UPrimitiveComponent* HitComponent) {
    if (!HitActor) return;
    
    // 1. Calculate raw Jolt physics force based on weapon mass and swing velocity
    float ImpactForce = (HitVelocity.Size() / 100.0f) * BaseWeaponMass * HardnessMultiplier;
    ImpactForce = FMath::Clamp(ImpactForce, 0.0f, 8.0f); // Bounded by DMG_SCALE

    // 2. Route directly to the Combat Animator to trigger hit-stop and active ragdolls
    UBannonCombatAnimator* CombatAnim = HitActor->FindComponentByClass<UBannonCombatAnimator>();
    if (CombatAnim) {
        CombatAnim->ProcessActiveRagdoll(HitComponent ? HitComponent->GetFName() : TEXT("bone_Spine_02"), ImpactForce);
        CombatAnim->ApplyHitStop(5, 0.01f); // Extreme time dilation for weapon strikes
    }

    // 3. Delegate to Procedural Audio generator natively attached to this weapon
    UBannonProceduralImpactAudio* ProcAudio = GetOwner()->FindComponentByClass<UBannonProceduralImpactAudio>();
    if (ProcAudio) {
        ProcAudio->SynthesizeImpactSound(ImpactForce, HardnessMultiplier);
    }
}
