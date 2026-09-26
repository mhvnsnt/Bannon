#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRopeBounceMomentumMultiplier.generated.h"

// Phase 3 #29: Rope Bounce Momentum Multiplier
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRopeBounceMomentumMultiplier : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRopeBounceMomentumMultiplier();

protected:
    virtual void BeginPlay() override;
};
