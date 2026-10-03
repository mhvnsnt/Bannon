#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRealTimeRaytracedReflections.generated.h"

// Phase 9 #88: Real-time Raytraced Reflections
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRealTimeRaytracedReflections : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRealTimeRaytracedReflections();

protected:
    virtual void BeginPlay() override;
};
