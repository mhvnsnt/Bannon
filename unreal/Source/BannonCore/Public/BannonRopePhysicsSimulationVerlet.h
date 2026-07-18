#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRopePhysicsSimulationVerlet.generated.h"

// Phase 1 #5: Rope Physics Simulation (Verlet)
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRopePhysicsSimulationVerlet : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRopePhysicsSimulationVerlet();

protected:
    virtual void BeginPlay() override;
};
