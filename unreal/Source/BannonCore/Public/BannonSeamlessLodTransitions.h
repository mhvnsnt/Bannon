#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSeamlessLodTransitions.generated.h"

// Phase 9 #89: Seamless LOD Transitions
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSeamlessLodTransitions : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSeamlessLodTransitions();

protected:
    virtual void BeginPlay() override;
};
