#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonGodWithinEndgame.generated.h"

UCLASS()
class BANNONCORE_API UBannonGodWithinEndgame : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Cosmic")
    void ApplyRealityModifiers(float CosmicAlignment, UPARAM(ref) float& GravityScale, UPARAM(ref) float& GameSpeedMultiplier);
};
