#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonPhysicsDrivenIrishWhipEngine.generated.h"

// Phase 3 #21: Physics-Driven Irish Whip Engine
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonPhysicsDrivenIrishWhipEngine : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonPhysicsDrivenIrishWhipEngine();

protected:
    virtual void BeginPlay() override;
};
