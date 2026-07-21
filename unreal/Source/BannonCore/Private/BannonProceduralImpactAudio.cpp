#include "BannonProceduralImpactAudio.h"
#include "Kismet/KismetMathLibrary.h"

UBannonProceduralImpactAudio::UBannonProceduralImpactAudio() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonProceduralImpactAudio::SynthesizeImpactSound(float ImpactForce, float MaterialHardness) {
    // Math-driven audio generation replacing static .wav files.
    // 1. Map ImpactForce (0.0 to 8.0) directly to MetaSound amplitude/volume.
    float VolumeMod = FMath::Clamp(ImpactForce / 8.0f, 0.1f, 1.0f);
    
    // 2. Map MaterialHardness to a pitch/distortion vector.
    float PitchMod = FMath::Lerp(0.5f, 1.5f, MaterialHardness / 2.0f);

    // Push directly to the native audio synth parameters (e.g. Unreal MetaSounds)
    SetFloatParameter(TEXT("ImpactAmplitude"), VolumeMod);
    SetFloatParameter(TEXT("ImpactPitch"), PitchMod);
    Play();
}
