#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonGodWithinEndgame.generated.h"

UCLASS()
class BANNONCORE_API UBannonGodWithinEndgame : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Endgame")
    void TriggerCosmicAlignment(float CosmicAlignmentScore, UPARAM(ref) bool& bUnlockRealityModifiers, UPARAM(ref) float& OutGravityScale, UPARAM(ref) float& OutTimeDilation);
};
