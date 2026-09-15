#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicMatchCardBooking.generated.h"

// Phase 10 #97: Dynamic Match Card Booking
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicMatchCardBooking : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonDynamicMatchCardBooking();

protected:
    virtual void BeginPlay() override;
};
