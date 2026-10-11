#include "BannonShowEconomy.h"

void UBannonShowEconomy::CalculateShowBudget(float AvailableFunds, float PyroCost, float TalentCost, bool& bIsBankrupt)
{
    // Create-A-Show Economy: Managing pyro budget vs. talent budget.
    float TotalCost = PyroCost + TalentCost;

    if (TotalCost > AvailableFunds)
    {
        bIsBankrupt = true;
    }
    else
    {
        bIsBankrupt = false;
    }
}
