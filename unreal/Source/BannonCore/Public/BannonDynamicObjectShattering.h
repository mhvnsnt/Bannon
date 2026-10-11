#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicObjectShattering.generated.h"

// Phase 2 #13: Dynamic Object Shattering
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicObjectShattering : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicObjectShattering();

protected:
    virtual void BeginPlay() override;
};
