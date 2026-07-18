#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonClothTearingSimulation.generated.h"

// Phase 9 #82: Cloth Tearing & Simulation
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonClothTearingSimulation : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonClothTearingSimulation();

protected:
    virtual void BeginPlay() override;
};
