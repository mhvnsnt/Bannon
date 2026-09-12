#include "BannonAudioPropagation.h"

void UBannonAudioPropagation::CalculateArenaEcho(float ImpactVelocity, float DistanceToListener, float ArenaVolumeScale, float& OutEchoDelayMs, float& OutEchoVolumeMultiplier)
{
    // Spatial audio logic calculating the stadium echo of massive physics impacts (e.g. suplexing onto a ladder)
    // Larger arenas have longer delays and bigger reverbs.
    OutEchoDelayMs = (DistanceToListener / 34300.0f) * 1000.0f; // Basic speed of sound delay (343 m/s)
    
    // Scale echo volume by the severity of the impact and the acoustic scale of the building
    OutEchoVolumeMultiplier = (ImpactVelocity * 0.001f) * ArenaVolumeScale;
    OutEchoVolumeMultiplier = FMath::Clamp(OutEchoVolumeMultiplier, 0.0f, 1.0f);
}
