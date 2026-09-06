#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonRingDust.generated.h"

UCLASS()
class BANNONCORE_API UBannonRingDust : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Rendering")
    void SpawnVolumetricDust(float ImpactForce, UPARAM(ref) float& DustParticleScale, UPARAM(ref) float& DustOpacity);
};
