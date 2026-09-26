#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTorqueBasedJointLocks.generated.h"

// Phase 4 #31: Torque-Based Joint Locks
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTorqueBasedJointLocks : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTorqueBasedJointLocks();

protected:
    virtual void BeginPlay() override;
};
