#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonJointDislocationEvents.generated.h"

// Phase 4 #37: Joint Dislocation Events
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonJointDislocationEvents : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonJointDislocationEvents();

protected:
    virtual void BeginPlay() override;
};
