#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicBleedingSweatMasks.generated.h"

// Phase 3 #20: Dynamic Bleeding & Sweat Masks
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicBleedingSweatMasks : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicBleedingSweatMasks();

protected:
    virtual void BeginPlay() override;
};
