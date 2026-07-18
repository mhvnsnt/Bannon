#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonInteractiveCrowdMechanics.generated.h"

// Phase 2 #16: Interactive Crowd Mechanics
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonInteractiveCrowdMechanics : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonInteractiveCrowdMechanics();

protected:
    virtual void BeginPlay() override;
};
