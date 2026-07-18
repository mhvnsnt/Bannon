#include "BannonGodWithinEndgame.h"

void UBannonGodWithinEndgame::TriggerCosmicAlignment(float CosmicAlignmentScore, bool& bUnlockRealityModifiers, float& OutGravityScale, float& OutTimeDilation)
{
    // The God Within Endgame: Achieving maximum cosmic alignment unlocks reality-bending sandbox physics modifiers.
    if (CosmicAlignmentScore >= 100.0f)
    {
        bUnlockRealityModifiers = true;
        OutGravityScale = 0.5f; // Moon gravity mode unlocked
        OutTimeDilation = 0.8f; // Matrix slow-motion mode unlocked during strikes
    }
    else
    {
        bUnlockRealityModifiers = false;
        OutGravityScale = 1.0f; // Standard Earth gravity
        OutTimeDilation = 1.0f; // Standard time
    }
}
