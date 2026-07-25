#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonElevatorScaffoldingHazards.generated.h"

// Phase 6 #57: Elevator & Scaffolding Hazards
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonElevatorScaffoldingHazards : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonElevatorScaffoldingHazards();

protected:
    virtual void BeginPlay() override;
};
