#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonBitingIllegalTactics.generated.h"

// Phase 4 #39: Biting & Illegal Tactics
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonBitingIllegalTactics : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonBitingIllegalTactics();

protected:
    virtual void BeginPlay() override;
};
