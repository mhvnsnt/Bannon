#pragma once
#include "CoreMinimal.h"
#include "Components/AudioComponent.h"
#include "BannonProceduralImpactAudio.generated.h"

UCLASS(ClassGroup=(BannonAudio), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralImpactAudio : public UAudioComponent {
    GENERATED_BODY()
public:
    UBannonProceduralImpactAudio();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Audio")
    void SynthesizeImpactSound(float ImpactForce, float MaterialHardness);
};
