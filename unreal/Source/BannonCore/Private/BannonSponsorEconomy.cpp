#include "BannonSponsorEconomy.h"

void UBannonSponsorEconomy::CalculateWeeklyMerchRevenue(float CrowdHeat, int32 TitlesHeld, float BasePopularity, float& OutWeeklyRevenue)
{
    // Sponsor & Merchandise Economy: Money earned unlocks better training facilities.
    // Absolute value of CrowdHeat is used, because massive heels sell as much merch as massive babyfaces.
    float HeatFactor = FMath::Abs(CrowdHeat); 
    
    // Base merch sales driven by overall popularity
    float BaseSales = BasePopularity * 50.0f; // e.g. 80 pop = $4000 base
    
    // Multipliers for being white-hot with the crowd and holding gold
    float HeatMultiplier = 1.0f + (HeatFactor / 100.0f); // Up to 2.0x
    float TitleMultiplier = 1.0f + (TitlesHeld * 0.5f); // 1.5x per title
    
    OutWeeklyRevenue = BaseSales * HeatMultiplier * TitleMultiplier;
}
