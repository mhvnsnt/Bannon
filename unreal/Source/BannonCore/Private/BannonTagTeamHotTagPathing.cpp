#include "BannonTagTeamHotTagPathing.h"

void UBannonTagTeamHotTagPathing::EvaluateHotTagNeed(float ActiveHealth, float PartnerHealth, float DistanceToCorner, bool& bShouldCrawlToTag)
{
    // Tag Team Hot Tag Pathing: AI desperately crawling to their corner when health is critical.
    bShouldCrawlToTag = false;

    // If the active wrestler is badly beaten, and their partner is relatively fresh
    if (ActiveHealth < 25.0f && PartnerHealth > 50.0f)
    {
        // If they are reasonably close to their own corner (e.g. within 600 units), prioritize the tag over fighting back
        if (DistanceToCorner < 600.0f)
        {
            bShouldCrawlToTag = true;
        }
    }
}
