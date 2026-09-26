#include "BannonTagTeamChemistry.h"

void UBannonTagTeamChemistry::UpdateTeamChemistry(int32 MatchesWrestledTogether, bool bWonMatch, float& InOutChemistryStat, bool& bUnlocksTandemFinishers)
{
    // Tag Team Chemistry Engine: Co-op mechanics where frequent partners unlock tandem procedural moves.
    
    // Winning builds chemistry faster than losing
    float ChemistryGain = bWonMatch ? 5.0f : 1.0f;
    InOutChemistryStat = FMath::Clamp(InOutChemistryStat + ChemistryGain, 0.0f, 100.0f);
    
    // If they have wrestled at least 10 matches together AND have a chemistry > 75%, they unlock sync tandem maneuvers.
    if (MatchesWrestledTogether >= 10 && InOutChemistryStat > 75.0f)
    {
        bUnlocksTandemFinishers = true;
    }
    else
    {
        bUnlocksTandemFinishers = false;
    }
}
