#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRingAwarenessPathfinding.generated.h"

// Phase 7 #65: Ring Awareness Pathfinding
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRingAwarenessPathfinding : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRingAwarenessPathfinding();

protected:
    virtual void BeginPlay() override;
};
