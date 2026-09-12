#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonFactionStableLogic.generated.h"

// Phase 5 #46: Faction & Stable Logic
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonFactionStableLogic : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonFactionStableLogic();

protected:
    virtual void BeginPlay() override;
};
