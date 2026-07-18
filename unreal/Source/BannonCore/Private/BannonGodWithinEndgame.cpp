#include "BannonGodWithinEndgame.h"

void UBannonGodWithinEndgame::ApplyRealityModifiers(float CosmicAlignment, float& GravityScale, float& GameSpeedMultiplier)
{
    // The God Within Endgame: Achieving maximum cosmic alignment unlocks reality-bending 
    // sandbox physics modifiers (e.g., low gravity throws, super speed) similar to MDickie cheats.
    if (CosmicAlignment > 90.0f)
    {
        GravityScale = 0.5f; // Moon gravity for massive air time
        GameSpeedMultiplier = 1.5f; // Super speed
    }
    else
    {
        GravityScale = 1.0f; // Normal Earth gravity
        GameSpeedMultiplier = 1.0f; // Normal time
    }
}
