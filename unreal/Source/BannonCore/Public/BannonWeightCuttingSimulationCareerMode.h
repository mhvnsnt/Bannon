#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonWeightCuttingSimulationCareerMode.generated.h"

// Phase 8 #79: Weight Cutting Simulation (Career Mode)
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonWeightCuttingSimulationCareerMode : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonWeightCuttingSimulationCareerMode();

protected:
    virtual void BeginPlay() override;
};
