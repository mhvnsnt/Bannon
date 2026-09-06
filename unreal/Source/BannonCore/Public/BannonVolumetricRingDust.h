#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonVolumetricRingDust.generated.h"

// Phase 9 #86: Volumetric Ring Dust
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonVolumetricRingDust : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonVolumetricRingDust();

protected:
    virtual void BeginPlay() override;
};
