#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFederationDraftSimulator.generated.h"

// Phase 10 #91: Federation Draft Simulator
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFederationDraftSimulator : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonFederationDraftSimulator();

protected:
    virtual void BeginPlay() override;
};
