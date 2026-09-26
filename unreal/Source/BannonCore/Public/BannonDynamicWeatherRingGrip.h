#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicWeatherRingGrip.generated.h"

// Phase 6 #52: Dynamic Weather & Ring Grip
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicWeatherRingGrip : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicWeatherRingGrip();

protected:
    virtual void BeginPlay() override;
};
