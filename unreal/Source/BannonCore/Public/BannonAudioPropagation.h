#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonAudioPropagation.generated.h"

UCLASS()
class BANNONCORE_API UBannonAudioPropagation : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Audio")
    void CalculateArenaEcho(float ImpactVelocity, float DistanceToListener, float ArenaVolumeScale, UPARAM(ref) float& OutEchoDelayMs, UPARAM(ref) float& OutEchoVolumeMultiplier);
};
