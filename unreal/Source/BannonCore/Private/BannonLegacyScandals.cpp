#include "BannonLegacyScandals.h"

void UBannonLegacyScandals::TriggerRandomDrugTest(float WrestlerStrengthStat, float WrestlerAgilityStat, bool& bTestFailed, int32& OutSuspensionWeeks)
{
    // Classic Wrestling Mpire random events: Random drug testing.
    // Unnaturally high strength relative to agility increases the risk of failing a steroid test.
    
    float RiskFactor = (WrestlerStrengthStat - 85.0f) + (50.0f - WrestlerAgilityStat);
    
    if (RiskFactor > 20.0f)
    {
        // 30% chance to pop on a test if risk factor is dangerously high
        bTestFailed = (FMath::RandRange(0, 100) < 30);
    }
    else
    {
        bTestFailed = false;
    }

    if (bTestFailed)
    {
        OutSuspensionWeeks = FMath::RandRange(4, 8); // Suspended 1 to 2 months
    }
    else
    {
        OutSuspensionWeeks = 0;
    }
}
