#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralRopeBreakReaches.generated.h"

// Phase 4 #32: Procedural Rope Break Reaches
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralRopeBreakReaches : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonProceduralRopeBreakReaches();

protected:
    virtual void BeginPlay() override;
};
