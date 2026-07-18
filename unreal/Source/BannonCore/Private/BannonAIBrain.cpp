#include "BannonAIBrain.h"

void UBannonAIBrain::EvaluateDesperation(float CurrentHP, float Stamina)
{
    // AI triggers high-risk aerial moves or cheating when health/stamina is critically low
    if (CurrentHP < 2000.0f || Stamina < 10.0f)
    {
        if (Cowardice > 0.7f)
        {
            // Flee the ring, attempt a countout loss to save a title
        }
        else if (Aggression > 0.8f)
        {
            // Execute desperation maneuver (e.g., low blow, weapon strike)
        }
    }
}

bool UBannonAIBrain::ScanForWeapons(float DistanceToNearestWeapon)
{
    // AI actively searches the sandbox environment for high-damage props
    if (DistanceToNearestWeapon < 500.0f && Aggression > 0.5f)
    {
        return true; // Command AI controller to pathfind to weapon
    }
    return false;
}
