#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSweatAccumulationFrictionDrop.generated.h"

// Phase 8 #78: Sweat Accumulation & Friction Drop
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSweatAccumulationFrictionDrop : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSweatAccumulationFrictionDrop();

protected:
    virtual void BeginPlay() override;
};
