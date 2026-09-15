#include "BannonInjuryRehab.h"

void UBannonInjuryRehab::ProcessHospitalization(float InjurySeverity, float AvailableFunds, float& OutHospitalBill, bool& bIsBankrupt, int32& OutWeeksSidelined)
{
    // MDickie Career Mode logic: severe injuries cost real money and time
    OutHospitalBill = InjurySeverity * 15.0f; // Arbitrary cost multiplier
    OutWeeksSidelined = FMath::CeilToInt(InjurySeverity / 100.0f);
    
    if (AvailableFunds < OutHospitalBill)
    {
        bIsBankrupt = true;
    }
    else
    {
        bIsBankrupt = false;
    }
}
