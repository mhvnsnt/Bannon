#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTvRatingAlgorithm.generated.h"

// Phase 10 #92: TV Rating Algorithm
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTvRatingAlgorithm : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTvRatingAlgorithm();

protected:
    virtual void BeginPlay() override;
};
