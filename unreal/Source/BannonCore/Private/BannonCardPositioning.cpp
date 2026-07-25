#include "BannonCardPositioning.h"

float UBannonCardPositioning::GetPoiseMultiplierForTier(EBannonRosterTier Tier)
{
    // Main Eventers recover poise significantly faster, Jobbers are hardcapped
    switch(Tier)
    {
        case EBannonRosterTier::Jobber: return 0.5f;
        case EBannonRosterTier::LowerMid: return 0.8f;
        case EBannonRosterTier::Midcard: return 1.0f;
        case EBannonRosterTier::UpperMid: return 1.2f;
        case EBannonRosterTier::MainEventer: return 1.5f;
        case EBannonRosterTier::Legend: return 2.0f;
        default: return 1.0f;
    }
}

void UBannonCardPositioning::ProcessTheRub(EBannonRosterTier WinnerTier, EBannonRosterTier LoserTier, float& WinnerHeat, float& LoserMorale)
{
    // If a lower tier organically defeats a higher tier via physics output, transfer momentum (The Rub)
    if ((uint8)WinnerTier < (uint8)LoserTier)
    {
        float TierDelta = (uint8)LoserTier - (uint8)WinnerTier;
        WinnerHeat += (10.0f * TierDelta); // Massive heat spike
        LoserMorale -= (0.1f * TierDelta); // Stock drops
    }
}
