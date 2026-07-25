#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDayNightCycleLighting.generated.h"

// Phase 6 #53: Day/Night Cycle Lighting
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDayNightCycleLighting : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDayNightCycleLighting();

protected:
    virtual void BeginPlay() override;
};
