#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicInjuryRehabilitation.generated.h"

// Phase 5 #45: Dynamic Injury Rehabilitation
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicInjuryRehabilitation : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicInjuryRehabilitation();

protected:
    virtual void BeginPlay() override;
};
