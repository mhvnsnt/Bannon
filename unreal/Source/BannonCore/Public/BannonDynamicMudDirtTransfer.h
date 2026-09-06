#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicMudDirtTransfer.generated.h"

// Phase 9 #85: Dynamic Mud & Dirt Transfer
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicMudDirtTransfer : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicMudDirtTransfer();

protected:
    virtual void BeginPlay() override;
};
