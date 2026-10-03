#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMultiThreatPrioritization.generated.h"

// Phase 7 #63: Multi-Threat Prioritization
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMultiThreatPrioritization : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMultiThreatPrioritization();

protected:
    virtual void BeginPlay() override;
};
