#include "BannonAdrenalineMasking.h"

void UBannonAdrenalineMasking::CalculateAdrenalineBuff(float MatchMomentum, float LegDamage, float& OutLimpAlphaModifier)
{
    // Adrenaline Masking ("Hulking Up"): High momentum temporarily nullifies IK limping penalties.
    // Base limp alpha is driven directly by leg damage.
    float BaseLimp = FMath::Clamp(LegDamage / 100.0f, 0.0f, 1.0f);
    
    if (MatchMomentum > 80.0f)
    {
        // Surging adrenaline suppresses the pain. Limp is completely zeroed out while momentum stays hot.
        OutLimpAlphaModifier = 0.0f; 
    }
    else if (MatchMomentum > 50.0f)
    {
        // Partial adrenaline masks 50% of the limp.
        OutLimpAlphaModifier = BaseLimp * 0.5f;
    }
    else
    {
        // No momentum, full pain response.
        OutLimpAlphaModifier = BaseLimp;
    }
}
