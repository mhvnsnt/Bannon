#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonContextualPropSpawningEngine.generated.h"

// Phase 2 #12: Contextual Prop Spawning Engine
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonContextualPropSpawningEngine : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonContextualPropSpawningEngine();

protected:
    virtual void BeginPlay() override;
};
