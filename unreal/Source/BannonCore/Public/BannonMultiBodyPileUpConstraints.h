#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMultiBodyPileUpConstraints.generated.h"

// Phase 1 #8: Multi-body Pile-up Constraints
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMultiBodyPileUpConstraints : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMultiBodyPileUpConstraints();

protected:
    virtual void BeginPlay() override;
};
