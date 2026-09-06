#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMidAirGrappleInterceptions.generated.h"

// Phase 3 #24: Mid-Air Grapple Interceptions
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMidAirGrappleInterceptions : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonMidAirGrappleInterceptions();

protected:
    virtual void BeginPlay() override;
};
