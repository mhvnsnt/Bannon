#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTrafficVehicleHazards.generated.h"

// Phase 2 #17: Traffic & Vehicle Hazards
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTrafficVehicleHazards : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTrafficVehicleHazards();

protected:
    virtual void BeginPlay() override;
};
