#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFrictionBasedMatInteraction.generated.h"

// Phase 1 #4: Friction-Based Mat Interaction
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFrictionBasedMatInteraction : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonFrictionBasedMatInteraction();

protected:
    virtual void BeginPlay() override;
};
