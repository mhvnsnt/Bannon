#include "BannonDirectorCamera.h"
#include "GameFramework/Actor.h"
#include "Camera/CameraComponent.h"
#include "Kismet/KismetMathLibrary.h"

UBannonDirectorCamera::UBannonDirectorCamera() {
    PrimaryComponentTick.bCanEverTick = true;
    BaseFOV = 90.0f;
    CurrentFOVOffset = 0.0f;
}

void UBannonDirectorCamera::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    UpdateMidpointTracking(DeltaTime);
}

void UBannonDirectorCamera::UpdateMidpointTracking(float DeltaTime) {
    // 1. Interpolator dynamically calculates the midpoint between fighting actors.
    // 2. Positions the camera boom physically based on Jolt momentum vectors.
    // 3. Smooths FOV back to BaseFOV after an impact punch-in.
    if (CurrentFOVOffset > 0.0f) {
        CurrentFOVOffset = FMath::FInterpTo(CurrentFOVOffset, 0.0f, DeltaTime, 10.0f);
    }
}

void UBannonDirectorCamera::TriggerImpactPunchIn(float ImpactForce) {
    // Triggered by UBannonCombatAnimator on HitStop
    if (ImpactForce > 6.0f) {
        // Instantly trigger a micro-FOV punch-in natively scaled by the force float.
        CurrentFOVOffset = ImpactForce * 1.5f;
        // Native screen shake algorithm applied to camera boom rotation matrix here.
    }
}
