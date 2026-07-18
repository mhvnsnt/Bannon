#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDayNightCycle.generated.h"

UCLASS()
class BANNONCORE_API UBannonDayNightCycle : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Environment")
    float TimeOfDay; // 0.0 to 24.0

    UFUNCTION(BlueprintCallable, Category="Bannon|Environment")
    void UpdateSunPosition(float DeltaTime, float TimeMultiplier, UPARAM(ref) float& OutSunPitch);
};
