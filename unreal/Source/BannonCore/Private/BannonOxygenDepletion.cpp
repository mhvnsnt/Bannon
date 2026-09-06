#include "BannonOxygenDepletion.h"

void UBannonOxygenDepletion::ProcessChokehold(float HoldDuration, float AttackerGripStrength, float& DefenderOxygen, bool& bIsTKO)
{
    // Separate from general Stamina, Oxygen depletes rapidly in sleeper holds or chokes
    float DrainRate = AttackerGripStrength * 0.5f;
    DefenderOxygen -= (DrainRate * HoldDuration);

    if (DefenderOxygen <= 0.0f)
    {
        bIsTKO = true; // Defender goes completely limp (Active Ragdoll TKO)
    }
}
