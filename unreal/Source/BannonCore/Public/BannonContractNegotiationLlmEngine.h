#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonContractNegotiationLlmEngine.generated.h"

// Phase 5 #42: Contract Negotiation LLM Engine
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonContractNegotiationLlmEngine : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonContractNegotiationLlmEngine();

protected:
    virtual void BeginPlay() override;
};
