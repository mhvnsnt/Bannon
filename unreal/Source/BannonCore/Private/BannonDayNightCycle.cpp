#include "BannonDayNightCycle.h"

void UBannonDayNightCycle::CalculateTimeOfDayLighting(float InGameTimeHours, float& OutDirectionalLightIntensity, float& OutSunAnglePitch)
{
    // Real-time lighting shifts for open-world sandbox areas (MDickie style persistent time).
    // InGameTimeHours is 0.0 to 24.0.
    
    // Normalize time to a 0-1 range for sine wave calculation
    float NormalizedTime = InGameTimeHours / 24.0f;
    
    // Sun angle pitch: -90 (midnight, pointing up) to 90 (noon, pointing down). 
    // Shifted so 12:00 is straight down.
    OutSunAnglePitch = FMath::Sin((NormalizedTime - 0.25f) * PI * 2.0f) * 90.0f;

    // Intensity: 0.0 at night, max 10.0 at noon.
    if (InGameTimeHours >= 6.0f && InGameTimeHours <= 18.0f)
    {
        // Daytime
        float DayAlpha = FMath::Sin((InGameTimeHours - 6.0f) / 12.0f * PI);
        OutDirectionalLightIntensity = DayAlpha * 10.0f;
    }
    else
    {
        // Nighttime
        OutDirectionalLightIntensity = 0.0f;
    }
}
