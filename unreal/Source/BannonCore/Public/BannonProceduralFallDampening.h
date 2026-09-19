#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralFallDampening.generated.h"

// Phase 1 #7: Procedural Fall Dampening
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralFallDampening : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonProceduralFallDampening();

protected:
    virtual void BeginPlay() override;
};
