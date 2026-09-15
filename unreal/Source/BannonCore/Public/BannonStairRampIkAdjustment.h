#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonStairRampIkAdjustment.generated.h"

// Phase 1 #9: Stair & Ramp IK Adjustment
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonStairRampIkAdjustment : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonStairRampIkAdjustment();

protected:
    virtual void BeginPlay() override;
};
