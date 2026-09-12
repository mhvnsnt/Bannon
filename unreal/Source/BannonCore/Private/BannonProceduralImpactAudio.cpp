#include "BannonProceduralImpactAudio.h"
#include "Kismet/KismetMathLibrary.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"

UBannonProceduralImpactAudio::UBannonProceduralImpactAudio() {
    PrimaryComponentTick.bCanEverTick = false;
    AudioLODDistanceThreshold = 2500.0f;
}

void UBannonProceduralImpactAudio::SynthesizeImpactSound(float ImpactForce, float MaterialHardness) {
    float DistanceSq = 0.0f;
    if (GetWorld() && GetWorld()->GetFirstPlayerController()) {
        FVector CameraLoc;
        FRotator CameraRot;
        GetWorld()->GetFirstPlayerController()->GetPlayerViewPoint(CameraLoc, CameraRot);
        DistanceSq = FVector::DistSquared(CameraLoc, GetComponentLocation());
    }

    // Audio LOD Routing: Protect CPU bounds during massive 500+ ringside collision events
    if (DistanceSq > (AudioLODDistanceThreshold * AudioLODDistanceThreshold)) {
        // Distant impact: Route to low-res simplified noise matrices or cull entirely if below impact threshold
        if (ImpactForce < 2.0f) return; // Hard Cull
        SetFloatParameter(TEXT("ImpactAmplitude"), FMath::Clamp(ImpactForce / 8.0f, 0.1f, 0.3f));
        SetFloatParameter(TEXT("ImpactPitch"), 1.0f); // Strip complex distortion vectors
        SetFloatParameter(TEXT("LOD_Mode"), 1.0f); // Tell MetaSound to bypass complex node chains
    } else {
        // Close combat: Full 3D spacial MetaSound distortion variables
        float VolumeMod = FMath::Clamp(ImpactForce / 8.0f, 0.1f, 1.0f);
        float PitchMod = FMath::Lerp(0.5f, 1.5f, MaterialHardness / 2.0f);
        SetFloatParameter(TEXT("ImpactAmplitude"), VolumeMod);
        SetFloatParameter(TEXT("ImpactPitch"), PitchMod);
        SetFloatParameter(TEXT("LOD_Mode"), 0.0f);
    }
    
    Play();
}
