#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonWeightDetectionLiftingLogic.generated.h"

// Phase 3 #23: Weight Detection Lifting Logic
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonWeightDetectionLiftingLogic : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonWeightDetectionLiftingLogic();

protected:
    virtual void BeginPlay() override;
};
