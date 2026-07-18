#include "BannonSweatScattering.h"

void UBannonSweatScattering::CalculateSweatAccumulation(float MatchDuration, float ExertionLevel, float& OutRoughness, float& OutSpecular)
{
    // Sweat Subsurface Scattering: Skin rendering changes based on fatigue/exertion
    // This alters the shader parameters dynamically to make skin more specular/reflective over a long match
    float SweatFactor = FMath::Clamp((MatchDuration * 0.05f) + (ExertionLevel * 0.1f), 0.0f, 1.0f);
    
    // High sweat = lower roughness (shiny), higher specular
    OutRoughness = FMath::Lerp(0.6f, 0.15f, SweatFactor);
    OutSpecular = FMath::Lerp(0.3f, 0.9f, SweatFactor);
}
