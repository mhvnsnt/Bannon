#include "BannonRingDust.h"

void UBannonRingDust::SpawnVolumetricDust(float ImpactForce, float& DustParticleScale, float& DustOpacity)
{
    // Volumetric Ring Dust: Impacts on the mat puff up volumetric particles illuminated by stadium lights
    if (ImpactForce > 500.0f)
    {
        float NormalizedForce = FMath::Clamp((ImpactForce - 500.0f) / 2000.0f, 0.0f, 1.0f);
        DustParticleScale = FMath::Lerp(1.0f, 3.0f, NormalizedForce);
        DustOpacity = FMath::Lerp(0.2f, 0.8f, NormalizedForce);
    }
    else
    {
        DustParticleScale = 0.0f;
        DustOpacity = 0.0f;
    }
}
