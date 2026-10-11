#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonNeuralNetworkOpponentAi.generated.h"

// Phase 7 #61: Neural Network Opponent AI
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonNeuralNetworkOpponentAi : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonNeuralNetworkOpponentAi();

protected:
    virtual void BeginPlay() override;
};
