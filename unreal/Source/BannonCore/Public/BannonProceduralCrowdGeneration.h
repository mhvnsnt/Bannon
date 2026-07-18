#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralCrowdGeneration.generated.h"

// Phase 10 #90: Procedural Crowd Generation
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralCrowdGeneration : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonProceduralCrowdGeneration();

protected:
    virtual void BeginPlay() override;
};
