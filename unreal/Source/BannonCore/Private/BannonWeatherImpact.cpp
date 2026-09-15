#include "BannonWeatherImpact.h"

void UBannonWeatherImpact::CalculateCanvasFriction(EBannonWeatherState CurrentWeather, bool bIsOutdoorStadium, float& CanvasFriction)
{
    // Rain in outdoor stadiums reduces canvas friction and increases slip probability
    CanvasFriction = 1.0f; // Default baseline

    if (bIsOutdoorStadium)
    {
        if (CurrentWeather == EBannonWeatherState::Rain)
        {
            CanvasFriction = 0.6f; // High slip chance
        }
        else if (CurrentWeather == EBannonWeatherState::Snow)
        {
            CanvasFriction = 0.4f; // Extreme slip chance
        }
    }
}
