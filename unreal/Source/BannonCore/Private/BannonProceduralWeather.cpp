#include "BannonProceduralWeather.h"

void UBannonProceduralWeather::UpdateRingFriction(float PrecipitationLevel, bool bIsOutdoorArena, float& OutCanvasFriction, float& OutSlipProbability)
{
    float BaseFriction = 1.0f;
    float BaseSlip = 0.05f; // 5% baseline slip chance (sweat, etc.)

    if (bIsOutdoorArena && PrecipitationLevel > 0.0f)
    {
        // Rain reduces friction and increases slipping dramatically
        OutCanvasFriction = FMath::Max(0.2f, BaseFriction - (PrecipitationLevel * 0.8f));
        OutSlipProbability = FMath::Min(0.40f, BaseSlip + (PrecipitationLevel * 0.35f)); // Up to 40% chance to slip when running
    }
    else
    {
        OutCanvasFriction = BaseFriction;
        OutSlipProbability = BaseSlip;
    }
}
