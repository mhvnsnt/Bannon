#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDesperationTapOutPhysics.generated.h"

// Phase 5 #40: Desperation Tap-Out Physics
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDesperationTapOutPhysics : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDesperationTapOutPhysics();

protected:
    virtual void BeginPlay() override;
};
