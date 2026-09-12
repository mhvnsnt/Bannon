#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonWeatherImpact.generated.h"

UENUM(BlueprintType)
enum class EBannonWeatherState : uint8
{
    Clear,
    Rain,
    Snow
};

UCLASS()
class BANNONCORE_API UBannonWeatherImpact : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void CalculateCanvasFriction(EBannonWeatherState CurrentWeather, bool bIsOutdoorStadium, UPARAM(ref) float& CanvasFriction);
};
