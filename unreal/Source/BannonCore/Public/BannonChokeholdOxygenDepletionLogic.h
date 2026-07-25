#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonChokeholdOxygenDepletionLogic.generated.h"

// Phase 4 #36: Chokehold Oxygen Depletion Logic
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonChokeholdOxygenDepletionLogic : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonChokeholdOxygenDepletionLogic();

protected:
    virtual void BeginPlay() override;
};
