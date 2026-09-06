#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCornerTrappedStateMachine.generated.h"

// Phase 3 #28: Corner Trapped State Machine
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCornerTrappedStateMachine : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonCornerTrappedStateMachine();

protected:
    virtual void BeginPlay() override;
};
