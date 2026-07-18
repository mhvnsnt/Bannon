#include "BannonDayNightCycle.h"

void UBannonDayNightCycle::UpdateSunPosition(float DeltaTime, float TimeMultiplier, float& OutSunPitch)
{
    // Real-time lighting shifts for open-world sandbox areas
    TimeOfDay += (DeltaTime * TimeMultiplier);
    
    if (TimeOfDay >= 24.0f)
    {
        TimeOfDay -= 24.0f; // Wrap around
    }
    
    // Map 24 hours to 360 degrees. 0/24 is midnight (Pitch = 90), 12 is noon (Pitch = -90)
    // Shifted by 6 hours so sunrise (6am) is 0 pitch
    float TimeOffset = TimeOfDay - 6.0f; 
    OutSunPitch = (TimeOffset / 24.0f) * -360.0f; 
}
