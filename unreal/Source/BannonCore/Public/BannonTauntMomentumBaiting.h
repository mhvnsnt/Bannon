#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonTauntMomentumBaiting.generated.h"

// Phase 7 #69: Taunt & Momentum Baiting
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonTauntMomentumBaiting : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonTauntMomentumBaiting();

protected:
    virtual void BeginPlay() override;
};
