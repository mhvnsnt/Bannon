#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTitleBeltLineageTracking.generated.h"

// Phase 10 #95: Title Belt Lineage Tracking
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTitleBeltLineageTracking : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTitleBeltLineageTracking();

protected:
    virtual void BeginPlay() override;
};
