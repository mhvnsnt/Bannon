#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRingImplosionMechanics.generated.h"

// Phase 6 #55: Ring Implosion Mechanics
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRingImplosionMechanics : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonRingImplosionMechanics();

protected:
    virtual void BeginPlay() override;
};
