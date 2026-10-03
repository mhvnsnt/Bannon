#include "BannonCrowdDynamics.h"

UBannonCrowdDynamics::UBannonCrowdDynamics() {
    PrimaryComponentTick.bCanEverTick = true;
    TargetCrowdIntensity = 0.1f; // Base murmur
    CurrentCrowdIntensity = 0.1f;
    MaxPoiseThreshold = 100.0f; // Normalized poise boundary
}

void UBannonCrowdDynamics::InjectPhysicsMomentum(float JoltImpactForce, float CurrentPoise) {
    // Scale intensity inversely with poise drops and directly with physical impact forces
    float PoiseFactor = 1.0f - FMath::Clamp(CurrentPoise / MaxPoiseThreshold, 0.0f, 1.0f);
    float ForceFactor = FMath::Clamp(JoltImpactForce / 8.0f, 0.0f, 1.0f); // 8.0f DMG_SCALE lock
    
    TargetCrowdIntensity = FMath::Clamp(PoiseFactor + ForceFactor, 0.1f, 1.0f);
}

void UBannonCrowdDynamics::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    // Smoothly interpolate crowd volume/pitch metrics based on momentum
    if (!FMath::IsNearlyEqual(CurrentCrowdIntensity, TargetCrowdIntensity, 0.01f)) {
        CurrentCrowdIntensity = FMath::FInterpTo(CurrentCrowdIntensity, TargetCrowdIntensity, DeltaTime, 1.5f);
        
        // Map to MetaSound or SoundCue parameters dynamically
        SetFloatParameter(TEXT("CrowdIntensity"), CurrentCrowdIntensity);
    }
}
