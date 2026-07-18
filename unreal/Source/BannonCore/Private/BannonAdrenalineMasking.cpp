#include "BannonAdrenalineMasking.h"

void UBannonAdrenalineMasking::ProcessHulkingUp(float CurrentMomentum, bool bHasLimbDamage, bool& bIgnoreLimpIK)
{
    // Adrenaline Masking: High momentum temporarily nullifies IK limping penalties
    // Recreating the classic "Hulking Up" or fighting spirit spots.
    if (CurrentMomentum > 90.0f && bHasLimbDamage)
    {
        bIgnoreLimpIK = true; // Turn off procedural limping/pain facial morphs temporarily
    }
    else
    {
        bIgnoreLimpIK = false; // Normal pain constraints apply
    }
}
