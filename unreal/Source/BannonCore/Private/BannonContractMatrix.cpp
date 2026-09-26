#include "BannonContractMatrix.h"

void UBannonContractMatrix::ProcessWeeklyDecay(FBannonContract& Contract, float CurrentHeat)
{
    if (Contract.WeeksRemaining > 0)
    {
        Contract.WeeksRemaining--;
    }
    
    // Payout scales dynamically based on heat, overriding base salary
    float DynamicPayout = Contract.BaseSalary + (Contract.BaseSalary * Contract.MerchMultiplier * CurrentHeat);
}

bool UBannonContractMatrix::RequestFinishOverride(const FBannonContract& Contract, float EgoRoll)
{
    if (Contract.bCreativeControl && EgoRoll > 0.8f)
    {
        return true; // The wrestler rejects the booked finish
    }
    return false;
}
