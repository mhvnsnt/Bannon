#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonLimbSpecificRagdollTriggers.generated.h"

// Phase 2 #10: Limb-Specific Ragdoll Triggers
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonLimbSpecificRagdollTriggers : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonLimbSpecificRagdollTriggers();

protected:
    virtual void BeginPlay() override;
};
