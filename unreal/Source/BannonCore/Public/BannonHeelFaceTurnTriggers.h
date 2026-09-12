#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonHeelFaceTurnTriggers.generated.h"

// Phase 10 #98: Heel/Face Turn Triggers
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonHeelFaceTurnTriggers : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonHeelFaceTurnTriggers();

protected:
    virtual void BeginPlay() override;
};
