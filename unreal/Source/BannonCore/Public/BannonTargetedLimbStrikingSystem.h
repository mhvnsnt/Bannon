#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTargetedLimbStrikingSystem.generated.h"

// Phase 3 #26: Targeted Limb Striking System
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTargetedLimbStrikingSystem : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTargetedLimbStrikingSystem();

protected:
    virtual void BeginPlay() override;
};
