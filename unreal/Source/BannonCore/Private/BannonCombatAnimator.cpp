#include "BannonCombatAnimator.h"

UBannonCombatAnimator::UBannonCombatAnimator() {
    PrimaryComponentTick.bCanEverTick = true;
    CurrentBlendWeight = 0.0f;
    HitStopTimeDilation = 1.0f;
    HitStopFramesRemaining = 0;
    bIsCrumpled = false;
}

void UBannonCombatAnimator::ApplyHitStop(int32 Frames, float DilationScale) {
    HitStopFramesRemaining = Frames;
    HitStopTimeDilation = DilationScale;
}

void UBannonCombatAnimator::ProcessActiveRagdoll(FName HitBone, float ImpactForce) {
    if (bIsCrumpled) return;
    if (ImpactForce > 8.0f) ImpactForce = 8.0f; // Clamp to DMG_SCALE
    CurrentBlendWeight = FMath::Clamp(ImpactForce / 8.0f, 0.0f, 1.0f);
    // Hands control of HitBone over to Jolt solver
}

void UBannonCombatAnimator::TriggerPoiseCrumple() {
    bIsCrumpled = true;
    CurrentBlendWeight = 1.0f;
    // Disconnect mocap input, force full body Jolt ragdoll
}

void UBannonCombatAnimator::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (HitStopFramesRemaining > 0) {
        HitStopFramesRemaining--;
        CustomTimeDilation = HitStopTimeDilation;
    } else {
        CustomTimeDilation = 1.0f;
    }

    if (CurrentBlendWeight > 0.0f && !bIsCrumpled) {
        CurrentBlendWeight = FMath::FInterpTo(CurrentBlendWeight, 0.0f, DeltaTime, 5.0f);
    }
}

void UBannonCombatAnimator::SerializeState(TArray<uint8>& OutBuffer) {
    // Push HitStopFramesRemaining, CurrentBlendWeight, and bIsCrumpled to GGPO byte buffer
}

void UBannonCombatAnimator::DeserializeState(const TArray<uint8>& InBuffer) {
    // Restore exact tick state from GGPO byte buffer
}

void UBannonCombatAnimator::SnapToFrame(float AnimSequenceTime, float InBlendWeight) {
    CurrentBlendWeight = InBlendWeight;
    // Lerp visual mesh back to server-verified frame within 1 tick
}
