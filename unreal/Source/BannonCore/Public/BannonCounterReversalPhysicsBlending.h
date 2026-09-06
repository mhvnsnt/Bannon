#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCounterReversalPhysicsBlending.generated.h"

// Phase 3 #25: Counter-Reversal Physics Blending
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCounterReversalPhysicsBlending : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonCounterReversalPhysicsBlending();

protected:
    virtual void BeginPlay() override;
};
