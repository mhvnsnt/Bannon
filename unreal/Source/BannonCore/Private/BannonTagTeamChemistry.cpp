#include "BannonTagTeamChemistry.h"

void UBannonTagTeamChemistry::ProcessHotTag(float IncomingPartnerDrive, float& OutMomentumSpike)
{
    // The Hot Tag applies a massive localized momentum spike, ignoring baseline fatigue temporarily
    OutMomentumSpike = IncomingPartnerDrive * 2.0f;
    // Bypasses poise degradation for the next 15 seconds
}

void UBannonTagTeamChemistry::EvaluateMiscommunication(float CurrentCohesion)
{
    // If Cohesion is low (e.g. newly formed team or rival faction members forced to team)
    if (CurrentCohesion < 0.4f)
    {
        // High probability of double-team moves failing, or friendly-fire strikes occurring
    }
}
