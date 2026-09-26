#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDesperationMoveTriggers.generated.h"

// Phase 7 #64: Desperation Move Triggers
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDesperationMoveTriggers : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDesperationMoveTriggers();

protected:
    virtual void BeginPlay() override;
};
