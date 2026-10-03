#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonStaminaDrainedRagdollCollapse.generated.h"

// Phase 4 #34: Stamina-Drained Ragdoll Collapse
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonStaminaDrainedRagdollCollapse : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonStaminaDrainedRagdollCollapse();

protected:
    virtual void BeginPlay() override;
};
